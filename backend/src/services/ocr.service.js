// backend/src/services/ocr.service.js
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

/**
 * Internal helper to run the Python script
 */
const runPythonOCR = (filePath) => {
    return new Promise((resolve, reject) => {
        // Ensure the path to ocr_agent.py is correct relative to your project root
        const scriptPath = path.join(process.cwd(), "ocr_agent.py");

        // Spawn the python process
        const pythonProcess = spawn("python", [scriptPath, filePath]);

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            console.log(`[PYTHON STDOUT]: ${data.toString()}`);
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(`[PYTHON STDERR]: ${data.toString()}`);
            errorOutput += data.toString();
        });

        pythonProcess.on("close", (code) => {
            console.log(`[TRACE] 6. Python bridge closed with exit code: ${code}`);
            if (code !== 0) {
                console.error("Python Script Error Output:", errorOutput);
                return resolve({ error: "Python OCR script failed to execute" });
            }
            try {
                console.log("[TRACE] 7. Attempting to parse JSON at line 128...");
                // Parse exactly the last line to prevent printed warnings from corrupting the JSON
                const lines = output.trim().split('\n');
                const finalJson = lines[lines.length - 1];
                
                const parsed = JSON.parse(finalJson);
                resolve(parsed);
            } catch (e) {
                console.error('[DETAILED ERROR]', e.stack || e);
                console.error("====== FATAL JSON PARSE ERROR FROM PYTHON ======");
                console.error("RAW OUTPUT:", output);
                console.error("error code:", e.message);
                console.error("==========================================");
                // Cleanly fallback with explicit error so claim.service.js can handle it without 500ing
                resolve({ 
                    error: "Failed to parse OCR result",
                    raw_text: ""
                });
            }
        });
    });
};

/**
 * EXPORT 1: For local files
 */
export const extractClaimData = async (filePath) => {
    return await runPythonOCR(filePath);
};

/**
 * EXPORT 2: For Cloudinary URLs (This fixes your SyntaxError)
 */
export const extractClaimDataFromUrl = async (documentUrl) => {
    const { default: axios } = await import("axios");

    // Create a temporary file path
    const fileExtension = path.extname(new URL(documentUrl).pathname) || ".jpg";
    const tempFilePath = path.join(os.tmpdir(), `ocr_temp_${Date.now()}${fileExtension}`);

    try {
        console.log(`⬇️ OCR Bridge: Downloading from Cloudinary...`);
        const response = await axios.get(documentUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
        });

        fs.writeFileSync(tempFilePath, response.data);

        // Run the Python script on the downloaded file
        const result = await runPythonOCR(tempFilePath);
        return result;

    } catch (err) {
        console.error(`❌ OCR Bridge Error: ${err.message}`);
        return { error: err.message };
    } finally {
        // Always delete the temp file
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`🧹 OCR Bridge: Temp file cleaned up`);
        }
    }
};