import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, Smartphone, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { formatCurrencyExact } from '../../utils/formatters.js';

interface QrPaymentModalProps {
  amount: number;
  customerName?: string;
  accountReference?: string;
  onClose: () => void;
  onConfirmReference?: (ref: string, method: string) => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  amount,
  customerName,
  accountReference,
  onClose,
  onConfirmReference,
}) => {
  const { businessSettings } = useAuth();
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<'gpay' | 'phonepe' | 'upi'>('gpay');
  const [transactionRef, setTransactionRef] = useState<string>('');

  const upiId = businessSettings?.upiId || 'srilakshmifinance@okaxis';
  const payeeName = businessSettings?.payeeName || businessSettings?.businessName || 'Sri Lakshmi Finance';

  // Construct standard UPI Payment String
  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount > 0 ? amount.toFixed(2) : '0.00'}&cu=INR&tn=${encodeURIComponent(
    `Finance Payment - ${customerName || 'Customer'}`
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (onConfirmReference) {
      onConfirmReference(transactionRef, selectedMethod);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Google Pay & PhonePe QR</h2>
              <p className="text-[11px] text-slate-300">Scan & Pay via any UPI App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Amount Badge */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Payment Amount
            </span>
            <p className="text-2xl font-black text-blue-700 mt-0.5">{formatCurrencyExact(amount)}</p>
            {customerName && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {customerName} {accountReference ? `• ${accountReference}` : ''}
              </p>
            )}
          </div>

          {/* Payment Method Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setSelectedMethod('gpay')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                selectedMethod === 'gpay'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Google Pay
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('phonepe')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                selectedMethod === 'phonepe'
                  ? 'bg-white text-purple-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              PhonePe
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                selectedMethod === 'upi'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Any UPI
            </button>
          </div>

          {/* Dynamic QR Code Card */}
          <div className="flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-xs">
              <QRCodeSVG
                value={upiString}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-3 text-center">
              Scan with Google Pay, PhonePe, Paytm, or BHIM UPI
            </p>

            {/* UPI ID Copy Field */}
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 w-full justify-between text-xs">
              <div className="truncate">
                <span className="text-slate-400 font-medium mr-1.5">UPI ID:</span>
                <span className="font-mono font-semibold text-slate-800">{upiId}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 shrink-0"
                title="Copy UPI ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Manual Verification Advisory */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Admin Notice:</strong> QR display does not mean automatic verification. Please confirm payment in your bank app and enter the 12-digit UTR/Reference number below to record the payment.
            </p>
          </div>

          {/* Optional Direct Confirmation Form */}
          {onConfirmReference && (
            <form onSubmit={handleSubmitReference} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank UTR / Transaction Reference Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 408210398212"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-colors"
              >
                Confirm & Record Payment
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
