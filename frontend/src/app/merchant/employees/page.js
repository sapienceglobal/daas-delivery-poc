'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, ArrowLeft, KeySquare, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { employeeAPI } from '@/lib/api';
import { GlassCard, Button, Input, Badge, showToast, Tabs, EmptyState } from '@/components/ui';

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
    if (!isMerchant) { router.push('/customer'); return; }
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
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    try {
      await employeeAPI.removeEmployee(id);
      showToast('Employee removed', 'success');
      loadEmployees();
    } catch (err) {
      showToast(err.message || 'Failed to remove', 'error');
    }
  };

  const isClockedIn = (emp) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return emp.attendance?.some(a => new Date(a.date) >= today && a.clockIn && !a.clockOut);
  };

  if (loading) return <div className="p-8 text-center text-brand-muted">Loading employees...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/merchant')} className="p-2 rounded-xl bg-brand-card border border-brand-border hover:text-brand-cyan transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
              <Users className="h-6 w-6 text-brand-cyan" />
              Employee Management
            </h1>
            <p className="text-sm text-brand-muted mt-1">Manage staff, roles, and PIN access.</p>
          </div>
        </div>
        {activeTab === 'employees' && (
          <Button onClick={() => setShowAddModal(true)} icon={Plus}>Hire Employee</Button>
        )}
      </div>

      <Tabs 
        tabs={[
          { value: 'employees', label: 'Employees', icon: Users },
          { value: 'schedules', label: 'Schedules', icon: Clock },
          { value: 'payroll', label: 'Payroll', icon: DollarSign }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length === 0 ? (
          <div className="col-span-full py-8 text-center text-brand-muted text-sm">No employees found.</div>
        ) : (
          employees.map(emp => (
            <GlassCard key={emp._id} className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-green flex items-center justify-center text-brand-bg font-black">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-text">{emp.firstName} {emp.lastName}</h3>
                    <p className="text-xs text-brand-muted">{emp.phone}</p>
                  </div>
                </div>
                <Badge color="cyan" className="capitalize">{emp.role}</Badge>
              </div>

              <div className="flex justify-between items-center bg-brand-bg/50 p-3 rounded-lg border border-brand-border/50">
                <div className="flex items-center gap-2">
                  <KeySquare className="h-4 w-4 text-brand-muted" />
                  <span className="text-sm font-medium text-brand-text">POS PIN:</span>
                </div>
                <span className="font-mono font-bold tracking-widest text-brand-cyan">{emp.pin}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                {isClockedIn(emp) ? (
                  <Badge color="green" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Clocked In
                  </Badge>
                ) : (
                  <Badge color="gray" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Clocked Out
                  </Badge>
                )}
                <button onClick={() => handleRemove(emp._id)} className="text-xs text-brand-red hover:underline">
                  Remove
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
      )}

      {activeTab === 'payroll' && (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border/50 text-sm text-brand-muted">
                  <th className="pb-3 px-2">Employee</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Pay Type</th>
                  <th className="pb-3 px-2">Total Hours</th>
                  <th className="pb-3 px-2 text-right">Amount Owed</th>
                </tr>
              </thead>
              <tbody>
                {payroll.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-brand-muted text-sm">No payroll records found.</td></tr>
                ) : (
                  payroll.map(record => (
                    <tr key={record.employeeId} className="border-b border-brand-border/30 hover:bg-brand-bg/30 transition-colors">
                      <td className="py-3 px-2 font-bold text-brand-text">{record.firstName} {record.lastName}</td>
                      <td className="py-3 px-2 text-brand-muted uppercase text-xs">{record.role}</td>
                      <td className="py-3 px-2">
                        <Badge color={record.payType === 'salary' ? 'purple' : 'cyan'}>{record.payType}</Badge>
                        {record.payType === 'hourly' && <span className="ml-2 text-xs text-brand-muted">(${record.hourlyRate || 0}/hr)</span>}
                        {record.payType === 'salary' && <span className="ml-2 text-xs text-brand-muted">(${record.salary || 0}/mo)</span>}
                      </td>
                      <td className="py-3 px-2 font-bold text-brand-text">{record.totalHours}h</td>
                      <td className="py-3 px-2 text-right font-black text-brand-green">${record.amountOwed.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-6">
          {employees.length === 0 ? (
            <div className="py-8 text-center text-brand-muted text-sm">No employees found.</div>
          ) : (
            employees.map(emp => (
              <GlassCard key={`sched-${emp._id}`} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-brand-border/50 pb-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-green flex items-center justify-center text-brand-bg font-black">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-text">{emp.firstName} {emp.lastName}</h3>
                    <Badge color="cyan" className="capitalize text-xs">{emp.role}</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const shift = emp.schedule?.find(s => s.day === day) || { day, startTime: '09:00', endTime: '17:00', isOff: true };
                    return (
                      <div key={day} className={`p-3 rounded-xl border ${shift.isOff ? 'border-brand-border/30 bg-brand-bg/20' : 'border-brand-cyan/30 bg-brand-cyan/5'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">{day.slice(0, 3)}</span>
                          <label className="flex items-center gap-1 text-xs cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={!shift.isOff}
                              onChange={(e) => handleUpdateSchedule(emp._id, day, 'isOff', !e.target.checked)}
                              className="rounded border-brand-border text-brand-cyan focus:ring-brand-cyan bg-brand-bg"
                            />
                            Work
                          </label>
                        </div>
                        
                        {!shift.isOff && (
                          <div className="space-y-2">
                            <input 
                              type="time" 
                              value={shift.startTime}
                              onChange={(e) => handleUpdateSchedule(emp._id, day, 'startTime', e.target.value)}
                              className="w-full bg-brand-bg/50 border border-brand-border rounded text-xs px-2 py-1 text-brand-text focus:border-brand-cyan outline-none"
                            />
                            <input 
                              type="time" 
                              value={shift.endTime}
                              onChange={(e) => handleUpdateSchedule(emp._id, day, 'endTime', e.target.value)}
                              className="w-full bg-brand-bg/50 border border-brand-border rounded text-xs px-2 py-1 text-brand-text focus:border-brand-cyan outline-none"
                            />
                          </div>
                        )}
                        {shift.isOff && (
                          <div className="text-center py-4 text-xs font-semibold text-brand-muted italic">
                            Off Day
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md space-y-4 relative">
            <h2 className="text-xl font-bold text-brand-text">Hire New Employee</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={addForm.firstName} onChange={e => setAddForm({...addForm, firstName: e.target.value})} />
              <Input label="Last Name" value={addForm.lastName} onChange={e => setAddForm({...addForm, lastName: e.target.value})} />
            </div>
            
            <Input label="Phone Number" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} />
            
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-1">Role</label>
              <select 
                className="w-full bg-brand-bg/50 border border-brand-border text-brand-text text-sm rounded-xl px-4 py-3 outline-none focus:border-brand-cyan/50"
                value={addForm.role}
                onChange={e => setAddForm({...addForm, role: e.target.value})}
              >
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <Input 
              label="4-Digit POS PIN (Leave blank to auto-generate)" 
              value={addForm.pin} 
              onChange={e => setAddForm({...addForm, pin: e.target.value})} 
              maxLength={4}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button onClick={handleAddEmployee}>Hire Employee</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
