import cron from 'node-cron';
import { assignBonuses, clearInactiveBonuses } from './controllers/bonusGenerator';
import { User } from './models/User';
import { updateTotalCoins } from './modules/totalCoinsstore';


cron.schedule('0 0 * * *', async () => {
  console.log('Cron job started');

  try {
    const users = await User.find();
    for (const user of users) {
      await clearInactiveBonuses(user.userId);
      await assignBonuses(user.userId);
    }
    console.log('Бонусы начислены всем игрокам');
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

    console.log('Начисление монет завершено.');
  } catch (error) {
    console.error('Ошибка при начислении монет:', error);
  }
});

cron.schedule('* * * * *', async () => {
  console.log('Подсчет общего количества монет начался.');

  try {
    const result = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$coins" } } }
    ]);

    if (result.length > 0) {
      updateTotalCoins(result[0].total);
    } else {
      updateTotalCoins(0);
    }

    console.log(`Суммарное количество монет обновлено: ${result[0]?.total || 0}`);
  } catch (error) {
    console.error('Ошибка при подсчете общего количества монет:', error);
  }
});;