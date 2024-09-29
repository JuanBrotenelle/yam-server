import { FastifyPluginAsync } from 'fastify';
import { User } from '../models/User';
import mongoose from 'mongoose';

const bonusRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.addHook('preHandler', async (request, reply) => {
    const { authToken } = request.body as { authToken?: string };
    if (!authToken) {
      reply.status(403).send({ error: 'Токен отсутствует' });
      return;
    }

    try {
      await fastify.jwt.verify(authToken);
    } catch (err) {
      reply.status(403).send({ error: 'Неверный токен' });
    }
  });

  async function activateGift(
    userId: number,
    bonusId: string,
    type: 'coins' | 'hourly_income' | 'multiplier',
    value: number
  ): Promise<void> {
    console.log('Input params:', { userId, bonusId, type, value });

    const objectId = mongoose.Types.ObjectId.isValid(bonusId) ? new mongoose.Types.ObjectId(bonusId) : null;
    if (!objectId) {
      throw new Error('Неверный id бонуса');
    }

    const user = await User.findOne({
      "user.userId": userId,
      'game.bonuses.gifts._id': objectId,
      'game.bonuses.gifts.status': 'inactive'
    });

    console.log('Found user:', user);

    if (!user) {
      throw new Error('Бонус не найден или уже использован');
    }

    const updatedUser = await User.updateOne(
      { "user.userId": userId, 'game.bonuses.gifts._id': objectId },
      { $set: { 'game.bonuses.gifts.$.status': 'used' } }
    );

    console.log('Update result:', updatedUser);

    if (updatedUser.modifiedCount === 0) {
      throw new Error('Ошибка активации бонуса');
    }

    switch (type) {
      case 'coins':
        await User.updateOne({ "user.userId": userId }, { $inc: { "game.coins.currentUserCoins": value } });
        await User.updateOne({ "user.userId": userId }, { $inc: { "game.coins.totalUserCoins": value } });
        break;
      case 'hourly_income':
        await User.updateOne({ "user.userId": userId }, { $inc: { "game.hourlyIncome": value } });
        break;
      case 'multiplier':
        await User.updateOne({ "user.userId": userId }, { $mul: { coins: value } });
        break;
    }

    console.log(`Bonus applied: type = ${type}, value = ${value}`);
  }

  async function activateTask(
    userId: number,
    bonusId: string,
    type: 'coins',
    value: number
  ): Promise<void> {
    console.log('Input params:', { userId, bonusId, type, value });

    const objectId = mongoose.Types.ObjectId.isValid(bonusId) ? new mongoose.Types.ObjectId(bonusId) : null;
    if (!objectId) {
      throw new Error('Неверный id бонуса');
    }

    const user = await User.findOne({
      "user.userId": userId,
      'game.bonuses.tasks._id': objectId,
      'game.bonuses.tasks.status': 'inactive'
    });

    console.log('Found user:', user);

    if (!user) {
      throw new Error('Бонус не найден или уже использован');
    }

    const updatedUser = await User.updateOne(
      { "user.userId": userId, 'game.bonuses.tasks._id': objectId },
      { $set: { 'game.bonuses.tasks.$.status': 'used' } }
    );

    console.log('Update result:', updatedUser);

    if (updatedUser.modifiedCount === 0) {
      throw new Error('Ошибка активации бонуса');
    }
    await User.updateOne({ "user.userId": userId }, { $inc: { "game.coins.currentUserCoins": value } });
    await User.updateOne({ "user.userId": userId }, { $inc: { "game.coins.totalUserCoins": value } });
    console.log(`Bonus applied: type = ${type}, value = ${value}`);
  }

  fastify.post('/gifts', async (request, reply) => {
    try {
      const { userId, bonusId, authToken, value, type } = request.body as { userId: number; bonusId: string; authToken: string; value: number, type: 'coins' | 'hourly_income' | 'multiplier' };

      let user = await User.findOne({ "user.userId": userId, authToken });
      if (!user) {
        reply.status(403).send({ error: 'Неверный токен или пользователь' });
        return;
      }

      await activateGift(userId, bonusId, type, value);
      await user.save();

      user = await User.findOne({ "user.userId": userId, "authToken": authToken});

      reply.send({
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
    } catch (error) {
      console.error('Ошибка при обработке запроса /gifts:', (error as Error).message);
      reply.status(500).send({ error: (error as Error).message });
    }
  });
  fastify.post('/tasks', async (request, reply) => {
    try {
      const { userId, bonusId, authToken, value } = request.body as { userId: number; bonusId: string; authToken: string; value: number };
  
      let user = await User.findOne({ "user.userId": userId, "authToken": authToken });
      if (!user) {
        reply.status(403).send({ error: 'Неверный токен или пользователь' });
        return;
      }
  
      await activateTask(userId, bonusId, 'coins', value);
      await user.save();
  
      user = await User.findOne({ "user.userId": userId, "authToken": authToken });
  
      reply.send({
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
    } catch (error) {
      console.error('Ошибка при обработке запроса /tasks:', (error as Error).message);
      reply.status(500).send({ error: (error as Error).message });
    }
  });
};

export default bonusRoutes;
