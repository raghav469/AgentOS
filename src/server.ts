import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyPostgres from '@fastify/postgres';
import fastifyWebsocket from '@fastify/websocket';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import * as dotenv from 'dotenv';
import { agentRoutes } from './routes/agents';
import { runRoutes } from './routes/runs';
import { wsRoutes } from './routes/ws';
import { userRoutes } from './routes/users';
import { taskRoutes } from './routes/tasks';
import { billingRoutes } from './routes/billing';
import { startWorker } from './worker';
import fastifyRawBody from 'fastify-raw-body';

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any;
  }
}

dotenv.config();

const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function main() {
  await server.register(cors, {
    origin: '*',
  });

  await server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod'
  });

  server.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  await server.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: function (request, context) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `I only allow ${context.max} requests per ${context.after} to this API. Try again soon.`
      }
    }
  });

  await server.register(fastifyPostgres, {
    connectionString: process.env.DATABASE_URL,
  });

  await server.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true
  });

  await server.register(fastifyWebsocket);
  
  server.register(agentRoutes, { prefix: '/api/agents' });
  server.register(runRoutes, { prefix: '/api/runs' });
  server.register(wsRoutes, { prefix: '/ws/runs' });
  server.register(userRoutes, { prefix: '/api/users' });
  server.register(taskRoutes, { prefix: '/api/tasks' });
  server.register(billingRoutes, { prefix: '/api/billing' });

  server.get('/', async (request, reply) => {
    return { message: 'Welcome to the API! Server is running successfully.' };
  });

  server.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  try {
    const PORT = parseInt(process.env.PORT || '3001', 10);
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${PORT}`);
    startWorker().catch(console.error);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
