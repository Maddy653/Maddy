import React, { useRef } from 'react';
import { BillRecord } from '../types';
import { formatCurrency, formatMonthYear, formatDate } from '../utils/helpers';
import { X, Printer, Share2, Clipboard, Check, Calendar, Phone, Home, Zap } from 'lucide-react';

interface ReceiptModalProps {
  bill: BillRecord;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ bill, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a temporary print window/frame or apply print-specific styling dynamically
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 20px !important;
            font-family: 'Inter', sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `;
      document.head.appendChild(style);
      window.print();
      document.head.removeChild(style);
    }
  };

  const getShareText = () => {
    return `*Rent & Electricity Bill Receipt*
----------------------------------
*Tenant:* ${bill.tenantName}
*Room No:* ${bill.roomNumber}
*Month:* ${formatMonthYear(bill.monthYear)}
----------------------------------
*Monthly Room Rent:* ${formatCurrency(bill.monthlyRent)}
*Electricity Meter:* ${bill.previousMeterReading} to ${bill.currentMeterReading}
*Units Consumed:* ${bill.totalUnits} Units (@ ₹${bill.electricityRate}/unit)
*Electricity Bill:* ${formatCurrency(bill.electricityBill)}
----------------------------------
*Grand Total:* ${formatCurrency(bill.grandTotal)}
*Payment Status:* ${bill.paymentStatus} ${bill.paymentStatus === 'Paid' ? `via ${bill.paymentMethod} on ${formatDate(bill.paymentDate)}` : `(Due: ${formatCurrency(bill.dueAmount)})`}
----------------------------------
Thank you!`;
  };

  const handleShare = async () => {
    const shareText = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt Room ${bill.roomNumber} - ${formatMonthYear(bill.monthYear)}`,
          text: shareText,
        });
      } catch (err) {
        // Fallback to clipboard
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="receipt-modal-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
          <h3 className="text-lg font-semibold text-slate-800">Rent Receipt</h3>
          <button 
            id="close-receipt-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex gap-2 justify-end no-print">
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-indigo-200 transition-all cursor-pointer"
          >
            <Printer size={15} />
            Print/PDF
          </button>
          <button
            id="share-receipt-btn"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-emerald-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-emerald-200 transition-all cursor-pointer"
          >
            <Share2 size={15} />
            Share
          </button>
          <button
            id="copy-receipt-btn"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-indigo-200 transition-all cursor-pointer"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Clipboard size={15} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
        </div>

        {/* Receipt Printable Area */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1" ref={printAreaRef}>
          <div className="print-container bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs max-w-md mx-auto">
            {/* Stamp/Status indicator */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold tracking-tight text-slate-900">E-RECEIPT</h4>
                <p className="text-xs text-slate-400 mt-1">Receipt ID: RES-{bill.id.substring(2, 8).toUpperCase()}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
                bill.paymentStatus === 'Paid' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {bill.paymentStatus}
              </div>
            </div>

            {/* From/To Details */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-dashed border-slate-200 py-4 mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Room Details</span>
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <Home size={14} className="text-slate-400" />
                  Room No: {bill.roomNumber}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar size={13} className="text-slate-400" />
                  {formatMonthYear(bill.monthYear)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Tenant Details</span>
                <span className="text-sm font-bold text-slate-700 block">{bill.tenantName}</span>
                <span className="text-xs text-slate-500 inline-flex items-center gap-1 mt-1">
                  <Phone size={12} className="text-slate-400" />
                  {bill.mobileNumber}
                </span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-4 mb-6">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Billing Breakdown</span>
              
              {/* Room Rent */}
              <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                <span className="text-slate-600">Monthly Room Rent</span>
                <span className="font-semibold text-slate-800">{formatCurrency(bill.monthlyRent)}</span>
              </div>

              {/* Electricity Breakdown */}
              <div className="space-y-1.5 py-1 border-b border-slate-100 pb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 flex items-center gap-1">
                    <Zap size={14} className="text-amber-500 fill-amber-100" />
                    Electricity Charges
                  </span>
                  <span className="font-semibold text-slate-800">{formatCurrency(bill.electricityBill)}</span>
                </div>
                
                {/* Meter Details */}
                <div className="bg-slate-50/80 rounded-lg p-2.5 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Current Meter Reading:</span>
                    <span className="font-medium text-slate-700">{bill.currentMeterReading}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous Meter Reading:</span>
                    <span className="font-medium text-slate-700">{bill.previousMeterReading}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1 font-semibold text-slate-600">
                    <span>Units Used:</span>
                    <span>{bill.currentMeterReading} - {bill.previousMeterReading} = {bill.totalUnits} Units</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Calculation Rate:</span>
                    <span>{bill.totalUnits} Units × ₹{bill.electricityRate}/unit</span>
                  </div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center py-2 bg-indigo-50/50 rounded-xl px-4 mt-4 border border-indigo-100/30">
                <span className="text-slate-700 font-bold text-sm">Grand Total</span>
                <span className="text-indigo-700 font-extrabold text-lg">{formatCurrency(bill.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2 mb-4">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Payment Information</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Status</span>
                  <span className={`font-bold ${bill.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {bill.paymentStatus}
                  </span>
                </div>

                {bill.paymentStatus === 'Paid' ? (
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Paid On</span>
                    <span className="font-semibold text-slate-700">{formatDate(bill.paymentDate)}</span>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Due Amount</span>
                    <span className="font-bold text-rose-600">{formatCurrency(bill.dueAmount)}</span>
                  </div>
                )}

                {bill.paymentStatus === 'Paid' && (
                  <div className="bg-slate-50 p-2 rounded-lg col-span-2">
                    <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Payment Method</span>
                    <span className="font-semibold text-slate-700">{bill.paymentMethod}</span>
                  </div>
                )}
              </div>

              {bill.notes && (
                <div className="mt-2 text-[11px] text-slate-500 italic bg-amber-50/40 border border-amber-100/30 p-2 rounded-lg">
                  *Notes: {bill.notes}*
                </div>
              )}
            </div>

            {/* Footer Signature */}
            <div className="text-center mt-8 border-t border-slate-100 pt-4">
              <div className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[10px] font-bold tracking-widest text-indigo-700 uppercase mb-2">
                Verified Digital Copy
              </div>
              <p className="text-[10px] text-slate-400">Generated on: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
