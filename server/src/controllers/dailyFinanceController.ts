import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Customer } from '../models/Customer.js';
import { Installment } from '../models/Installment.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';
import { generateAccountNumber, generateTransactionId, generateReceiptNumber } from '../utils/idGenerator.js';
import { generateDailySchedule, roundMoney } from '../utils/financeCalculations.js';
import { logAudit } from '../middleware/audit.js';

export const getDailyAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const filter: any = { financeType: 'daily' };

    if (status && status !== 'all') {
      filter.status = status;
    }

    const accounts = await FinanceAccount.find(filter)
      .populate('customerId')
      .sort({ createdAt: -1 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Get today's payments for these accounts
    const accountIds = accounts.map((a) => a._id);
    const todayPayments = await Payment.find({
      accountId: { $in: accountIds },
      paymentDate: { $gte: todayStart, $lte: todayEnd },
      isReversed: { $ne: true },
    });

    // Get installment stats for each account
    const installments = await Installment.find({ accountId: { $in: accountIds } });

    const formatted = accounts.map((acc: any) => {
      const cust = acc.customerId || {};
      const accPayments = todayPayments.filter((p) => p.accountId?.toString() === acc._id.toString());
      const todayPaid = roundMoney(accPayments.reduce((sum, p) => sum + p.amount, 0));

      const accInstallments = installments.filter((i) => i.accountId.toString() === acc._id.toString());
      const completedInstallments = accInstallments.filter((i) => i.status === 'paid').length;
      const pendingInstallments = accInstallments.filter((i) => i.status === 'pending' || i.status === 'partially_paid').length;
      
      const overdueInstallments = accInstallments.filter(
        (i) => i.status !== 'paid' && new Date(i.dueDate) < todayStart
      ).length;

      // Find next pending installment
      const nextInst = accInstallments
        .filter((i) => i.status !== 'paid')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      let todayStatus: 'paid' | 'partially_paid' | 'pending' | 'overdue' = 'pending';
      if (todayPaid >= acc.installmentAmount) {
        todayStatus = 'paid';
      } else if (todayPaid > 0) {
        todayStatus = 'partially_paid';
      } else if (overdueInstallments > 0) {
        todayStatus = 'overdue';
      }

      return {
        _id: acc._id,
        accountNumber: acc.accountNumber,
        customer: {
          _id: cust._id,
          customerId: cust.customerId,
          name: cust.name,
          phone: cust.phone,
          address: cust.address,
        },
        principal: acc.principal,
        interestAmount: acc.interestAmount,
        totalRepaymentAmount: acc.totalRepaymentAmount,
        installmentAmount: acc.installmentAmount,
        totalInstallments: acc.totalInstallments,
        totalPaid: acc.totalPaid,
        remainingBalance: acc.remainingBalance,
        startDate: acc.startDate,
        endDate: acc.endDate,
        collectionAgent: acc.collectionAgent,
        status: acc.status,
        todayPaid,
        todayStatus,
        completedInstallments,
        pendingInstallments,
        overdueInstallments,
        nextPaymentDate: nextInst ? nextInst.dueDate : null,
      };
    });

    // Apply search filter on customer name/phone/accountNumber
    let result = formatted;
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = formatted.filter(
        (item) =>
          item.customer.name?.toLowerCase().includes(q) ||
          item.customer.phone?.toLowerCase().includes(q) ||
          item.accountNumber?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({ success: true, count: result.length, accounts: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching daily finance accounts.' });
  }
};

export const createDailyAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      principal,
      interestType,
      interestRate,
      interestAmount: rawInterestAmount,
      documentCharges: rawDocCharges,
      totalRepaymentAmount: rawTotalRepayment,
      installmentAmount: rawInstallmentAmount,
      totalInstallments: rawTotalInstallments,
      startDate: rawStartDate,
      collectionAgent,
      notes,
    } = req.body;

    if (!customerId || !principal) {
      res.status(400).json({ success: false, message: 'Customer ID and Loan principal amount are required.' });
      return;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    const princ = roundMoney(Number(principal));
    const intRate = Number(interestRate) || 0;
    const docCharges = roundMoney(Number(rawDocCharges) || 0);

    let calculatedInterest = Number(rawInterestAmount) || 0;
    if (interestType === 'percentage' && intRate > 0) {
      calculatedInterest = roundMoney((princ * intRate) / 100);
    }
    calculatedInterest = roundMoney(calculatedInterest);

    let totalRepay = Number(rawTotalRepayment);
    if (!totalRepay || totalRepay <= 0) {
      totalRepay = roundMoney(princ + calculatedInterest + docCharges);
    }

    let totalInst = Number(rawTotalInstallments) || 100;
    let instAmount = Number(rawInstallmentAmount);
    if (!instAmount || instAmount <= 0) {
      instAmount = roundMoney(totalRepay / totalInst);
    } else {
      totalInst = Math.ceil(totalRepay / instAmount);
    }

    const startDate = rawStartDate ? new Date(rawStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalInst - 1);

    const accountNumber = await generateAccountNumber('daily');

    const account = await FinanceAccount.create({
      accountNumber,
      customerId: customer._id,
      financeType: 'daily',
      principal: princ,
      interestType: interestType || 'flat',
      interestRate: intRate,
      interestAmount: calculatedInterest,
      documentCharges: docCharges,
      totalRepaymentAmount: totalRepay,
      installmentAmount: instAmount,
      totalInstallments: totalInst,
      startDate,
      endDate,
      collectionAgent: collectionAgent || 'Self',
      status: 'active',
      totalPaid: 0,
      remainingBalance: totalRepay,
      notes: notes || '',
    });

    // Auto-generate installment schedules
    const scheduleItems = generateDailySchedule(startDate, totalInst, instAmount);
    const installmentDocs = scheduleItems.map((item) => ({
      accountId: account._id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate,
      expectedAmount: item.expectedAmount,
      paidAmount: 0,
      status: 'pending',
    }));

    await Installment.insertMany(installmentDocs);

    await logAudit(req, 'DAILY_LOAN_CREATED', 'FinanceAccount', account._id.toString(), {
      accountNumber,
      customerName: customer.name,
      principal: princ,
      totalRepaymentAmount: totalRepay,
      installmentAmount: instAmount,
      days: totalInst,
    });

    res.status(201).json({ success: true, message: 'Daily finance loan account created successfully.', account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating daily finance account.' });
  }
};

export const getDailyAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid account ID.' });
      return;
    }

    const account = await FinanceAccount.findById(id).populate('customerId');
    if (!account || account.financeType !== 'daily') {
      res.status(404).json({ success: false, message: 'Daily finance account not found.' });
      return;
    }

    const installments = await Installment.find({ accountId: account._id }).sort({ installmentNumber: 1 });
    const payments = await Payment.find({ accountId: account._id }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      account,
      installments,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching account details.' });
  }
};

export const recordDailyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, transactionReference, notes, recordedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid account ID.' });
      return;
    }

    const numAmount = roundMoney(Number(amount));
    if (!numAmount || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Valid payment amount greater than 0 is required.' });
      return;
    }

    const account = await FinanceAccount.findById(id).populate('customerId');
    if (!account || account.financeType !== 'daily') {
      res.status(404).json({ success: false, message: 'Daily finance account not found.' });
      return;
    }

    if (account.status === 'closed') {
      res.status(400).json({ success: false, message: 'This account has already been fully paid and closed.' });
      return;
    }

    // Check financial rule: cannot exceed balance unless advance
    const isAdvance = numAmount > account.remainingBalance;
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      transactionId,
      receiptNumber,
      customerId: (account.customerId as any)._id,
      accountId: account._id,
      financeType: 'daily',
      amount: numAmount,
      paymentDate: pDate,
      paymentMethod: paymentMethod || 'cash',
      transactionReference: transactionReference || '',
      paymentStatus: isAdvance ? 'advance' : numAmount < account.installmentAmount ? 'partially_paid' : 'paid',
      recordedBy: recordedBy || 'Admin',
      notes: notes || '',
    });

    // Update account totals
    const newTotalPaid = roundMoney(account.totalPaid + numAmount);
    const newRemainingBalance = Math.max(0, roundMoney(account.totalRepaymentAmount - newTotalPaid));
    account.totalPaid = newTotalPaid;
    account.remainingBalance = newRemainingBalance;

    if (newRemainingBalance === 0) {
      account.status = 'closed';
    }
    await account.save();

    // Distribute payment to pending installments sequentially
    let unallocatedAmount = numAmount;
    const pendingInstallments = await Installment.find({
      accountId: account._id,
      status: { $ne: 'paid' },
    }).sort({ installmentNumber: 1 });

    for (const inst of pendingInstallments) {
      if (unallocatedAmount <= 0) break;
      const needed = roundMoney(inst.expectedAmount - inst.paidAmount);

      if (unallocatedAmount >= needed) {
        inst.paidAmount = inst.expectedAmount;
        inst.status = 'paid';
        inst.paidDate = pDate;
        unallocatedAmount = roundMoney(unallocatedAmount - needed);
      } else {
        inst.paidAmount = roundMoney(inst.paidAmount + unallocatedAmount);
        inst.status = 'partially_paid';
        inst.paidDate = pDate;
        unallocatedAmount = 0;
      }
      await inst.save();
    }

    await logAudit(req, 'DAILY_PAYMENT_RECORDED', 'Payment', payment._id.toString(), {
      accountNumber: account.accountNumber,
      transactionId,
      amount: numAmount,
      paymentMethod: payment.paymentMethod,
      remainingBalance: newRemainingBalance,
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${numAmount} successfully recorded.`,
      payment,
      receiptNumber,
      remainingBalance: newRemainingBalance,
      isClosed: newRemainingBalance === 0,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error recording payment.' });
  }
};
