import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  picture?: string;
  role: 'student' | 'teacher' | 'coordinator';
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  picture: { type: String },
  role: { type: String, default: 'student' },
  googleId: { type: String },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);


