import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const getJwtSecret = () => process.env.JWT_SECRET || 'finance_mgmt_super_secure_jwt_secret_key_2026_987654321';

const sendTokenResponse = (user: any, statusCode: number, res: Response, message: string) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
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
      email: user.email,
      phone: user.phone,
      role: user.role,
      customerId: user.customerId,
    },
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role, customerId } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    // First user is automatically admin, otherwise role specified or customer
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role || 'customer';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: assignedRole,
      customerId,
      isActive: true,
    });

    await logAudit(req, 'USER_REGISTERED', 'User', user._id.toString(), {
      email: user.email,
      role: user.role,
    });

    sendTokenResponse(user, 201, res, 'Registration successful.');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account has been deactivated. Please contact administrator.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    await logAudit(req, 'USER_LOGIN', 'User', user._id.toString(), { email: user.email });

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

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
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      customerId: req.user.customerId,
    },
  });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return 200 for security so attackers cannot enumerate registered emails
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset instructions token has been generated.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await logAudit(req, 'PASSWORD_RESET_REQUESTED', 'User', user._id.toString(), { email });

    // In production, send via email. Here we provide the token for UI verification or admin testing.
    res.status(200).json({
      success: true,
      message: 'Password reset token generated. In a production environment, this link is emailed directly.',
      resetToken, // Provided for direct seamless testing
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error processing forgot password.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error resetting password.' });
  }
};

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
