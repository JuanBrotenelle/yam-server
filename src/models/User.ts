import mongoose, { Schema, Document } from 'mongoose';
import { IGift } from './Gift';
import { ITask } from './Task';

export interface IUser extends Document {
  authToken: string;
  supportId: string;
  dateData: {
    firstAuth: Date;
    currentAuth: Date;
    lastAuth: Date;
    totalHours: number;
    totalDaysInGame: number;
    daysStreak: number;
  };
  user: {
    userId: number;
    isBot?: boolean;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
    isPremium?: boolean;
    photoUrl?: string;
    referalLink: string;
  };
  game: {
    accountExperience: number;
    coins: {
      totalUserCoins: number;
      currentUserCoins: number;
      awayFromGame: number;
    };
    hourlyIncome: number;
    combos: {
      totalUserCombos: number;
      currentUserCombo: Array<{
        type: 'trash' | 'cherry' | 'strawberry' | 'banana' | 'pineapple' | 'yam' | 'hamster';
      }>;
      level: number;
    };
    bonuses: {
      gifts: IGift[];
      tasks: ITask[]
    };
  };
  referals: Array<{
    userId: number;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
    isPremium: boolean;
    totalReferalCoins: number;
    accountExperience: number;
  }>;
}

const UserSchema: Schema<IUser> = new Schema({
  authToken: { type: String, required: true },
  supportId: { type: String, required: true },
  dateData: {
    firstAuth: { type: Date, required: true },
    lastAuth: { type: Date },
    currentAuth: { type: Date, required: true },
    totalHours: { type: Number, required: true, default: 0 },
    totalDaysInGame: { type: Number, required: true, default: 1 },
    daysStreak: { type: Number, required: true, default: 1 },
  },
  user: {
    userId: { type: Number, required: true },
    isBot: { type: Boolean },
    firstName: { type: String, required: true },
    lastName: { type: String },
    username: { type: String },
    languageCode: { type: String },
    isPremium: { type: Boolean },
    photoUrl: { type: String },
    referalLink: { type: String, required: true },
  },
  game: {
    accountExperience: { type: Number, required: true, default: 0 },
    coins: {
      totalUserCoins: { type: Number, required: true, default: 0 },
      currentUserCoins: { type: Number, required: true, default: 0 },
      awayFromGame: { type: Number, required: true, default: 0 },
    },
    hourlyIncome: { type: Number, required: true, default: 0 },
    combos: {
      level: { type: Number, required: true, default: 1 },
      totalUserCombos: { type: Number, required: true, default: 0 },
      currentUserCombo: [{
        type: { type: String, enum: ['trash', 'cherry', 'strawberry', 'banana', 'pineapple', 'yam', 'hamster'], required: true }
      }]
    },
    bonuses: {
      gifts: [{ type: Schema.Types.Mixed, ref: 'Gifts', required: true }],
      tasks: [{ type: Schema.Types.Mixed, ref: 'Tasks', required: true }],
    }
  },
  referals: [{
    userId: { type: Number, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    photoUrl: { type: String },
    isPremium: { type: Boolean, required: true },
    totalReferalCoins: { type: Number, required: true },
    accountExperience: { type: Number, required: true },
  }]
});


export const User = mongoose.model<IUser>('User', UserSchema);
