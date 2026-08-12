import { BaseLLMClient, LLMResponse } from './BaseLLMClient';
import axios from 'axios';

export class OllamaClient implements BaseLLMClient {
  private url: string;
  private model: string;

  constructor() {
    this.url = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3';
  }

  async generate(prompt: string, context: string[]): Promise<LLMResponse> {
    let fullPrompt = '';
    if (context.length > 0) {
      fullPrompt += `Context from past runs:\n${context.join('\n')}\n\n`;
    }
    fullPrompt += `Task: ${prompt}`;

    // Note: Ollama format varies. We simulate tool calling here for simplicity by asking it to output JSON
    const response = await axios.post(`${this.url}/api/generate`, {
      model: this.model,
      prompt: fullPrompt + '\n\nOutput tool calls as JSON format: {"toolCall": {"name": "tool", "input": {}}}. Otherwise output normal text.',
      stream: false
    });

    const outputText = response.data.response;
    let toolCall;
    let cleanedText = outputText;

    try {
      // Basic heuristic to extract JSON if ollama outputs it
      const match = outputText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.toolCall) {
          toolCall = parsed.toolCall;
          cleanedText = outputText.replace(match[0], '').trim();
        }
      }
    } catch (e) {
      // Ignore parse errors
    }

    return {
      text: cleanedText,
      toolCall,
      tokensIn: response.data.prompt_eval_count || 0,
      tokensOut: response.data.eval_count || 0
    };
  }
}
