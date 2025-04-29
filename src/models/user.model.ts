import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
  referralCode: string;
  referredBy?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: String,
  balance: { type: Number, default: 50 },
  referralCode: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => Math.random().toString(36).substring(2, 10)
  },
  referredBy: { 
    type: String, 
    default: null,
    ref: 'User' 
  },
  isAdmin: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema, 'pepper');