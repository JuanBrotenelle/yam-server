import cron from 'node-cron';
import { assignBonuses, clearInactiveBonuses } from './controllers/bonusGenerator';
import { User } from './models/User';
import { updateTotalCoins } from './modules/totalCoinsstore';


cron.schedule('* * * * *', async () => {
  try {
    const users = await User.find();
    for (const user of users) {
      console.log(`Обрабатываю пользователя с ID: ${user.userId}`);
      await clearInactiveBonuses(user.userId);
      console.log(`Неактивные бонусы для пользователя ${user.userId} очищены`);
      await assignBonuses(user.userId);
      console.log(`Новые бонусы для пользователя ${user.userId} начислены`);
    }
  } catch (error) {
    console.error('Ошибка при начислении бонусов:', error);
  }
});

cron.schedule('0 * * * *', async () => {

  try {
    const users = await User.find({ hourlyIncome: { $gt: 0 } });

    for (const user of users) {
      user.coins += user.hourlyIncome;

      await user.save();
    }

  } catch (error) {
    console.error('Ошибка при начислении монет:', error);
  }
});

cron.schedule('* * * * *', async () => {

  try {
    const result = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$coins" } } }
    ]);

    if (result.length > 0) {
      updateTotalCoins(result[0].total);
    } else {
      updateTotalCoins(0);
    }

  } catch (error) {
    console.error('Ошибка при подсчете общего количества монет:', error);
  }
});;