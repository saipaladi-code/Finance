/**
 * Decimal-safe monetary math and installment generators
 */

export const roundMoney = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export interface DailyScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
}

export interface WeeklyScheduleItem {
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
}

/**
 * Generate daily installment schedule
 */
export const generateDailySchedule = (
  startDate: Date,
  totalDays: number,
  installmentAmount: number
): DailyScheduleItem[] => {
  const schedule: DailyScheduleItem[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  for (let i = 1; i <= totalDays; i++) {
    const dueDate = new Date(current);
    schedule.push({
      installmentNumber: i,
      dueDate,
      expectedAmount: roundMoney(installmentAmount),
    });
    // Add 1 day
    current.setDate(current.getDate() + 1);
  }

  return schedule;
};

/**
 * Generate weekly installment schedule
 */
export const generateWeeklySchedule = (
  startDate: Date,
  totalWeeks: number,
  installmentAmount: number
): WeeklyScheduleItem[] => {
  const schedule: WeeklyScheduleItem[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  for (let i = 1; i <= totalWeeks; i++) {
    const dueDate = new Date(current);
    schedule.push({
      installmentNumber: i,
      dueDate,
      expectedAmount: roundMoney(installmentAmount),
    });
    // Add 7 days
    current.setDate(current.getDate() + 7);
  }

  return schedule;
};

/**
 * Chit Fund Auction Calculations
 */
export interface AuctionCalculationResult {
  foremanCommission: number;
  totalDividend: number;
  dividendPerMember: number;
  nextMonthNetPayable: number;
  netPayoutAmount: number;
}

export const calculateAuctionDividend = (
  chitValue: number,
  bidAmount: number,
  totalMembers: number,
  monthlyContribution: number,
  foremanCommissionPercent: number = 5
): AuctionCalculationResult => {
  // Foreman commission is calculated on chit value (typically 5%)
  const foremanCommission = roundMoney((chitValue * foremanCommissionPercent) / 100);

  if (bidAmount < foremanCommission) {
    throw new Error(`Bid amount (₹${bidAmount}) cannot be less than foreman commission (₹${foremanCommission})`);
  }

  if (bidAmount > chitValue) {
    throw new Error(`Bid amount (₹${bidAmount}) cannot exceed total chit value (₹${chitValue})`);
  }

  // Total dividend is remaining discount after deducting foreman commission
  const totalDividend = roundMoney(bidAmount - foremanCommission);

  // Dividend per member is distributed equally among all members
  const dividendPerMember = roundMoney(totalDividend / totalMembers);

  // Net payable by non-prized/active members for the following month
  const nextMonthNetPayable = Math.max(0, roundMoney(monthlyContribution - dividendPerMember));

  // The winning bidder receives Chit Value minus the bid discount
  const netPayoutAmount = roundMoney(chitValue - bidAmount);

  return {
    foremanCommission,
    totalDividend,
    dividendPerMember,
    nextMonthNetPayable,
    netPayoutAmount,
  };
};
