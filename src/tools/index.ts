import { query } from '../db';

export interface Tool {
  name: string;
  idempotent: boolean;
  execute(input: any): Promise<any>;
}

export const tools: Record<string, Tool> = {
  web_search: {
    name: 'web_search',
    idempotent: true,
    execute: async (input: { query: string }) => {
      console.log(`[Tool] Searching web for: ${input.query}`);
      await new Promise(r => setTimeout(r, 1000));
      return { results: `Found results for ${input.query}` };
    }
  },
  code_exec: {
    name: 'code_exec',
    idempotent: true,
    execute: async (input: { code: string }) => {
      console.log(`[Tool] Executing code...`);
      await new Promise(r => setTimeout(r, 1000));
      return { output: 'Code executed successfully' };
    }
  },
  fake_send_email: {
    name: 'fake_send_email',
    idempotent: false,
    execute: async (input: { to: string, body: string }) => {
      console.log(`[Tool] Sending email to: ${input.to}`);
      await new Promise(r => setTimeout(r, 1000));
      if (Math.random() < 0.5) {
        throw new Error('Failed to send email');
      }
      return { status: 'Email sent' };
    }
  },
  list_tasks: {
    name: 'list_tasks',
    idempotent: true,
    execute: async (input: { user_id: string }) => {
      console.log(`[Tool] Listing tasks for user: ${input.user_id}`);
      const { rows } = await query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [input.user_id]);
      return { tasks: rows };
    }
  },
  create_task: {
    name: 'create_task',
    idempotent: false,
    execute: async (input: { user_id: string, title: string, description?: string }) => {
      console.log(`[Tool] Creating task for user: ${input.user_id}`);
      const { rows } = await query(
        'INSERT INTO tasks (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
        [input.user_id, input.title, input.description || null]
      );
      return { task: rows[0] };
    }
  }
};
