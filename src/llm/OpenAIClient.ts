import { BaseLLMClient, LLMResponse } from './BaseLLMClient';
import OpenAI from 'openai';

export class OpenAIClient implements BaseLLMClient {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey?: string) {
    const key = apiKey && apiKey.trim() ? apiKey.trim() : 'invalid_missing_user_key';
    this.openai = new OpenAI({
      apiKey: key,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  async generate(prompt: string, context: string[]): Promise<LLMResponse> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are an autonomous agent capable of using tools. Follow instructions and use tools when appropriate.' }
    ];

    if (context.length > 0) {
      messages.push({ role: 'system', content: `Context from past runs:\n${context.join('\n')}` });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      tools: [
        {
          type: 'function',
          function: {
            name: 'web_search',
            description: 'Search the web for information.',
            parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'code_exec',
            description: 'Execute JavaScript code.',
            parameters: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'fake_send_email',
            description: 'Send an email.',
            parameters: { type: 'object', properties: { to: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'body'] }
          }
        }
      ]
    });

    const choice = response.choices[0];
    const message = choice.message;

    let toolCall;
    if (message.tool_calls && message.tool_calls.length > 0) {
      const tc = message.tool_calls[0] as any;
      toolCall = {
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments)
      };
    }

    return {
      text: message.content || '',
      toolCall,
      tokensIn: response.usage?.prompt_tokens || 0,
      tokensOut: response.usage?.completion_tokens || 0
    };
  }
}
