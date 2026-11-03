import mongoose, { Document, Schema } from 'mongoose';

export interface IFinanceAccount extends Document {
  accountNumber: string;
  customerId: mongoose.Types.ObjectId;
  financeType: 'daily' | 'weekly';
  principal: number;
  interestType: 'flat' | 'percentage' | 'none';
  interestRate: number;
  interestAmount: number;
  documentCharges: number;
  totalRepaymentAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  startDate: Date;
  endDate: Date;
  collectionDay?: string; // For weekly finance (e.g., 'Monday', 'Friday')
  collectionAgent?: string;
  status: 'active' | 'closed' | 'defaulted';
  totalPaid: number;
  remainingBalance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceAccountSchema = new Schema<IFinanceAccount>(
  {
    accountNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    financeType: { type: String, enum: ['daily', 'weekly'], required: true, index: true },
    principal: { type: Number, required: true, min: 0 },
    interestType: { type: String, enum: ['flat', 'percentage', 'none'], default: 'flat' },
    interestRate: { type: Number, default: 0 },
    interestAmount: { type: Number, default: 0 },
    documentCharges: { type: Number, default: 0 },
    totalRepaymentAmount: { type: Number, required: true, min: 0 },
    installmentAmount: { type: Number, required: true, min: 0 },
    totalInstallments: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    collectionDay: { type: String, default: '' },
    collectionAgent: { type: String, default: 'Self' },
    status: { type: String, enum: ['active', 'closed', 'defaulted'], default: 'active', index: true },
    totalPaid: { type: Number, default: 0, min: 0 },
    remainingBalance: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const FinanceAccount = mongoose.model<IFinanceAccount>('FinanceAccount', FinanceAccountSchema);
