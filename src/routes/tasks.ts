import { FastifyInstance, FastifyPluginAsync } from 'fastify';

interface CreateTaskBody {
  user_id: string;
  title: string;
  description?: string;
}

export const taskRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Add authentication hook to all routes in this plugin
  server.addHook('preValidation', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  server.get('/', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { rows } = await client.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [request.user.id]);
      return rows;
    } finally {
      client.release();
    }
  });

  server.post<{ Body: CreateTaskBody }>('/', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { title, description } = request.body;
      const { rows } = await client.query(
        'INSERT INTO tasks (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
        [request.user.id, title, description || null]
      );
      return reply.status(201).send(rows[0]);
    } finally {
      client.release();
    }
  });
};
