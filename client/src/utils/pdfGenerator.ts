import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, BusinessSetting } from '../types/index.js';
import { formatCurrencyExact, formatDate, formatDateTime, numberToWordsINR } from './formatters.js';

export const generatePaymentReceiptPDF = (
  payment: Payment,
  business: BusinessSetting | null,
  autoDownload: boolean = true
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // Compact professional receipt size
  });

  const bName = business?.businessName || 'Sri Lakshmi Finance & Chits';
  const bPhone = business?.phone || '+91 98765 43210';
  const bEmail = business?.email || 'admin@finance.local';
  const bAddress = business?.address || 'Main Bazaar Road, Commercial Street, City';

  const custName = payment.customerId?.name || 'Customer';
  const custPhone = payment.customerId?.phone || '-';
  const custCode = payment.customerId?.customerId || '-';
  const custAddress = payment.customerId?.address || '';

  const accountRef = payment.accountId?.accountNumber || payment.chitGroupId?.groupName || 'Direct Payment';
  const financeTypeName =
    payment.financeType === 'daily'
      ? 'Daily Finance'
      : payment.financeType === 'weekly'
      ? 'Weekly Finance'
      : 'Chitti (Chit Fund)';

  // Header Box
  doc.setFillColor(15, 23, 42); // Navy background
  doc.rect(0, 0, 148, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(bName, 10, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`${bAddress} | Phone: ${bPhone}`, 10, 16);
  doc.text(`Email: ${bEmail}`, 10, 21);

  doc.setFillColor(37, 99, 235);
  doc.roundedRect(100, 7, 40, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('PAYMENT RECEIPT', 104, 15);

  // Meta info section
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let y = 35;
  doc.text(`Receipt No:`, 10, y);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.receiptNumber || '-', 32, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Txn ID:`, 80, y);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.transactionId || '-', 95, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date & Time:`, 10, y);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDateTime(payment.paymentDate), 32, y);

  doc.setFont('helvetica', 'normal');
  doc.text(`Method:`, 80, y);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.paymentMethod.toUpperCase(), 95, y);

  // Customer Details Box
  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, y, 128, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('RECEIVED FROM:', 14, y + 6);

  doc.setFontSize(9);
  doc.text(`${custName} (${custCode})`, 14, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: ${custPhone}`, 14, y + 17);
  if (custAddress) {
    doc.text(`Address: ${custAddress.substring(0, 55)}`, 14, y + 22);
  }

  // Payment Breakdown Table
  y += 32;
  const tableData = [
    ['Finance Category', financeTypeName],
    ['Account / Chit Reference', accountRef],
    ['Transaction Reference / UTR', payment.transactionReference || 'N/A (Cash / Counter)'],
    ['Payment Mode', payment.paymentMethod.toUpperCase()],
    ['Received Amount', formatCurrencyExact(payment.amount)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    theme: 'grid',
    head: [['Description', 'Details']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { fontStyle: 'normal', textColor: [15, 23, 42] },
    },
  });

  // Amount in Words
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Amount in Words:', 10, finalY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWordsINR(payment.amount), 10, finalY + 5);

  // Signatures & Stamp
  const sigY = finalY + 22;
  doc.setDrawColor(203, 213, 225);
  doc.line(10, sigY + 12, 50, sigY + 12);
  doc.line(98, sigY + 12, 138, sigY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Customer's Signature", 14, sigY + 16);
  doc.text('Authorized Signatory', 104, sigY + 16);

  // Footer Disclaimer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated transaction receipt. Keep this receipt safely for account reconciliation.',
    10,
    sigY + 24
  );

  if (autoDownload) {
    doc.save(`Receipt_${payment.receiptNumber || payment.transactionId}.pdf`);
  }

  return doc;
};

export const exportReportPDF = (
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string = 'Financial_Report.pdf'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${formatDateTime(new Date().toISOString())} | Smart Finance Management System`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
  });

  doc.save(filename);
};

