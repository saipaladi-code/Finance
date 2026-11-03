import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { autoSeedIfEmpty } from '../utils/autoSeed.js';
import { User } from '../models/User.js';
import { normalizeIndianPhone, isValidIndianMobile } from '../utils/phoneUtils.js';

async function runAuthTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING MOBILE AUTHENTICATION & OTP TESTS');
  console.log('========================================================\n');

  await connectDB();
  await autoSeedIfEmpty();

  // Test 1: Indian Phone normalization
  console.log('--- Test 1: Phone Normalization ---');
  const raw1 = '+91 98765 43210';
  const norm1 = normalizeIndianPhone(raw1);
  if (norm1 === '9876543210' && isValidIndianMobile(norm1)) {
    console.log(`✅ PASS: ${raw1} normalized correctly to ${norm1}`);
  } else {
    throw new Error(`Failed phone normalization for ${raw1}: got ${norm1}`);
  }

  const raw2 = '09876543210';
  const norm2 = normalizeIndianPhone(raw2);
  if (norm2 === '9876543210') {
    console.log(`✅ PASS: Leading zero stripped: ${raw2} -> ${norm2}`);
  } else {
    throw new Error(`Failed zero strip for ${raw2}: got ${norm2}`);
  }

  // Test 2: Admin exists and password verification
  console.log('\n--- Test 2: Admin User Mobile & Bcrypt ---');
  const admin = await User.findOne({ phone: '9876543210' });
  if (!admin) {
    throw new Error('Admin user with phone 9876543210 not found in database!');
  }
  console.log(`✅ PASS: Found admin user: ${admin.name} (${admin.phone})`);

  const passwordMatch = await admin.comparePassword('Password@123');
  if (passwordMatch) {
    console.log('✅ PASS: Admin password "Password@123" verified with bcrypt');
  } else {
    throw new Error('Admin password comparison failed!');
  }

  const badPasswordMatch = await admin.comparePassword('WrongPassword');
  if (!badPasswordMatch) {
    console.log('✅ PASS: Wrong password rejected correctly');
  } else {
    throw new Error('Wrong password was accepted!');
  }

  // Test 3: HTTP API Login Simulation
  console.log('\n--- Test 3: HTTP API Login with Mobile Number ---');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNumber: '+91 98765-43210',
      password: 'Password@123',
    }),
  });
  const loginData: any = await loginRes.json();
  if (loginData.success && loginData.token && loginData.user.phone === '9876543210') {
    console.log('✅ PASS: Successfully authenticated with mobile number +91 98765-43210');
    console.log(`✅ PASS: Issued JWT token: ${loginData.token.slice(0, 20)}...`);
  } else {
    throw new Error(`Login API failed: ${JSON.stringify(loginData)}`);
  }

  // Test 4: Forgot Password & OTP Generation
  console.log('\n--- Test 4: Forgot Password OTP Generation (5-Minute Window) ---');
  const otpRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNumber: '9876543210',
    }),
  });
  const otpData: any = await otpRes.json();
  if (otpData.success && otpData.otp && otpData.otp.length === 6) {
    console.log(`✅ PASS: Generated 6-digit OTP: ${otpData.otp} (Valid: ${otpData.expiresInSeconds}s)`);
  } else {
    throw new Error(`OTP generation failed: ${JSON.stringify(otpData)}`);
  }

  // Test 5: Verify OTP and Reset Password
  console.log('\n--- Test 5: Verify OTP & Reset Password ---');
  const resetRes = await fetch('http://localhost:5000/api/auth/verify-otp-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNumber: '9876543210',
      otp: otpData.otp,
      newPassword: 'Password@123', // Keep same or updated
    }),
  });
  const resetData: any = await resetRes.json();
  if (resetData.success) {
    console.log(`✅ PASS: ${resetData.message}`);
  } else {
    throw new Error(`OTP reset failed: ${JSON.stringify(resetData)}`);
  }

  // Test 6: Invalidation of used OTP
  console.log('\n--- Test 6: Used OTP Invalidation Protection ---');
  const reuseRes = await fetch('http://localhost:5000/api/auth/verify-otp-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNumber: '9876543210',
      otp: otpData.otp,
      newPassword: 'AnotherPassword',
    }),
  });
  const reuseData: any = await reuseRes.json();
  if (!reuseData.success) {
    console.log(`✅ PASS: Reused OTP rejected: "${reuseData.message}"`);
  } else {
    throw new Error('Used OTP was incorrectly accepted twice!');
  }

  console.log('\n========================================================');
  console.log('🎉 ALL MOBILE AUTHENTICATION & OTP TESTS PASSED PERFECTLY!');
  console.log('========================================================\n');

  await disconnectDB();
  process.exit(0);
}

runAuthTests().catch((err) => {
  console.error('❌ Auth test failure:', err);
  process.exit(1);
});
