import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ChitGroup } from '../models/ChitGroup.js';
import { ChitMember } from '../models/ChitMember.js';
import { ChitAuction } from '../models/ChitAuction.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';
import { Notification } from '../models/Notification.js';
import { calculateAuctionDividend, roundMoney } from '../utils/financeCalculations.js';
import { generateTransactionId, generateReceiptNumber } from '../utils/idGenerator.js';
import { logAudit } from '../middleware/audit.js';

export const LEGAL_DISCLAIMER =
  'LEGAL DISCLAIMER: This software application is strictly a bookkeeping and management tool for financial records and calculations. It is NOT a substitute for statutory chit fund registration, state regulatory approvals, or legal compliance under the Chit Funds Act, 1982 or other applicable jurisdiction laws.';

export const getChitGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const groups = await ChitGroup.find(filter).sort({ createdAt: -1 });

    const groupIds = groups.map((g) => g._id);
    const members = await ChitMember.find({ chitGroupId: { $in: groupIds } }).populate('customerId');
    const auctions = await ChitAuction.find({ chitGroupId: { $in: groupIds } }).sort({ auctionNumber: -1 });
    const payments = await Payment.find({ chitGroupId: { $in: groupIds }, isReversed: { $ne: true } });

    const formatted = groups.map((grp) => {
      const grpMembers = members.filter((m) => m.chitGroupId.toString() === grp._id.toString());
      const grpAuctions = auctions.filter((a) => a.chitGroupId.toString() === grp._id.toString());
      const grpPayments = payments.filter((p) => p.chitGroupId?.toString() === grp._id.toString());

      const totalCollected = roundMoney(grpPayments.reduce((sum, p) => sum + p.amount, 0));
      const totalDistributed = roundMoney(grpAuctions.reduce((sum, a) => sum + a.netPayoutAmount, 0));
      const auctionsConducted = grpAuctions.length;

      // Last auction info
      const lastAuction = grpAuctions[0] || null;
      const nextMonthNetPayable = lastAuction ? lastAuction.nextMonthNetPayable : grp.monthlyContribution;

      return {
        ...grp.toObject(),
        enrolledMembers: grpMembers.length,
        isFull: grpMembers.length >= grp.totalMembers,
        totalCollected,
        totalDistributed,
        auctionsConducted,
        remainingAuctions: grp.durationMonths - auctionsConducted,
        currentDividend: lastAuction ? lastAuction.dividendPerMember : 0,
        nextMonthNetPayable,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      disclaimer: LEGAL_DISCLAIMER,
      groups: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching chit groups.' });
  }
};

export const createChitGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      groupName,
      groupCode,
      chitValue,
      totalMembers,
      durationMonths,
      monthlyContribution,
      startDate,
      monthlyDueDate,
      foremanCommissionPercent,
      minBidAmount,
      maxBidAmount,
      groupDescription,
    } = req.body;

    if (!groupName || !chitValue || !totalMembers) {
      res.status(400).json({ success: false, message: 'Group name, total chit value, and total members are required.' });
      return;
    }

    const cVal = roundMoney(Number(chitValue));
    const members = Number(totalMembers);
    const months = Number(durationMonths) || members;
    let monthlyContrib = roundMoney(Number(monthlyContribution));

    if (!monthlyContrib || monthlyContrib <= 0) {
      monthlyContrib = roundMoney(cVal / months);
    }

    const commPercent = Number(foremanCommissionPercent) !== undefined ? Number(foremanCommissionPercent) : 5;
    const commAmount = roundMoney((cVal * commPercent) / 100);

    const code =
      groupCode ||
      `CHIT-${groupName.substring(0, 4).toUpperCase()}-${Math.floor(cVal / 1000)}K-${Date.now().toString().slice(-4)}`;

    const group = await ChitGroup.create({
      groupName: groupName.trim(),
      groupCode: code.toUpperCase().trim(),
      chitValue: cVal,
      totalMembers: members,
      durationMonths: months,
      monthlyContribution: monthlyContrib,
      startDate: startDate ? new Date(startDate) : new Date(),
      monthlyDueDate: Number(monthlyDueDate) || 10,
      foremanCommissionPercent: commPercent,
      minBidAmount: minBidAmount ? Number(minBidAmount) : commAmount,
      maxBidAmount: maxBidAmount ? Number(maxBidAmount) : roundMoney(cVal * 0.4), // 40% default max bid
      groupDescription: groupDescription || '',
      status: 'active',
    });

    await logAudit(req, 'CHIT_GROUP_CREATED', 'ChitGroup', group._id.toString(), {
      groupName: group.groupName,
      groupCode: group.groupCode,
      chitValue: cVal,
      monthlyContribution: monthlyContrib,
      totalMembers: members,
    });

    res.status(201).json({
      success: true,
      message: 'Chit group created successfully.',
      disclaimer: LEGAL_DISCLAIMER,
      group,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating chit group.' });
  }
};

