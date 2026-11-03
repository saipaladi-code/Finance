import React, { useState, useEffect } from 'react';
import {
  Building2,
  QrCode,
  Sliders,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

export const SettingsPage: React.FC = () => {
  const { businessSettings, refreshSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'business' | 'payment' | 'finance' | 'security'>('business');

  // Business Profile Form
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    logoUrl: '',
    upiId: '',
    payeeName: '',
    googlePayQrUrl: '',
    phonePeQrUrl: '',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata',
    receiptPrefix: 'SLF-REC',
    termsAndConditions: '',
  });

  // Security Form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    if (businessSettings) {
      setBusinessForm({
        businessName: businessSettings.businessName || '',
        ownerName: businessSettings.ownerName || '',
        phone: businessSettings.phone || '',
        email: businessSettings.email || '',
        address: businessSettings.address || '',
        logoUrl: businessSettings.logoUrl || '',
        upiId: businessSettings.upiId || '',
        payeeName: businessSettings.payeeName || '',
        googlePayQrUrl: businessSettings.googlePayQrUrl || '',
        phonePeQrUrl: businessSettings.phonePeQrUrl || '',
        defaultCurrency: businessSettings.defaultCurrency || 'INR',
        timezone: businessSettings.timezone || 'Asia/Kolkata',
        receiptPrefix: businessSettings.receiptPrefix || 'SLF-REC',
        termsAndConditions: businessSettings.termsAndConditions || '',
      });
    }
  }, [businessSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await api.updateSettings(businessForm);
      if (res.success) {
        setSaveSuccess('Settings successfully updated and saved.');
        await refreshSettings();
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError(res.message || 'Error updating settings.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Server error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setSaveError('New password and confirm password do not match.');
      return;
    }
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const res = await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (res.success) {
        setSaveSuccess('Password changed successfully.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError(res.message || 'Error changing password.');
      }
    } catch (err: any) {
      setSaveError(err.message || 'Server error changing password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business identity, UPI & QR codes, receipt prefixes, and account security
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50/70 p-2 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'business'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Business Profile
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'payment'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" /> UPI & QR Settings
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'finance'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" /> Finance & Receipt Rules
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'security'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Account Security
          </button>
        </div>

        {/* Tab 1: Business Profile */}
        {activeTab === 'business' && (
          <form onSubmit={handleSaveSettings} className="p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessForm.businessName}
                  onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Director Name *</label>
                <input
                  type="text"
                  required
                  value={businessForm.ownerName}
                  onChange={(e) => setBusinessForm({ ...businessForm, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Business Address *</label>
              <textarea
                rows={2}
                required
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
            </button>
          </form>
        )}

        {/* Tab 2: UPI & QR Settings */}
        {activeTab === 'payment' && (
          <form onSubmit={handleSaveSettings} className="p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Business UPI ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. srilakshmifinance@okaxis"
                  value={businessForm.upiId}
                  onChange={(e) => setBusinessForm({ ...businessForm, upiId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payee Name for UPI *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Lakshmi Finance"
                  value={businessForm.payeeName}
                  onChange={(e) => setBusinessForm({ ...businessForm, payeeName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-800 mb-1">Dynamic UPI Generation:</p>
              The system automatically renders standard, scannable QR codes for Google Pay, PhonePe, and Paytm encoded with your UPI ID and the exact installment amount requested from each customer.
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Payment Settings
            </button>
          </form>
        )}

        {/* Tab 3: Finance Settings */}
        {activeTab === 'finance' && (
          <form onSubmit={handleSaveSettings} className="p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency</label>
                <input
                  type="text"
                  disabled
                  value={businessForm.defaultCurrency}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Timezone</label>
                <input
                  type="text"
                  disabled
                  value={businessForm.timezone}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Prefix</label>
                <input
                  type="text"
                  required
                  value={businessForm.receiptPrefix}
                  onChange={(e) => setBusinessForm({ ...businessForm, receiptPrefix: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Terms & Conditions for Receipts</label>
              <textarea
                rows={3}
                value={businessForm.termsAndConditions}
                onChange={(e) => setBusinessForm({ ...businessForm, termsAndConditions: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Finance Rules
            </button>
          </form>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
