import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import IORedis from 'ioredis';

export const wsRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Use a dedicated redis connection for subscribing
  const subscriber = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

  server.get('/:runId', { websocket: true }, (connection /* SocketStream */, req) => {
    const { runId } = req.params as { runId: string };
    
    const channelName = `run-events:${runId}`;
    
    // Subscribe to this run's events
    subscriber.subscribe(channelName, (err, count) => {
      if (err) {
        server.log.error(err, 'Failed to subscribe to run-events');
      }
    });

    const messageHandler = (channel: string, message: string) => {
      if (channel === channelName) {
        connection.socket.send(message);
      }
    };

    subscriber.on('message', messageHandler);

    connection.socket.on('close', () => {
      subscriber.off('message', messageHandler);
      subscriber.unsubscribe(channelName);
    });
  });
};
