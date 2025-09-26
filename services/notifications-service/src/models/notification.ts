import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  channel: 'email' | 'telegram' | 'whatsapp';
  to: string;
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

const NotificationSchema = new Schema<INotification>({
  channel: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String },
  body: { type: String },
  status: { type: String, default: 'pending' },
  error: { type: String }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);


