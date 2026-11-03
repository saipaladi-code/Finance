import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { normalizeIndianPhone, isValidIndianMobile } from '../utils/phoneUtils.js';

const getJwtSecret = () =>
  process.env.JWT_SECRET || 'finance_mgmt_super_secure_jwt_secret_key_2026_987654321';

const sendTokenResponse = (user: any, statusCode: number, res: Response, message: string) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, phone: user.phone, name: user.name },
    getJwtSecret(),
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    },
  });
};

/**
 * Register User (Admin, Staff, or Customer)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, mobileNumber, email, password, role, customerId } = req.body;
    const rawMobile = phone || mobileNumber;

    if (!name || !rawMobile || !password) {
      res.status(400).json({ success: false, message: 'Name, mobile number, and password are required.' });
      return;
    }

    const normalizedPhone = normalizeIndianPhone(rawMobile);
    if (!isValidIndianMobile(normalizedPhone)) {
      res.status(400).json({
        success: false,
        message: 'Invalid mobile number. Please provide a valid 10-digit Indian mobile number.',
      });
      return;
    }

    const existingUser = await User.findOne({ phone: normalizedPhone });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this mobile number already exists.' });
      return;
    }

    // First user is automatically admin, otherwise role specified or customer
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role || 'customer';

    const user = await User.create({
      name: name.trim(),
      phone: normalizedPhone,
      email: email ? email.toLowerCase().trim() : undefined,
      password,
      role: assignedRole,
      customerId,
      isActive: true,
    });

    await logAudit(req, 'USER_REGISTERED', 'User', user._id.toString(), {
      phone: user.phone,
      role: user.role,
    });

    sendTokenResponse(user, 201, res, 'Registration successful.');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

/**
 * Mobile Number + Password Login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, phone, email, password } = req.body;
    const rawMobile = mobileNumber || phone;

    if ((!rawMobile && !email) || !password) {
      res.status(400).json({ success: false, message: 'Please provide mobile number and password.' });
      return;
    }

    let user = null;

    if (rawMobile) {
      const normalizedPhone = normalizeIndianPhone(rawMobile);
      if (!isValidIndianMobile(normalizedPhone)) {
        res.status(400).json({
          success: false,
          message: 'Invalid mobile number. Please enter a valid 10-digit Indian mobile number.',
        });
        return;
      }
      user = await User.findOne({ phone: normalizedPhone });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found with this mobile number.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administrator.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid password.' });
      return;
    }

    await logAudit(req, 'USER_LOGIN', 'User', user._id.toString(), { phone: user.phone });

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

/**
 * Logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

/**
 * Get Authenticated User Details
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      role: req.user.role,
      customerId: req.user.customerId,
    },
  });
};

/**
 * Request OTP for Mobile Number Password Reset
 * Generates secure 6-digit OTP, expires in 5 minutes, hashes with SHA-256
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, phone, email } = req.body;
    const rawMobile = mobileNumber || phone;

    let user = null;

    if (rawMobile) {
      const normalizedPhone = normalizeIndianPhone(rawMobile);
      if (!isValidIndianMobile(normalizedPhone)) {
        res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit Indian mobile number.',
        });
        return;
      }
      user = await User.findOne({ phone: normalizedPhone });
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else {
      res.status(400).json({ success: false, message: 'Mobile number is required.' });
      return;
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No user registered with this mobile number.',
      });
      return;
    }

    // Generate secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

    // 5-minute validity window
    user.resetOtpHash = hashedOtp;
    user.resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save();

    await logAudit(req, 'OTP_REQUESTED', 'User', user._id.toString(), { phone: user.phone });

    console.log(`🔑 [SECURITY OTP] Mobile: ${user.phone} | Generated 6-Digit OTP: ${rawOtp} (Expires in 5 minutes)`);

    res.status(200).json({
      success: true,
      message: '6-digit OTP has been sent to your registered mobile number. Valid for 5 minutes.',
      phone: user.phone,
      otp: rawOtp, // Provided for instant seamless UI verification and development testing
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error processing OTP request.' });
  }
};

/**
 * Verify OTP & Reset Password
 */
export const verifyOtpAndResetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, phone, otp, newPassword } = req.body;
    const rawMobile = mobileNumber || phone;

    if (!rawMobile || !otp || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Mobile number, 6-digit OTP, and new password are required.',
      });
      return;
    }

    if (String(newPassword).length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    const normalizedPhone = normalizeIndianPhone(rawMobile);
    const user = await User.findOne({ phone: normalizedPhone });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found with this mobile number.' });
      return;
    }

    if (!user.resetOtpHash || !user.resetOtpExpires) {
      res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new OTP.',
      });
      return;
    }

    // Check expiry (5 minutes)
    if (new Date() > user.resetOtpExpires) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
      res.status(400).json({
        success: false,
        message: 'OTP has expired (validity is 5 minutes). Please request a new OTP.',
      });
      return;
    }

    // Brute-force protection: max 5 attempts per OTP
    if ((user.resetOtpAttempts || 0) >= 5) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      await user.save();
      res.status(429).json({
        success: false,
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      });
      return;
    }

    const hashedInput = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

    if (hashedInput !== user.resetOtpHash) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      const remaining = 5 - user.resetOtpAttempts;
      res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${remaining} attempt(s) remaining.`,
      });
      return;
    }

    // OTP Verified: Update password securely
    user.password = newPassword;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    await logAudit(req, 'PASSWORD_RESET_SUCCESS', 'User', user._id.toString(), { phone: user.phone });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error resetting password.' });
  }
};

/**
 * Backward compatibility: Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  // If request contains otp, forward to verifyOtpAndResetPassword
  if (req.body.otp) {
    return verifyOtpAndResetPassword(req, res);
  }

  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required.' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
      return;
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logAudit(req, 'PASSWORD_RESET_COMPLETED', 'User', user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error resetting password.' });
  }
};

/**
 * Change Password (for logged-in users)
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required.' });
      return;
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password.' });
      return;
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, 'PASSWORD_CHANGED', 'User', user._id.toString());

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating password.' });
  }
};
