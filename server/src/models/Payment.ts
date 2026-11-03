import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  transactionId: string;
  receiptNumber: string;
  customerId: mongoose.Types.ObjectId;
  accountId?: mongoose.Types.ObjectId; // For daily/weekly finance
  chitGroupId?: mongoose.Types.ObjectId; // For chitti payments
  chitMemberId?: mongoose.Types.ObjectId;
  financeType: 'daily' | 'weekly' | 'chitti';
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'gpay' | 'phonepe' | 'bank_transfer' | 'other';
  transactionReference?: string;
  paymentStatus: 'paid' | 'partially_paid' | 'advance' | 'reversed';
  recordedBy: string;
  notes?: string;
  isReversed?: boolean;
  reversalReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'FinanceAccount', index: true },
    chitGroupId: { type: Schema.Types.ObjectId, ref: 'ChitGroup', index: true },
    chitMemberId: { type: Schema.Types.ObjectId, ref: 'ChitMember', index: true },
    financeType: { type: String, enum: ['daily', 'weekly', 'chitti'], required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'gpay', 'phonepe', 'bank_transfer', 'other'],
      default: 'cash',
      index: true,
    },
    transactionReference: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partially_paid', 'advance', 'reversed'],
      default: 'paid',
      index: true,
    },
    recordedBy: { type: String, default: 'Admin' },
    notes: { type: String, default: '' },
    isReversed: { type: Boolean, default: false },
    reversalReason: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

