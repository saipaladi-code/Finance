import mongoose, { Document, Schema } from 'mongoose';

export interface IChitAuction extends Document {
  chitGroupId: mongoose.Types.ObjectId;
  auctionNumber: number;
  auctionDate: Date;
  totalChitValue: number;
  winningMemberId: mongoose.Types.ObjectId;
  winningCustomerId: mongoose.Types.ObjectId;
  bidAmount: number; // Discount offered by the highest bidder
  foremanCommission: number;
  totalDividend: number; // (bidAmount - foremanCommission)
  dividendPerMember: number; // distributed among all or eligible members
  nextMonthNetPayable: number; // monthlyContribution - dividendPerMember
  netPayoutAmount: number; // totalChitValue - bidAmount
  payoutStatus: 'pending' | 'processed' | 'settled';
  payoutDate?: Date;
  payoutReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChitAuctionSchema = new Schema<IChitAuction>(
  {
    chitGroupId: { type: Schema.Types.ObjectId, ref: 'ChitGroup', required: true, index: true },
    auctionNumber: { type: Number, required: true },
    auctionDate: { type: Date, required: true, index: true },
    totalChitValue: { type: Number, required: true },
    winningMemberId: { type: Schema.Types.ObjectId, ref: 'ChitMember', required: true },
    winningCustomerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    bidAmount: { type: Number, required: true, min: 0 },
    foremanCommission: { type: Number, required: true, min: 0 },
    totalDividend: { type: Number, required: true, min: 0 },
    dividendPerMember: { type: Number, required: true, min: 0 },
    nextMonthNetPayable: { type: Number, required: true, min: 0 },
    netPayoutAmount: { type: Number, required: true, min: 0 },
    payoutStatus: {
      type: String,
      enum: ['pending', 'processed', 'settled'],
      default: 'pending',
      index: true,
    },
    payoutDate: { type: Date },
    payoutReference: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ChitAuctionSchema.index({ chitGroupId: 1, auctionNumber: 1 }, { unique: true });

export const ChitAuction = mongoose.model<IChitAuction>('ChitAuction', ChitAuctionSchema);

