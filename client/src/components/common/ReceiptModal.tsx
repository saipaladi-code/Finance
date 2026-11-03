import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { Payment } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { formatCurrencyExact, formatDateTime, numberToWordsINR } from '../../utils/formatters.js';
import { generatePaymentReceiptPDF } from '../../utils/pdfGenerator.js';

interface ReceiptModalProps {
  payment: Payment | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose }) => {
  const { t } = useTranslation();
  const { businessSettings } = useAuth();

  if (!payment) return null;

  const handleDownloadPDF = () => {
    generatePaymentReceiptPDF(payment, businessSettings, true);
  };

  const handlePrint = () => {
    window.print();
  };

  const custName = payment.customerId?.name || 'Customer';
  const custCode = payment.customerId?.customerId || '-';
  const custPhone = payment.customerId?.phone || '-';
  const accountRef = payment.accountId?.accountNumber || payment.chitGroupId?.groupName || 'Direct Payment';
  const remainingBalance = (payment as any).remainingBalance ?? payment.accountId?.remainingBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Receipt Header Banner */}
        <div className="px-6 py-5 bg-[#142B4A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              ₹
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {businessSettings?.businessName || 'Smart Finance'}
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {t('receiptModal.title')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B375E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Body */}
        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-100/80 text-center">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              {t('receiptModal.amountReceived')}
            </p>
            <p className="text-3xl font-extrabold text-blue-700 mt-1">{formatCurrencyExact(payment.amount)}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{numberToWordsINR(payment.amount)}</p>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F5F7FB] border border-slate-100">
              <span className="text-slate-400 font-medium">{t('receiptModal.receiptNo')}:</span>
              <p className="font-bold text-slate-900 mt-0.5">{payment.receiptNumber}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7FB] border border-slate-100">
              <span className="text-slate-400 font-medium">{t('dashboard.transactionId')}:</span>
              <p className="font-bold text-slate-900 mt-0.5">{payment.transactionId}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7FB] border border-slate-100">
              <span className="text-slate-400 font-medium">{t('receiptModal.date')}:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(payment.paymentDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F7FB] border border-slate-100">
              <span className="text-slate-400 font-medium">{t('receiptModal.paymentMode')}:</span>
              <p className="font-semibold text-slate-800 uppercase mt-0.5">{payment.paymentMethod}</p>
            </div>
          </div>

          {/* Customer & Account Details */}
          <div className="p-4 rounded-2xl bg-[#F5F7FB] border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('receiptModal.receivedFrom')}:</span>
              <span className="font-bold text-slate-900">{custName} ({custCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('receiptModal.phone')}:</span>
              <span className="font-medium text-slate-800">{custPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('receiptModal.accountNo')}:</span>
              <span className="font-semibold text-blue-700">{accountRef}</span>
            </div>
            {remainingBalance !== undefined && (
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-semibold">{t('receiptModal.remainingBalance')}:</span>
                <span className="font-extrabold text-rose-600">{formatCurrencyExact(remainingBalance)}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center text-[11px] text-slate-400">
            {t('receiptModal.computerGenerated')}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{t('receiptModal.print')}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('receiptModal.downloadPdf')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
