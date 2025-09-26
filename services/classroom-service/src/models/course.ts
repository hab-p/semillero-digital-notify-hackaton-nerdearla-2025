import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  googleId: string;
  name: string;
  section?: string;
  description?: string;
  teacherId?: string;
}

const CourseSchema = new Schema<ICourse>({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  section: { type: String },
  description: { type: String },
  teacherId: { type: String }
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', CourseSchema);


