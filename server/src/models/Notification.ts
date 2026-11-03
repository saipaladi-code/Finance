import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'due_reminder' | 'overdue' | 'auction' | 'payment_received' | 'general';
  financeType?: 'daily' | 'weekly' | 'chitti' | 'system';
  customerId?: mongoose.Types.ObjectId;
  referenceId?: string;
  isRead: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['due_reminder', 'overdue', 'auction', 'payment_received', 'general'],
      default: 'general',
      index: true,
    },
    financeType: { type: String, enum: ['daily', 'weekly', 'chitti', 'system'], default: 'system' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    referenceId: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

