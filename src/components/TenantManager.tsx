import React, { useState } from 'react';
import { Tenant } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Search, Edit2, Trash2, X, Phone, Home, Calendar, Circle, CheckCircle, HelpCircle } from 'lucide-react';

interface TenantManagerProps {
  tenants: Tenant[];
  onAddTenant: (tenant: Omit<Tenant, 'id'>) => void;
  onEditTenant: (tenant: Tenant) => void;
  onDeleteTenant: (id: string) => void;
}

export const TenantManager: React.FC<TenantManagerProps> = ({
  tenants,
  onAddTenant,
  onEditTenant,
  onDeleteTenant,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [lastMeterReading, setLastMeterReading] = useState('');
  const [status, setStatus] = useState<'Occupied' | 'Vacant'>('Occupied');
  const [joinedDate, setJoinedDate] = useState('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const handleOpenAdd = () => {
    setEditingTenant(null);
    setName('');
    setMobile('');
    setRoomNumber('');
    setMonthlyRent('');
    setLastMeterReading('');
    setStatus('Occupied');
    setJoinedDate(new Date().toISOString().split('T')[0]);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setName(tenant.name);
    setMobile(tenant.mobile);
    setRoomNumber(tenant.roomNumber);
    setMonthlyRent(tenant.monthlyRent.toString());
    setLastMeterReading(tenant.lastMeterReading.toString());
    setStatus(tenant.status);
    setJoinedDate(tenant.joinedDate);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) errors.name = 'Tenant name is required';
    if (!mobile.trim() || mobile.length < 10) errors.mobile = 'Enter a valid 10-digit mobile number';
    if (!roomNumber.trim()) errors.roomNumber = 'Room number is required';
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) errors.monthlyRent = 'Enter a valid monthly rent amount';
    if (!lastMeterReading || parseFloat(lastMeterReading) < 0) errors.lastMeterReading = 'Enter starting meter reading';
    if (!joinedDate) errors.joinedDate = 'Joining date is required';

    // Prevent duplicate Room Numbers for active Occupied rooms (excluding editing itself)
    const activeRooms = tenants.filter(t => t.status === 'Occupied' && (!editingTenant || t.id !== editingTenant.id));
    if (status === 'Occupied' && activeRooms.some(t => t.roomNumber === roomNumber)) {
      errors.roomNumber = `Room ${roomNumber} is already occupied by another tenant!`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const tenantData = {
      name: name.trim(),
      mobile: mobile.trim(),
      roomNumber: roomNumber.trim(),
      monthlyRent: parseFloat(monthlyRent),
      lastMeterReading: parseFloat(lastMeterReading),
      status,
      joinedDate,
    };

    if (editingTenant) {
      onEditTenant({
        ...editingTenant,
        ...tenantData,
      });
    } else {
      onAddTenant(tenantData);
    }
    setIsFormOpen(false);
  };

  const filteredTenants = tenants.filter((tenant) => {
    const term = searchTerm.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(term) ||
      tenant.roomNumber.toLowerCase().includes(term) ||
      tenant.mobile.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="tenant-search-input"
            type="text"
            placeholder="Search by Tenant Name or Room No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
          />
        </div>
        <button
          id="add-tenant-btn"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          Add Tenant
        </button>
      </div>

      {/* Tenants Grid/List */}
      {filteredTenants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-xs">
          <HelpCircle size={40} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No tenants found.</p>
          <p className="text-slate-400 text-xs mt-1">Try refining your search or add a new tenant.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
            >
              {/* Card Status Indicator Band */}
              <div className={`absolute top-0 left-0 w-2 h-full ${
                tenant.status === 'Occupied' ? 'bg-indigo-500' : 'bg-slate-300'
              }`} />

              <div className="pl-2">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg leading-snug">{tenant.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Phone size={12} className="text-slate-400" />
                      <span>{tenant.mobile}</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border flex items-center gap-1 ${
                    tenant.status === 'Occupied'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <Circle size={8} className={`fill-current ${tenant.status === 'Occupied' ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {tenant.status}
                  </span>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-50 pt-3 mb-4">
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Room Number</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Home size={13} className="text-slate-400" />
                      Room {tenant.roomNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Monthly Rent</span>
                    <span className="font-bold text-indigo-600">
                      {formatCurrency(tenant.monthlyRent)}/mo
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Meter Reading</span>
                    <span className="font-semibold text-slate-600">
                      {tenant.lastMeterReading} Units
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block">Joined Since</span>
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(tenant.joinedDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-50 pt-3 pl-2 no-print">
                <button
                  id={`edit-tenant-btn-${tenant.id}`}
                  onClick={() => handleOpenEdit(tenant)}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                  title="Edit Tenant"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  id={`delete-tenant-btn-${tenant.id}`}
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${tenant.name}? All related history will be preserved but they will be removed from active listings.`)) {
                      onDeleteTenant(tenant.id);
                    }
                  }}
                  className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Delete Tenant"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide Over or Modal for Add/Edit Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTenant ? 'Edit Tenant Details' : 'Add New Tenant'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tenant Name *</label>
                <input
                  id="form-name-input"
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                    formErrors.name ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.name && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number *</label>
                  <input
                    id="form-mobile-input"
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.mobile ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.mobile && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.mobile}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Room Number *</label>
                  <input
                    id="form-room-input"
                    type="text"
                    placeholder="e.g. 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.roomNumber ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.roomNumber && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.roomNumber}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Room Rent (₹) *</label>
                  <input
                    id="form-rent-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.monthlyRent ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.monthlyRent && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.monthlyRent}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Starting Meter Reading *</label>
                  <input
                    id="form-meter-input"
                    type="number"
                    min="0"
                    placeholder="e.g. 120"
                    value={lastMeterReading}
                    onChange={(e) => setLastMeterReading(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.lastMeterReading ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.lastMeterReading && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.lastMeterReading}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Occupancy Status *</label>
                  <select
                    id="form-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Occupied' | 'Vacant')}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                  >
                    <option value="Occupied">Occupied</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date *</label>
                  <input
                    id="form-joined-date"
                    type="date"
                    value={joinedDate}
                    onChange={(e) => setJoinedDate(e.target.value)}
                    className={`w-full px-3.5 py-2 border rounded-xl text-sm focus:outline-hidden focus:ring-2 transition-all ${
                      formErrors.joinedDate ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                  />
                  {formErrors.joinedDate && <span className="text-[10px] text-rose-500 font-medium mt-1 block">{formErrors.joinedDate}</span>}
                </div>
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
                  id="save-tenant-submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {editingTenant ? 'Save Changes' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
