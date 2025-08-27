// File: app/api/translate/route.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure the API key is loaded from your .env.local file
if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
  try {
    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // --- CRITICAL PROMPT ENHANCEMENT ---
    // This new, stricter prompt ensures clean, professional output.
    const prompt = `
      **Role**: You are a professional medical translator.
      **Task**: Translate the following text from ${sourceLang} to ${targetLang} for a conversation between a patient and a healthcare provider.
      **Instructions**:
      1.  Your response must contain ONLY the translated text.
      2.  Do NOT include any explanations, apologies, or extra formatting like asterisks, bullet points, or quotation marks.
      3.  Maintain a professional and clinical tone.
      4.  Filter out and do not translate any vulgar, offensive, or inappropriate language. If the input is nonsensical or offensive, return a simple, neutral phrase like "Could you please repeat that?".

      **Text to Translate**: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response || typeof response.text !== 'function') {
      console.error("Invalid response structure from Google API:", response);
      return NextResponse.json({ error: "Received an invalid response from the translation service." }, { status: 502 });
    }

    const translatedText = response.text();
    return NextResponse.json({ translatedText });

  } catch (error) {
    console.error("--- ERROR IN TRANSLATION API ---", error);
    return NextResponse.json({ error: "Failed to translate text due to an internal server error." }, { status: 500 });
  }
}