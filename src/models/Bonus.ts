import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBonus extends Document {
  _id: Types.ObjectId; // Убедитесь, что _id имеет тип ObjectId
  type: string;
  value: number;
  photoUrl?: string;
  title?: string;
  status: 'inactive' | 'used';
  receivedAt: Date;
}

const BonusSchema: Schema<IBonus> = new Schema({
  type: { type: String, required: true },
  value: { type: Number, required: true },
  photoUrl: { type: String },
  title: { type: String },
  status: { type: String, enum: ['inactive', 'used'], default: 'inactive' },
  receivedAt: { type: Date, default: Date.now },
});

const Bonus = mongoose.model<IBonus>('Bonus', BonusSchema);

export default Bonus;
