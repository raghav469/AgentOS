import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';

interface CreateAgentBody {
  name: string;
  system_prompt: string;
  allowed_tools: string[];
  max_steps?: number;
  model: string;
}

export const agentRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Add authentication hook to all routes in this plugin
  server.addHook('preValidation', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // GET /api/agents
  server.get('/', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { rows } = await client.query('SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC', [request.user.id]);
      return rows;
    } finally {
      client.release();
    }
  });

  // GET /api/agents/:id
  server.get<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { id } = request.params;
      const { rows } = await client.query('SELECT * FROM agents WHERE id = $1 AND user_id = $2', [id, request.user.id]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Agent not found' });
      }
      return rows[0];
    } finally {
      client.release();
    }
  });

  // POST /api/agents
  server.post<{ Body: CreateAgentBody }>('/', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { name, system_prompt, allowed_tools, max_steps = 10, model } = request.body;
      const id = randomUUID();
      
      const { rows } = await client.query(
        `INSERT INTO agents (id, user_id, name, system_prompt, allowed_tools, max_steps, model) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, request.user.id, name, system_prompt, allowed_tools, max_steps, model]
      );
      return reply.status(201).send(rows[0]);
    } finally {
      client.release();
    }
  });

  // PUT /api/agents/:id
  server.put<{ Params: { id: string }, Body: Partial<CreateAgentBody> }>('/:id', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { id } = request.params;
      const { name, system_prompt, allowed_tools, max_steps, model } = request.body;
      
      const { rows } = await client.query(
        `UPDATE agents 
         SET name = COALESCE($1, name), 
             system_prompt = COALESCE($2, system_prompt), 
             allowed_tools = COALESCE($3, allowed_tools), 
             max_steps = COALESCE($4, max_steps), 
             model = COALESCE($5, model) 
         WHERE id = $6 AND user_id = $7 RETURNING *`,
        [name, system_prompt, allowed_tools, max_steps, model, id, request.user.id]
      );
      
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Agent not found' });
      }
      return rows[0];
    } finally {
      client.release();
    }
  });

  // DELETE /api/agents/:id
  server.delete<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { id } = request.params;
      const { rowCount } = await client.query('DELETE FROM agents WHERE id = $1 AND user_id = $2', [id, request.user.id]);
      if (rowCount === 0) {
        return reply.status(404).send({ error: 'Agent not found' });
      }
      return reply.status(204).send();
    } finally {
      client.release();
    }
  });
};
