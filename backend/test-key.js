import 'dotenv/config'; // or require('dotenv').config()

console.log("--- KEY DIAGNOSTIC ---");
const key = process.env.GOOGLE_GENAI_API_KEY;

if (!key) {
    console.error("❌ ERROR: Your environment variable is UNDEFINED.");
} else if (key.startsWith("AIza") && key.length > 20) {
    console.log("✅ SUCCESS: Key found and looks valid (starts with AIza).");
    console.log("Key Length:", key.length);
} else {
    console.error("❌ ERROR: Key found but looks malformed. Check for extra spaces or quotes.");
    console.log("Found:", `[${key}]`);
}