import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function callGeminiForImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ imageUrl: string; mimeType: string } | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Handle cases where the prompt was blocked or no candidates were returned.
    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}. Please adjust your prompt or image.`);
      }
      throw new Error("The model did not return any content. Please try a different prompt.");
    }
    
    const candidate = response.candidates[0];
    const imagePart = candidate.content?.parts?.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const restoredBase64 = imagePart.inlineData.data;
      const restoredMimeType = imagePart.inlineData.mimeType;
      return {
        imageUrl: `data:${restoredMimeType};base64,${restoredBase64}`,
        mimeType: restoredMimeType,
      };
    }
    
    // If no image is found, check for a text response to provide a more specific error.
    const textResponse = response.text.trim();
    if (textResponse) {
      throw new Error(`Model returned text instead of an image: "${textResponse}"`);
    }

    // This is a fallback. The user will see the generic "did not return an image" message from App.tsx.
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
             throw new Error(`QUOTA_EXCEEDED: You have exceeded your API quota. To prevent further errors, the process button will be disabled for 60 seconds.`);
        }
        // Let our custom, more informative errors pass through without being re-wrapped.
        if (error.message.startsWith('Request was blocked') || 
            error.message.startsWith('The model did not return') || 
            error.message.startsWith('Model returned text')) {
            throw error;
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}

export function restorePhoto(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ imageUrl: string; mimeType: string } | null> {
  return callGeminiForImage(base64ImageData, mimeType, prompt);
}

export async function reanimateImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  onProgress: (message: string) => void
): Promise<string> { // returns blob url
  try {
    onProgress("Starting video generation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: base64ImageData,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1
      }
    });

    let pollCount = 0;
    const maxPolls = 30; // 30 polls * 10s = 5 minutes max

    while (!operation.done && pollCount < maxPolls) {
      pollCount++;
      onProgress(`Checking progress (${pollCount}/${maxPolls})... This can take a few minutes.`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.done) {
      throw new Error("Video generation timed out.");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation failed or did not return a valid link.");
    }
    
    onProgress("Downloading generated video...");
    
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    
    onProgress("Finalizing...");
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Error calling Gemini Video API:", error);
    if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
             throw new Error(`QUOTA_EXCEEDED: You have exceeded your API quota for video generation.`);
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}