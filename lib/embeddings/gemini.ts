import { GoogleGenAI } from "@google/genai";
import { appConfig } from "@/lib/config";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly modelId: string;
  private readonly client: GoogleGenAI;
  private readonly outputDimensionality: number;

  constructor(options?: { apiKey?: string; modelId?: string; outputDimensionality?: number }) {
    const apiKey = options?.apiKey ?? appConfig.geminiApiKey;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for embedding.");
    }
    this.modelId = options?.modelId ?? appConfig.embeddingModel;
    this.outputDimensionality = options?.outputDimensionality ?? appConfig.requestedEmbeddingDimensions;
    this.client = new GoogleGenAI({ apiKey });
  }

  async embedImage(input: { bytes: Uint8Array; mimeType: string }): Promise<number[]> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await this.client.models.embedContent({
          model: this.modelId,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: input.mimeType,
                  data: toBase64(input.bytes),
                },
              },
            ],
          },
          config: {
            outputDimensionality: this.outputDimensionality,
          },
        });
        const values = response.embeddings?.[0]?.values;
        if (!values || values.length === 0) {
          throw new Error("Gemini embedContent returned an empty embedding.");
        }
        return values;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        const retryable = /429|RESOURCE_EXHAUSTED|unavailable|500|503/i.test(message);
        if (!retryable || attempt === 3) break;
        await sleep(1000 * 2 ** attempt);
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
