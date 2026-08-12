const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // The SDK might not expose listModels directly easily, so let's fetch manually.
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  console.log(data.models.map(m => m.name).join(', '));
}
run();
