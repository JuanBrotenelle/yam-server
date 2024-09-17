import { User } from '../models/User';
import Bonus from '../models/Bonus';

interface BonusData {
  type: 'coins' | 'hourly_income' | 'multiplier';
  value: number;
  active: boolean;
}

function exponentialRandom(lambda: number): number {
  return -Math.log(1 - Math.random()) / lambda;
}

function generateCoinBonus(): BonusData {
  const maxCoins = 1.5;
  const minCoins = 0.001;
  const lambda = 1.5;

  let value = exponentialRandom(lambda);
  value = Math.min(maxCoins, Math.max(minCoins, value));

  return {
    type: 'coins',
    value: parseFloat(value.toFixed(3)),
    active: true,
  };
}

function generateHourlyIncomeBonus(): BonusData | null {
  const maxIncome = 1.5;
  const minIncome = 0.001;
  const lambda = 1.5;
  const chance = 65;
  const roll = Math.random() * 100;

  let value = exponentialRandom(lambda);
  value = Math.min(maxIncome, Math.max(minIncome, value));

  if (roll <= chance) {
    return {
      type: 'hourly_income',
      value: parseFloat(value.toFixed(3)),
      active: true,
    };
  }

  return null;
}

function generateMultiplierBonus(): BonusData | null {
  const chance = 1.5;
  const roll = Math.random() * 100;

  if (roll <= chance) {
    return {
      type: 'multiplier',
      value: 2,
      active: true,
    };
  }

  return null;
}

function generatePlayerBonuses(): BonusData[] {
  const bonuses: BonusData[] = [];
  bonuses.push(generateCoinBonus());

  const multiplierBonus = generateMultiplierBonus();
  const hourlyincomeBonus = generateHourlyIncomeBonus();
  if (hourlyincomeBonus) {
    bonuses.push(hourlyincomeBonus);
  } else {
    bonuses.push(generateCoinBonus());
  }

  if (multiplierBonus) {
    bonuses.push(multiplierBonus);
  } else {
    bonuses.push(generateCoinBonus());
  }

  return bonuses;
}

export const assignBonuses = async (userId: number) => {
  const bonuses = generatePlayerBonuses();
  await User.updateOne(
    { userId },
    { $push: { 'bonuses.default': { $each: bonuses } } }
  );
};


export async function clearInactiveBonuses(userId: number) {
  try {
    await User.updateOne(
      { userId },
      { $pull: { 'bonuses.default': { status: "inactive" } } }
    );
  } catch (error) {
    console.error(`Ошибка при удалении неактивных бонусов для пользователя ${userId}:`, error);
  }
}