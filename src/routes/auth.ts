import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User';
import { assignBonuses } from '../controllers/bonusGenerator';
import Bonus, { IBonus } from '../models/Bonus';
import validateTelegramData from '../controllers/validateTelegramData'; // Импорт функции валидации

async function syncGiftsBonuses(userId: number) {
  try {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const allGifts: IBonus[] = await Bonus.find({});
    const giftsToAdd = allGifts.filter(gift => {
      return !user.bonuses.gifts.some(userGift => userGift._id.equals(gift._id));
    });

    if (giftsToAdd.length > 0) {
      user.bonuses.gifts.push(...giftsToAdd);
      await user.save();
    }
  } catch (error) {
    console.error('Error synchronizing gifts bonuses:', error);
  }
}

interface StartRequestBody {
  initData: string; // Поле для initData
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/start', async (request: FastifyRequest<{ Body: StartRequestBody }>, reply: FastifyReply) => {
    const { initData } = request.body;

    const validatedData = validateTelegramData(initData);

    if (!validatedData) {
      reply.status(400).send({ error: 'Invalid Telegram data' });
      return;
    }

    const ReferalLink = validatedData.start_param;
    const userData = validatedData.user;

    if (!userData.id) {
      reply.status(400).send({ error: 'User ID is required' });
      return;
    }

    let user = await User.findOne({ userId: userData.id });

    if (!user) {
      const token = fastify.jwt.sign({
        userId: userData.id,
        isPremium: userData.is_premium,
      });

      user = new User({
        userId: userData.id,
        isBot: userData.is_bot !== undefined ? userData.is_bot : false,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
        isPremium: userData.is_premium,
        photoUrl: userData.photo_url,
        token: token,
        referalLink: ReferalLink,
      });
      if (ReferalLink) {
        const inviter = await User.findOne({ userId: Number(user.referalLink) });

        if (inviter) {
          inviter.referals.push({
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            photoUrl: user.photoUrl,
            isPremium: user.isPremium,
          });

          inviter.hourlyIncome += user.isPremium ? 0.050 : 0.010;

          await inviter.save();
        }
      }

      try {
        await user.save();
        console.log("User saved successfully:", user);
      } catch (error) {
        console.error("Error saving user:", error);
      }

      try {
        await assignBonuses(user.userId);
        console.log("Были начислены первые бонусы пользователю:", user.firstName);
      } catch (error) {
        console.error("Error assigning bonuses:", error);
      }
    }

    await syncGiftsBonuses(user.userId);

    user = await User.findOne({ userId: userData.id });

    reply.send({
      userId: user?.userId,
      token: user?.token,
      referals: user?.referals,
      bonuses: user?.bonuses,
      coins: user?.coins,
      hourlyIncome: user?.hourlyIncome,
    });
  });
};

export default authRoutes;
