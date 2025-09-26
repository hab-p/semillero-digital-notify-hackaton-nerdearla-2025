import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  studentId: string;
  courseId: string; // reference to Course.googleId
}

const EnrollmentSchema = new Schema<IEnrollment>({
  studentId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true }
}, { timestamps: true });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);


