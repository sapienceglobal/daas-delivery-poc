import mongoose from 'mongoose';
import { EMPLOYEE_ROLE_VALUES } from '../config/constants.js';

const ShiftSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: { type: String, required: true },   // "09:00"
  endTime: { type: String, required: true },       // "17:00"
  isOff: { type: Boolean, default: false }
}, { _id: false });

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  clockIn: { type: Date, default: null },
  clockOut: { type: Date, default: null },
  hoursWorked: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'leave'],
    default: 'present'
  },
  notes: { type: String, default: '' }
}, { _id: true });

const EmployeeSchema = new mongoose.Schema({
  // ── Relations ─────────────────────────────────────────────────────────
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Restaurant ID is required']
  },

  // ── Profile ───────────────────────────────────────────────────────────
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, default: null, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  avatar: { type: String, default: null },

  // ── Role & Permissions ────────────────────────────────────────────────
  role: {
    type: String,
    enum: EMPLOYEE_ROLE_VALUES,
    required: [true, 'Employee role is required']
  },
  permissions: {
    canManageMenu: { type: Boolean, default: false },
    canManageOrders: { type: Boolean, default: true },
    canManageEmployees: { type: Boolean, default: false },
    canManageInventory: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: false },
    canProcessPayments: { type: Boolean, default: false }
  },

  // ── Shifts ────────────────────────────────────────────────────────────
  schedule: [ShiftSchema],

  // ── Attendance ────────────────────────────────────────────────────────
  attendance: [AttendanceSchema],

  // ── Payroll ───────────────────────────────────────────────────────────
  hourlyRate: { type: Number, default: 0, min: 0 },
  salary: { type: Number, default: 0, min: 0 },         // monthly salary
  payType: {
    type: String,
    enum: ['hourly', 'salary'],
    default: 'hourly'
  },

  // ── Employment Info ───────────────────────────────────────────────────
  hireDate: { type: Date, default: Date.now },
  terminationDate: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  pin: { type: String, default: null }    // POS login PIN
}, { timestamps: true });

// ── Indexes ─────────────────────────────────────────────────────────────────
EmployeeSchema.index({ restaurantId: 1, isActive: 1 });
EmployeeSchema.index({ restaurantId: 1, role: 1 });

const Employee = mongoose.model('Employee', EmployeeSchema);
export default Employee;
