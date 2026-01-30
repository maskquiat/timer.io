
import { GoogleGenAI, Type } from "@google/genai";
import { Activity } from "../types";

// Always use the process.env.API_KEY directly for GoogleGenAI initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsights = async (activities: Activity[]) => {
  if (activities.length === 0) return "Add your tasks to get started. I can help you organize your flow once you've listed a few items.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Look at this schedule: ${activities.map(a => `${a.name} (${a.duration}m)`).join(', ')}. 
      Provide 3-4 very short, concrete, and actionable sentences of advice. 
      Focus on 1-2 practical suggestions for focus. 
      Avoid metaphors, storytelling, or emotional build-up. 
      Speak in a calm, encouraging, and highly practical tone. 
      Ensure it can be read in under 10 seconds. 
      No markdown, no bolding, no symbols.`,
      config: {
        systemInstruction: "You are a practical executive functioning coach. Your advice is brief, concrete, and supportive. Use simple language. No metaphors. No storytelling. No markdown formatting. Max 4 sentences.",
        temperature: 0.5,
      }
    });

    return response.text?.replace(/\*/g, '') || "Focus on the first task. Take a short 2-minute stretch between transitions. You are ready to begin.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Check your first task and ensure your workspace is ready. Take small breaks to stay fresh.";
  }
};

export const extractActivitiesFromMedia = async (base64Data: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: "Extract all tasks, assignments, or activities from this document or image. For each task, provide a descriptive name and an estimated duration in minutes. If no duration is mentioned, assign a reasonable estimate (e.g., 15, 30, or 45 minutes) based on the task type. Return the data as a clean JSON array."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              duration: { type: Type.INTEGER }
            },
            required: ["name", "duration"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as { name: string, duration: number }[];
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};