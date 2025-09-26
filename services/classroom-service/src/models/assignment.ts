import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  googleId: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  googleId: { type: String, required: true, unique: true },
  courseId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);


