import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { Installment } from '../models/Installment.js';
import { ChitGroup } from '../models/ChitGroup.js';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    // Dynamically check for overdue and due-today items and create notifications if needed
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Overdue installments count
    const overdueCount = await Installment.countDocuments({
      dueDate: { $lt: todayStart },
      status: { $ne: 'paid' },
    });

    // Check if an overdue alert was already created today
    const existingOverdueAlert = await Notification.findOne({
      type: 'overdue',
      createdAt: { $gte: todayStart },
    });

    if (overdueCount > 0 && !existingOverdueAlert) {
      await Notification.create({
        title: 'Overdue Payments Alert',
        message: `There are currently ${overdueCount} overdue installments across active loans requiring follow-up.`,
        type: 'overdue',
        financeType: 'system',
        date: new Date(),
      });
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching notifications.' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      res.status(200).json({ success: true, message: 'All notifications marked as read.' });
      return;
    }

    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating notification.' });
  }
};
