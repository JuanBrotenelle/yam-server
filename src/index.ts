import Fastify from 'fastify';
import connectDB from './db';
import authRoutes from './routes/auth';
import cors from '@fastify/cors'
import giftsandtasks from './routes/giftsAndTasks';
import jwt from 'fastify-jwt';
import fastifyCookie from 'fastify-cookie';
import ComboRoutes from './routes/ComboRoutes';
import Upgrades from './routes/upgrades';
import LastAuthWebSocket from './routes/lastAuth';
import './cronJobs';

const fastify = Fastify({ logger: true });

fastify.register(fastifyCookie);


if (!process.env.SECRET_KEY_FOR_JWT) {
  throw new Error('SECRET_KEY_FOR_JWT must be set');
} else {
  fastify.register(jwt, {
    secret: process.env.SECRET_KEY_FOR_JWT
  }); 
}


fastify.get('/healthcheck', async (request, reply) => {
    return { status: 'ok' };
  });

fastify.get('/set-cookie', (request, reply) => {
  reply
    .setCookie('exampleCookie', 'cookieValue', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600
    })
    .send({ message: 'Cookie is ready.' });
});

fastify.register(cors, {
    origin: 'https://yamton.space',
    //origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

connectDB();

fastify.register(authRoutes);
fastify.register(giftsandtasks);
fastify.register(ComboRoutes);
fastify.register(Upgrades)
fastify.register(LastAuthWebSocket);

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
