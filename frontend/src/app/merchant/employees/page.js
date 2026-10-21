'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, KeySquare, CheckCircle2, Clock, DollarSign, Calendar, X, Trash2, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { employeeAPI } from '@/lib/api';
import { showToast, PageLoader } from '@/components/ui';
import PageHeaderGradient from '@/components/merchant/common/PageHeaderGradient';
import TableScrollContainer from '@/components/merchant/common/TableScrollContainer';

export default function EmployeesDashboard() {
  const { user, isMerchant, isAuthenticated } = useAuth();
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', phone: '', role: 'waiter', pin: '' });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant) { router.push('/'); return; }
    loadEmployees();
  }, [isAuthenticated, isMerchant]);

  const loadEmployees = async () => {
    try {
      const [empRes, payrollRes] = await Promise.all([
        employeeAPI.getEmployees(user.restaurantId),
        employeeAPI.getPayroll(user.restaurantId)
      ]);
      setEmployees(empRes.data || []);
      setPayroll(payrollRes.data || []);
    } catch (err) {
      showToast('Failed to load employee data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.phone) {
      return showToast('First Name, Last Name, and Phone are required', 'error');
    }
    if (addForm.pin && addForm.pin.length !== 4) {
      return showToast('PIN must be exactly 4 digits', 'error');
    }

    try {
      await employeeAPI.createEmployee(user.restaurantId, addForm);
      showToast('Employee added successfully', 'success');
      setShowAddModal(false);
      setAddForm({ firstName: '', lastName: '', phone: '', role: 'waiter', pin: '' });
      loadEmployees();
    } catch (err) {
      showToast(err.message || 'Failed to add employee', 'error');
    }
  };

  const handleUpdateSchedule = async (empId, day, field, value) => {
    try {
      const emp = employees.find(e => e._id === empId);
      let newSchedule = [...(emp.schedule || [])];
      
      const dayIndex = newSchedule.findIndex(s => s.day === day);
      if (dayIndex >= 0) {
        newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
      } else {
        const newEntry = { day, startTime: '09:00', endTime: '17:00', isOff: false, [field]: value };
        newSchedule.push(newEntry);
      }
      
      await employeeAPI.updateSchedule(empId, newSchedule);
      showToast('Schedule updated', 'success');
      loadEmployees();
    } catch (err) {
      showToast('Failed to update schedule', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee from your staff roster?')) return;
    try {
      await employeeAPI.removeEmployee(id);
      showToast('Employee removed successfully', 'success');
      loadEmployees();
    } catch (err) {
      showToast(err.message || 'Failed to remove employee', 'error');
    }
  };

  const isClockedIn = (emp) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return emp.attendance?.some(a => new Date(a.date) >= today && a.clockIn && !a.clockOut);
  };

  if (loading) return <PageLoader text="Loading Employee Roster..." />;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header section */}
      <PageHeaderGradient
        badgeIcon={Users}
        badgeText="Staff & Payroll Management"
        title="Employee Roster"
        subtitle="Manage staff accounts, attendance clock-ins, shift schedules, and POS access PINs."
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit"
            >
              <Plus className="w-4 h-4" /> Add New Staff
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-admin-border pb-3">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
            activeTab === 'employees'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Members ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
            activeTab === 'schedules'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
          }`}
        >
          <Clock className="w-4 h-4" /> Weekly Schedules
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all font-outfit ${
            activeTab === 'payroll'
              ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20'
              : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Payroll & Hours
        </button>
      </div>

      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-admin-surface border border-dashed border-admin-border rounded-2xl">
              <Users className="w-12 h-12 text-admin-muted mx-auto mb-3" />
              <h3 className="text-sm font-bold text-admin-text font-outfit">No Employees Found</h3>
              <p className="text-xs text-admin-muted mt-1">Click "Add New Staff" above to hire your first team member.</p>
            </div>
          ) : (
            employees.map(emp => (
              <div key={emp._id} className="bg-admin-surface border border-admin-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-admin-border-hover transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center text-white font-black font-outfit shadow-sm shadow-primary/20">
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-admin-text font-outfit">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-xs text-admin-muted mt-0.5">{emp.phone}</p>
                    </div>
                  </div>
                  <span className="capitalize px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px] font-bold font-outfit">
                    {emp.role}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-admin-surface-2 p-3 rounded-xl border border-admin-border/60">
                  <div className="flex items-center gap-2">
                    <KeySquare className="h-4 w-4 text-admin-muted" />
                    <span className="text-xs font-bold text-admin-muted font-outfit">POS Passcode PIN:</span>
                  </div>
                  <span className="font-mono font-black tracking-widest text-primary text-sm">{emp.pin || '----'}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-admin-border">
                  {isClockedIn(emp) ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-outfit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Clocked In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-admin-surface-2 text-admin-muted border border-admin-border font-outfit">
                      <Clock className="h-3 w-3" /> Clocked Out
                    </span>
                  )}
                  <button 
                    onClick={() => handleRemove(emp._id)} 
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors font-outfit flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-sm overflow-hidden">
          <TableScrollContainer>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-2/60 text-admin-muted font-bold text-[11px] uppercase tracking-wider font-outfit">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Pay Structure</th>
                  <th className="py-3.5 px-4">Total Logged Hours</th>
                  <th className="py-3.5 px-4 text-right">Amount Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/50 text-admin-text">
                {payroll.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-admin-muted font-medium">
                      No payroll records found for current cycle.
                    </td>
                  </tr>
                ) : (
                  payroll.map(record => (
                    <tr key={record.employeeId} className="hover:bg-admin-surface-2/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-admin-text font-outfit text-sm">{record.firstName} {record.lastName}</td>
                      <td className="py-3.5 px-4 text-admin-muted uppercase text-[11px] font-semibold">{record.role}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[11px] font-bold uppercase font-outfit">
                          {record.payType}
                        </span>
                        {record.payType === 'hourly' && <span className="ml-2 text-xs text-admin-muted">(${record.hourlyRate || 0}/hr)</span>}
                        {record.payType === 'salary' && <span className="ml-2 text-xs text-admin-muted">(${record.salary || 0}/mo)</span>}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-admin-text font-outfit">{record.totalHours} hrs</td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-500 font-outfit text-sm">${record.amountOwed.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScrollContainer>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-5">
          {employees.length === 0 ? (
            <div className="py-16 text-center bg-admin-surface border border-dashed border-admin-border rounded-2xl text-admin-muted text-xs font-semibold">
              No employees found to configure shifts.
            </div>
          ) : (
            employees.map(emp => (
              <div key={`sched-${emp._id}`} className="bg-admin-surface border border-admin-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-admin-border pb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center text-white font-bold font-outfit shadow-sm">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-admin-text font-outfit">{emp.firstName} {emp.lastName}</h3>
                    <span className="capitalize text-[11px] text-admin-muted">{emp.role}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const shift = emp.schedule?.find(s => s.day === day) || { day, startTime: '09:00', endTime: '17:00', isOff: true };
                    return (
                      <div key={day} className={`p-3 rounded-xl border transition-all ${
                        shift.isOff 
                          ? 'border-admin-border bg-admin-surface-2/40 opacity-70' 
                          : 'border-primary/30 bg-primary/[0.04]'
                      }`}>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-admin-muted font-outfit">{day.slice(0, 3)}</span>
                          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-admin-text font-medium font-outfit">
                            <input 
                              type="checkbox" 
                              checked={!shift.isOff}
                              onChange={(e) => handleUpdateSchedule(emp._id, day, 'isOff', !e.target.checked)}
                              className="rounded border-admin-border text-primary focus:ring-primary"
                            />
                            Work
                          </label>
                        </div>
                        
                        {!shift.isOff ? (
                          <div className="space-y-2">
                            <input 
                              type="time" 
                              value={shift.startTime}
                              onChange={(e) => handleUpdateSchedule(emp._id, day, 'startTime', e.target.value)}
                              className="w-full bg-admin-surface border border-admin-border rounded-lg text-[11px] px-2 py-1 text-admin-text focus:border-primary outline-none"
                            />
                            <input 
                              type="time" 
                              value={shift.endTime}
                              onChange={(e) => handleUpdateSchedule(emp._id, day, 'endTime', e.target.value)}
                              className="w-full bg-admin-surface border border-admin-border rounded-lg text-[11px] px-2 py-1 text-admin-text focus:border-primary outline-none"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-4 text-xs font-semibold text-admin-muted italic font-outfit">
                            Off
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-admin-border">
              <h2 className="text-base font-bold text-admin-text font-outfit">Hire New Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-admin-text mb-1 font-outfit">First Name *</label>
                  <input 
                    type="text" 
                    value={addForm.firstName} 
                    onChange={e => setAddForm({...addForm, firstName: e.target.value})} 
                    placeholder="e.g. Alex"
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-admin-text mb-1 font-outfit">Last Name *</label>
                  <input 
                    type="text" 
                    value={addForm.lastName} 
                    onChange={e => setAddForm({...addForm, lastName: e.target.value})} 
                    placeholder="e.g. Smith"
                    className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Phone Number *</label>
                <input 
                  type="text" 
                  value={addForm.phone} 
                  onChange={e => setAddForm({...addForm, phone: e.target.value})} 
                  placeholder="+1 555-0182"
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Assigned Role</label>
                <select 
                  className="w-full bg-admin-surface border border-admin-border text-admin-text text-xs rounded-xl px-3.5 py-2 outline-none focus:border-primary cursor-pointer font-medium"
                  value={addForm.role}
                  onChange={e => setAddForm({...addForm, role: e.target.value})}
                >
                  <option value="waiter">Waiter / Floor Staff</option>
                  <option value="chef">Kitchen Chef</option>
                  <option value="cashier">POS Cashier</option>
                  <option value="manager">Shift Manager</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">4-Digit POS PIN (Leave blank to auto-generate)</label>
                <input 
                  type="password"
                  maxLength={4}
                  value={addForm.pin} 
                  onChange={e => setAddForm({...addForm, pin: e.target.value})} 
                  placeholder="e.g. 1234"
                  className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-xs text-admin-text focus:outline-none focus:border-primary font-mono tracking-widest"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 rounded-xl transition-colors font-outfit"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleAddEmployee}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all font-outfit flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Hire Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