export const getChitGroupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid chit group ID.' });
      return;
    }

    const group = await ChitGroup.findById(id);
    if (!group) {
      res.status(404).json({ success: false, message: 'Chit group not found.' });
      return;
    }

    const members = await ChitMember.find({ chitGroupId: group._id })
      .populate('customerId')
      .sort({ ticketNumber: 1 });

    const auctions = await ChitAuction.find({ chitGroupId: group._id })
      .populate('winningCustomerId')
      .populate('winningMemberId')
      .sort({ auctionNumber: 1 });

    const payments = await Payment.find({ chitGroupId: group._id, isReversed: { $ne: true } })
      .populate('customerId')
      .sort({ paymentDate: -1 });

    const totalCollected = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
    const totalDistributed = roundMoney(auctions.reduce((sum, a) => sum + a.netPayoutAmount, 0));

    res.status(200).json({
      success: true,
      disclaimer: LEGAL_DISCLAIMER,
      group,
      stats: {
        totalCollected,
        totalDistributed,
        enrolledCount: members.length,
        auctionsConducted: auctions.length,
        nextAuctionNumber: auctions.length + 1,
      },
      members,
      auctions,
      payments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching chit group details.' });
  }
};

export const addChitMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerId, ticketNumber, nomineeName, nomineeRelation, nomineePhone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !customerId) {
      res.status(400).json({ success: false, message: 'Chit group ID and Customer ID are required.' });
      return;
    }

    const group = await ChitGroup.findById(id);
    if (!group) {
      res.status(404).json({ success: false, message: 'Chit group not found.' });
      return;
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return;
    }

    const currentMembersCount = await ChitMember.countDocuments({ chitGroupId: group._id });
    if (currentMembersCount >= group.totalMembers) {
      res.status(400).json({
        success: false,
        message: `Chit group is already full (${group.totalMembers} / ${group.totalMembers} members enrolled).`,
      });
      return;
    }

    // Assign next available ticket number if not specified
    let assignedTicket = Number(ticketNumber);
    if (!assignedTicket || assignedTicket < 1) {
      const existingMembers = await ChitMember.find({ chitGroupId: group._id }).select('ticketNumber');
      const takenTickets = new Set(existingMembers.map((m) => m.ticketNumber));
      for (let i = 1; i <= group.totalMembers; i++) {
        if (!takenTickets.has(i)) {
          assignedTicket = i;
          break;
        }
      }
    } else {
      const alreadyTaken = await ChitMember.findOne({ chitGroupId: group._id, ticketNumber: assignedTicket });
      if (alreadyTaken) {
        res.status(400).json({ success: false, message: `Ticket number ${assignedTicket} is already taken in this group.` });
        return;
      }
    }

    const member = await ChitMember.create({
      chitGroupId: group._id,
      customerId: customer._id,
      ticketNumber: assignedTicket,
      joiningDate: new Date(),
      nomineeName: nomineeName ? nomineeName.trim() : '',
      nomineeRelation: nomineeRelation ? nomineeRelation.trim() : '',
      nomineePhone: nomineePhone ? nomineePhone.trim() : '',
      hasWonAuction: false,
      totalPaid: 0,
      totalDividendReceived: 0,
      status: 'active',
    });

    await logAudit(req, 'CHIT_MEMBER_ENROLLED', 'ChitMember', member._id.toString(), {
      groupName: group.groupName,
      customerName: customer.name,
      ticketNumber: assignedTicket,
    });

    res.status(201).json({ success: true, message: 'Member enrolled into Chit Group successfully.', member });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error enrolling chit member.' });
  }
};

