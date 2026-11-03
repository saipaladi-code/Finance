import React from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Receipt Header Banner */}
        <div className="px-6 py-5 bg-[#0f172a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              ₹
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {businessSettings?.businessName || 'Sri Lakshmi Finance & Chits'}
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Official Transaction Receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content Body */}
        <div className="p-6 space-y-5">
          {/* Amount Badge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-100/80 text-center">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amount Received</p>
            <p className="text-3xl font-extrabold text-blue-700 mt-1">{formatCurrencyExact(payment.amount)}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">{numberToWordsINR(payment.amount)}</p>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-medium">Receipt No:</span>
              <p className="font-bold text-slate-900 mt-0.5">{payment.receiptNumber}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-medium">Transaction ID:</span>
              <p className="font-bold text-slate-900 mt-0.5">{payment.transactionId}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-medium">Payment Date:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{formatDateTime(payment.paymentDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-medium">Payment Method:</span>
              <p className="font-semibold text-slate-800 mt-0.5 uppercase">{payment.paymentMethod}</p>
            </div>
          </div>

          {/* Customer & Account Details */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{custName} ({custCode})</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-medium text-slate-800">{custPhone}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Finance Reference:</span>
              <span className="font-semibold text-blue-700">{accountRef}</span>
            </div>
            {payment.transactionReference && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bank / UPI Ref:</span>
                <span className="font-mono text-slate-800">{payment.transactionReference}</span>
              </div>
            )}
          </div>

          {/* Security Guarantee Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-200">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Digital ledger entry verified and recorded with strict audit trail.</span>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-colors"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};
