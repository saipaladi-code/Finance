import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Customer } from '../models/Customer.js';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Payment } from '../models/Payment.js';
import { ChitMember } from '../models/ChitMember.js';
import { generateCustomerId } from '../utils/idGenerator.js';
import { roundMoney } from '../utils/financeCalculations.js';
import { logAudit } from '../middleware/audit.js';

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { customerId: { $regex: term, $options: 'i' } },
        { address: { $regex: term, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    // Aggregate summary metrics for each customer
    const customerIds = customers.map((c) => c._id);

    const accounts = await FinanceAccount.find({ customerId: { $in: customerIds } });
    const chitMemberships = await ChitMember.find({ customerId: { $in: customerIds } }).populate('chitGroupId');

    const customerSummaries = customers.map((c) => {
      const custAccounts = accounts.filter((a) => a.customerId.toString() === c._id.toString());
      const dailyCount = custAccounts.filter((a) => a.financeType === 'daily' && a.status === 'active').length;
      const weeklyCount = custAccounts.filter((a) => a.financeType === 'weekly' && a.status === 'active').length;
      const chittiCount = chitMemberships.filter((cm) => cm.customerId.toString() === c._id.toString() && cm.status === 'active').length;

      const totalBorrowed = roundMoney(
        custAccounts.reduce((sum, a) => sum + (a.totalRepaymentAmount || a.principal), 0)
      );
      const totalPaid = roundMoney(custAccounts.reduce((sum, a) => sum + (a.totalPaid || 0), 0));
      const totalOutstanding = roundMoney(
        custAccounts.reduce((sum, a) => sum + (a.remainingBalance || 0), 0)
      );

      return {
        ...c.toObject(),
        dailyAccountsCount: dailyCount,
        weeklyAccountsCount: weeklyCount,
        chittiMembershipCount: chittiCount,
        totalBorrowed,
        totalPaid,
        totalOutstanding,
      };
    });

    res.status(200).json({ success: true, count: customerSummaries.length, customers: customerSummaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching customers.' });
  }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    // Fetch all related finance accounts, chit memberships, and payments
    const accounts = await FinanceAccount.find({ customerId: customer._id }).sort({ createdAt: -1 });
    const chitMemberships = await ChitMember.find({ customerId: customer._id })
      .populate('chitGroupId')
      .sort({ createdAt: -1 });
    const payments = await Payment.find({ customerId: customer._id }).sort({ paymentDate: -1 });

    const totalBorrowed = roundMoney(
      accounts.reduce((sum, a) => sum + (a.totalRepaymentAmount || a.principal), 0)
    );
    const totalPaid = roundMoney(accounts.reduce((sum, a) => sum + (a.totalPaid || 0), 0));
    const totalOutstanding = roundMoney(accounts.reduce((sum, a) => sum + (a.remainingBalance || 0), 0));

    res.status(200).json({
      success: true,
      customer,
      summary: {
        totalBorrowed,
        totalPaid,
        totalOutstanding,
        activeAccountsCount: accounts.filter((a) => a.status === 'active').length,
        chitCount: chitMemberships.length,
      },
      accounts,
      chitMemberships,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching customer profile.' });
  }
};

export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, address, city, idProofType, idProofNumber, photoUrl, guarantorName, guarantorPhone, notes } = req.body;

    if (!name || !phone || !address) {
      res.status(400).json({ success: false, message: 'Customer name, phone number, and address are required.' });
      return;
    }

    const customerId = await generateCustomerId();

    const customer = await Customer.create({
      customerId,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      address: address.trim(),
      city: city ? city.trim() : '',
      idProofType: idProofType || 'Aadhaar',
      idProofNumber: idProofNumber ? idProofNumber.trim() : '',
      photoUrl: photoUrl || '',
      guarantorName: guarantorName ? guarantorName.trim() : '',
      guarantorPhone: guarantorPhone ? guarantorPhone.trim() : '',
      notes: notes || '',
      status: 'active',
    });

    await logAudit(req, 'CUSTOMER_CREATED', 'Customer', customer._id.toString(), {
      customerId: customer.customerId,
      name: customer.name,
      phone: customer.phone,
    });

    res.status(201).json({ success: true, message: 'Customer registered successfully.', customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error registering customer.' });
  }
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    const { name, phone, email, address, city, idProofType, idProofNumber, photoUrl, guarantorName, guarantorPhone, notes, status } = req.body;

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email ? email.trim() : undefined;
    if (address) customer.address = address.trim();
    if (city !== undefined) customer.city = city.trim();
    if (idProofType) customer.idProofType = idProofType;
    if (idProofNumber !== undefined) customer.idProofNumber = idProofNumber.trim();
    if (photoUrl !== undefined) customer.photoUrl = photoUrl;
    if (guarantorName !== undefined) customer.guarantorName = guarantorName.trim();
    if (guarantorPhone !== undefined) customer.guarantorPhone = guarantorPhone.trim();
    if (notes !== undefined) customer.notes = notes;
    if (status && ['active', 'inactive', 'defaulter'].includes(status)) customer.status = status;

    await customer.save();

    await logAudit(req, 'CUSTOMER_UPDATED', 'Customer', customer._id.toString(), {
      name: customer.name,
      phone: customer.phone,
      status: customer.status,
    });

    res.status(200).json({ success: true, message: 'Customer details updated successfully.', customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating customer.' });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      return;
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    // Safety rule: check if customer has active loans with outstanding balance
    const activeAccounts = await FinanceAccount.find({
      customerId: customer._id,
      remainingBalance: { $gt: 0 },
    });

    if (activeAccounts.length > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete customer. Customer has ${activeAccounts.length} active finance account(s) with outstanding balance of ₹${activeAccounts.reduce((sum, a) => sum + a.remainingBalance, 0)}. Please clear or settle balances first.`,
      });
      return;
    }

    await Customer.findByIdAndDelete(id);

    await logAudit(req, 'CUSTOMER_DELETED', 'Customer', id, {
      customerId: customer.customerId,
      name: customer.name,
    });

    res.status(200).json({ success: true, message: 'Customer removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting customer.' });
  }
};

