import { User } from "../models/User";

interface ComboElement {
    type: 'trash' | 'cherry' | 'strawberry' | 'banana' | 'pineapple' | 'yam' | 'hamster'
}

interface ComboElementChance extends ComboElement {
    chance: number
}

interface Reward extends ComboElementChance {
    value: number
}

interface Level extends Reward {
    availableLevel: number
}

const chancesOfComboElements: Level[] = [
    {
        type: 'trash',
        chance: 0.5,
        value: 0,
        availableLevel: 1
    },
    {
        type: 'cherry',
        chance: 0.3,
        value: 0.005,
        availableLevel: 1
    },
    {
        type: 'strawberry',
        chance: 0.2,
        value: 0.015,
        availableLevel: 2
    },
    {
        type: 'banana',
        chance: 0.15,
        value: 0.05,
        availableLevel: 2
    },
    {
        type: 'pineapple',
        chance: 0.075,
        value: 0.5,
        availableLevel: 3
    },
    {
        type: 'yam',
        chance: 0.025,
        value: 1,
        availableLevel: 4
    },
    {
        type: 'hamster',
        chance: 0.001,
        value: 2,
        availableLevel: 5
    }
]

export async function generateCombo(userId: number): Promise<void> {
    const user = await User.findOne({ "user.userId": userId });
    if (!user) throw new Error('User not found');
    
    const combo = [];
    const availableElements = chancesOfComboElements.filter(element => element.availableLevel <= user.game.combos.level);

    for (let i = 0; i < 3; i++) {
        const roll = Math.random();

        const totalChance = availableElements.reduce((sum, element) => sum + element.chance, 0);

        let accumulatedChance = 0;
        const selectedElement = availableElements.find(element => {
            accumulatedChance += element.chance / totalChance;
            return roll <= accumulatedChance;
        });
        combo.push({type: selectedElement!.type});
    }
    await User.updateOne({ "user.userId": userId }, { $push: { 'game.combos.currentUserCombo': combo } });
    await user.save();
}

export async function clearCombo(userId: number): Promise<void> {
    const user = await User.findOne({ "user.userId": userId });
    if (!user) throw new Error('User not found');
    await User.updateOne({ "user.userId": userId }, { $set: { 'game.combos.currentUserCombo': [] } });
    user.game.combos.currentUserCombo = [];
    await user.save();
}

export async function assignComboBonuses(userId: number): Promise<number> {
    const user = await User.findOne({ "user.userId": userId });
    if (!user) throw new Error('User not found');
  
    const combo = user.game.combos.currentUserCombo as ComboElement[];
    let totalBonusValue = 0;
    let multiplier = 1;
  
    for (let i = 0; i < combo.length; i++) {
      const currentType = combo[i].type;
      const bonus = chancesOfComboElements.find((element) => element.type === currentType);
  
      if (!bonus) throw new Error('Bonus not found');
  
      if (i > 0 && combo[i].type === combo[i - 1].type) {
        multiplier++;
      } else {
        multiplier = 1;
      }
  
      totalBonusValue += bonus.value * multiplier;
    }
  
    if (totalBonusValue > 0) {
        user.game.coins.currentUserCoins += totalBonusValue;
        user.game.coins.totalUserCoins += totalBonusValue;
        user.game.accountExperience += 5;
        await user.save();
    } else {
        user.game.accountExperience += 5;
        await user.save();
    }
  
    return totalBonusValue;
  }
  