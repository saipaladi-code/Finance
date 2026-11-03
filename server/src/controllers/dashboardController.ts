import { Request, Response } from 'express';
import { Customer } from '../models/Customer.js';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Installment } from '../models/Installment.js';
import { Payment } from '../models/Payment.js';
import { ChitGroup } from '../models/ChitGroup.js';
import { ChitAuction } from '../models/ChitAuction.js';
import { roundMoney } from '../utils/financeCalculations.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 1. Total Customers
    const totalCustomers = await Customer.countDocuments();

    // 2. Active Accounts
    const activeDailyAccounts = await FinanceAccount.countDocuments({ financeType: 'daily', status: 'active' });
    const activeWeeklyAccounts = await FinanceAccount.countDocuments({ financeType: 'weekly', status: 'active' });
    const activeChittiGroups = await ChitGroup.countDocuments({ status: 'active' });

    // 3. Money Distributed: Loan principal + Chit auction payouts
    const loanAccounts = await FinanceAccount.find({}, 'principal totalRepaymentAmount remainingBalance financeType status');
    const chitAuctions = await ChitAuction.find({}, 'netPayoutAmount');

    const dailyDistributed = roundMoney(
      loanAccounts.filter((a) => a.financeType === 'daily').reduce((sum, a) => sum + a.principal, 0)
    );
    const weeklyDistributed = roundMoney(
      loanAccounts.filter((a) => a.financeType === 'weekly').reduce((sum, a) => sum + a.principal, 0)
    );
    const chitDistributed = roundMoney(chitAuctions.reduce((sum, a) => sum + a.netPayoutAmount, 0));
    const totalMoneyDistributed = roundMoney(dailyDistributed + weeklyDistributed + chitDistributed);

    // 4. Collections
    const validPayments = await Payment.find({ isReversed: { $ne: true } }).sort({ paymentDate: -1 });
    const totalAmountCollected = roundMoney(validPayments.reduce((sum, p) => sum + p.amount, 0));

    const todayPayments = validPayments.filter(
      (p) => new Date(p.paymentDate) >= todayStart && new Date(p.paymentDate) <= todayEnd
    );
    const todayCollection = roundMoney(todayPayments.reduce((sum, p) => sum + p.amount, 0));

    // 5. Total Outstanding
    const totalOutstandingAmount = roundMoney(
      loanAccounts.filter((a) => a.status === 'active').reduce((sum, a) => sum + (a.remainingBalance || 0), 0)
    );

    // 6. Today's Due Installments
    const todayDueInstallments = await Installment.find({
      dueDate: { $gte: todayStart, $lte: todayEnd },
    }).populate({
      path: 'accountId',
      populate: { path: 'customerId' },
    });

    const todayPendingPaymentsCount = todayDueInstallments.filter((i) => i.status !== 'paid').length;
    const todayExpectedAmount = roundMoney(
      todayDueInstallments.reduce((sum, i) => sum + i.expectedAmount, 0)
    );

    // 7. Overdue installments and overdue customers
    const overdueInstallments = await Installment.find({
      dueDate: { $lt: todayStart },
      status: { $ne: 'paid' },
    }).populate({
      path: 'accountId',
      populate: { path: 'customerId' },
    });

    const overdueCustomerMap = new Map<string, any>();
    overdueInstallments.forEach((inst: any) => {
      const acc = inst.accountId;
      if (!acc || acc.status === 'closed') return;
      const cust = acc.customerId;
      if (!cust) return;

      const custId = cust._id.toString();
      const pendingVal = roundMoney(inst.expectedAmount - inst.paidAmount);

      if (!overdueCustomerMap.has(custId)) {
        overdueCustomerMap.set(custId, {
          customerId: cust._id,
          customerName: cust.name,
          phoneNumber: cust.phone,
          accountNumber: acc.accountNumber,
          financeType: acc.financeType,
          pendingAmount: pendingVal,
          pendingInstallmentsCount: 1,
          oldestDueDate: inst.dueDate,
        });
      } else {
        const existing = overdueCustomerMap.get(custId);
        existing.pendingAmount = roundMoney(existing.pendingAmount + pendingVal);
        existing.pendingInstallmentsCount += 1;
        if (new Date(inst.dueDate) < new Date(existing.oldestDueDate)) {
          existing.oldestDueDate = inst.dueDate;
        }
      }
    });

    const overdueCustomersList = Array.from(overdueCustomerMap.values());
    const overdueCustomersCount = overdueCustomersList.length;

    // 8. Today's payments list for dashboard table
    const todayPaymentsList = todayDueInstallments.map((inst: any) => {
      const acc = inst.accountId || {};
      const cust = acc.customerId || {};
      const remaining = Math.max(0, roundMoney(inst.expectedAmount - inst.paidAmount));

      return {
        _id: inst._id,
        customerName: cust.name || 'Unknown',
        phoneNumber: cust.phone || '-',
        accountNumber: acc.accountNumber || '-',
        financeType: acc.financeType || 'daily',
        expectedAmount: inst.expectedAmount,
        paidAmount: inst.paidAmount,
        remainingAmount: remaining,
        paymentStatus: inst.status,
      };
    });

    // 9. Recent 10 Transactions
    const recentTransactions = await Payment.find({ isReversed: { $ne: true } })
      .populate('customerId')
      .populate('accountId')
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(10);

    const formattedRecentTransactions = recentTransactions.map((tx: any) => ({
      _id: tx._id,
      customerName: tx.customerId?.name || 'Customer',
      transactionId: tx.transactionId,
      receiptNumber: tx.receiptNumber,
      paymentDate: tx.paymentDate,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      financeType: tx.financeType,
    }));

    // 10. Charts Data
    // Daily Collection Chart (last 7 days)
    const dailyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayPayments = validPayments.filter(
        (p) => new Date(p.paymentDate) >= dayStart && new Date(p.paymentDate) <= dayEnd
      );
      const dailySum = roundMoney(
        dayPayments.filter((p) => p.financeType === 'daily').reduce((s, p) => s + p.amount, 0)
      );
      const weeklySum = roundMoney(
        dayPayments.filter((p) => p.financeType === 'weekly').reduce((s, p) => s + p.amount, 0)
      );
      const chittiSum = roundMoney(
        dayPayments.filter((p) => p.financeType === 'chitti').reduce((s, p) => s + p.amount, 0)
      );

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dailyChartData.push({
        name: dayName,
        daily: dailySum,
        weekly: weeklySum,
        chitti: chittiSum,
        total: roundMoney(dailySum + weeklySum + chittiSum),
      });
    }

    // Monthly Collection Chart (last 6 months)
    const monthlyChartData = [];
    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const mPayments = validPayments.filter(
        (p) => new Date(p.paymentDate) >= mDate && new Date(p.paymentDate) <= mEnd
      );
      const mTotal = roundMoney(mPayments.reduce((s, p) => s + p.amount, 0));
      const mMonth = mDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      monthlyChartData.push({
        month: mMonth,
        collection: mTotal,
      });
    }

    // Weekly Collections (last 4 weeks)
    const weeklyChartData = [];
    for (let w = 3; w >= 0; w--) {
      const wEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const wStart = new Date(wEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      const wPayments = validPayments.filter(
        (p) => new Date(p.paymentDate) >= wStart && new Date(p.paymentDate) <= wEnd
      );
      const wTotal = roundMoney(wPayments.reduce((s, p) => s + p.amount, 0));
      weeklyChartData.push({
        week: `Week -${w}`,
        total: wTotal,
      });
    }

    res.status(200).json({
      success: true,
      cards: {
        totalCustomers,
        totalMoneyDistributed,
        totalAmountCollected,
        todayCollection,
        totalOutstandingAmount,
        todayPendingPaymentsCount,
        todayExpectedAmount,
        overdueCustomersCount,
        activeDailyAccounts,
        activeWeeklyAccounts,
        activeChittiGroups,
      },
      distribution: {
        dailyDistributed,
        weeklyDistributed,
        chitDistributed,
      },
      charts: {
        dailyCollection: dailyChartData,
        weeklyCollection: weeklyChartData,
        monthlyCollection: monthlyChartData,
        collectionVsOutstanding: [
          { name: 'Collected', value: totalAmountCollected, fill: '#10b981' },
          { name: 'Outstanding', value: totalOutstandingAmount, fill: '#ef4444' },
        ],
        financeDistribution: [
          { name: 'Daily Finance', value: dailyDistributed, fill: '#3b82f6' },
          { name: 'Weekly Finance', value: weeklyDistributed, fill: '#8b5cf6' },
          { name: 'Chitti (Chits)', value: chitDistributed, fill: '#f59e0b' },
        ],
      },
      sections: {
        todayPayments: todayPaymentsList,
        recentTransactions: formattedRecentTransactions,
        overdueCustomers: overdueCustomersList,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating dashboard data.' });
  }
};

