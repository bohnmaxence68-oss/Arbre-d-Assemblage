import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAssemblyMethodsSuggestions(context: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggère des méthodes d'assemblage industrielles (chaudronnerie, métallerie) pour le contexte suivant: ${context}. Réponds uniquement avec une liste de 5 méthodes séparées par des virgules.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text?.split(',').map(s => s.trim()) || [];
}
