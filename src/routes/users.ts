import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';

export const userRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Register a new user
  server.post('/register', async (request, reply) => {
    const { name, email, password } = request.body as any;
    
    if (!name || !email || !password) {
      return reply.status(400).send({ error: 'Name, email, and password are required' });
    }

    const client = await server.pg.connect();
    try {
      // Check if user exists
      const { rows: existing } = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.length > 0) {
        return reply.status(409).send({ error: 'User already exists' });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user with default active subscription for dev/trial
      const { rows } = await client.query(
        'INSERT INTO users (name, email, password_hash, subscription_status) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
        [name, email, password_hash, 'active']
      );
      
      const user = rows[0];
      const token = server.jwt.sign({ id: user.id, email: user.email });
      
      return reply.status(201).send({ user, token });
    } finally {
      client.release();
    }
  });

  // Login
  server.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;
    
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    const client = await server.pg.connect();
    try {
      const { rows } = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = rows[0];

      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = server.jwt.sign({ id: user.id, email: user.email });
      return reply.send({ user: { id: user.id, name: user.name, email: user.email }, token });
    } finally {
      client.release();
    }
  });
  
  // Get current user (protected)
  server.get('/me', {
    preValidation: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { rows } = await client.query(
        'SELECT id, name, email, subscription_status, gemini_api_key, openai_api_key FROM users WHERE id = $1',
        [request.user.id]
      );
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return rows[0];
    } finally {
      client.release();
    }
  });

  // Update user API keys & profile (protected)
  server.put('/keys', {
    preValidation: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request: any, reply) => {
    const { name, gemini_api_key, openai_api_key } = request.body as any;
    const client = await server.pg.connect();
    try {
      const { rows } = await client.query(
        `UPDATE users 
         SET name = COALESCE($1, name), 
             gemini_api_key = $2, 
             openai_api_key = $3 
         WHERE id = $4 
         RETURNING id, name, email, subscription_status, gemini_api_key, openai_api_key`,
        [name || null, gemini_api_key !== undefined ? gemini_api_key : null, openai_api_key !== undefined ? openai_api_key : null, request.user.id]
      );
      return reply.send({ success: true, user: rows[0] });
    } catch (err: any) {
      server.log.error('Failed to update keys:', err);
      return reply.status(500).send({ error: 'Failed to update settings' });
    } finally {
      client.release();
    }
  });
};
