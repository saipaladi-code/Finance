import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessSetting extends Document {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  upiId: string;
  payeeName: string;
  googlePayQrUrl?: string;
  phonePeQrUrl?: string;
  defaultCurrency: string;
  timezone: string;
  receiptPrefix: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSettingSchema = new Schema<IBusinessSetting>(
  {
    businessName: { type: String, default: 'Sri Lakshmi Finance & Chits' },
    ownerName: { type: String, default: 'Finance Director' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'admin@finance.local' },
    address: { type: String, default: 'Main Bazaar Road, Commercial Street, City' },
    logoUrl: { type: String, default: '' },
    upiId: { type: String, default: 'finance.business@upi' },
    payeeName: { type: String, default: 'Sri Lakshmi Finance' },
    googlePayQrUrl: { type: String, default: '' },
    phonePeQrUrl: { type: String, default: '' },
    defaultCurrency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    receiptPrefix: { type: String, default: 'REC' },
    termsAndConditions: {
      type: String,
      default:
        'All repayments are subject to agreed terms. Please collect receipt for every payment made. This software serves as record-keeping and bookkeeping software.',
    },
  },
  { timestamps: true }
);

export const BusinessSetting = mongoose.model<IBusinessSetting>('BusinessSetting', BusinessSettingSchema);

