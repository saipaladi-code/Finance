import { Request, Response } from 'express';
import { Payment } from '../models/Payment.js';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Installment } from '../models/Installment.js';
import { ChitAuction } from '../models/ChitAuction.js';
import { roundMoney } from '../utils/financeCalculations.js';

export const getDailyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const payments = await Payment.find({
      paymentDate: { $gte: dayStart, $lte: dayEnd },
      isReversed: { $ne: true },
    }).populate('customerId').populate('accountId');

    const totalCollected = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
    const dailyCollections = roundMoney(
      payments.filter((p) => p.financeType === 'daily').reduce((sum, p) => sum + p.amount, 0)
    );
    const weeklyCollections = roundMoney(
      payments.filter((p) => p.financeType === 'weekly').reduce((sum, p) => sum + p.amount, 0)
    );
    const chittiCollections = roundMoney(
      payments.filter((p) => p.financeType === 'chitti').reduce((sum, p) => sum + p.amount, 0)
    );

    // Installments due on this date
    const dueInstallments = await Installment.find({
      dueDate: { $gte: dayStart, $lte: dayEnd },
    }).populate({
      path: 'accountId',
      populate: { path: 'customerId' },
    });

    const pendingInstallments = dueInstallments.filter((i) => i.status !== 'paid');
    const pendingTotal = roundMoney(
      pendingInstallments.reduce((sum, i) => sum + (i.expectedAmount - i.paidAmount), 0)
    );

    // Overdue payments (due before target date and still pending)
    const overdueInstallments = await Installment.find({
      dueDate: { $lt: dayStart },
      status: { $ne: 'paid' },
    }).populate({
      path: 'accountId',
      populate: { path: 'customerId' },
    });
    const overdueTotal = roundMoney(
      overdueInstallments.reduce((sum, i) => sum + (i.expectedAmount - i.paidAmount), 0)
    );

    res.status(200).json({
      success: true,
      reportDate: dayStart,
      summary: {
        totalCollected,
        dailyCollections,
        weeklyCollections,
        chittiCollections,
        pendingPaymentsCount: pendingInstallments.length,
        pendingTotal,
        overdueCount: overdueInstallments.length,
        overdueTotal,
      },
      transactions: payments,
      dueInstallments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating daily report.' });
  }
};

export const getWeeklyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    const end = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const payments = await Payment.find({
      paymentDate: { $gte: start, $lte: end },
      isReversed: { $ne: true },
    }).populate('customerId');

    const totalCollected = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));

    // Accounts active during this period
    const activeAccounts = await FinanceAccount.find({ status: 'active' }).populate('customerId');
    const totalOutstanding = roundMoney(
      activeAccounts.reduce((sum, a) => sum + (a.remainingBalance || 0), 0)
    );

    const paidCustomerIds = new Set(payments.map((p) => (p.customerId as any)?._id?.toString()));
    const customersPaidCount = paidCustomerIds.size;

    res.status(200).json({
      success: true,
      period: { start, end },
      summary: {
        totalCollected,
        customersPaidCount,
        activeAccountsCount: activeAccounts.length,
        totalOutstanding,
      },
      payments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating weekly report.' });
  }
};

export const getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();
    const targetYear = year ? Number(year) : now.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const payments = await Payment.find({
      paymentDate: { $gte: start, $lte: end },
      isReversed: { $ne: true },
    });

    const totalCollected = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
    const chittiContributions = roundMoney(
      payments.filter((p) => p.financeType === 'chitti').reduce((sum, p) => sum + p.amount, 0)
    );

    // New loans originated in this month
    const newAccounts = await FinanceAccount.find({
      createdAt: { $gte: start, $lte: end },
    });
    const totalMoneyDistributed = roundMoney(newAccounts.reduce((sum, a) => sum + a.principal, 0));
    const totalInterestCollected = roundMoney(newAccounts.reduce((sum, a) => sum + a.interestAmount, 0));

    // Auctions conducted in this month
    const monthAuctions = await ChitAuction.find({
      auctionDate: { $gte: start, $lte: end },
    });
    const auctionPayouts = roundMoney(monthAuctions.reduce((sum, a) => sum + a.netPayoutAmount, 0));

    // Outstanding
    const activeAccounts = await FinanceAccount.find({ status: 'active' });
    const totalOutstanding = roundMoney(
      activeAccounts.reduce((sum, a) => sum + (a.remainingBalance || 0), 0)
    );

    res.status(200).json({
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      summary: {
        totalMoneyDistributed,
        totalAmountCollected: totalCollected,
        totalOutstanding,
        totalInterestCollected,
        chittiContributions,
        auctionPayouts,
        newLoansCount: newAccounts.length,
        auctionsCount: monthAuctions.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating monthly report.' });
  }
};
