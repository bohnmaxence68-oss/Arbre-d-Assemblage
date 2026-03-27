import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("Gemini API Key is missing or not configured.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export async function getAssemblyMethodsSuggestions(context: string) {
  const ai = getAI();
  if (!ai) {
    return ["Soudure TIG", "Soudure MIG", "Soudure MAG", "Boulonnage", "Rivetage"];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggère des méthodes d'assemblage industrielles (chaudronnerie, métallerie) pour le contexte suivant: ${context}. Réponds uniquement avec une liste de 5 méthodes séparées par des virgules.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return response.text?.split(',').map(s => s.trim()) || [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Soudure TIG", "Soudure MIG", "Soudure MAG", "Boulonnage", "Rivetage"];
  }
}
