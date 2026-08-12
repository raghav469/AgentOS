export interface LLMResponse {
  text: string;
  toolCall?: {
    name: string;
    input: any;
  };
  tokensIn: number;
  tokensOut: number;
}

export interface BaseLLMClient {
  generate(prompt: string, context: string[]): Promise<LLMResponse>;
}
