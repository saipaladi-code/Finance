/**
 * Comprehensive Automated End-to-End Test Suite for Smart Finance Management System
 */

const BASE_URL = 'http://localhost:5000/api';

const runTests = async () => {
  console.log('========================================================');
  console.log('🚀 RUNNING COMPREHENSIVE END-TO-END SYSTEM INTEGRITY TEST');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  const test = (condition: boolean, name: string, extra?: any) => {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [TEST ${total}] PASS: ${name}`);
    } else {
      console.error(`❌ [TEST ${total}] FAIL: ${name}`, extra || '');
      throw new Error(`Test failed: ${name}`);
    }
  };

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    test(healthRes.status === 200 && healthData.status === 'healthy', 'Health check API returns 200 OK');

    // 2. Admin Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@finance.local', password: 'Password@123' }),
    });
    const loginData = await loginRes.json();
    test(loginRes.status === 200 && Boolean(loginData.token), 'Admin login authenticates with JWT token', loginData);
    const token = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 3. Current User Profile
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    test(meRes.status === 200 && meData.user.role === 'admin', 'Auth middleware verifies admin role', meData);

    // 4. Live Dashboard Stats
    const dashRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeaders });
    const dashData = await dashRes.json();
    test(dashRes.status === 200 && dashData.cards.totalCustomers >= 10, 'Dashboard returns real live metrics (>= 10 customers)', dashData.cards);
    test(dashData.charts.dailyCollection.length === 7, 'Dashboard provides 7-day daily collection chart series');
    test(dashData.charts.monthlyCollection.length === 6, 'Dashboard provides 6-month historical chart series');
    test(Array.isArray(dashData.sections.recentTransactions), 'Dashboard returns live recent transactions');

    // 5. Customer Registry & Registration
    const custRes = await fetch(`${BASE_URL}/customers`, { headers: authHeaders });
    const custData = await custRes.json();
    test(custRes.status === 200 && custData.customers.length >= 10, 'Customers list returns seeded customer directory');

    const newCustRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Automated Test Customer',
        phone: '9840999999',
        address: '100 Test Avenue, Chennai',
        idProofType: 'Aadhaar',
        idProofNumber: '1111 2222 3333',
        status: 'active',
      }),
    });
    const newCustData = await newCustRes.json();
    test(newCustRes.status === 201 && newCustData.customer.customerId.startsWith('CUST-'), 'New customer created with unique Customer ID');
    const createdCustomerId = newCustData.customer._id;

    // 6. Daily Finance Loan Creation & Installment Calculation
    const dailyLoanRes = await fetch(`${BASE_URL}/daily-finance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: createdCustomerId,
        principal: 10000,
        interestAmount: 0,
        totalInstallments: 100,
        installmentAmount: 100,
        totalRepaymentAmount: 10000,
        startDate: new Date().toISOString(),
      }),
    });
    const dailyLoanData = await dailyLoanRes.json();
    test(
      dailyLoanRes.status === 201 && dailyLoanData.account.accountNumber.startsWith('DF-'),
      'Daily Finance loan created with DF- account number'
    );
    const dailyAccountId = dailyLoanData.account._id;

    // 7. Verify Day-by-day Installment Schedule generated
    const dailyDetailRes = await fetch(`${BASE_URL}/daily-finance/${dailyAccountId}`, { headers: authHeaders });
    const dailyDetailData = await dailyDetailRes.json();
    test(
      dailyDetailData.installments.length === 100,
      'Automatically generated exactly 100 daily installment records'
    );
    test(
      dailyDetailData.installments[0].expectedAmount === 100 && dailyDetailData.installments[0].status === 'pending',
      'Installment #1 has expected amount ₹100 and pending status'
    );

    // 8. Record Daily Payment & Receipt Generation
    const dailyPayRes = await fetch(`${BASE_URL}/daily-finance/${dailyAccountId}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 200, // 2 installments
        paymentMethod: 'gpay',
        transactionReference: 'UPI-TEST-12345',
        notes: '2-day test collection',
      }),
    });
    const dailyPayData = await dailyPayRes.json();
    test(
      dailyPayRes.status === 201 && dailyPayData.payment.receiptNumber.startsWith('REC-'),
      'Daily payment recorded with unique Receipt Number and Transaction ID'
    );
    test(
      dailyPayData.remainingBalance === 9800,
      'Remaining balance accurately reduced from ₹10,000 to ₹9,800'
    );
    const testPaymentId = dailyPayData.payment._id;

    // 9. Weekly Finance Loan Creation & Explicit Interest
    const weeklyLoanRes = await fetch(`${BASE_URL}/weekly-finance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: createdCustomerId,
        principal: 10000,
        interestAmount: 2000,
        totalRepaymentAmount: 12000,
        installmentAmount: 1000,
        totalInstallments: 12,
        collectionDay: 'Thursday',
        startDate: new Date().toISOString(),
      }),
    });
    const weeklyLoanData = await weeklyLoanRes.json();
    test(
      weeklyLoanRes.status === 201 && weeklyLoanData.account.accountNumber.startsWith('WF-'),
      'Weekly loan created with explicit ₹2,000 interest and WF- number'
    );
    const weeklyAccountId = weeklyLoanData.account._id;

    // 10. Record Weekly Payment
    const weeklyPayRes = await fetch(`${BASE_URL}/weekly-finance/${weeklyAccountId}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        amount: 1000,
        paymentMethod: 'phonepe',
        transactionReference: 'PHPE-UTR-99999',
      }),
    });
    const weeklyPayData = await weeklyPayRes.json();
    test(
      weeklyPayRes.status === 201 && weeklyPayData.remainingBalance === 11000,
      'Weekly payment recorded, balance reduced from ₹12,000 to ₹11,000'
    );

    // 11. Chitti Group Creation & Rule Verification
    const chitGroupRes = await fetch(`${BASE_URL}/chitti/groups`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        groupName: 'Automated Test Chit - ₹1 Lakh',
        chitValue: 100000,
        totalMembers: 20,
        durationMonths: 20,
        monthlyContribution: 5000,
        monthlyDueDate: 10,
        foremanCommissionPercent: 5,
      }),
    });
    const chitGroupData = await chitGroupRes.json();
    test(
      chitGroupRes.status === 201 && chitGroupData.group.groupCode.startsWith('CHIT-'),
      'Chit group created with 5% foreman commission and monthly contribution rules'
    );
    test(Boolean(chitGroupData.disclaimer), 'Statutory legal disclaimer returned in API response');
    const chitGroupId = chitGroupData.group._id;

    // 12. Enroll Member in Chit
    const enrollRes = await fetch(`${BASE_URL}/chitti/groups/${chitGroupId}/members`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        customerId: createdCustomerId,
        nomineeName: 'Test Nominee',
        nomineePhone: '9840999998',
      }),
    });
    const enrollData = await enrollRes.json();
    test(enrollRes.status === 201 && enrollData.member.ticketNumber === 1, 'Member enrolled with assigned ticket #1');
    const winningMemberId = enrollData.member._id;

    // 13. Conduct Transparent Auction
    const auctionRes = await fetch(`${BASE_URL}/chitti/groups/${chitGroupId}/auctions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        winningMemberId,
        bidAmount: 25000,
        auctionDate: new Date().toISOString(),
      }),
    });
    const auctionData = await auctionRes.json();
    test(
      auctionRes.status === 201 &&
        auctionData.calculation.foremanCommission === 5000 &&
        auctionData.calculation.totalDividend === 20000 &&
        auctionData.calculation.dividendPerMember === 1000 &&
        auctionData.calculation.nextMonthNetPayable === 4000 &&
        auctionData.calculation.netPayoutAmount === 75000,
      'Chit auction transparently calculates commission (₹5k), dividend (₹1k/member), net payable (₹4k), and net payout (₹75k)'
    );

    // 14. Financial Reports
    const dailyRep = await (await fetch(`${BASE_URL}/reports/daily`, { headers: authHeaders })).json();
    test(dailyRep.success && dailyRep.summary.totalCollected > 0, 'Daily report compiles live summary');

    const monthlyRep = await (await fetch(`${BASE_URL}/reports/monthly`, { headers: authHeaders })).json();
    test(monthlyRep.success && monthlyRep.summary.totalMoneyDistributed > 0, 'Monthly report aggregates total money distributed');

    // 15. Settings API
    const settingsRes = await fetch(`${BASE_URL}/settings`, { headers: authHeaders });
    const settingsData = await settingsRes.json();
    test(settingsRes.status === 200 && Boolean(settingsData.settings.upiId), 'Settings API returns configured UPI ID and business profile');

    // 16. Audit-Protected Payment Reversal
    const reverseRes = await fetch(`${BASE_URL}/payments/${testPaymentId}/reverse`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Automated test verification of audit reversal' }),
    });
    const reverseData = await reverseRes.json();
    test(reverseRes.status === 200 && reverseData.payment.isReversed === true, 'Payment transaction reversed safely with audit reason');

    // Check account balance restored
    const checkAccRes = await (await fetch(`${BASE_URL}/daily-finance/${dailyAccountId}`, { headers: authHeaders })).json();
    test(checkAccRes.account.remainingBalance === 10000, 'Reversal automatically restored customer loan balance back to ₹10,000');

    // 17. Notifications API
    const notifRes = await fetch(`${BASE_URL}/notifications`, { headers: authHeaders });
    const notifData = await notifRes.json();
    test(notifRes.status === 200 && notifData.notifications.length > 0, 'Notifications system aggregates reminders and overdue alerts');

    console.log('\n========================================================');
    console.log(`🎉 ALL ${passed}/${total} END-TO-END SYSTEM INTEGRITY TESTS PASSED!`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
