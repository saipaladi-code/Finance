import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { ChitMember } from '../models/ChitMember.js';
import { roundMoney } from '../utils/financeCalculations.js';
import { logAudit } from '../middleware/audit.js';

export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, paymentMethod, financeType, customerId, search, status } = req.query;
    const filter: any = {};

    if (financeType && financeType !== 'all') {
      filter.financeType = financeType;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    if (status && status !== 'all') {
      filter.paymentStatus = status;
    }

    if (customerId && mongoose.Types.ObjectId.isValid(customerId as string)) {
      filter.customerId = customerId;
    }

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) {
        const s = new Date(startDate as string);
        s.setHours(0, 0, 0, 0);
        filter.paymentDate.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate as string);
        e.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = e;
      }
    }

    let payments = await Payment.find(filter)
      .populate('customerId')
      .populate('accountId')
      .populate('chitGroupId')
      .sort({ paymentDate: -1, createdAt: -1 });

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      payments = payments.filter((p: any) => {
        const custName = p.customerId?.name?.toLowerCase() || '';
        const phone = p.customerId?.phone?.toLowerCase() || '';
        const txId = p.transactionId?.toLowerCase() || '';
        const rec = p.receiptNumber?.toLowerCase() || '';
        const ref = p.transactionReference?.toLowerCase() || '';
        return (
          custName.includes(q) ||
          phone.includes(q) ||
          txId.includes(q) ||
          rec.includes(q) ||
          ref.includes(q)
        );
      });
    }

    const totalCollected = roundMoney(
      payments.filter((p) => !p.isReversed).reduce((sum, p) => sum + p.amount, 0)
    );

    res.status(200).json({
      success: true,
      count: payments.length,
      totalCollected,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching payments.' });
  }
};

export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let payment: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id)
        .populate('customerId')
        .populate('accountId')
        .populate('chitGroupId');
    }

    if (!payment) {
      payment = await Payment.findOne({
        $or: [{ transactionId: id }, { receiptNumber: id }],
      })
        .populate('customerId')
        .populate('accountId')
        .populate('chitGroupId');
    }

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment transaction not found.' });
      return;
    }

    res.status(200).json({ success: true, payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching payment.' });
  }
};

export const reversePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      res.status(400).json({ success: false, message: 'A valid reason is required to reverse a payment transaction.' });
      return;
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment transaction not found.' });
      return;
    }

    if (payment.isReversed) {
      res.status(400).json({ success: false, message: 'This transaction has already been reversed.' });
      return;
    }

    // Reverse financial balance in account or chit member
    if (payment.accountId) {
      const account = await FinanceAccount.findById(payment.accountId);
      if (account) {
        account.totalPaid = Math.max(0, roundMoney(account.totalPaid - payment.amount));
        account.remainingBalance = roundMoney(account.totalRepaymentAmount - account.totalPaid);
        if (account.status === 'closed' && account.remainingBalance > 0) {
          account.status = 'active';
        }
        await account.save();
      }
    } else if (payment.chitMemberId) {
      const member = await ChitMember.findById(payment.chitMemberId);
      if (member) {
        member.totalPaid = Math.max(0, roundMoney(member.totalPaid - payment.amount));
        await member.save();
      }
    }

    payment.isReversed = true;
    payment.paymentStatus = 'reversed';
    payment.reversalReason = reason.trim();
    await payment.save();

    await logAudit(req, 'PAYMENT_REVERSED', 'Payment', payment._id.toString(), {
      transactionId: payment.transactionId,
      amount: payment.amount,
      reason,
    });

    res.status(200).json({
      success: true,
      message: `Transaction ${payment.transactionId} reversed successfully. Financial balances updated.`,
      payment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error reversing payment.' });
  }
};
