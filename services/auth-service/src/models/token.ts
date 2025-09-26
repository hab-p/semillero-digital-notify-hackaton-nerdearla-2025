import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  expiryDate?: Date;
}

const TokenSchema = new Schema<IToken>({
  userId: { type: String, required: true, index: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  scope: { type: String },
  expiryDate: { type: Date }
}, { timestamps: true });

export default mongoose.model<IToken>('Token', TokenSchema);


