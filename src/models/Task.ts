import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  _id: Types.ObjectId;
  value: number;
  photoUrl?: string;
  title?: string;
  status: 'inactive' | 'used';
  url: string;
}

const TaskSchema: Schema<ITask> = new Schema({
  value: { type: Number, required: true },
  photoUrl: { type: String },
  title: { type: String },
  status: { type: String, enum: ['inactive', 'used'], default: 'inactive' },
  url: { type: String },
});

const Task = mongoose.model<ITask>('Tasks', TaskSchema);

export default Task;