/**
 * classification.service.js
 * 
 * Implements a document classification engine based on OCR text to detect
 * document type mismatches and flag potential fraud or misfiled claims.
 */

const KEYWORD_DICTIONARY = {
    "Health Insurance": [
        "hospital", "clinic", "patient", "discharge", "prescription", 
        "doctor", "medical", "surgery", "diagnosis", "pharmacy", 
        "blood", "scan", "tablet", "dosage", "fever", "disease",
        "treatment", "consultation", "lab", "pathology", "ward"
    ],
    "Auto Insurance": [
        "vehicle", "car", "motor", "garage", "repair", 
        "mechanic", "dent", "bumper", "engine", "tow", 
        "accident", "police", "fir", "driving", "license", "rc",
        "chassis", "tyre", "service", "insurance", "registration"
    ],
    "Gadget Insurance": [
        "mobile", "laptop", "tablet", "screen", "battery", 
        "motherboard", "processor", "device", "invoice", "warranty", 
        "repair", "replacement", "imei", "serial", "water damage", "display",
        "electronics", "hardware", "software", "keyboard"
    ]
};

/**
 * Classifies a document based on extracted text and evaluates risk indicators.
 * 
 * @param {string} claimType - The expected claim category (e.g., "Health Insurance")
 * @param {string} extractedText - The raw OCR text from the document
 * @returns {Object} JSON object with classification and risk metrics
 */
export const classifyDocument = (claimType, extractedText) => {
    // Failsafe for empty text
    if (!extractedText || typeof extractedText !== 'string' || extractedText.trim().length === 0) {
        return {
            detectedType: "Unknown",
            claimType,
            confidence: 0,
            status: "manual_review",
            risk: "High",
            reasons: ["No readable text extracted from the document."]
        };
    }

    const textToSearch = extractedText.toLowerCase();

    const scores = {
        "Health Insurance": 0,
        "Auto Insurance": 0,
        "Gadget Insurance": 0
    };

    let totalScore = 0;

    // Calculate keyword match scores for each category
    for (const [category, keywords] of Object.entries(KEYWORD_DICTIONARY)) {
        for (const keyword of keywords) {
            // Count occurrences of the keyword
            // Using split allows counting overlapping/embedded words too, but regex boundary is safer
            const regex = new RegExp(`\\b${keyword}\\b`, "g");
            const matches = textToSearch.match(regex);
            
            if (matches) {
                scores[category] += matches.length;
                totalScore += matches.length;
            }
        }
    }

    // Determine the detectedType (highest score)
    let detectedType = "Unknown";
    let maxScore = 0;
    
    for (const [category, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            detectedType = category;
        }
    }

    // Calculate confidence
    let confidence = 0;
    if (totalScore > 0) {
        confidence = parseFloat((maxScore / totalScore).toFixed(4));
    }

    // Calculate Rules for Status and Risk
    let status = "approved";
    let risk = "Low";
    const reasons = [];

    // Normalize strings for robust comparison
    const expectedMatchName = claimType ? claimType.toLowerCase().trim() : "";
    
    // Check if what we detected perfectly mismatches what the user claimed
    const isMismatch = detectedType !== "Unknown" 
                        && !expectedMatchName.includes(detectedType.toLowerCase().replace(" insurance", "")) 
                        && !detectedType.toLowerCase().includes(expectedMatchName.replace(" insurance", ""));

    if (isMismatch) {
        status = "flagged";
        risk = "High";
        reasons.push(`Document Mismatch: User filed claim under '${claimType}', but the document heavily points to '${detectedType}'.`);
    } else if (confidence < 0.6 || totalScore < 3) {
        // Either the confidence spread is too even (mixed signals) or we barely found any keywords
        status = "manual_review";
        risk = "Medium";
        reasons.push(`Low Confidence (${(confidence * 100).toFixed(1)}%): Information in the document is ambiguous or doesn't strongly map to a known insurance category.`);
    }

    return {
        detectedType,
        claimType,
        confidence,
        status,
        risk,
        ...(reasons.length > 0 && { reasons })
    };
};
