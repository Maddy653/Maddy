import React, { useState, useEffect } from 'react';
import { BillRecord, Tenant, PaymentStatus, PaymentMethod } from '../types';
import { formatCurrency, formatMonthYear, formatDate, exportToCSV } from '../utils/helpers';
import { ReceiptModal } from './ReceiptModal';
import { 
  Plus, Search, Edit2, Trash2, Receipt, Calendar, Filter, 
  CheckCircle2, AlertCircle, FileSpreadsheet, FileText, X, Sparkles, Zap, DollarSign
} from 'lucide-react';

interface BillManagerProps {
  bills: BillRecord[];
  tenants: Tenant[];
  onAddBill: (bill: Omit<BillRecord, 'id'>) => void;
  onEditBill: (bill: BillRecord) => void;
  onDeleteBill: (id: string) => void;
}

export const BillManager: React.FC<BillManagerProps> = ({
  bills,
  tenants,
  onAddBill,
  onEditBill,
  onDeleteBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(''); // "YYYY-MM"
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillRecord | null>(null);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<BillRecord | null>(null);

  // Form states
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [previousMeterReading, setPreviousMeterReading] = useState(0);
  const [currentMeterReading, setCurrentMeterReading] = useState('');
  const [electricityRate, setElectricityRate] = useState('10'); // Default rate per unit
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [dueAmount, setDueAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Populate unique available months in existing bills for filter dropdown
  const uniqueMonths: string[] = Array.from(new Set<string>(bills.map((b) => b.monthYear))).sort().reverse();

  // Handle Automatic Reading Carryover and Tenant auto-fill when Tenant or Month changes
  useEffect(() => {
    if (!selectedTenantId || !monthYear) return;

    const tenant = tenants.find((t) => t.id === selectedTenantId);
    if (!tenant) return;

    // Set standard rent
    setMonthlyRent(tenant.monthlyRent);

    // Dynamic Carryover Rule:
    // 1. Check if there are any bills for this tenant in general
    // 2. We want to find the bill chronologically preceding the selected month.
    // Let's find the bills of this tenant, sort them by month Year descending.
    const tenantBills = bills
      .filter((b) => b.tenantId === selectedTenantId)
      .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

    // Find the latest bill before the currently selected monthYear
    const previousBill = tenantBills.find((b) => b.monthYear < monthYear);

    if (previousBill) {
      // Automatic carry over of currentMeterReading from the last recorded month
      setPreviousMeterReading(previousBill.currentMeterReading);
    } else {
      // Fallback to the initial registration reading
      setPreviousMeterReading(tenant.lastMeterReading);
    }
  }, [selectedTenantId, monthYear, bills, tenants]);

  // Handle auto-calculation of due amount based on Payment Status
  useEffect(() => {
    const currentReadingNum = parseFloat(currentMeterReading) || 0;
    const previousReadingNum = previousMeterReading;
    const rateNum = parseFloat(electricityRate) || 0;
    
    const calculatedUnits = Math.max(0, currentReadingNum - previousReadingNum);
    const calculatedElectricityBill = calculatedUnits * rateNum;
    const calculatedGrandTotal = monthlyRent + calculatedElectricityBill;

    if (paymentStatus === 'Paid') {
      setDueAmount(0);
      if (!paymentDate) {
        setPaymentDate(new Date().toISOString().split('T')[0]);
      }
      if (!paymentMethod) {
        setPaymentMethod('UPI');
      }
    } else {
      setDueAmount(calculatedGrandTotal);
      setPaymentDate('');
      setPaymentMethod('');
    }
  }, [paymentStatus, currentMeterReading, previousMeterReading, electricityRate, monthlyRent]);

  const handleOpenAdd = () => {
    setEditingBill(null);
    setSelectedTenantId('');
    setMonthYear(new Date().toISOString().substring(0, 7)); // Current YYYY-MM
    setPreviousMeterReading(0);
    setCurrentMeterReading('');
    setElectricityRate('10');
    setMonthlyRent(0);
    setPaymentStatus('Unpaid');
    setPaymentDate('');
    setPaymentMethod('');
    setDueAmount(0);
    setNotes('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (bill: BillRecord) => {
    setEditingBill(bill);
    setSelectedTenantId(bill.tenantId);
    setMonthYear(bill.monthYear);
    setPreviousMeterReading(bill.previousMeterReading);
    setCurrentMeterReading(bill.currentMeterReading.toString());
    setElectricityRate(bill.electricityRate.toString());
    setMonthlyRent(bill.monthlyRent);
    setPaymentStatus(bill.paymentStatus);
    setPaymentDate(bill.paymentDate);
    setPaymentMethod(bill.paymentMethod);
    setDueAmount(bill.dueAmount);
    setNotes(bill.notes || '');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!selectedTenantId) errors.selectedTenantId = 'Please select a tenant';
    if (!monthYear) errors.monthYear = 'Select month and year';
    
    const currentReadingNum = parseFloat(currentMeterReading);
    if (isNaN(currentReadingNum)) {
      errors.currentMeterReading = 'Enter current meter reading';
    } else if (currentReadingNum < previousMeterReading) {
      errors.currentMeterReading = `Must be equal to or greater than previous reading (${previousMeterReading})`;
    }

    const rateNum = parseFloat(electricityRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      errors.electricityRate = 'Enter a valid rate per unit';
    }

    if (paymentStatus === 'Paid') {
      if (!paymentDate) errors.paymentDate = 'Payment date is required for paid bills';
      if (!paymentMethod) errors.paymentMethod = 'Select payment method';
    }

    // Prevent duplicate bill for same tenant in same month (excluding edit)
    const duplicate = bills.some(
      (b) => b.tenantId === selectedTenantId && b.monthYear === monthYear && (!editingBill || b.id !== editingBill.id)
    );
    if (duplicate) {
      errors.monthYear = 'A bill for this tenant for this month already exists!';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tenant = tenants.find((t) => t.id === selectedTenantId);
    if (!tenant) return;

    const currentReadingNum = parseFloat(currentMeterReading);
    const rateNum = parseFloat(electricityRate);
    const totalUnits = Math.max(0, currentReadingNum - previousMeterReading);
    const electricityBill = totalUnits * rateNum;
    const grandTotal = monthlyRent + electricityBill;

    const billData = {
      tenantId: selectedTenantId,
      tenantName: tenant.name,
      mobileNumber: tenant.mobile,
      roomNumber: tenant.roomNumber,
      monthYear,
      previousMeterReading,
      currentMeterReading: currentReadingNum,
      electricityRate: rateNum,
      monthlyRent,
      totalUnits,
      electricityBill,
      grandTotal,
      paymentStatus,
      paymentDate: paymentStatus === 'Paid' ? paymentDate : '',
      paymentMethod: paymentStatus === 'Paid' ? paymentMethod : '',
      dueAmount: paymentStatus === 'Paid' ? 0 : dueAmount,
      notes: notes.trim(),
    };

    if (editingBill) {
      onEditBill({
        ...editingBill,
        ...billData,
      });
    } else {
      onAddBill(billData);
    }
    setIsFormOpen(false);
  };

  // Filter bills list based on search and selected month filter
  const filteredBills = bills.filter((b) => {
    const matchesSearch = 
      b.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth ? b.monthYear === filterMonth : true;
    return matchesSearch && matchesMonth;
  });

  // Calculate filtered stats
  const totalBilled = filteredBills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalReceived = filteredBills.reduce((acc, b) => acc + (b.paymentStatus === 'Paid' ? b.grandTotal : b.grandTotal - b.dueAmount), 0);
  const totalPending = filteredBills.reduce((acc, b) => acc + (b.paymentStatus === 'Unpaid' ? b.dueAmount : 0), 0);

  const handleExportCSV = () => {
    const period = filterMonth ? formatMonthYear(filterMonth) : 'All_Time';
    exportToCSV(filteredBills, `Rent_Bill_Report_${period}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Mini Stats Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50/50 border border-indigo-100/50 p-3.5 rounded-2xl">
          <span className="text-[10px] text-indigo-500 uppercase font-bold block">Period Billed</span>
          <span className="text-sm font-extrabold text-indigo-900 mt-1 block">{formatCurrency(totalBilled)}</span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-2xl">
          <span className="text-[10px] text-emerald-600 uppercase font-bold block">Period Collected</span>
          <span className="text-sm font-extrabold text-emerald-900 mt-1 block">{formatCurrency(totalReceived)}</span>
        </div>
        <div className="bg-rose-50/50 border border-rose-100/50 p-3.5 rounded-2xl">
          <span className="text-[10px] text-rose-500 uppercase font-bold block">Period Pending</span>
          <span className="text-sm font-extrabold text-rose-900 mt-1 block">{formatCurrency(totalPending)}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="bill-search-input"
              type="text"
              placeholder="Search by Room or Tenant Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            {/* Month Filter */}
            <div className="relative flex-1 md:w-48">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                id="bill-month-filter"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 bg-white appearance-none cursor-pointer"
              >
                <option value="">All Months</option>
                {uniqueMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthYear(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              disabled={filteredBills.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-600 rounded-xl text-sm transition-all bg-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
              title="Export filtered records as CSV (Excel)"
            >
              <FileSpreadsheet size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Generate Bill Trigger */}
        <button
          id="generate-bill-trigger"
          onClick={handleOpenAdd}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Create Monthly Invoice
        </button>
      </div>

      {/* Bill History List */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <AlertCircle size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No billing records found.</p>
          <p className="text-slate-400 text-xs mt-1">Try changing filters or generate a new invoice.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start border-b border-slate-50 pb-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold tracking-wide rounded-sm uppercase">
                      Room {bill.roomNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{formatMonthYear(bill.monthYear)}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mt-1.5">{bill.tenantName}</h4>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Grand Total</span>
                  <span className="font-extrabold text-slate-900 text-lg">{formatCurrency(bill.grandTotal)}</span>
                </div>
              </div>

              {/* Bill Details */}
              <div className="grid grid-cols-3 gap-2 py-1 text-xs text-slate-600">
                <div className="bg-slate-50/50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Room Rent</span>
                  <span className="font-bold text-slate-700">{formatCurrency(bill.monthlyRent)}</span>
                </div>
                <div className="bg-slate-50/50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Electricity</span>
                  <span className="font-bold text-slate-700">{formatCurrency(bill.electricityBill)}</span>
                </div>
                <div className="bg-slate-50/50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Power Usage</span>
                  <span className="font-medium text-slate-700">{bill.totalUnits} Units</span>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${bill.paymentStatus === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`text-xs font-bold ${bill.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {bill.paymentStatus}
                  </span>
                  {bill.paymentStatus === 'Paid' && (
                    <span className="text-[10px] text-slate-400 font-medium">({bill.paymentMethod})</span>
                  )}
                  {bill.paymentStatus === 'Unpaid' && bill.dueAmount < bill.grandTotal && (
                    <span className="text-[10px] text-rose-500 font-semibold">(Due: {formatCurrency(bill.dueAmount)})</span>
                  )}
                </div>

                {/* Bill Actions */}
                <div className="flex gap-1.5">
                  <button
                    id={`view-receipt-btn-${bill.id}`}
                    onClick={() => setSelectedBillForReceipt(bill)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                    title="View Receipt"
                  >
                    <Receipt size={13} className="text-indigo-500" />
                    Receipt
                  </button>
                  <button
                    id={`edit-bill-btn-${bill.id}`}
                    onClick={() => handleOpenEdit(bill)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                    title="Edit Invoice"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    id={`delete-bill-btn-${bill.id}`}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete this invoice for Room ${bill.roomNumber} - ${formatMonthYear(bill.monthYear)}?`)) {
                        onDeleteBill(bill.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete Invoice"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Over or Modal for Add/Edit Invoice Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingBill ? 'Modify Invoice' : 'Create Monthly Invoice'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Tenant Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Tenant *</label>
                {editingBill ? (
                  <div className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold border border-slate-200">
                    {editingBill.tenantName} (Room {editingBill.roomNumber})
                  </div>
                ) : (
                  <select
                    id="form-tenant-select"
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden transition-all bg-white ${
                      formErrors.selectedTenantId ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  >
                    <option value="">-- Choose Tenant --</option>
                    {tenants
                      .filter((t) => t.status === 'Occupied')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Room {t.roomNumber})
                        </option>
                      ))}
                  </select>
                )}
                {formErrors.selectedTenantId && (
                  <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.selectedTenantId}</span>
                )}
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Billing Month & Year *</label>
                <input
                  id="form-month-input"
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  disabled={!!editingBill}
                  className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden transition-all bg-white ${
                    editingBill ? 'bg-slate-100 border-slate-200' : formErrors.monthYear ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'
                  }`}
                />
                {formErrors.monthYear && (
                  <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.monthYear}</span>
                )}
              </div>

              {/* Readings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">Previous Reading</label>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1 rounded-sm">Auto-filled</span>
                  </div>
                  <input
                    type="number"
                    value={previousMeterReading}
                    disabled // Auto filled by helper
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">From last month's current reading</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Current Reading *</label>
                  <input
                    id="form-current-reading"
                    type="number"
                    min="0"
                    placeholder="Enter today's reading"
                    value={currentMeterReading}
                    onChange={(e) => setCurrentMeterReading(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden transition-all bg-white ${
                      formErrors.currentMeterReading ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.currentMeterReading && (
                    <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.currentMeterReading}</span>
                  )}
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rate / Unit (₹) *</label>
                  <input
                    id="form-electricity-rate"
                    type="number"
                    step="0.1"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden transition-all bg-white ${
                      formErrors.electricityRate ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  {formErrors.electricityRate && (
                    <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.electricityRate}</span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room Rent (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={monthlyRent}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Assigned in Tenant profiles</span>
                </div>
              </div>

              {/* Math Preview */}
              {selectedTenantId && currentMeterReading && (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[10px] uppercase tracking-wide mb-1">
                    <Sparkles size={12} />
                    Automatic Math Engine
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Units Used:</span>
                    <span className="font-semibold text-slate-700">
                      {Math.max(0, parseFloat(currentMeterReading) - previousMeterReading)} Units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Electricity Bill:</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(Math.max(0, parseFloat(currentMeterReading) - previousMeterReading) * (parseFloat(electricityRate) || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-indigo-600">
                      {formatCurrency(
                        monthlyRent + 
                        Math.max(0, parseFloat(currentMeterReading) - previousMeterReading) * (parseFloat(electricityRate) || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Status *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('Paid')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('Unpaid')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        paymentStatus === 'Unpaid'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Unpaid
                    </button>
                  </div>
                </div>

                {paymentStatus === 'Paid' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date *</label>
                      <input
                        id="form-payment-date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden transition-all bg-white ${
                          formErrors.paymentDate ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      />
                      {formErrors.paymentDate && (
                        <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.paymentDate}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method *</label>
                      <select
                        id="form-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden transition-all bg-white ${
                          formErrors.paymentMethod ? 'border-rose-400 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500'
                        }`}
                      >
                        <option value="">Select Method</option>
                        <option value="UPI">UPI (GPay/PhonePe)</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                      {formErrors.paymentMethod && (
                        <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.paymentMethod}</span>
                      )}
                    </div>
                  </div>
                )}

                {paymentStatus === 'Unpaid' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Due / Remaining Amount (₹)
                    </label>
                    <input
                      id="form-due-amount"
                      type="number"
                      max={
                        monthlyRent + 
                        Math.max(0, (parseFloat(currentMeterReading) || 0) - previousMeterReading) * (parseFloat(electricityRate) || 0)
                      }
                      value={dueAmount}
                      onChange={(e) => setDueAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
                      title="You can modify this if the tenant paid partially"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Default is Grand Total. Modify if partial payment was received.
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes (Optional)</label>
                <textarea
                  id="form-bill-notes"
                  placeholder="e.g. Paid in 2 installments, delayed by 3 days..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 transition-all bg-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-bill-submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {editingBill ? 'Apply Updates' : 'Generate Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Receipt overlay if selected */}
      {selectedBillForReceipt && (
        <ReceiptModal 
          bill={selectedBillForReceipt} 
          onClose={() => setSelectedBillForReceipt(null)} 
        />
      )}
    </div>
  );
};
