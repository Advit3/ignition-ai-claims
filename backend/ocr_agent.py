import google.generativeai as genai
import PIL.Image
import json
import sys
import os
from PIL import Image, ImageChops

# Configuration
API_KEY = "AIzaSyDoHwK-DTDVhuWUdkINPAxfnm3T2C39REw"
genai.configure(api_key=API_KEY)

def get_ela_score(image_path, quality=90):
    original = Image.open(image_path).convert('RGB')
    temp_file = "temp_ela.jpg"
    original.save(temp_file, 'JPEG', quality=quality)
    resaved = Image.open(temp_file)
    
    # Calculate difference between original and resaved
    diff = ImageChops.difference(original, resaved)
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    scale = 255.0 / (max_diff if max_diff > 0 else 1)
    
    # Get average brightness of the difference
    diff_data = diff.getdata()
    avg_diff = sum(sum(p) for p in diff_data) / (len(diff_data) * 3)
    return avg_diff # Scores > 10-15 are usually suspicious


def extract_claim_data(image_path):
    if not os.path.exists(image_path):
        return {"error": f"File not found: {image_path}"}

    try:
        img = PIL.Image.open(image_path)
        
        # PRO-TIP: Use 1.5-flash for the hackathon. 
        # 2.5-flash often has a '0' quota on free tier accounts.
        model = genai.GenerativeModel('gemini-3-flash-preview')
        
        prompt = """
        You are an expert insurance claim processor. Extract the following information.
        If a field is missing, output null. 
        Return ONLY a raw JSON object with no markdown formatting:
        {
            "provider_name": "Name of hospital or garage",
            "date_of_service": "Date on the bill (DD-MM-YYYY)",
            "total_amount": "Only the numerical total amount",
            "patient_name": "Name of the customer if visible"
        }
        Scan for FORGERY: Look for inconsistent fonts, 'ghosting' around numbers, 
        text that isn't perfectly aligned with the paper's tilt, or boxes that look 
        digitally 'pasted' on.

        Return ONLY a raw JSON object:
        {
            "data": { ...extracted fields... },
            "forgery_analysis": {
                "is_suspicious": true/false,
                "confidence_score": 0.0 to 1.0,
                "reason": "Brief explanation of any visual red flags"
            }
        }
        """
        
        response = model.generate_content([prompt, img])
        
        # Clean up Markdown formatting (```json ... ```)
        text_content = response.text
        if "```json" in text_content:
            text_content = text_content.split("```json")[1].split("```")[0]
        elif "```" in text_content:
            text_content = text_content.split("```")[1].split("```")[0]
        
        return json.loads(text_content.strip())

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # This allows Node.js to pass the image path as an argument
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
        result = extract_claim_data(target_path)
        # Print the result so Node.js can capture it
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No image path provided"}))