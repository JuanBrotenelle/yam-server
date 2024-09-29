import { FastifyPluginAsync } from 'fastify';
import { User } from '../models/User';

interface ComboUpgrade {
    level: number;
    cost: number;
}

const comboUpgrades: ComboUpgrade[] = [
    { level: 2, cost: 2 },
    { level: 3, cost: 10 },
    { level: 4, cost: 20 },
    { level: 5, cost: 50 },
]

const Upgrades: FastifyPluginAsync = async (fastify) => {

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

    fastify.post('/preupgradeincome', async (request, reply) => {
        const { token, userId } = request.body as { token?: string, userId?: number};
        if (!token || !userId ) {
            reply.status(400).send({ error: 'Некорректные параметры' });
            return;
        }

        let user = await User.findOne({ 'user.userId': userId });

        if (!user) {
            reply.status(400).send({ error: 'Пользователь не найден' });
            return;
        }

        const coins = user.game.coins.currentUserCoins;
        const income = user.game.hourlyIncome;
        const xp = user.game.accountExperience;

        const passiveIncomeUpgrade = (0.001 + (coins * 0.001)) + (xp / 1000 + 0.001) / 3;
        const passiveIncomeCost = Math.max(
        Number((passiveIncomeUpgrade * 3 * 3 - (xp * 0.001)).toFixed(3)), 0.100
        );

        reply.send( passiveIncomeCost );
    });

    fastify.post('/upgradeincome', async (request, reply) => {
        const { token, userId } = request.body as { token?: string, userId?: number};
        if (!token || !userId ) {
            reply.status(400).send({ error: 'Некорректные параметры' });
            return;
        }

        let user = await User.findOne({ 'user.userId': userId });

        if (!user) {
            reply.status(400).send({ error: 'Пользователь не найден' });
            return;
        }

        const coins = user.game.coins.currentUserCoins;
        const income = user.game.hourlyIncome;
        const xp = user.game.accountExperience;

        const passiveIncomeUpgrade = (0.001 + (coins * 0.001)) + (xp / 1000 + 0.001) / 3;
        const passiveIncomeCost = Math.max(
        Number((passiveIncomeUpgrade * 3 * 3 - (xp * 0.001)).toFixed(3)), 0.100
        );


        if (passiveIncomeCost <= coins) {
            await User.updateOne({ 'user.userId': userId }, { $set: { 'game.hourlyIncome': income + passiveIncomeUpgrade } });
            await User.updateOne({ 'user.userId': userId }, { $set: { 'game.coins.currentUserCoins': coins - passiveIncomeCost } });
            await User.updateOne({ 'user.userId': userId }, { $inc: { 'game.accountExperience': 50 } });
        } else {
            reply.status(400).send({ error: 'Not enough coins' });
        }

        user = await User.findOne({ 'user.userId': userId });
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
    });

    fastify.post('/preupgradecombo', async (request, reply) => {
        const { token, userId } = request.body as { token?: string, userId?: number};

        if (!token || !userId ) {
            reply.status(400).send({ error: 'Некорректные параметры' });
            return;
        }

        let user = await User.findOne({ 'user.userId': userId });

        if (!user) {
            reply.status(400).send({ error: 'Пользователь не найден' });
            return;
        }
        const level = user.game.combos.level;
        const costUpgrade = comboUpgrades.find((element) => level + 1 === element.level)!.cost
        reply.send(costUpgrade);
    });

    fastify.post('/upgradecombo', async (request, reply) => {
        const { token, userId } = request.body as { token?: string, userId?: number};

        if (!token || !userId ) {
            reply.status(400).send({ error: 'Некорректные параметры' });
            return;
        }

        let user = await User.findOne({ 'user.userId': userId });

        if (!user) {
            reply.status(400).send({ error: 'Пользователь не найден' });
            return;
        }

        const coins = user.game.coins.currentUserCoins;
        const level = user.game.combos.level;
        const costUpgrade = comboUpgrades.find((element) => level + 1 === element.level)!.cost

        if (costUpgrade <= coins) {
            await User.updateOne({ 'user.userId': userId }, { $set: { 'game.combos.level': level + 1 } });
            await User.updateOne({ 'user.userId': userId }, { $set: { 'game.coins.currentUserCoins': coins - costUpgrade } });
            await User.updateOne({ 'user.userId': userId }, { $inc: { 'game.accountExperience': 50 } });
        } else {
            reply.status(400).send({ error: 'Not enough coins' });
        }

        user = await User.findOne({ 'user.userId': userId });
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
        })
        
    });
}

export default Upgrades