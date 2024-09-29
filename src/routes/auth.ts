import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User';
import Gift, { IGift } from '../models/Gift';
import Task, { ITask } from '../models/Task';
import validateTelegramData from '../controllers/validateTelegramData';
import { clearCombo, generateCombo } from '../controllers/comboController';

async function syncGifts(userId: number) {
  try {
    const user = await User.findOne({ 'user.userId': userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const allGifts: IGift[] = await Gift.find({});
    const giftsToAdd = allGifts.filter(gift => {
      return !user.game.bonuses.gifts.some(userGift => userGift._id.equals(gift._id));
    });

    if (giftsToAdd.length > 0) {
      user.game.bonuses.gifts.push(...giftsToAdd);
      await user.save();
    }
  } catch (error) {
    console.error('Error synchronizing gifts bonuses:', error);
  }
}

async function syncTasks(userId: number) {
  try {
    const user = await User.findOne({ 'user.userId': userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const allTasks: ITask[] = await Task.find({});
    const tasksToAdd = allTasks.filter(task => {
      return !user.game.bonuses.tasks.some(userTask => userTask._id.equals(task._id));
    });

    if (tasksToAdd.length > 0) {
      user.game.bonuses.tasks.push(...tasksToAdd);
      await user.save();
    }
  } catch (error) {
    console.error('Error synchronizing tasks', error);
  }
}


function createUniqueId(userId: number, quantity: number) {
  const register = "abcdefghigklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const userIdStr = userId.toString();

  const modifiedRegister = [
    register.slice(0, 13),
    register.slice(13, 25),
    register.slice(25, 37),
    register.slice(37, 49),
    register.slice(49)
  ].join(userIdStr);

  let link = "";
  for (let i = 0; i < quantity + 1; i++) {
    link += modifiedRegister.charAt(Math.floor(Math.random() * register.length));
  }

  return link
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/start', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('tma ')) {
      reply.status(400).send({ error: 'Invalid or missing Authorization header' });
      return;
    }

    const initData = authHeader.slice(4);

    const validatedData = validateTelegramData(initData);

    if (!validatedData) {
      reply.status(400).send({ error: 'Invalid Telegram data' });
      return;
    }
    const userData = validatedData.user;

    if (!userData.id) {
      reply.status(400).send({ error: 'User ID is required' });
      return;
    }

    let user = await User.findOne({ 'user.userId': userData.id });

    if (!user) {
      const token = fastify.jwt.sign({
        userId: userData.id,
        isPremium: userData.is_premium,
      });

      user = new User({
        authToken: token,
        supportId: createUniqueId(userData.id, 15),
        dateData: {
          firstAuth: validatedData.auth_date,
          currentAuth: validatedData.auth_date,
          lastAuth: new Date(),
        },
        user: {
        userId: userData.id,
        isBot: userData.is_bot !== undefined ? userData.is_bot : false,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
        isPremium: userData.is_premium ?? false,
        photoUrl: userData.photo_url ?? '',
        referalLink: "ref_"+createUniqueId(userData.id, 8),
      }});
      if (validatedData.start_param) {
        const inviter = await User.findOne({ "user.referalLink": validatedData.start_param });

        if (!inviter) {
          console.log("Inviter not found:", validatedData.start_param);
          reply.status(400).send({ error: 'Inviter not found' });
          return;
        }

        if (inviter) {
          inviter.referals.push({
            userId: user.user.userId,
            firstName: user.user.firstName,
            lastName: user.user.lastName,
            photoUrl: user.user.photoUrl ?? '',
            isPremium: user.user.isPremium ?? false,
            totalReferalCoins: 0,
            accountExperience: 0,
          });
          inviter.game.accountExperience += user.user.isPremium ? 250 : 75;
          inviter.game.coins.currentUserCoins += user.user.isPremium ? 0.050 : 0.010;
          inviter.game.coins.totalUserCoins += user.user.isPremium ? 0.050 : 0.010;

          await inviter.save();
        }
      }

      try {
        await user.save();
        console.log("User saved successfully:", user);
      } catch (error) {
        console.error("Error saving user:", error);
      }
    } else {
      const authData: Date = validatedData.auth_date;
      user.dateData.currentAuth = authData;
      const betweenTime: number = authData.getTime() - user.dateData.lastAuth.getTime();

      if (user.dateData.lastAuth < authData) {
        if (betweenTime > 1000 * 60) {
          if (betweenTime < 1000 * 60 * 60 * 3) {
            user.game.coins.currentUserCoins += user.game.hourlyIncome / 3 * betweenTime / 1000 / 60 / 60;
            user.game.coins.totalUserCoins += user.game.hourlyIncome / 3 * betweenTime / 1000 / 60 /60;
            user.game.coins.awayFromGame += user.game.hourlyIncome / 3 * betweenTime / 1000 / 60 /60;
          } else {
            user.game.coins.currentUserCoins += user.game.hourlyIncome;
            user.game.coins.totalUserCoins += user.game.hourlyIncome;
            user.game.coins.awayFromGame += user.game.hourlyIncome;
          }
        }
      }
      
      if (user.dateData.daysStreak > 1 && user.dateData.daysStreak <= 14) {
        user.game.accountExperience += (user.dateData.daysStreak - 1 < 2) ? 0.5 : Math.pow(2, user.dateData.daysStreak - 1);
      } else if (user.dateData.daysStreak > 10) {
        user.game.accountExperience += 256;
      }

      user.user.firstName = userData.first_name;
      user.user.lastName = userData.last_name;
      user.user.username = userData.username;
      user.user.isPremium = userData.is_premium ?? false;
      user.user.photoUrl = userData.photo_url;
      let inviter = await User.findOne({ "referals.userId": userData.id });
      if (inviter) {
        const referal = inviter.referals.find(r => r.userId === userData.id);
      
        if (referal) {
          const updates: {
            firstName: string;
            lastName?: string;
            isPremium: boolean;
            photoUrl?: string;
            totalReferalCoins: number;
            accountExperience: number;
          } = {
            firstName: userData.first_name,
            lastName: userData.last_name,
            isPremium: userData.is_premium ?? false,
            photoUrl: userData.photo_url,
            totalReferalCoins: user.game.coins.currentUserCoins,
            accountExperience: user.game.accountExperience,
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
    try {
      await user.save();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }
    try {
      await clearCombo(user.user.userId)
      await generateCombo(user.user.userId)
    } catch (error) {console.error('Error while generating combo:', error);}
    try {await Promise.all([syncGifts(user.user.userId), syncTasks(user.user.userId)]);} catch (error) {console.error('Error synchronizing bonuses:', error);}


    user = await User.findOne({ "user.userId": userData.id });

    reply.setCookie('exampleCookie', user?.authToken ?? '', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600,
    }).send({
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
};

export default authRoutes;
