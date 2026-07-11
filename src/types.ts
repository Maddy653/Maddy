export type PaymentStatus = 'Paid' | 'Unpaid';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | '';

export interface Tenant {
  id: string;
  name: string;
  mobile: string;
  roomNumber: string;
  monthlyRent: number;
  lastMeterReading: number; // For initializing the next bill's previous reading
  status: 'Occupied' | 'Vacant';
  joinedDate: string;
}

export interface BillRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  mobileNumber: string;
  roomNumber: string;
  monthYear: string; // Format: "YYYY-MM" (e.g., "2026-07")
  previousMeterReading: number;
  currentMeterReading: number;
  electricityRate: number;
  monthlyRent: number;
  totalUnits: number; // calculated: current - previous
  electricityBill: number; // calculated: units * rate
  grandTotal: number; // calculated: rent + electricity
  paymentStatus: PaymentStatus;
  paymentDate: string; // Format: "YYYY-MM-DD"
  paymentMethod: PaymentMethod;
  dueAmount: number;
  notes?: string;
}

export interface MonthlyStats {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  totalMonthlyCollection: number; // Sum of paid bills (rent + electricity)
  pendingAmount: number; // Sum of unpaid grandTotals or dueAmounts
}
