import mongoose, { Document, Schema } from 'mongoose';

export interface IChitGroup extends Document {
  groupName: string;
  groupCode: string;
  chitValue: number;
  totalMembers: number;
  durationMonths: number;
  monthlyContribution: number;
  startDate: Date;
  monthlyDueDate: number; // Day of month, e.g. 10
  foremanCommissionPercent: number; // Default 5%
  minBidAmount: number;
  maxBidAmount: number;
  currentMonth: number;
  groupDescription?: string;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ChitGroupSchema = new Schema<IChitGroup>(
  {
    groupName: { type: String, required: true, trim: true },
    groupCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    chitValue: { type: Number, required: true, min: 1000 },
    totalMembers: { type: Number, required: true, min: 2 },
    durationMonths: { type: Number, required: true, min: 2 },
    monthlyContribution: { type: Number, required: true, min: 100 },
    startDate: { type: Date, required: true },
    monthlyDueDate: { type: Number, default: 10, min: 1, max: 31 },
    foremanCommissionPercent: { type: Number, default: 5, min: 0, max: 20 },
    minBidAmount: { type: Number, default: 0 },
    maxBidAmount: { type: Number, default: 0 },
    currentMonth: { type: Number, default: 1 },
    groupDescription: { type: String, default: '' },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming', index: true },
  },
  { timestamps: true }
);

export const ChitGroup = mongoose.model<IChitGroup>('ChitGroup', ChitGroupSchema);