export const conductAuction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { winningMemberId, bidAmount, auctionDate, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !winningMemberId) {
      res.status(400).json({ success: false, message: 'Group ID and Winning Member ID are required.' });
      return;
    }

    const group = await ChitGroup.findById(id);
    if (!group) {
      res.status(404).json({ success: false, message: 'Chit group not found.' });
      return;
    }

    const member = await ChitMember.findById(winningMemberId).populate('customerId');
    if (!member || member.chitGroupId.toString() !== group._id.toString()) {
      res.status(404).json({ success: false, message: 'Winning member not found in this group.' });
      return;
    }

    if (member.hasWonAuction) {
      res.status(400).json({
        success: false,
        message: `Member ${member.ticketNumber} (${(member.customerId as any)?.name}) has already won auction #${member.wonAuctionNumber}. Each member can win only once.`,
      });
      return;
    }

    const previousAuctionsCount = await ChitAuction.countDocuments({ chitGroupId: group._id });
    if (previousAuctionsCount >= group.durationMonths) {
      res.status(400).json({
        success: false,
        message: `All ${group.durationMonths} auctions for this group have already been completed.`,
      });
      return;
    }

    const auctionNumber = previousAuctionsCount + 1;
    const bid = roundMoney(Number(bidAmount));

    // Calculate dividend and payout transparently based on group rules
    const calc = calculateAuctionDividend(
      group.chitValue,
      bid,
      group.totalMembers,
      group.monthlyContribution,
      group.foremanCommissionPercent
    );

    const auction = await ChitAuction.create({
      chitGroupId: group._id,
      auctionNumber,
      auctionDate: auctionDate ? new Date(auctionDate) : new Date(),
      totalChitValue: group.chitValue,
      winningMemberId: member._id,
      winningCustomerId: (member.customerId as any)._id,
      bidAmount: bid,
      foremanCommission: calc.foremanCommission,
      totalDividend: calc.totalDividend,
      dividendPerMember: calc.dividendPerMember,
      nextMonthNetPayable: calc.nextMonthNetPayable,
      netPayoutAmount: calc.netPayoutAmount,
      payoutStatus: 'pending',
      notes: notes || '',
    });

    // Mark member as having won
    member.hasWonAuction = true;
    member.wonAuctionNumber = auctionNumber;
    await member.save();

    // Update all group members with the dividend received
    await ChitMember.updateMany(
      { chitGroupId: group._id },
      { $inc: { totalDividendReceived: calc.dividendPerMember } }
    );

    // Update group's current month
    group.currentMonth = auctionNumber + 1;
    if (group.currentMonth > group.durationMonths) {
      group.status = 'completed';
    }
    await group.save();

    // Send notification
    await Notification.create({
      title: `Auction #${auctionNumber} Completed: ${group.groupName}`,
      message: `Ticket #${member.ticketNumber} (${(member.customerId as any)?.name}) won with bid ₹${bid}. Net Payout: ₹${calc.netPayoutAmount}. Dividend per member: ₹${calc.dividendPerMember}. Next month payable: ₹${calc.nextMonthNetPayable}.`,
      type: 'auction',
      financeType: 'chitti',
      customerId: (member.customerId as any)._id,
      referenceId: auction._id.toString(),
    });

    await logAudit(req, 'CHIT_AUCTION_CONDUCTED', 'ChitAuction', auction._id.toString(), {
      groupName: group.groupName,
      auctionNumber,
      winningCustomer: (member.customerId as any)?.name,
      bidAmount: bid,
      dividendPerMember: calc.dividendPerMember,
      netPayoutAmount: calc.netPayoutAmount,
    });

    res.status(201).json({
      success: true,
      message: `Auction #${auctionNumber} conducted successfully. Winner Net Payout: ₹${calc.netPayoutAmount}.`,
      auction,
      calculation: calc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error conducting chit auction.' });
  }
};

export const recordChitPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // chitGroupId
    const { memberId, amount, paymentDate, paymentMethod, transactionReference, notes, recordedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !memberId) {
      res.status(400).json({ success: false, message: 'Chit Group ID and Member ID are required.' });
      return;
    }

    const group = await ChitGroup.findById(id);
    if (!group) {
      res.status(404).json({ success: false, message: 'Chit group not found.' });
      return;
    }

    const member = await ChitMember.findById(memberId).populate('customerId');
    if (!member) {
      res.status(404).json({ success: false, message: 'Chit member not found.' });
      return;
    }

    const numAmount = roundMoney(Number(amount));
    if (!numAmount || numAmount <= 0) {
      res.status(400).json({ success: false, message: 'Valid payment amount greater than 0 is required.' });
      return;
    }

    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();

    const payment = await Payment.create({
      transactionId,
      receiptNumber,
      customerId: (member.customerId as any)._id,
      chitGroupId: group._id,
      chitMemberId: member._id,
      financeType: 'chitti',
      amount: numAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      transactionReference: transactionReference || '',
      paymentStatus: 'paid',
      recordedBy: recordedBy || 'Admin',
      notes: notes || `Chit contribution for ${group.groupName} (Ticket #${member.ticketNumber})`,
    });

    member.totalPaid = roundMoney(member.totalPaid + numAmount);
    await member.save();

    await logAudit(req, 'CHIT_PAYMENT_RECORDED', 'Payment', payment._id.toString(), {
      groupName: group.groupName,
      customerName: (member.customerId as any)?.name,
      ticketNumber: member.ticketNumber,
      amount: numAmount,
      transactionId,
    });

    res.status(201).json({
      success: true,
      message: `Chitti payment of ₹${numAmount} successfully recorded.`,
      payment,
      receiptNumber,
      totalMemberPaid: member.totalPaid,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error recording chit payment.' });
  }
};
