import mongoose, { Document, Schema } from 'mongoose';

export interface IChitMember extends Document {
  chitGroupId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  ticketNumber: number;
  joiningDate: Date;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  hasWonAuction: boolean;
  wonAuctionNumber?: number;
  totalPaid: number;
  totalDividendReceived: number;
  status: 'active' | 'completed' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
}

const ChitMemberSchema = new Schema<IChitMember>(
  {
    chitGroupId: { type: Schema.Types.ObjectId, ref: 'ChitGroup', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    ticketNumber: { type: Number, required: true },
    joiningDate: { type: Date, default: Date.now },
    nomineeName: { type: String, default: '' },
    nomineeRelation: { type: String, default: '' },
    nomineePhone: { type: String, default: '' },
    hasWonAuction: { type: Boolean, default: false },
    wonAuctionNumber: { type: Number },
    totalPaid: { type: Number, default: 0 },
    totalDividendReceived: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'withdrawn'], default: 'active', index: true },
  },
  { timestamps: true }
);

ChitMemberSchema.index({ chitGroupId: 1, ticketNumber: 1 }, { unique: true });
ChitMemberSchema.index({ chitGroupId: 1, customerId: 1 });

export const ChitMember = mongoose.model<IChitMember>('ChitMember', ChitMemberSchema);
