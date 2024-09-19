import { FastifyPluginAsync } from 'fastify';
import { User } from '../models/User';
import mongoose from 'mongoose';

const bonusRoutes: FastifyPluginAsync = async (fastify) => {

  fastify.addHook('preHandler', async (request, reply) => {
    const { token } = request.body as { token?: string };
    if (!token) {
      reply.status(403).send({ error: 'Токен отсутствует' });
      return;
    }

    try {
      await fastify.jwt.verify(token);
    } catch (err) {
      reply.status(403).send({ error: 'Неверный токен' });
    }
  });

  async function activateBonus(
    userId: number,
    bonusId: string,
    type: 'coins' | 'hourly_income' | 'multiplier',
    value: number
  ): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(bonusId)) {
      throw new Error('Неверный id бонуса');
    }

    const user = await User.findOne({
      userId,
      'bonuses.default._id': bonusId,
      'bonuses.default.status': 'inactive'
    });

    if (!user) {
      throw new Error('Бонус не найден или уже использован');
    }

    console.log(`Found user with bonus:`, user);

    const updatedUser = await User.updateOne(
      { userId, 'bonuses.default._id': bonusId },
      { $set: { 'bonuses.default.$.status': 'used' } }
    );

    console.log(`Update result:`, updatedUser);

    if (updatedUser.modifiedCount === 0) {
      throw new Error('Ошибка активации бонуса');
    }
  }

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
      userId,
      'bonuses.gifts._id': objectId,
      'bonuses.gifts.status': 'inactive'
    });

    console.log('Found user:', user);

    if (!user) {
      throw new Error('Бонус не найден или уже использован');
    }

    const updatedUser = await User.updateOne(
      { userId, 'bonuses.gifts._id': objectId },
      { $set: { 'bonuses.gifts.$.status': 'used' } }
    );

    console.log('Update result:', updatedUser);

    if (updatedUser.modifiedCount === 0) {
      throw new Error('Ошибка активации бонуса');
    }

    if (type === 'coins') {
      await User.updateOne({ userId }, { $inc: { coins: value } });
    } else if (type === 'hourly_income') {
      await User.updateOne({ userId }, { $inc: { hourlyIncome: value } });
    } else if (type === 'multiplier') {
      await User.updateOne({ userId }, { $mul: { coins: value } });
    }

    console.log(`Bonus applied: type = ${type}, value = ${value}`);
  }

  fastify.post('/coins', async (request, reply) => {
    try {
      const { userId, bonusId, token, value } = request.body as { userId: number; bonusId: string; token: string; value: number };

      let user = await User.findOne({ userId, token });
      if (!user) {
        reply.status(403).send({ error: 'Неверный токен' });
        return;
      }

      await activateBonus(userId, bonusId, 'coins', value);

      user.coins += value;
      await user.save();

      user = await User.findOne({ userId, token });

      reply.send({
        token: user?.token,
        referals: user?.referals,
        bonuses: user?.bonuses,
        coins: user?.coins,
        hourlyIncome: user?.hourlyIncome,
      });
    } catch (error) {
      console.error('Ошибка при обработке запроса /coins:', (error as Error).message);
      reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/income', async (request, reply) => {
    try {
      const { userId, bonusId, token, value } = request.body as { userId: number; bonusId: string; token: string; value: number };

      let user = await User.findOne({ userId, token });
      if (!user) {
        reply.status(403).send({ error: 'Неверный токен или пользователь' });
        return;
      }

      await activateBonus(userId, bonusId, 'hourly_income', value);

      user.hourlyIncome += value;
      await user.save();

      user = await User.findOne({ userId, token });

      reply.send({
        token: user?.token,
        referals: user?.referals,
        bonuses: user?.bonuses,
        coins: user?.coins,
        hourlyIncome: user?.hourlyIncome,
      });
    } catch (error) {
      console.error('Ошибка при обработке запроса /income:', (error as Error).message);
      reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/multiplier', async (request, reply) => {
    try {
      const { userId, bonusId, token, value } = request.body as { userId: number; bonusId: string; token: string; value: number };

      let user = await User.findOne({ userId, token });
      if (!user) {
        reply.status(403).send({ error: 'Неверный токен или пользователь' });
        return;
      }

      await activateBonus(userId, bonusId, 'multiplier', value);

      user.coins *= value;
      await user.save();

      user = await User.findOne({ userId, token });

      reply.send({
        token: user?.token,
        referals: user?.referals,
        bonuses: user?.bonuses,
        coins: user?.coins,
        hourlyIncome: user?.hourlyIncome,
      });
    } catch (error) {
      console.error('Ошибка при обработке запроса /multiplier:', (error as Error).message);
      reply.status(500).send({ error: (error as Error).message });
    }
  });

  fastify.post('/gifts', async (request, reply) => {
    try {
      const { userId, bonusId, token, value, type } = request.body as { userId: number; bonusId: string; token: string; value: number, type: 'coins' | 'hourly_income' | 'multiplier' };

      let user = await User.findOne({ userId, token });
      if (!user) {
        reply.status(403).send({ error: 'Неверный токен или пользователь' });
        return;
      }

      await activateGift(userId, bonusId, type, value);

      if (type === 'coins') {
        user.coins += value;
      } else if (type === 'hourly_income') {
        user.hourlyIncome += value;
      } else if (type === 'multiplier') {
        user.coins *= value;
      }
      await user.save();

      user = await User.findOne({ userId, token });

      reply.send({
        token: user?.token,
        referals: user?.referals,
        bonuses: user?.bonuses,
        coins: user?.coins,
        hourlyIncome: user?.hourlyIncome,
      });
    } catch (error) {
      console.error('Ошибка при обработке запроса /gifts:', (error as Error).message);
      reply.status(500).send({ error: (error as Error).message });
    }
  });
};

export default bonusRoutes;
