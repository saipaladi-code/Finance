import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { FinanceAccount } from '../models/FinanceAccount.js';
import { Installment } from '../models/Installment.js';
import { Payment } from '../models/Payment.js';
import { ChitGroup } from '../models/ChitGroup.js';
import { ChitMember } from '../models/ChitMember.js';
import { ChitAuction } from '../models/ChitAuction.js';
import { BusinessSetting } from '../models/BusinessSetting.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import {
  generateDailySchedule,
  generateWeeklySchedule,
  calculateAuctionDividend,
} from '../utils/financeCalculations.js';

export const seedDatabase = async (disconnectAtEnd: boolean = true) => {
  try {
    console.log('🌱 Starting database seeding...');
    if (disconnectAtEnd) {
      await connectDB();
    }

    // Clear existing collections
    await User.deleteMany({});
    await Customer.deleteMany({});
    await FinanceAccount.deleteMany({});
    await Installment.deleteMany({});
    await Payment.deleteMany({});
    await ChitGroup.deleteMany({});
    await ChitMember.deleteMany({});
    await ChitAuction.deleteMany({});
    await BusinessSetting.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('🧹 Cleaned existing database records.');

    // 1. Create Business Profile & Settings
    await BusinessSetting.create({
      businessName: 'Sri Lakshmi Finance & Chits',
      ownerName: 'R. Venkatesh',
      phone: '+91 98401 23456',
      email: 'admin@finance.local',
      address: 'Shop #14, Ground Floor, Sri Krishna Complex, Gandhi Road, Chennai - 600001',
      upiId: 'srilakshmifinance@okaxis',
      payeeName: 'Sri Lakshmi Finance',
      googlePayQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=srilakshmifinance@okaxis&pn=Sri%20Lakshmi%20Finance&cu=INR',
      phonePeQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=srilakshmifinance@okaxis&pn=Sri%20Lakshmi%20Finance&cu=INR',
      defaultCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      receiptPrefix: 'SLF-REC',
      termsAndConditions:
        '1. Repayments must be remitted strictly as per the agreed daily/weekly schedule.\n2. Always verify and retain your printed or digital receipt for every payment.\n3. Chit auctions are conducted strictly on the 10th of every calendar month.\n4. This system serves as a bookkeeping management system.',
    });

    // 2. Create Admin User
    await User.create({
      name: 'R. Venkatesh (Admin)',
      email: 'admin@finance.local',
      password: 'Password@123',
      phone: '+91 98401 23456',
      role: 'admin',
      isActive: true,
    });

    console.log('👤 Admin user created: admin@finance.local / Password@123');

    // 3. Create 10 Realistic Customers
    const customerData = [
      {
        customerId: 'CUST-1001',
        name: 'Suresh Kumar',
        phone: '9840012341',
        email: 'suresh.retail@gmail.com',
        address: '#12 South Mada Street, Mylapore, Chennai',
        city: 'Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '4821 9021 3412',
        guarantorName: 'K. Ramesh',
        guarantorPhone: '9840054321',
        notes: 'Vegetable wholesale merchant, highly reliable.',
        status: 'active',
      },
      {
        customerId: 'CUST-1002',
        name: 'M. Anand Babu',
        phone: '9840012342',
        email: 'anand.sweets@gmail.com',
        address: '#45 Bazaar Road, T. Nagar, Chennai',
        city: 'Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '3214 8901 2341',
        guarantorName: 'M. Prakash',
        guarantorPhone: '9840054322',
        notes: 'Sweet stall proprietor, daily collections.',
        status: 'active',
      },
      {
        customerId: 'CUST-1003',
        name: 'P. Rajeshwari',
        phone: '9840012343',
        email: 'rajeshwari.textiles@gmail.com',
        address: '#78 R.K. Mutt Road, Mandaveli, Chennai',
        city: 'Chennai',
        idProofType: 'PAN',
        idProofNumber: 'ABCDE1234F',
        guarantorName: 'P. Sundaram',
        guarantorPhone: '9840054323',
        notes: 'Saree boutique owner, weekly finance member.',
        status: 'active',
      },
      {
        customerId: 'CUST-1004',
        name: 'K. Murugan',
        phone: '9840012344',
        email: 'murugan.tea@gmail.com',
        address: '#102 High Road, Guindy, Chennai',
        city: 'Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '6712 3412 8901',
        guarantorName: 'V. Subramani',
        guarantorPhone: '9840054324',
        notes: 'Tea & snacks stall owner, daily installment.',
        status: 'active',
      },
      {
        customerId: 'CUST-1005',
        name: 'S. Karthik',
        phone: '9840012345',
        email: 'karthik.auto@gmail.com',
        address: '#23 Trunk Road, Poonamallee, Chennai',
        city: 'Chennai',
        idProofType: 'Driving License',
        idProofNumber: 'TN-01-2015-00123',
        guarantorName: 'S. Ganesan',
        guarantorPhone: '9840054325',
        notes: 'Commercial vehicle operator, multiple chit tickets.',
        status: 'active',
      },
      {
        customerId: 'CUST-1006',
        name: 'Deepa Lakshmi',
        phone: '9840012346',
        email: 'deepa.lakshmi@gmail.com',
        address: '#56 Paper Mills Road, Perambur, Chennai',
        city: 'Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '9012 3412 5678',
        guarantorName: 'R. Loganathan',
        guarantorPhone: '9840054326',
        notes: 'Supermarket partner, chit group regular member.',
        status: 'active',
      },
      {
        customerId: 'CUST-1007',
        name: 'V. Balachander',
        phone: '9840012347',
        email: 'bala.hardware@gmail.com',
        address: '#89 Mount Road, Thousand Lights, Chennai',
        city: 'Chennai',
        idProofType: 'GST',
        idProofNumber: '33AABCT1234P1Z2',
        guarantorName: 'V. Mohan',
        guarantorPhone: '9840054327',
        notes: 'Hardware & electrical store, weekly finance.',
        status: 'active',
      },
      {
        customerId: 'CUST-1008',
        name: 'N. Saravanan',
        phone: '9840012348',
        email: 'saravanan.print@gmail.com',
        address: '#34 Nelson Manickam Road, Aminjikarai, Chennai',
        city: 'Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '2345 6789 0123',
        guarantorName: 'N. Pandian',
        guarantorPhone: '9840054328',
        notes: 'Printing press, currently delayed payments.',
        status: 'defaulter',
      },
      {
        customerId: 'CUST-1009',
        name: 'G. Meenakshi',
        phone: '9840012349',
        email: 'meenakshi.flour@gmail.com',
        address: '#15 Gandhi Nagar 2nd Street, Adyar, Chennai',
        city: 'Chennai',
        idProofType: 'Voter ID',
        idProofNumber: 'TN/02/123/456789',
        guarantorName: 'G. Kannan',
        guarantorPhone: '9840054329',
        notes: 'Flour mill owner, daily loan customer.',
        status: 'active',
      },
      {
        customerId: 'CUST-1010',
        name: 'T. R. Senthil',
        phone: '9840012350',
        email: 'senthil.traders@gmail.com',
        address: '#91 Lake View Road, West Mambalam, Chennai',
        city: 'Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '7890 1234 5678',
        guarantorName: 'T. R. Mani',
        guarantorPhone: '9840054330',
        notes: 'Stationery supplier, chit fund member.',
        status: 'active',
      },
    ];

    const customers = await Customer.insertMany(customerData);
    console.log(`👥 Created ${customers.length} realistic customer accounts.`);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 4. Create Daily Finance Accounts & Schedules
    const df1StartDate = new Date(today);
    df1StartDate.setDate(df1StartDate.getDate() - 40);
    const df1EndDate = new Date(df1StartDate);
    df1EndDate.setDate(df1EndDate.getDate() + 99);

    const df1 = await FinanceAccount.create({
      accountNumber: 'DF-2026-0001',
      customerId: customers[0]._id,
      financeType: 'daily',
      principal: 10000,
      interestType: 'flat',
      interestRate: 0,
      interestAmount: 0,
      documentCharges: 0,
      totalRepaymentAmount: 10000,
      installmentAmount: 100,
      totalInstallments: 100,
      startDate: df1StartDate,
      endDate: df1EndDate,
      collectionAgent: 'R. Venkatesh',
      status: 'active',
      totalPaid: 4000,
      remainingBalance: 6000,
      notes: 'Standard 100 days micro-loan. On-time payer.',
    });

    const df1Schedule = generateDailySchedule(df1StartDate, 100, 100);
    const df1Installments = df1Schedule.map((item, idx) => ({
      accountId: df1._id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate,
      expectedAmount: 100,
      paidAmount: idx < 40 ? 100 : 0,
      status: idx < 40 ? 'paid' : idx === 40 ? 'pending' : 'pending',
      paidDate: idx < 40 ? item.dueDate : undefined,
    }));
    await Installment.insertMany(df1Installments);

    for (let d = 0; d < 40; d += 10) {
      const pDate = new Date(df1StartDate);
      pDate.setDate(pDate.getDate() + d + 5);
      await Payment.create({
        transactionId: `TXN-2026${String(d + 1).padStart(4, '0')}`,
        receiptNumber: `REC-DF-00${d / 10 + 1}`,
        customerId: customers[0]._id,
        accountId: df1._id,
        financeType: 'daily',
        amount: 1000,
        paymentDate: pDate,
        paymentMethod: d % 20 === 0 ? 'gpay' : 'cash',
        transactionReference: d % 20 === 0 ? `UPI-UTR-90823${d}` : '',
        paymentStatus: 'paid',
        recordedBy: 'R. Venkatesh',
        notes: '10 days bundle payment',
      });
    }

    const df2StartDate = new Date(today);
    df2StartDate.setDate(df2StartDate.getDate() - 15);
    const df2EndDate = new Date(df2StartDate);
    df2EndDate.setDate(df2EndDate.getDate() + 99);

    const df2 = await FinanceAccount.create({
      accountNumber: 'DF-2026-0002',
      customerId: customers[1]._id,
      financeType: 'daily',
      principal: 20000,
      interestType: 'flat',
      interestRate: 0,
      interestAmount: 0,
      documentCharges: 0,
      totalRepaymentAmount: 20000,
      installmentAmount: 200,
      totalInstallments: 100,
      startDate: df2StartDate,
      endDate: df2EndDate,
      collectionAgent: 'R. Venkatesh',
      status: 'active',
      totalPaid: 3200,
      remainingBalance: 16800,
      notes: 'Daily sweet stall collection.',
    });

    const df2Schedule = generateDailySchedule(df2StartDate, 100, 200);
    const df2Installments = df2Schedule.map((item, idx) => ({
      accountId: df2._id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate,
      expectedAmount: 200,
      paidAmount: idx <= 15 ? 200 : 0,
      status: idx <= 15 ? 'paid' : 'pending',
      paidDate: idx <= 15 ? item.dueDate : undefined,
    }));
    await Installment.insertMany(df2Installments);

    await Payment.create({
      transactionId: `TXN-TODAY-0001`,
      receiptNumber: `REC-TODAY-001`,
      customerId: customers[1]._id,
      accountId: df2._id,
      financeType: 'daily',
      amount: 200,
      paymentDate: new Date(),
      paymentMethod: 'phonepe',
      transactionReference: 'PHPE-UTR-8910283',
      paymentStatus: 'paid',
      recordedBy: 'R. Venkatesh',
      notes: "Today's daily installment collection",
    });

    const df3StartDate = new Date(today);
    df3StartDate.setDate(df3StartDate.getDate() - 25);
    const df3EndDate = new Date(df3StartDate);
    df3EndDate.setDate(df3EndDate.getDate() + 99);

    const df3 = await FinanceAccount.create({
      accountNumber: 'DF-2026-0003',
      customerId: customers[3]._id,
      financeType: 'daily',
      principal: 30000,
      interestType: 'flat',
      interestRate: 0,
      interestAmount: 0,
      documentCharges: 0,
      totalRepaymentAmount: 30000,
      installmentAmount: 300,
      totalInstallments: 100,
      startDate: df3StartDate,
      endDate: df3EndDate,
      collectionAgent: 'R. Venkatesh',
      status: 'active',
      totalPaid: 4500,
      remainingBalance: 25500,
      notes: 'Tea shop owner - 10 days payments pending.',
    });

    const df3Schedule = generateDailySchedule(df3StartDate, 100, 300);
    const df3Installments = df3Schedule.map((item, idx) => {
      const isPaid = idx < 15;
      const isOverdue = idx >= 15 && idx < 25;
      return {
        accountId: df3._id,
        installmentNumber: item.installmentNumber,
        dueDate: item.dueDate,
        expectedAmount: 300,
        paidAmount: isPaid ? 300 : 0,
        status: isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
        paidDate: isPaid ? item.dueDate : undefined,
      };
    });
    await Installment.insertMany(df3Installments);

    // 5. Weekly Finance Accounts & Schedules
    const wf1StartDate = new Date(today);
    wf1StartDate.setDate(wf1StartDate.getDate() - 6 * 7);
    const wf1EndDate = new Date(wf1StartDate);
    wf1EndDate.setDate(wf1EndDate.getDate() + 11 * 7);

    const wf1 = await FinanceAccount.create({
      accountNumber: 'WF-2026-0001',
      customerId: customers[2]._id,
      financeType: 'weekly',
      principal: 10000,
      interestType: 'flat',
      interestRate: 20,
      interestAmount: 2000,
      documentCharges: 0,
      totalRepaymentAmount: 12000,
      installmentAmount: 1000,
      totalInstallments: 12,
      startDate: wf1StartDate,
      endDate: wf1EndDate,
      collectionDay: 'Monday',
      collectionAgent: 'R. Venkatesh',
      status: 'active',
      totalPaid: 6000,
      remainingBalance: 6000,
      notes: 'Textile boutique owner, weekly Monday collections.',
    });

    const wf1Schedule = generateWeeklySchedule(wf1StartDate, 12, 1000);
    const wf1Installments = wf1Schedule.map((item, idx) => ({
      accountId: wf1._id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate,
      expectedAmount: 1000,
      paidAmount: idx < 6 ? 1000 : 0,
      status: idx < 6 ? 'paid' : 'pending',
      paidDate: idx < 6 ? item.dueDate : undefined,
    }));
    await Installment.insertMany(wf1Installments);

    const wf2StartDate = new Date(today);
    wf2StartDate.setDate(wf2StartDate.getDate() - 3 * 7);
    const wf2EndDate = new Date(wf2StartDate);
    wf2EndDate.setDate(wf2EndDate.getDate() + 14 * 7);

    const wf2 = await FinanceAccount.create({
      accountNumber: 'WF-2026-0002',
      customerId: customers[6]._id,
      financeType: 'weekly',
      principal: 25000,
      interestType: 'flat',
      interestRate: 20,
      interestAmount: 5000,
      documentCharges: 0,
      totalRepaymentAmount: 30000,
      installmentAmount: 2000,
      totalInstallments: 15,
      startDate: wf2StartDate,
      endDate: wf2EndDate,
      collectionDay: 'Friday',
      collectionAgent: 'R. Venkatesh',
      status: 'active',
      totalPaid: 6000,
      remainingBalance: 24000,
      notes: 'Hardware merchant, weekly Friday collections.',
    });

    const wf2Schedule = generateWeeklySchedule(wf2StartDate, 15, 2000);
    const wf2Installments = wf2Schedule.map((item, idx) => ({
      accountId: wf2._id,
      installmentNumber: item.installmentNumber,
      dueDate: item.dueDate,
      expectedAmount: 2000,
      paidAmount: idx < 3 ? 2000 : 0,
      status: idx < 3 ? 'paid' : 'pending',
      paidDate: idx < 3 ? item.dueDate : undefined,
    }));
    await Installment.insertMany(wf2Installments);

    // 6. Chitti Groups & Members
    const chit1Start = new Date(today);
    chit1Start.setMonth(chit1Start.getMonth() - 2);

    const chit1 = await ChitGroup.create({
      groupName: 'Sri Lakshmi Premium Chit - ₹1 Lakh',
      groupCode: 'CHIT-LAKSHMI-100K-01',
      chitValue: 100000,
      totalMembers: 20,
      durationMonths: 20,
      monthlyContribution: 5000,
      startDate: chit1Start,
      monthlyDueDate: 10,
      foremanCommissionPercent: 5,
      minBidAmount: 5000,
      maxBidAmount: 35000,
      currentMonth: 3,
      groupDescription: 'Prime commercial merchants chit fund group with strict monthly auction on 10th.',
      status: 'active',
    });

    const chit1Members = [];
    for (let i = 0; i < 20; i++) {
      const cust = customers[i % customers.length];
      const member = await ChitMember.create({
        chitGroupId: chit1._id,
        customerId: cust._id,
        ticketNumber: i + 1,
        joiningDate: chit1Start,
        nomineeName: cust.guarantorName || 'Nominee',
        nomineeRelation: 'Family Member',
        nomineePhone: cust.guarantorPhone || cust.phone,
        hasWonAuction: false,
        totalPaid: 10000,
        totalDividendReceived: 1800,
        status: 'active',
      });
      chit1Members.push(member);
    }

    const auction1Calc = calculateAuctionDividend(100000, 25000, 20, 5000, 5);
    const auction1Date = new Date(chit1Start);
    auction1Date.setDate(10);

    await ChitAuction.create({
      chitGroupId: chit1._id,
      auctionNumber: 1,
      auctionDate: auction1Date,
      totalChitValue: 100000,
      winningMemberId: chit1Members[0]._id,
      winningCustomerId: (chit1Members[0].customerId as any)._id || chit1Members[0].customerId,
      bidAmount: 25000,
      foremanCommission: auction1Calc.foremanCommission,
      totalDividend: auction1Calc.totalDividend,
      dividendPerMember: auction1Calc.dividendPerMember,
      nextMonthNetPayable: auction1Calc.nextMonthNetPayable,
      netPayoutAmount: auction1Calc.netPayoutAmount,
      payoutStatus: 'settled',
      payoutDate: new Date(auction1Date.getTime() + 5 * 24 * 60 * 60 * 1000),
      payoutReference: 'NEFT-CHIT-0019283',
      notes: 'First auction of group. High bidding interest.',
    });
    chit1Members[0].hasWonAuction = true;
    chit1Members[0].wonAuctionNumber = 1;
    await chit1Members[0].save();

    const auction2Calc = calculateAuctionDividend(100000, 21000, 20, 5000, 5);
    const auction2Date = new Date(chit1Start);
    auction2Date.setMonth(auction2Date.getMonth() + 1);
    auction2Date.setDate(10);

    await ChitAuction.create({
      chitGroupId: chit1._id,
      auctionNumber: 2,
      auctionDate: auction2Date,
      totalChitValue: 100000,
      winningMemberId: chit1Members[1]._id,
      winningCustomerId: (chit1Members[1].customerId as any)._id || chit1Members[1].customerId,
      bidAmount: 21000,
      foremanCommission: auction2Calc.foremanCommission,
      totalDividend: auction2Calc.totalDividend,
      dividendPerMember: auction2Calc.dividendPerMember,
      nextMonthNetPayable: auction2Calc.nextMonthNetPayable,
      netPayoutAmount: auction2Calc.netPayoutAmount,
      payoutStatus: 'settled',
      payoutDate: new Date(auction2Date.getTime() + 4 * 24 * 60 * 60 * 1000),
      payoutReference: 'NEFT-CHIT-0028192',
      notes: 'Second monthly auction. Payout transferred successfully.',
    });
    chit1Members[1].hasWonAuction = true;
    chit1Members[1].wonAuctionNumber = 2;
    await chit1Members[1].save();

    const chit2 = await ChitGroup.create({
      groupName: 'Sri Vinayaga Commercial Chit - ₹2 Lakhs',
      groupCode: 'CHIT-VINAYAGA-200K-01',
      chitValue: 200000,
      totalMembers: 20,
      durationMonths: 20,
      monthlyContribution: 10000,
      startDate: new Date(),
      monthlyDueDate: 15,
      foremanCommissionPercent: 5,
      minBidAmount: 10000,
      maxBidAmount: 70000,
      currentMonth: 1,
      groupDescription: 'Large traders business chit with monthly auction on 15th.',
      status: 'active',
    });

    for (let i = 0; i < 12; i++) {
      const cust = customers[i % customers.length];
      await ChitMember.create({
        chitGroupId: chit2._id,
        customerId: cust._id,
        ticketNumber: i + 1,
        joiningDate: new Date(),
        nomineeName: cust.guarantorName || 'Nominee',
        nomineeRelation: 'Spouse',
        nomineePhone: cust.guarantorPhone || cust.phone,
        hasWonAuction: false,
        totalPaid: 10000,
        totalDividendReceived: 0,
        status: 'active',
      });
    }

    await ChitGroup.create({
      groupName: 'Navarathri Special Chit - ₹50,000',
      groupCode: 'CHIT-NAVARATHRI-50K',
      chitValue: 50000,
      totalMembers: 10,
      durationMonths: 10,
      monthlyContribution: 5000,
      startDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
      monthlyDueDate: 5,
      foremanCommissionPercent: 5,
      minBidAmount: 2500,
      maxBidAmount: 15000,
      currentMonth: 1,
      groupDescription: 'Upcoming small festival group. Enrollment currently open.',
      status: 'upcoming',
    });

    // 7. Notifications
    await Notification.create({
      title: 'Auction Reminder: Sri Lakshmi 1 Lakh',
      message: 'Monthly auction #3 is scheduled for the 10th of this month at 4:00 PM.',
      type: 'auction',
      financeType: 'chitti',
      isRead: false,
      date: new Date(),
    });

    await Notification.create({
      title: 'Daily Collection Alert',
      message: '₹200 collected from M. Anand Babu (DF-2026-0002) via PhonePe.',
      type: 'payment_received',
      financeType: 'daily',
      isRead: false,
      date: new Date(),
    });

    await Notification.create({
      title: 'Overdue Installment Notice',
      message: 'K. Murugan (DF-2026-0003) has 10 pending installments amounting to ₹3,000.',
      type: 'overdue',
      financeType: 'daily',
      isRead: false,
      date: new Date(),
    });

    // 8. Audit Logs
    await AuditLog.create({
      action: 'SYSTEM_INITIALIZED',
      performedBy: 'System Bootstrapper',
      targetResource: 'System',
      resourceId: 'INIT',
      details: {
        customersSeeded: customers.length,
        dailyAccountsSeeded: 3,
        weeklyAccountsSeeded: 2,
        chitGroupsSeeded: 3,
      },
    });

    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    if (disconnectAtEnd) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Database seeding error:', err);
    if (disconnectAtEnd) {
      process.exit(1);
    }
  }
};

// Check if running directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase(true);
}
