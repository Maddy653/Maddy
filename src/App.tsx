import { useState, useEffect } from 'react';
import { Tenant, BillRecord } from './types';
import { 
  INITIAL_TENANTS, 
  INITIAL_BILLS, 
  formatDate 
} from './utils/helpers';
import { DashboardStats } from './components/DashboardStats';
import { TenantManager } from './components/TenantManager';
import { BillManager } from './components/BillManager';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Smartphone, 
  Monitor, 
  TrendingUp,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bills' | 'tenants'>('dashboard');
  
  // Layout constraint state: simulated mobile viewport vs native responsive desktop
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Core Data States
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bills, setBills] = useState<BillRecord[]>([]);

  // Initialize data from LocalStorage or use seed data
  useEffect(() => {
    const storedTenants = localStorage.getItem('rent_app_tenants');
    const storedBills = localStorage.getItem('rent_app_bills');

    if (storedTenants && storedBills) {
      setTenants(JSON.parse(storedTenants));
      setBills(JSON.parse(storedBills));
    } else {
      // Use Seed Data
      setTenants(INITIAL_TENANTS);
      setBills(INITIAL_BILLS);
      localStorage.setItem('rent_app_tenants', JSON.stringify(INITIAL_TENANTS));
      localStorage.setItem('rent_app_bills', JSON.stringify(INITIAL_BILLS));
    }
  }, []);

  // Save states helper
  const saveTenants = (updatedTenants: Tenant[]) => {
    setTenants(updatedTenants);
    localStorage.setItem('rent_app_tenants', JSON.stringify(updatedTenants));
  };

  const saveBills = (updatedBills: BillRecord[]) => {
    setBills(updatedBills);
    localStorage.setItem('rent_app_bills', JSON.stringify(updatedBills));
  };

  const handleResetDatabase = () => {
    if (window.confirm('Are you sure you want to reset to the default 1-tenant seed data? This will overwrite your changes.')) {
      setTenants(INITIAL_TENANTS);
      setBills(INITIAL_BILLS);
      localStorage.setItem('rent_app_tenants', JSON.stringify(INITIAL_TENANTS));
      localStorage.setItem('rent_app_bills', JSON.stringify(INITIAL_BILLS));
    }
  };

  // Tenant CRUD actions
  const handleAddTenant = (newTenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = {
      ...newTenantData,
      id: `t-${Date.now()}`,
    };
    const updated = [...tenants, newTenant];
    saveTenants(updated);
  };

  const handleEditTenant = (updatedTenant: Tenant) => {
    const updated = tenants.map((t) => (t.id === updatedTenant.id ? updatedTenant : t));
    saveTenants(updated);

    // Also update cached tenant meta inside all their historical bills to keep data pristine
    const updatedBills = bills.map((b) => {
      if (b.tenantId === updatedTenant.id) {
        return {
          ...b,
          tenantName: updatedTenant.name,
          mobileNumber: updatedTenant.mobile,
          roomNumber: updatedTenant.roomNumber,
          monthlyRent: updatedTenant.status === 'Occupied' ? updatedTenant.monthlyRent : b.monthlyRent,
        };
      }
      return b;
    });
    saveBills(updatedBills);
  };

  const handleDeleteTenant = (id: string) => {
    // Soft-delete: change status to Vacant rather than purging, to preserve billing reports integrity
    const updated = tenants.map((t) => {
      if (t.id === id) {
        return { ...t, status: 'Vacant' as const };
      }
      return t;
    });
    saveTenants(updated);
  };

  // Bills CRUD actions
  const handleAddBill = (newBillData: Omit<BillRecord, 'id'>) => {
    const newBill: BillRecord = {
      ...newBillData,
      id: `b-${Date.now()}`,
    };
    const updated = [newBill, ...bills];
    saveBills(updated);

    // After generating a bill, update the tenant's current reading cache to match
    const updatedTenants = tenants.map((t) => {
      if (t.id === newBillData.tenantId) {
        return {
          ...t,
          lastMeterReading: newBillData.currentMeterReading,
        };
      }
      return t;
    });
    saveTenants(updatedTenants);
  };

  const handleEditBill = (updatedBill: BillRecord) => {
    const updated = bills.map((b) => (b.id === updatedBill.id ? updatedBill : b));
    saveBills(updated);

    // Sync Tenant's reading with edited bill if it's the latest bill
    const tenantBills = updated
      .filter((b) => b.tenantId === updatedBill.tenantId)
      .sort((a, b) => b.monthYear.localeCompare(a.monthYear));
    
    if (tenantBills.length > 0 && tenantBills[0].id === updatedBill.id) {
      const updatedTenants = tenants.map((t) => {
        if (t.id === updatedBill.tenantId) {
          return {
            ...t,
            lastMeterReading: updatedBill.currentMeterReading,
          };
        }
        return t;
      });
      saveTenants(updatedTenants);
    }
  };

  const handleDeleteBill = (id: string) => {
    const updated = bills.filter((b) => b.id !== id);
    saveBills(updated);
  };

  // Direct Landlord instant payment collector from dashboard dues card
  const handleReceivePayment = (billId: string) => {
    const updated = bills.map((b) => {
      if (b.id === billId) {
        return {
          ...b,
          paymentStatus: 'Paid' as const,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'UPI' as const,
          dueAmount: 0,
        };
      }
      return b;
    });
    saveBills(updated);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start p-0 sm:py-6 sm:px-4 font-sans text-slate-700 antialiased selection:bg-indigo-100">
      
      {/* Top Level Global Toolbar */}
      <div className="w-full max-w-md md:max-w-6xl px-4 py-2 flex items-center justify-between text-slate-400 text-xs font-semibold no-print mb-1.5">
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-emerald-400" />
          <span>Real Estate Admin HUD</span>
        </div>
        
        {/* Device Viewport Selector Toggle */}
        <button
          id="viewport-toggle-btn"
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[10px]"
          title="Toggle between Mobile App Frame and Responsive Desktop View"
        >
          {isMobileFrame ? (
            <>
              <Monitor size={12} className="text-indigo-400" />
              <span>Switch to Desktop View</span>
            </>
          ) : (
            <>
              <Smartphone size={12} className="text-emerald-400" />
              <span>Switch to Mobile View</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        id="app-container"
        className={`bg-slate-50 min-h-screen sm:min-h-0 sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${
          isMobileFrame 
            ? 'w-full max-w-md sm:aspect-[9/19.5] sm:max-h-[820px] sm:border sm:border-slate-800/40' 
            : 'w-full max-w-5xl sm:min-h-[750px] sm:max-h-[880px]'
        }`}
      >
        {/* App Header */}
        <header className="bg-slate-900 text-white px-5 py-4 flex flex-col justify-between relative overflow-hidden shrink-0 no-print">
          {/* Accent light element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Zap size={18} className="fill-indigo-500/20" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight">Vidyut & Rent</h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Admin Dashboard</p>
              </div>
            </div>
            
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/40 px-2 py-1 rounded-lg text-[10px] font-mono text-indigo-300">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Active Portal</span>
            </div>
          </div>
        </header>

        {/* Informative Tip Banner */}
        <div className="bg-indigo-50 px-5 py-2.5 border-b border-indigo-100 flex items-center justify-between gap-3 text-[10px] text-indigo-700 font-medium no-print">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
            <p>
              Meter readings carry over automatically. June's <strong>Current Reading</strong> will default as July's <strong>Previous Reading</strong>.
            </p>
          </div>
          <button
            onClick={handleResetDatabase}
            className="shrink-0 bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-indigo-600 px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer shadow-xs"
            title="Reset system to the official 1-Tenant seed data"
          >
            Reset Seed
          </button>
        </div>

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto px-5 py-4 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardStats
                  tenants={tenants}
                  bills={bills}
                  onNavigateToBills={() => setActiveTab('bills')}
                  onNavigateToTenants={() => setActiveTab('tenants')}
                  onReceivePayment={handleReceivePayment}
                />
              )}

              {activeTab === 'bills' && (
                <BillManager
                  bills={bills}
                  tenants={tenants}
                  onAddBill={handleAddBill}
                  onEditBill={handleEditBill}
                  onDeleteBill={handleDeleteBill}
                />
              )}

              {activeTab === 'tenants' && (
                <TenantManager
                  tenants={tenants}
                  onAddTenant={handleAddTenant}
                  onEditTenant={handleEditTenant}
                  onDeleteTenant={handleDeleteTenant}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Tab Navigation Bar */}
        <nav className="bg-white border-t border-slate-200/80 px-4 py-2.5 flex justify-around items-center shrink-0 shadow-lg no-print">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-indigo-600 font-bold bg-indigo-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-[10px] tracking-wide">Overview</span>
          </button>

          <button
            id="tab-bills"
            onClick={() => setActiveTab('bills')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'bills'
                ? 'text-indigo-600 font-bold bg-indigo-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt size={18} />
            <span className="text-[10px] tracking-wide">Bill Books</span>
          </button>

          <button
            id="tab-tenants"
            onClick={() => setActiveTab('tenants')}
            className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'tenants'
                ? 'text-indigo-600 font-bold bg-indigo-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={18} />
            <span className="text-[10px] tracking-wide">Tenants</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
