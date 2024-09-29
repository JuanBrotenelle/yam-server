import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { User } from '../models/User';

interface LastAuthQueryParams {
  userId: number;
  authToken: string;
}

export default async function routes(fastify: FastifyInstance) {
  fastify.get('/lastauth', async (request: FastifyRequest<{ Querystring: LastAuthQueryParams }>, reply: FastifyReply) => {
    const { userId, authToken } = request.query;

    if (!userId || !authToken) {
      return reply.status(400).send({ success: false, message: 'Invalid parameters' });
    }

    try {
      const user = await User.findOne({ 'user.userId': Number(userId), 'authToken': authToken });
      if (!user) {
        return reply.status(400).send({ success: false, message: 'User not found' });
      }

      user.dateData.lastAuth = new Date();
      user.dateData.totalHours += (user.dateData.currentAuth.getTime() - user.dateData.firstAuth.getTime()) / 1000 / 60 / 60;

      await user.save();
    } catch (error) {
      console.error('Error processing request:', error);
      reply.status(500).send({ success: false, message: 'Server error' });
    }

    reply.status(200).send({ success: true });
  });
}
