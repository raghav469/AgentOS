import { BaseLLMClient, LLMResponse } from './BaseLLMClient';

export class MockLLMClient implements BaseLLMClient {
  private stepCount = 0;

  async generate(prompt: string, context: string[]): Promise<LLMResponse> {
    this.stepCount++;
    
    // Simulate some latency
    await new Promise(resolve => setTimeout(resolve, 500));

    if (this.stepCount === 1) {
      return {
        text: 'I will search the web for that information.',
        toolCall: {
          name: 'web_search',
          input: { query: 'test query' }
        },
        tokensIn: 50,
        tokensOut: 20
      };
    } else if (this.stepCount === 2) {
      return {
        text: 'I found the information. Now I will execute some code.',
        toolCall: {
          name: 'code_exec',
          input: { code: 'console.log("Hello")' }
        },
        tokensIn: 100,
        tokensOut: 30
      };
    } else {
      return {
        text: 'I have finished the task successfully.',
        tokensIn: 150,
        tokensOut: 15
      };
    }
  }

  reset() {
    this.stepCount = 0;
  }
}
