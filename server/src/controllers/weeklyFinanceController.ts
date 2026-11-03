import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Customer } from '../models/Customer.js';
import { Installment } from '../models/Installment.js';
import { Payment } from '../models/Payment.js';
import { generateAccountNumber, generateTransactionId, generateReceiptNumber } from '../utils/idGenerator.js';
import { generateWeeklySchedule, roundMoney } from '../utils/financeCalculations.js';
import { logAudit } from '../middleware/audit.js';

export const getWeeklyAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, collectionDay, search } = req.query;
    const filter: any = { financeType: 'weekly' };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (collectionDay && collectionDay !== 'all') {
      filter.collectionDay = collectionDay;
    }

    const accounts = await FinanceAccount.find(filter)
      .populate('customerId')
      .sort({ createdAt: -1 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const accountIds = accounts.map((a) => a._id);
    const installments = await Installment.find({ accountId: { $in: accountIds } });

    const formatted = accounts.map((acc: any) => {
      const cust = acc.customerId || {};
      const accInstallments = installments.filter((i) => i.accountId.toString() === acc._id.toString());
      
      const paidWeeks = accInstallments.filter((i) => i.status === 'paid').length;
      const pendingWeeks = accInstallments.filter((i) => i.status === 'pending' || i.status === 'partially_paid').length;
      const overdueWeeks = accInstallments.filter(
        (i) => i.status !== 'paid' && new Date(i.dueDate) < todayStart
      ).length;

      const nextInst = accInstallments
        .filter((i) => i.status !== 'paid')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      let paymentStatus: 'paid' | 'pending' | 'overdue' = 'pending';
      if (acc.remainingBalance <= 0) {
        paymentStatus = 'paid';
      } else if (overdueWeeks > 0) {
        paymentStatus = 'overdue';
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
        collectionDay: acc.collectionDay,
        collectionAgent: acc.collectionAgent,
        status: acc.status,
        paidWeeks,
        pendingWeeks,
        overdueWeeks,
        nextPaymentDate: nextInst ? nextInst.dueDate : null,
        paymentStatus,
      };
    });

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
    res.status(500).json({ success: false, message: error.message || 'Error fetching weekly finance accounts.' });
  }
};

export const createWeeklyAccount = async (req: Request, res: Response): Promise<void> => {
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
      totalInstallments: rawTotalWeeks,
      startDate: rawStartDate,
      collectionDay,
      collectionAgent,
      notes,
    } = req.body;

    if (!customerId || !principal) {
      res.status(400).json({ success: false, message: 'Customer ID and Loan principal are required.' });
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

    let totalWeeks = Number(rawTotalWeeks) || 12;
    let totalRepay = Number(rawTotalRepayment);
    if (!totalRepay || totalRepay <= 0) {
      totalRepay = roundMoney(princ + calculatedInterest + docCharges);
    }

    let weeklyAmount = Number(rawInstallmentAmount);
    if (!weeklyAmount || weeklyAmount <= 0) {
      weeklyAmount = roundMoney(totalRepay / totalWeeks);
    } else {
      totalWeeks = Math.ceil(totalRepay / weeklyAmount);
    }

    const startDate = rawStartDate ? new Date(rawStartDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalWeeks * 7 - 7);

    // Determine collection day if not provided
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const chosenDay = collectionDay || daysOfWeek[startDate.getDay()];

    const accountNumber = await generateAccountNumber('weekly');

    const account = await FinanceAccount.create({
      accountNumber,
      customerId: customer._id,
      financeType: 'weekly',
      principal: princ,
      interestType: interestType || 'flat',
      interestRate: intRate,
      interestAmount: calculatedInterest,
      documentCharges: docCharges,
      totalRepaymentAmount: totalRepay,
      installmentAmount: weeklyAmount,
      totalInstallments: totalWeeks,
      startDate,
      endDate,
      collectionDay: chosenDay,
      collectionAgent: collectionAgent || 'Self',
      status: 'active',
      totalPaid: 0,
      remainingBalance: totalRepay,
      notes: notes || '',
    });

    // Auto-generate weekly schedules
    const scheduleItems = generateWeeklySchedule(startDate, totalWeeks, weeklyAmount);
    const installmentDocs = scheduleItems.map((item) => ({
      accountId: account._id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate,
      expectedAmount: item.expectedAmount,
      paidAmount: 0,
      status: 'pending',
    }));

    await Installment.insertMany(installmentDocs);

    await logAudit(req, 'WEEKLY_LOAN_CREATED', 'FinanceAccount', account._id.toString(), {
      accountNumber,
      customerName: customer.name,
      principal: princ,
      interestAmount: calculatedInterest,
      totalRepaymentAmount: totalRepay,
      weeklyAmount,
      weeks: totalWeeks,
      collectionDay: chosenDay,
    });

    res.status(201).json({ success: true, message: 'Weekly finance loan created successfully.', account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating weekly finance account.' });
  }
};

export const getWeeklyAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid account ID.' });
      return;
    }

    const account = await FinanceAccount.findById(id).populate('customerId');
    if (!account || account.financeType !== 'weekly') {
      res.status(404).json({ success: false, message: 'Weekly finance account not found.' });
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
    res.status(500).json({ success: false, message: error.message || 'Error fetching weekly account.' });
  }
};

export const recordWeeklyPayment = async (req: Request, res: Response): Promise<void> => {
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
    if (!account || account.financeType !== 'weekly') {
      res.status(404).json({ success: false, message: 'Weekly finance account not found.' });
      return;
    }

    if (account.status === 'closed') {
      res.status(400).json({ success: false, message: 'This account has already been fully paid and closed.' });
      return;
    }

    const isAdvance = numAmount > account.remainingBalance;
    const pDate = paymentDate ? new Date(paymentDate) : new Date();

    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      transactionId,
      receiptNumber,
      customerId: (account.customerId as any)._id,
      accountId: account._id,
      financeType: 'weekly',
      amount: numAmount,
      paymentDate: pDate,
      paymentMethod: paymentMethod || 'cash',
      transactionReference: transactionReference || '',
      paymentStatus: isAdvance ? 'advance' : numAmount < account.installmentAmount ? 'partially_paid' : 'paid',
      recordedBy: recordedBy || 'Admin',
      notes: notes || '',
    });

    const newTotalPaid = roundMoney(account.totalPaid + numAmount);
    const newRemainingBalance = Math.max(0, roundMoney(account.totalRepaymentAmount - newTotalPaid));
    account.totalPaid = newTotalPaid;
    account.remainingBalance = newRemainingBalance;

    if (newRemainingBalance === 0) {
      account.status = 'closed';
    }
    await account.save();

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

    await logAudit(req, 'WEEKLY_PAYMENT_RECORDED', 'Payment', payment._id.toString(), {
      accountNumber: account.accountNumber,
      transactionId,
      amount: numAmount,
      paymentMethod: payment.paymentMethod,
      remainingBalance: newRemainingBalance,
    });

    res.status(201).json({
      success: true,
      message: `Weekly payment of ₹${numAmount} successfully recorded.`,
      payment,
      receiptNumber,
      remainingBalance: newRemainingBalance,
      isClosed: newRemainingBalance === 0,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error recording weekly payment.' });
  }
};
