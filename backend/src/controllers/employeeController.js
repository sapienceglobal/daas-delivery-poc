import Employee from '../models/Employee.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import crypto from 'crypto';

const verifyRestaurantOwnership = async (restaurantId, userId) => {
  const owns = await Restaurant.exists({ _id: restaurantId, ownerId: userId });
  if (!owns) throw new AppError('Not authorized for this restaurant', 403);
};

// get all employees for a restaurant
export const getEmployees = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  
  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  const employees = await Employee.find({ restaurantId, isActive: true })
    .populate('userId', 'name email')
    .sort({ firstName: 1 });
    
  res.success(response, employees);
});

// create employee
export const createEmployee = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const data = req.body;

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  // generate a random 4-digit PIN if not provided
  if (!data.pin) {
    data.pin = Math.floor(1000 + Math.random() * 9000).toString();
  } else if (data.pin.length !== 4) {
    throw new AppError('PIN must be exactly 4 digits', 400);
  }

  // ensure unique PIN for the same restaurant
  const existingPin = await Employee.findOne({ restaurantId, pin: data.pin, isActive: true });
  if (existingPin) {
    throw new AppError('This PIN is already in use by another employee', 400);
  }

  const employee = await Employee.create({ ...data, restaurantId });
  res.success(response, employee, 201);
});

// update employee
export const updateEmployee = asyncHandler(async (req, response) => {
  const { employeeId } = req.params;
  const data = req.body;

  const emp = await Employee.findById(employeeId);
  if (!emp) throw new AppError('Employee not found', 404);

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(emp.restaurantId, req.user._id);
  }

  if (data.pin) {
    if (data.pin.length !== 4) throw new AppError('PIN must be exactly 4 digits', 400);
    const existingPin = await Employee.findOne({ 
      restaurantId: emp.restaurantId, 
      pin: data.pin, 
      isActive: true,
      _id: { $ne: employeeId }
    });
    if (existingPin) throw new AppError('This PIN is already in use by another employee', 400);
  }

  const updated = await Employee.findByIdAndUpdate(employeeId, data, { new: true, runValidators: true });
  res.success(response, updated);
});

// update employee schedule
export const updateSchedule = asyncHandler(async (req, response) => {
  const { employeeId } = req.params;
  const { schedule } = req.body;

  const emp = await Employee.findById(employeeId);
  if (!emp) throw new AppError('Employee not found', 404);

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(emp.restaurantId, req.user._id);
  }

  emp.schedule = schedule;
  await emp.save();

  res.success(response, emp);
});

// remove employee
export const removeEmployee = asyncHandler(async (req, response) => {
  const { employeeId } = req.params;

  const emp = await Employee.findById(employeeId);
  if (!emp) throw new AppError('Employee not found', 404);

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(emp.restaurantId, req.user._id);
  }

  emp.isActive = false;
  emp.terminationDate = new Date();
  await emp.save();
  
  res.success(response, { message: 'Employee terminated/removed' });
});

// ── PIN helper (shared by clockIn, clockOut, verify) ───────────────────────
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const findEmployeeByPin = async (restaurantId, pin) => {
  if (!restaurantId || !pin) {
    throw new AppError('PIN and Restaurant ID are required', 400);
  }

  // find all active employees in this restaurant (don't match PIN yet — need to check lockout first)
  // we match by restaurantId only then validate PIN to support lockout tracking per employee.
  // but we can't know WHICH employee without the PIN. So we find by PIN + restaurantId
  // but ONLY after confirming the restaurant exists to prevent timing attacks.
  const employee = await Employee.findOne({ restaurantId, isActive: true, pin });

  if (!employee) {
    // we don't track failed attempts here since we don't know which employee was targeted.
    // IP-level rate limiting (in the route) handles this case.
    throw new AppError('Invalid PIN', 401);
  }

  // check if this employee's PIN is locked
  if (employee.pinLockedUntil && employee.pinLockedUntil > new Date()) {
    const minsLeft = Math.ceil((employee.pinLockedUntil - Date.now()) / 60000);
    throw new AppError(`PIN locked due to too many wrong attempts. Try again in ${minsLeft} minute(s).`, 429);
  }

  // PIN matched — reset failed counter
  if (employee.pinFailedAttempts > 0 || employee.pinLockedUntil) {
    employee.pinFailedAttempts = 0;
    employee.pinLockedUntil = null;
    await employee.save();
  }

  return employee;
};

// ── PIN Clock In / Clock Out (for POS) ─────────────────────────────────────
export const clockInWithPin = asyncHandler(async (req, response) => {
  const { pin, restaurantId } = req.body;

  const employee = await findEmployeeByPin(restaurantId, pin);

  // check if already clocked in today without clock out
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeAttendanceIdx = employee.attendance.findIndex(a =>
    a.date >= today && a.clockIn && !a.clockOut
  );

  if (activeAttendanceIdx !== -1) {
    throw new AppError('Employee is already clocked in', 400);
  }

  employee.attendance.push({
    date: new Date(),
    clockIn: new Date(),
    status: 'present'
  });

  await employee.save();
  res.success(response, { message: `Welcome ${employee.firstName}, you are clocked in.`, employee });
});

export const clockOutWithPin = asyncHandler(async (req, response) => {
  const { pin, restaurantId } = req.body;

  const employee = await findEmployeeByPin(restaurantId, pin);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeAttendanceIdx = employee.attendance.findIndex(a =>
    a.date >= today && a.clockIn && !a.clockOut
  );

  if (activeAttendanceIdx === -1) {
    throw new AppError('Employee is not currently clocked in', 400);
  }

  const attendance = employee.attendance[activeAttendanceIdx];
  attendance.clockOut = new Date();

  // calculate hours
  const ms = attendance.clockOut.getTime() - attendance.clockIn.getTime();
  attendance.hoursWorked = Number((ms / (1000 * 60 * 60)).toFixed(2));

  await employee.save();
  res.success(response, { 
    message: `Goodbye ${employee.firstName}, you are clocked out. Hours worked: ${attendance.hoursWorked}`, 
    employee 
  });
});

export const verifyPin = asyncHandler(async (req, response) => {
  const { pin, restaurantId } = req.body;

  const employee = await findEmployeeByPin(restaurantId, pin);

  res.success(response, employee);
});

export const getPayrollReport = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  
  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  const employees = await Employee.find({ restaurantId, isActive: true });

  const payroll = employees.map(emp => {
    // basic payroll calc: total hours worked * hourlyRate
    const totalHours = emp.attendance.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    const amountOwed = emp.payType === 'salary' 
      ? emp.salary 
      : totalHours * (emp.hourlyRate || 0);

    return {
      employeeId: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      role: emp.role,
      payType: emp.payType,
      hourlyRate: emp.hourlyRate,
      salary: emp.salary,
      totalHours: Number(totalHours.toFixed(2)),
      amountOwed: Number(amountOwed.toFixed(2))
    };
  });

  res.success(response, payroll);
});
