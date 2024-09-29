import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGift extends Document {
  _id: Types.ObjectId;
  type: 'coins' | 'hourly_income' | 'multiplier';
  value: number;
  photoUrl?: string;
  title?: string;
  description?: string;
  status: 'inactive' | 'used';
}

const GiftSchema: Schema<IGift> = new Schema({
  type: { type: String, enum: ['coins', 'hourly_income', 'multiplier'], required: true },
  value: { type: Number, required: true },
  photoUrl: { type: String },
  title: { type: String },
  description: { type: String },
  status: { type: String, enum: ['inactive', 'used'], default: 'inactive' },
});

const Gift = mongoose.model<IGift>('Gifts', GiftSchema);

export default Gift;
