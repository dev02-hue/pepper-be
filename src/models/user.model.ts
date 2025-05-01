import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  googleId?: string;
  password?: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
  referralCode: string;
  referredBy?: Types.ObjectId;
  referrals: Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: { 
    type: String,
    required: false,
    sparse: true,
    default: null 
  },
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
  password: { type: String },
  referredBy: { 
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referrals: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  isAdmin: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const User = model<IUser>('User', userSchema, 'pepper');
