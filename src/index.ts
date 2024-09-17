import Fastify from 'fastify';
import connectDB from './db';
import authRoutes from './routes/auth';
import cors from '@fastify/cors'
import dotenv from 'dotenv';
import './cronJobs';
import coins from './routes/coins';
import totalCoins from './routes/totalcoins';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.get('/healthcheck', async (request, reply) => {
    return { status: 'ok' };
  });
  

fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

connectDB();

fastify.register(authRoutes);
fastify.register(coins);
fastify.register(totalCoins);

fastify.listen({ port: 3000 }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
