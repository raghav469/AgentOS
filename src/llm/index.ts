import { BaseLLMClient } from './BaseLLMClient';
import { MockLLMClient } from './MockLLMClient';
import { OpenAIClient } from './OpenAIClient';
import { OllamaClient } from './OllamaClient';
import { GeminiClient } from './GeminiClient';

export function getLLMClient(apiKey?: string, overrideProvider?: string): BaseLLMClient {
  const provider = overrideProvider || process.env.LLM_PROVIDER || 'gemini';

  switch (provider.toLowerCase()) {
    case 'gemini':
      console.log(`[LLM] Using Gemini Provider ${apiKey ? '(User API Key)' : '(Server Fallback Key)'}`);
      return new GeminiClient(apiKey);
    case 'openai':
      console.log(`[LLM] Using OpenAI Provider ${apiKey ? '(User API Key)' : '(Server Fallback Key)'}`);
      return new OpenAIClient(apiKey);
    case 'ollama':
      console.log('[LLM] Using Ollama Provider');
      return new OllamaClient();
    case 'mock':
    default:
      console.log('[LLM] Using Mock Provider');
      return new MockLLMClient();
  }
}
