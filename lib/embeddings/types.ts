export interface EmbeddingProvider {
  readonly modelId: string;
  embedImage(input: { bytes: Uint8Array; mimeType: string }): Promise<number[]>;
}
