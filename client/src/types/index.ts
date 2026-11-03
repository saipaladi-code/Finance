export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff' | 'customer';
  customerId?: string;
}

export interface Customer {
  _id: string;
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  idProofType?: string;
  idProofNumber?: string;
  photoUrl?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'defaulter';
  dailyAccountsCount?: number;
  weeklyAccountsCount?: number;
  chittiMembershipCount?: number;
  totalBorrowed?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  createdAt?: string;
}

export interface Installment {
  _id: string;
  accountId: string;
  installmentNumber: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  paidDate?: string;
  notes?: string;
}

export interface FinanceAccount {
  _id: string;
  accountNumber: string;
  customerId: Customer | string;
  customer?: Customer;
  financeType: 'daily' | 'weekly';
  principal: number;
  interestType: 'flat' | 'percentage' | 'none';
  interestRate: number;
  interestAmount: number;
  documentCharges: number;
  totalRepaymentAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  startDate: string;
  endDate: string;
  collectionDay?: string;
  collectionAgent?: string;
  status: 'active' | 'closed' | 'defaulted';
  totalPaid: number;
  remainingBalance: number;
  notes?: string;
  completedInstallments?: number;
  pendingInstallments?: number;
  overdueInstallments?: number;
  nextPaymentDate?: string | null;
  todayPaid?: number;
  todayStatus?: 'paid' | 'partially_paid' | 'pending' | 'overdue';
  paidWeeks?: number;
  pendingWeeks?: number;
  overdueWeeks?: number;
  paymentStatus?: 'paid' | 'pending' | 'overdue';
}

export interface Payment {
  _id: string;
  transactionId: string;
  receiptNumber: string;
  customerId: Customer | any;
  accountId?: FinanceAccount | any;
  chitGroupId?: ChitGroup | any;
  chitMemberId?: string;
  financeType: 'daily' | 'weekly' | 'chitti';
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'gpay' | 'phonepe' | 'bank_transfer' | 'other';
  transactionReference?: string;
  paymentStatus: 'paid' | 'partially_paid' | 'advance' | 'reversed';
  recordedBy: string;
  notes?: string;
  isReversed?: boolean;
  reversalReason?: string;
  createdAt?: string;
}

export interface ChitGroup {
  _id: string;
  groupName: string;
  groupCode: string;
  chitValue: number;
  totalMembers: number;
  durationMonths: number;
  monthlyContribution: number;
  startDate: string;
  monthlyDueDate: number;
  foremanCommissionPercent: number;
  minBidAmount: number;
  maxBidAmount: number;
  currentMonth: number;
  groupDescription?: string;
  status: 'upcoming' | 'active' | 'completed';
  enrolledMembers?: number;
  isFull?: boolean;
  totalCollected?: number;
  totalDistributed?: number;
  auctionsConducted?: number;
  remainingAuctions?: number;
  currentDividend?: number;
  nextMonthNetPayable?: number;
}

export interface ChitMember {
  _id: string;
  chitGroupId: string;
  customerId: Customer | any;
  ticketNumber: number;
  joiningDate: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineePhone?: string;
  hasWonAuction: boolean;
  wonAuctionNumber?: number;
  totalPaid: number;
  totalDividendReceived: number;
  status: 'active' | 'completed' | 'withdrawn';
}

export interface ChitAuction {
  _id: string;
  chitGroupId: string;
  auctionNumber: number;
  auctionDate: string;
  totalChitValue: number;
  winningMemberId: ChitMember | any;
  winningCustomerId: Customer | any;
  bidAmount: number;
  foremanCommission: number;
  totalDividend: number;
  dividendPerMember: number;
  nextMonthNetPayable: number;
  netPayoutAmount: number;
  payoutStatus: 'pending' | 'processed' | 'settled';
  payoutDate?: string;
  payoutReference?: string;
  notes?: string;
}

export interface BusinessSetting {
  _id?: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  upiId: string;
  payeeName: string;
  googlePayQrUrl?: string;
  phonePeQrUrl?: string;
  defaultCurrency: string;
  timezone: string;
  receiptPrefix: string;
  termsAndConditions?: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'due_reminder' | 'overdue' | 'auction' | 'payment_received' | 'general';
  financeType?: 'daily' | 'weekly' | 'chitti' | 'system';
  isRead: boolean;
  date: string;
  createdAt: string;
}

export interface DashboardStats {
  cards: {
    totalCustomers: number;
    totalMoneyDistributed: number;
    totalAmountCollected: number;
    todayCollection: number;
    totalOutstandingAmount: number;
    todayPendingPaymentsCount: number;
    todayExpectedAmount: number;
    overdueCustomersCount: number;
    activeDailyAccounts: number;
    activeWeeklyAccounts: number;
    activeChittiGroups: number;
  };
  distribution: {
    dailyDistributed: number;
    weeklyDistributed: number;
    chitDistributed: number;
  };
  charts: {
    dailyCollection: Array<{ name: string; daily: number; weekly: number; chitti: number; total: number }>;
    weeklyCollection: Array<{ week: string; total: number }>;
    monthlyCollection: Array<{ month: string; collection: number }>;
    collectionVsOutstanding: Array<{ name: string; value: number; fill: string }>;
    financeDistribution: Array<{ name: string; value: number; fill: string }>;
  };
  sections: {
    todayPayments: Array<{
      _id: string;
      customerName: string;
      phoneNumber: string;
      accountNumber: string;
      financeType: 'daily' | 'weekly';
      expectedAmount: number;
      paidAmount: number;
      remainingAmount: number;
      paymentStatus: 'pending' | 'partially_paid' | 'paid' | 'overdue';
    }>;
    recentTransactions: Array<{
      _id: string;
      customerName: string;
      transactionId: string;
      receiptNumber: string;
      paymentDate: string;
      amount: number;
      paymentMethod: string;
      financeType: string;
    }>;
    overdueCustomers: Array<{
      customerId: string;
      customerName: string;
      phoneNumber: string;
      accountNumber: string;
      financeType: string;
      pendingAmount: number;
      pendingInstallmentsCount: number;
      oldestDueDate: string;
    }>;
  };
}

