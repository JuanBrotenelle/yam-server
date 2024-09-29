import { FastifyPluginAsync } from 'fastify';
import { User } from '../models/User';
import { generateCombo, clearCombo, assignComboBonuses } from '../controllers/comboController';

const ComboRoutes: FastifyPluginAsync = async (fastify) => {

    fastify.addHook('preHandler', async (request, reply) => {
      const { token } = request.body as { token?: string };
      if (!token) {
        reply.status(403).send({ error: 'Token is required' });
        return;
      }
  
      try {
        await fastify.jwt.verify(token);
      } catch (err) {
        reply.status(403).send({ error: 'Invalid token' });
      }
    });

    fastify.post('/combo', async (request, reply) => {
      const { token, userId } = request.body as { token?: string, userId?: number };
    
      if (!token || !userId) {
        reply.status(400).send({ error: 'Invalid parameters' });
        return;
      }
    
      let postComboStatus: boolean = false;
      let assignBonusValue = 0;
    
      try {
        const value = await assignComboBonuses(userId);
        if (value > 0) {
          postComboStatus = true;
          assignBonusValue = value;
        }
        await clearCombo(userId);
        await generateCombo(userId);
      } catch (e: any) {
        reply.status(400).send({ error: e.message });
        return;
      }
    
      let user = await User.findOne({ 'user.userId': userId });
      if (!user) {
        reply.status(404).send({ error: 'User not found' });
        return;
      }
    
      user.game.combos.totalUserCombos += 1;
      await user.save();
      user = await User.findOne({ 'user.userId': userId });
    
      reply.send({
        postComboStatus: postComboStatus,
        authToken: user?.authToken ?? '',
        supportId: user?.supportId ?? '',
        user: user?.user ?? null,
        daysStreak: user?.dateData.daysStreak ?? 0,
        game: {
          accountExperience: user?.game.accountExperience ?? 0,
          awayFromGame: user?.game.coins.awayFromGame ?? 0,
          currentUserCoins: user?.game.coins.currentUserCoins ?? 0,
          currentUserIncome: user?.game.hourlyIncome ?? 0,
          comboLevel: user?.game.combos.level ?? 0,
          combo: user?.game.combos.currentUserCombo ?? null,
          bonuses: user?.game.bonuses ?? [],
        },
        referals: user?.referals ?? [],
      });
    });
    
}

export default ComboRoutes;