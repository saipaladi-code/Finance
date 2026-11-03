import mongoose, { Document, Schema } from 'mongoose';

export interface IInstallment extends Document {
  accountId: mongoose.Types.ObjectId;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
  paidAmount: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentSchema = new Schema<IInstallment>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: 'FinanceAccount', required: true, index: true },
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    expectedAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'partially_paid', 'paid', 'overdue'],
      default: 'pending',
      index: true,
    },
    paidDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

InstallmentSchema.index({ accountId: 1, installmentNumber: 1 }, { unique: true });

export const Installment = mongoose.model<IInstallment>('Installment', InstallmentSchema);
