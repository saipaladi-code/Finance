import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Loader2,
  Globe,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, businessSettings } = useAuth();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState<string>('admin@finance.local');
  const [password, setPassword] = useState<string>('Password@123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
  const [forgotMessage, setForgotMessage] = useState<string>('');

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'te' ? 'en' : 'te';
    i18n.changeLanguage(nextLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.login({ email, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.forgotPassword(forgotEmail);
      if (res.success) {
        setForgotMessage(res.message || 'Reset token generated.');
        if (res.resetToken) {
          setResetToken(res.resetToken);
          setResetStep('reset');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.resetPassword({ token: resetToken, newPassword });
      if (res.success) {
        alert('Password reset successfully! You can now log in.');
        setShowForgotModal(false);
        setResetStep('request');
      }
    } catch (err: any) {
      setError(err.message || 'Error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center p-4">
      {/* Language Switcher Pill */}
      <div className="mb-4">
        <button
          onClick={handleLanguageToggle}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs hover:shadow text-xs font-bold text-slate-700 transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>{i18n.language === 'te' ? '🌐 Switch to English' : '🌐 తెలుగులోకి మార్చండి'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-300">
        {/* Brand Banner */}
        <div className="bg-[#142B4A] text-white p-8 text-center relative overflow-hidden">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-bold text-3xl shadow-xl shadow-blue-500/30 mb-4">
            ₹
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            {businessSettings?.businessName || 'Smart Finance Management'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {t('nav.dailyFinance')} • {t('nav.weeklyFinance')} • {t('nav.chitti')}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B375E] text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Authentication Portal
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="admin@finance.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-[#F5F7FB] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setForgotMessage('');
                  setShowForgotModal(true);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 bg-[#F5F7FB] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('common.loading')}
              </>
            ) : (
              <>
                <span>Access System</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@finance.local');
                setPassword('Password@123');
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Auto-Fill Admin Demo Credentials</span>
            </button>
          </div>
        </form>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> Password Recovery
              </h2>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {forgotMessage && (
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-200">
                {forgotMessage}
              </div>
            )}

            {resetStep === 'request' ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-xs text-slate-600">
                  Enter your registered admin or staff email to receive password reset authorization.
                </p>
                <input
                  type="email"
                  required
                  placeholder="admin@finance.local"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-medium"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  {loading ? 'Generating...' : 'Send Reset Instructions'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Authorization Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  {loading ? 'Resetting...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
