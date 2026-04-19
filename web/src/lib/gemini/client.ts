import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

import { env, features } from "@/lib/config";

let cached: GoogleGenerativeAI | undefined;

export function getGemini(): GoogleGenerativeAI | null {
  if (!features.gemini) return null;
  if (!cached) cached = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  return cached;
}

export const STRUCTURED_CONFIG: GenerationConfig = {
  temperature: 0.2,
  topP: 0.9,
  topK: 32,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
};
