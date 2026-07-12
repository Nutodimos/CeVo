import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function run() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  const flashModels = data.models.filter((m: any) => m.name.includes("flash") && m.supportedGenerationMethods.includes("generateContent"));
  console.log(flashModels.map((m: any) => m.name));
}

run();
