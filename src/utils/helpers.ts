import { Tenant, BillRecord } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatMonthYear = (monthYearStr: string): string => {
  if (!monthYearStr) return '';
  const [year, month] = monthYearStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Seed initial data for testing
export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 't-1',
    name: 'Rajesh Kumar',
    mobile: '9876543210',
    roomNumber: '101',
    monthlyRent: 6000,
    lastMeterReading: 595,
    status: 'Occupied',
    joinedDate: '2026-01-10',
  },
];

export const INITIAL_BILLS: BillRecord[] = [
  // June 2026 Bills
  {
    id: 'b-1',
    tenantId: 't-1',
    tenantName: 'Rajesh Kumar',
    mobileNumber: '9876543210',
    roomNumber: '101',
    monthYear: '2026-06',
    previousMeterReading: 450,
    currentMeterReading: 520,
    electricityRate: 10,
    monthlyRent: 6000,
    totalUnits: 70,
    electricityBill: 700,
    grandTotal: 6700,
    paymentStatus: 'Paid',
    paymentDate: '2026-06-05',
    paymentMethod: 'UPI',
    dueAmount: 0,
    notes: 'Paid on time',
  },
  // July 2026 Bills (Current Month - Unpaid / Partial)
  {
    id: 'b-4',
    tenantId: 't-1',
    tenantName: 'Rajesh Kumar',
    mobileNumber: '9876543210',
    roomNumber: '101',
    monthYear: '2026-07',
    previousMeterReading: 520, // Auto-carried from June current reading
    currentMeterReading: 595,
    electricityRate: 10,
    monthlyRent: 6000,
    totalUnits: 75,
    electricityBill: 750,
    grandTotal: 6750,
    paymentStatus: 'Unpaid',
    paymentDate: '',
    paymentMethod: '',
    dueAmount: 6750,
  },
];

// Export to CSV helper
export const exportToCSV = (bills: BillRecord[], fileName: string) => {
  const headers = [
    'Bill ID',
    'Tenant Name',
    'Mobile',
    'Room No',
    'Month-Year',
    'Previous Reading',
    'Current Reading',
    'Units Used',
    'Electricity Rate (Rs/Unit)',
    'Electricity Bill (Rs)',
    'Monthly Room Rent (Rs)',
    'Grand Total (Rs)',
    'Payment Status',
    'Payment Date',
    'Payment Method',
    'Due Amount',
    'Notes',
  ];

  const rows = bills.map((b) => [
    b.id,
    b.tenantName,
    b.mobileNumber,
    b.roomNumber,
    formatMonthYear(b.monthYear),
    b.previousMeterReading,
    b.currentMeterReading,
    b.totalUnits,
    b.electricityRate,
    b.electricityBill,
    b.monthlyRent,
    b.grandTotal,
    b.paymentStatus,
    b.paymentDate || 'N/A',
    b.paymentMethod || 'N/A',
    b.dueAmount,
    b.notes || '',
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
