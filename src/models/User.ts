import mongoose, { Schema, Document } from 'mongoose';
import { IBonus } from './Bonus'; // Импортируйте интерфейс IBonus

// Интерфейс для пользователя
export interface IUser extends Document {
  userId: number;
  bonuses: {
    gifts: IBonus[];
    default: Array<{
      type: string;
      value: number;
      status: 'inactive' | 'used';
    }>;
  };
  coins: number;
  isBot: boolean;
  hourlyIncome: number;
  referalLink: string;
  referals: Array<{
    userId: number;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
    isPremium: boolean;
  }>;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  isPremium?: boolean;
  photoUrl?: string;
  token: string;
}

// Схема пользователя
const UserSchema: Schema<IUser> = new Schema({
  userId: { type: Number, required: true, unique: true },
  isBot: { type: Boolean, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  username: { type: String },
  languageCode: { type: String },
  isPremium: { type: Boolean, default: false },
  photoUrl: { type: String },
  token: { type: String, required: true },
  bonuses: {
    gifts: [{ type: Schema.Types.Mixed }],
    default: [
      {
        type: {
          type: String,
          enum: ['coins', 'hourly_income', 'multiplier'],
          required: true,
        },
        value: { type: Number, required: true },
        status: {
          type: String,
          enum: ['inactive', 'used'],
          required: true,
          default: 'inactive'
        }
      },
    ],
  },
  coins: { type: Number, default: 0 },
  hourlyIncome: { type: Number, default: 0 },
  referalLink: { type: String, default: '' },
  referals: [
    {
      userId: { type: Number, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String },
      photoUrl: { type: String },
      isPremium: { type: Boolean },
    },
  ],
});

export const User = mongoose.model<IUser>('User', UserSchema);
