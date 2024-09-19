import Fastify from 'fastify';
import connectDB from './db';
import authRoutes from './routes/auth';
import cors from '@fastify/cors'
import dotenv from 'dotenv';
import './cronJobs';
import coins from './routes/coins';
import totalCoins from './routes/totalcoins';
import jwt from 'fastify-jwt';


dotenv.config();

const fastify = Fastify({ logger: false });

fastify.register(jwt, {
  secret: '8dSSH2kdc21mMD4'
});


fastify.get('/healthcheck', async (request, reply) => {
    return { status: 'ok' };
  });
  

fastify.register(cors, {
    origin: 'https://yamton.space',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

connectDB();

fastify.register(authRoutes);
fastify.register(coins);
fastify.register(totalCoins);

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
