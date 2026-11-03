import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Loader2,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, businessSettings } = useAuth();
  const { t, i18n } = useTranslation();

  // Login form state
  const [mobileNumber, setMobileNumber] = useState<string>('9876543210');
  const [password, setPassword] = useState<string>('Password@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotMobile, setForgotMobile] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [forgotMessage, setForgotMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState<boolean>(false);

  // Timer for OTP expiration countdown
  useEffect(() => {
    let timer: any;
    if (showForgotModal && resetStep === 'verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          if (prev <= 270) {
            setCanResend(true); // Allow resend after 30 seconds
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showForgotModal, resetStep, countdown]);

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'te' ? 'en' : 'te';
    i18n.changeLanguage(nextLang);
  };

  // Helper to sanitize and normalize 10-digit Indian phone input
  const sanitizeMobile = (val: string): string => {
    let digits = val.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 10);
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeMobile(e.target.value);
    setMobileNumber(cleaned);
    if (error) setError('');
  };

  const handleForgotMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeMobile(e.target.value);
    setForgotMobile(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mobileNumber.length !== 10 || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setError(t('auth.invalidMobile') || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password) {
      setError(t('auth.passwordRequired') || 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.login({ mobileNumber, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');

    if (forgotMobile.length !== 10 || !/^[6-9]\d{9}$/.test(forgotMobile)) {
      setError(t('auth.invalidMobile') || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestOtp(forgotMobile);
      if (res.success) {
        setForgotMessage(res.message || t('auth.otpSuccessSent'));
        if (res.otp) {
          // Pre-fill demo OTP for developer convenience
          setOtp(res.otp);
        }
        setResetStep('verify');
        setCountdown(300); // 5 minutes
        setCanResend(false);
      } else {
        setError(res.message || 'Failed to generate OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtpAndReset({
        mobileNumber: forgotMobile,
        otp,
        newPassword,
      });

      if (res.success) {
        alert(t('auth.passwordResetSuccess') || 'Password reset successfully! Please sign in with your new password.');
        setShowForgotModal(false);
        setResetStep('request');
        setPassword(newPassword);
        setMobileNumber(forgotMobile);
      } else {
        setError(res.message || 'Password reset failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying OTP or resetting password.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Top Floating Language Switcher */}
      <div className="mb-4">
        <button
          onClick={handleLanguageToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md text-xs font-bold text-slate-700 transition-all active:scale-95"
        >
          <Globe className="w-4 h-4 text-blue-600" />
          <span>{i18n.language === 'te' ? '🌐 Switch to English' : '🌐 తెలుగులోకి మార్చండి'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Banner */}
        <div className="bg-[#142B4A] text-white p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-3xl shadow-xl shadow-blue-500/30 mb-4 ring-4 ring-white/10">
            ₹
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {businessSettings?.businessName || 'Smart Finance Management'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            {t('nav.dailyFinance')} • {t('nav.weeklyFinance')} • {t('nav.chitti')}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B375E] text-[11px] text-emerald-400 font-semibold tracking-wide border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> {t('auth.loginTitle')}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-7 sm:p-8 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Mobile Number Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('auth.mobileNumber')}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 text-xs font-bold text-slate-600 pointer-events-none border-r border-slate-300 pr-2">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder={t('auth.mobilePlaceholder') || 'Enter your mobile number'}
                value={mobileNumber}
                onChange={handleMobileChange}
                className="w-full pl-20 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-[#F5F7FB] focus:bg-white tracking-wider transition-all"
              />
              <Phone className="w-4 h-4 absolute right-3 text-slate-400 pointer-events-none" />
            </div>
            {mobileNumber && mobileNumber.length < 10 && (
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                Enter 10 digits ({mobileNumber.length}/10)
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                {t('auth.password')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setForgotMessage('');
                  setForgotMobile(mobileNumber);
                  setShowForgotModal(true);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('auth.passwordPlaceholder') || 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-[#F5F7FB] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Access System Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
              </>
            ) : (
              <>
                <span>{t('auth.accessSystem')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Fill Credentials */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMobileNumber('9876543210');
                setPassword('Password@123');
                setError('');
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('auth.demoAdmin')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Forgot / Reset Password Modal (Mobile OTP Flow) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> {t('auth.passwordRecovery')}
              </h2>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {forgotMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotMessage}</span>
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {t('auth.enterRegisteredMobile')}
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('auth.mobileNumber')}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 text-xs font-bold text-slate-600 pointer-events-none border-r border-slate-300 pr-2">
                      <span>🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={forgotMobile}
                      onChange={handleForgotMobileChange}
                      className="w-full pl-20 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 font-semibold tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
                    </>
                  ) : (
                    <span>{t('auth.sendOtp')}</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                {/* Timer Banner */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{t('auth.otpExpiresIn')}:</span>
                  </div>
                  <span className={`font-mono text-sm ${countdown < 60 ? 'text-rose-600' : 'text-blue-700'}`}>
                    {formatTimer(countdown)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('auth.enterOtp')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3.5 py-2.5 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('auth.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder={t('auth.newPasswordPlaceholder')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || countdown === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
                    </>
                  ) : (
                    <span>{t('auth.saveNewPassword')}</span>
                  )}
                </button>

                {canResend && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    {t('auth.resendOtp')}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
