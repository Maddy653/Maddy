import React, { useState } from 'react';
import { Tenant, BillRecord } from '../types';
import { formatCurrency, formatMonthYear } from '../utils/helpers';
import { 
  Home, Users, CheckCircle, AlertTriangle, CreditCard, 
  ChevronRight, Calendar, MessageSquare, Copy, Check 
} from 'lucide-react';

interface DashboardStatsProps {
  tenants: Tenant[];
  bills: BillRecord[];
  onNavigateToBills: () => void;
  onNavigateToTenants: () => void;
  onReceivePayment: (billId: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  tenants,
  bills,
  onNavigateToBills,
  onNavigateToTenants,
  onReceivePayment,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to the latest month in bills, or current month
    if (bills.length > 0) {
      const sorted = [...bills].sort((a, b) => b.monthYear.localeCompare(a.monthYear));
      return sorted[0].monthYear;
    }
    return new Date().toISOString().substring(0, 7);
  });

  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);

  // Available unique months in bills
  const uniqueMonths: string[] = Array.from(new Set<string>(bills.map((b) => b.monthYear))).sort().reverse();
  if (uniqueMonths.length === 0) {
    uniqueMonths.push(new Date().toISOString().substring(0, 7));
  }

  // Filter bills for the chosen month
  const monthlyBills = bills.filter((b) => b.monthYear === selectedMonth);

  // Calculate metrics
  const occupiedCount = tenants.filter((t) => t.status === 'Occupied').length;
  const vacantCount = tenants.filter((t) => t.status === 'Vacant').length;
  const totalRooms = occupiedCount + vacantCount;

  const totalMonthlyCollection = monthlyBills
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + b.grandTotal, 0);

  const pendingAmount = monthlyBills
    .filter((b) => b.paymentStatus === 'Unpaid')
    .reduce((sum, b) => sum + b.dueAmount, 0);

  // Get unpaid bills for dues list
  const unpaidBills = monthlyBills.filter((b) => b.paymentStatus === 'Unpaid');

  // List of all room numbers that exist in system
  const allRooms = Array.from(new Set([
    '101', '102', '103', '104', '105', '201', '202', '203'
  ]));

  const getReminderText = (bill: BillRecord) => {
    return `Dear ${bill.tenantName}, this is a gentle reminder regarding your Room Rent & Electricity Bill for ${formatMonthYear(bill.monthYear)}.
Room Rent: ${formatCurrency(bill.monthlyRent)}
Electricity Bill: ${formatCurrency(bill.electricityBill)} (${bill.totalUnits} Units)
Grand Total: ${formatCurrency(bill.grandTotal)}
Please pay at your earliest convenience. Thank you!`;
  };

  const handleCopyReminder = (bill: BillRecord) => {
    const text = getReminderText(bill);
    navigator.clipboard.writeText(text);
    setCopiedReminderId(bill.id);
    setTimeout(() => setCopiedReminderId(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Month Selector for Financials */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Reporting Month</span>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5 mt-0.5">
            <Calendar size={16} className="text-indigo-500" />
            {formatMonthYear(selectedMonth)}
          </h3>
        </div>
        <select
          id="dashboard-month-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 cursor-pointer text-slate-700"
        >
          {uniqueMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthYear(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Rooms */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Total Rooms</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Home size={15} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 block">{totalRooms}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">In System</span>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-200 transition-all" onClick={onNavigateToTenants}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Occupied</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-emerald-700 block">{occupiedCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">Active Tenants</span>
          </div>
        </div>

        {/* Vacant */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all" onClick={onNavigateToTenants}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Vacant</span>
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
              <Home size={15} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-600 block">{vacantCount}</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Ready to rent</span>
          </div>
        </div>

        {/* Total Monthly Collection */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 shadow-xs flex flex-col justify-between cursor-pointer hover:bg-emerald-50 transition-all col-span-1" onClick={onNavigateToBills}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Paid Collection</span>
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <CheckCircle size={15} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-emerald-800 block">{formatCurrency(totalMonthlyCollection)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">This month received</span>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50 shadow-xs flex flex-col justify-between cursor-pointer hover:bg-rose-50 transition-all col-span-1" onClick={onNavigateToBills}>
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">Pending dues</span>
            <div className="p-1.5 bg-rose-600 text-white rounded-lg">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-rose-800 block">{formatCurrency(pendingAmount)}</span>
            <span className="text-[10px] text-rose-600 font-semibold mt-1 block">This month outstanding</span>
          </div>
        </div>

      </div>

      {/* Visual Building Room Layout Map Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <h4 className="font-bold text-slate-800 text-sm mb-3.5 flex items-center gap-1.5">
          <Home size={16} className="text-indigo-500" />
          Interactive Room Grid
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allRooms.map((roomNo) => {
            // Find tenant in this room
            const roomTenant = tenants.find((t) => t.roomNumber === roomNo && t.status === 'Occupied');
            const isOccupied = !!roomTenant;

            return (
              <div
                key={roomNo}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isOccupied
                    ? 'bg-indigo-50/20 border-indigo-100 hover:border-indigo-300'
                    : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/40'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-extrabold text-slate-800">R-{roomNo}</span>
                  <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                </div>
                
                {isOccupied ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-700 block truncate">{roomTenant.name}</span>
                    <span className="text-[10px] text-indigo-600 font-medium">{formatCurrency(roomTenant.monthlyRent)}/mo</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Vacant Room</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Available</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Outstanding Bills & Payment reminders */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <CreditCard size={16} className="text-rose-500" />
            Pending Reminders ({unpaidBills.length})
          </h4>
          <button 
            onClick={onNavigateToBills}
            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-0.5"
          >
            All Bills
            <ChevronRight size={14} />
          </button>
        </div>

        {unpaidBills.length === 0 ? (
          <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle size={28} className="mx-auto text-emerald-500 mb-1.5" />
            <p className="text-slate-600 font-semibold text-xs">All bills cleared for this month!</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Amazing! Zero outstanding collections.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unpaidBills.slice(0, 3).map((bill) => (
              <div 
                key={bill.id}
                className="p-3 bg-rose-50/30 border border-rose-100/50 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Room {bill.roomNumber}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1 rounded-xs">
                      Due: {formatCurrency(bill.dueAmount)}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 font-medium">{bill.tenantName}</p>
                </div>

                <div className="flex items-center gap-2">
                  {/* WhatsApp/Reminder text copy button */}
                  <button
                    id={`copy-reminder-btn-${bill.id}`}
                    onClick={() => handleCopyReminder(bill)}
                    className="p-1.5 bg-white border border-slate-200 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Copy polite rent reminder to clipboard"
                  >
                    {copiedReminderId === bill.id ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                    <span className="text-[10px] font-semibold">{copiedReminderId === bill.id ? 'Copied' : 'Reminder'}</span>
                  </button>

                  {/* Immediate payment collector */}
                  <button
                    id={`receive-payment-btn-${bill.id}`}
                    onClick={() => onReceivePayment(bill.id)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-[10px]"
                  >
                    Receive Rent
                  </button>
                </div>
              </div>
            ))}
            {unpaidBills.length > 3 && (
              <p className="text-[10px] text-slate-400 text-center font-semibold pt-1">
                + {unpaidBills.length - 3} more outstanding bills. View Bills tab to see all.
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
