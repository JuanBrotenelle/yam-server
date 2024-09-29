import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { User } from '../models/User';

interface LastAuthRequestBody {
  userId: number;
  authToken: string;
}

export default async function routes(fastify: FastifyInstance) {
  fastify.post('/lastauth', async (request: FastifyRequest<{ Body: LastAuthRequestBody }>, reply: FastifyReply) => {
    const { userId, authToken } = request.body;

    if (!userId || !authToken) {
      return reply.status(400).send({ success: false, message: 'Invalid parameters' });
    }

    try {
      const user = await User.findOne({ 'user.userId': userId, 'authToken': authToken });
      if (!user) {
        return reply.status(400).send({ success: false, message: 'User not found' });
      }

      user.dateData.lastAuth = new Date();
      user.dateData.totalHours += (user.dateData.currentAuth.getTime() - user.dateData.firstAuth.getTime()) / 1000 / 60 / 60;

      await user.save();
      return
    } catch (error) {
      console.error('Ошибка при обработке запроса:', error);
      reply.status(500).send({ success: false, message: 'Ошибка сервера' });
    }

    const user = await User.findOne({ 'user.userId': userId, 'authToken': authToken });
    let inviter = await User.findOne({ "referals.userId": userId});
      if (inviter) {
        const referal = inviter.referals.find(r => r.userId === userId);
      
        if (referal) {
          const updates: {
            totalReferalCoins: number;
            accountExperience: number;
          } = {
            totalReferalCoins: user!.game.coins.currentUserCoins,
            accountExperience: user!.game.accountExperience,
          };
        
          let hasChanged = false;
        
          for (const key in updates) {
            const typedKey = key as keyof typeof updates;
          
            if (typedKey in referal) {
              const value = updates[typedKey];
              if (referal[typedKey] !== value) {
                if (value !== undefined) {
                  (referal as any)[typedKey] = value;
                  hasChanged = true;
                }
              }
            }
          }
          if (hasChanged) {
            try {
              await inviter.save();
            } catch (error) {
              console.error('Error saving user:', error);
            }
          }
        }
      }
  });
}
