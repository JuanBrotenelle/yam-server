import cron from 'node-cron';
import { User } from './models/User';

cron.schedule('0 0 * * *', async () => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  const users = await User.find({});

  for (const user of users) {
    const lastAuthTime = user.dateData.lastAuth.getTime();

    if (lastAuthTime >= startOfDay && lastAuthTime < endOfDay) {
      user.dateData.daysStreak += 1;
      user.dateData.totalDaysInGame += 1;
      await user.save();
    } else {
      user.dateData.totalDaysInGame += 1;
      await user.save();
    }
  }

  console.log('Daily streak update completed.');
});