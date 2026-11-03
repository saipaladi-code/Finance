import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, QrCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FinanceAccount, Payment } from '../../types/index.js';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters.js';
import { api } from '../../services/api.js';
import { QrPaymentModal } from './QrPaymentModal.js';
import { ReceiptModal } from './ReceiptModal.js';

interface CollectPaymentModalProps {
  account: FinanceAccount;
  onClose: () => void;
  onSuccess: () => void;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  account,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const custName = account.customer?.name || (account.customerId as any)?.name || 'Customer';
  const expectedAmount = account.installmentAmount || 100;
  const remainingBalance = account.remainingBalance || 0;

  const [amount, setAmount] = useState<number>(Math.min(expectedAmount, remainingBalance));
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gpay' | 'phonepe' | 'bank_transfer' | 'other'>('cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [generatedPayment, setGeneratedPayment] = useState<Payment | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        amount,
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef,
        notes,
      };

      let result;
      if (account.financeType === 'daily') {
        result = await api.recordDailyPayment(account._id, payload);
      } else {
        result = await api.recordWeeklyPayment(account._id, payload);
      }

      if (result.success && result.payment) {
        setGeneratedPayment({
          ...result.payment,
          customerId: account.customer || account.customerId,
          accountId: account,
        });
        onSuccess();
      } else {
        setError(result.message || 'Payment processing failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error recording payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (generatedPayment) {
    return (
      <ReceiptModal
        payment={generatedPayment}
        onClose={() => {
          setGeneratedPayment(null);
          onClose();
        }}
      />
    );
  }

  const isAdvance = amount > remainingBalance;
  const isPartial = amount < expectedAmount;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{t('paymentModal.title')}</h2>
              <p className="text-xs text-slate-300">
                {account.financeType === 'daily' ? t('nav.dailyFinance') : t('nav.weeklyFinance')} • {account.accountNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B375E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer & Balance Overview */}
            <div className="p-3.5 rounded-2xl bg-[#F5F7FB] border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{t('paymentModal.customer')}</p>
                <p className="text-sm font-bold text-slate-900">{custName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">{t('customers.outstandingBalance')}</p>
                <p className="text-sm font-extrabold text-rose-600">{formatCurrencyExact(remainingBalance)}</p>
              </div>
            </div>

            {/* Quick Amount Suggestion Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">{t('paymentModal.amountPaying')}</label>
                <span className="text-xs text-slate-500">
                  {t('paymentModal.expectedAmount')}: <strong className="text-slate-800">{formatCurrency(expectedAmount)}</strong>
                </span>
              </div>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-base font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(expectedAmount)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Exact ({formatCurrency(expectedAmount)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(expectedAmount * 2)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  2x ({formatCurrency(expectedAmount * 2)})
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(remainingBalance)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium"
                >
                  Full ({formatCurrency(remainingBalance)})
                </button>
              </div>
              {isAdvance && (
                <p className="text-[11px] text-blue-600 font-medium mt-1.5">
                  ✨ Payment exceeds remaining balance. Will be recorded as advance payment.
                </p>
              )}
              {isPartial && !isAdvance && (
                <p className="text-[11px] text-amber-600 font-medium mt-1.5">
                  ⚠️ Amount is less than scheduled installment. Will be marked as partial payment.
                </p>
              )}
            </div>

            {/* Payment Method & QR Code Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">{t('paymentModal.paymentMethod')}</label>
                {(paymentMethod === 'gpay' || paymentMethod === 'phonepe') && (
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> {t('common.generateQr')}
                  </button>
                )}
              </div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="cash">{t('payments.cash')}</option>
                <option value="gpay">{t('payments.gpay')} (UPI)</option>
                <option value="phonepe">{t('payments.phonepe')} (UPI)</option>
                <option value="bank_transfer">{t('payments.bankTransfer')}</option>
                <option value="other">{t('payments.other')}</option>
              </select>
            </div>

            {/* Transaction Reference / UTR (if non-cash) */}
            {paymentMethod !== 'cash' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('paymentModal.transactionRef')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 408219082341"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Payment Date & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('paymentModal.paymentDate')}</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('paymentModal.notes')}</label>
                <input
                  type="text"
                  placeholder="e.g. Cash collected"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {t('paymentModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#16A34A] hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('paymentModal.saving')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('paymentModal.savePayment')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* UPI QR Modal if triggered */}
      {showQrModal && (
        <QrPaymentModal
          amount={amount}
          customerName={custName}
          accountNumber={account.accountNumber}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </>
  );
};
