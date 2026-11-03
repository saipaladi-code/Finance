import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  idProofType?: string;
  idProofNumber?: string;
  photoUrl?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'defaulter';
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: '' },
    idProofType: { type: String, default: 'Aadhaar' },
    idProofNumber: { type: String, trim: true },
    photoUrl: { type: String, default: '' },
    guarantorName: { type: String, trim: true, default: '' },
    guarantorPhone: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive', 'defaulter'], default: 'active', index: true },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

