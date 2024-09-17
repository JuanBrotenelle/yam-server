import mongoose, { Document, Schema } from 'mongoose';

interface IRefFriend extends Document {
  userId: number;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  isPremium: boolean;
}

const RefFriendsSchema: Schema<IRefFriend> = new Schema({
  userId: { type: Number, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  photoUrl: { type: String },
  isPremium: { type: Boolean, required: true },
});

const RefFriend = mongoose.model<IRefFriend>('RefFriend', RefFriendsSchema);

export default RefFriend;
