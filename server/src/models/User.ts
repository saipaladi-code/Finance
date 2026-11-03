import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: 'admin' | 'staff' | 'customer';
  customerId?: mongoose.Types.ObjectId;
  resetOtpHash?: string;
  resetOtpExpires?: Date;
  resetOtpAttempts?: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isActive: boolean;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'customer'], default: 'admin' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    resetOtpHash: { type: String },
    resetOtpExpires: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
