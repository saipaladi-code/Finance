import {
  calculateAuctionDividend,
  generateDailySchedule,
  generateWeeklySchedule,
  roundMoney,
} from '../utils/financeCalculations.js';

console.log('========================================================');
console.log('🧪 RUNNING FINANCIAL CALCULATION & INTEGRITY TESTS');
console.log('========================================================\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition: boolean, testName: string, details?: any) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName}`, details || '');
    throw new Error(`Test failed: ${testName}`);
  }
};

// 1. Decimal Precision
console.log('--- Test 1: Decimal Money Rounding ---');
const floatJitter = 0.1 + 0.2; // normally 0.30000000000000004
assert(roundMoney(floatJitter) === 0.3, 'Decimal precision rounding handles IEEE 754 float jitter');
assert(roundMoney(1234.567) === 1234.57, 'Rounds to 2 decimal places properly');

// 2. Chitti Auction Math
console.log('\n--- Test 2: Chitti Fund Auction Calculations ---');
const auctionResult = calculateAuctionDividend(
  100000, // Chit Value: ₹1,00,000
  25000,  // Bid Discount: ₹25,000
  20,     // Total Members: 20
  5000,   // Monthly Contribution: ₹5,000
  5       // Foreman Commission: 5%
);

assert(auctionResult.foremanCommission === 5000, 'Foreman commission is 5% of ₹1,00,000 = ₹5,000');
assert(auctionResult.totalDividend === 20000, 'Total dividend = Bid (₹25,000) - Commission (₹5,000) = ₹20,000');
assert(auctionResult.dividendPerMember === 1000, 'Dividend per member = ₹20,000 / 20 = ₹1,000');
assert(auctionResult.nextMonthNetPayable === 4000, 'Next month payable = ₹5,000 - ₹1,000 = ₹4,000');
assert(auctionResult.netPayoutAmount === 75000, 'Winner net payout = ₹1,00,000 - ₹25,000 = ₹75,000');

// 3. Daily Finance Schedule Generation
console.log('\n--- Test 3: Daily Finance Installment Schedule ---');
const startDate = new Date('2026-01-01');
const dailySchedule = generateDailySchedule(startDate, 100, 100);
assert(dailySchedule.length === 100, 'Generated exactly 100 daily installments');
assert(dailySchedule[0].expectedAmount === 100, 'Installment 1 is ₹100');
assert(dailySchedule[99].installmentNumber === 100, 'Installment 100 is labeled 100');
const totalDailyExpected = roundMoney(dailySchedule.reduce((s, i) => s + i.expectedAmount, 0));
assert(totalDailyExpected === 10000, 'Total daily expected equals ₹10,000');

// 4. Weekly Finance Schedule Generation
console.log('\n--- Test 4: Weekly Finance Installment Schedule ---');
const weeklySchedule = generateWeeklySchedule(startDate, 12, 1000);
assert(weeklySchedule.length === 12, 'Generated exactly 12 weekly installments');
assert(weeklySchedule[0].expectedAmount === 1000, 'Weekly installment 1 is ₹1,000');
const totalWeeklyExpected = roundMoney(weeklySchedule.reduce((s, i) => s + i.expectedAmount, 0));
assert(totalWeeklyExpected === 12000, 'Total weekly expected equals ₹12,000 (Principal ₹10,000 + Interest ₹2,000)');

console.log(`\n========================================================`);
console.log(`🎉 ALL ${passedTests}/${totalTests} FINANCIAL ACCURACY TESTS PASSED!`);
console.log(`========================================================\n`);

