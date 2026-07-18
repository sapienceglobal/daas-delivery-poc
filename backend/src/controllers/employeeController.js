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

// Get all employees for a restaurant
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

// Create employee
export const createEmployee = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const data = req.body;

  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  // Generate a random 4-digit PIN if not provided
  if (!data.pin) {
    data.pin = Math.floor(1000 + Math.random() * 9000).toString();
  } else if (data.pin.length !== 4) {
    throw new AppError('PIN must be exactly 4 digits', 400);
  }

  // Ensure unique PIN for the same restaurant
  const existingPin = await Employee.findOne({ restaurantId, pin: data.pin, isActive: true });
  if (existingPin) {
    throw new AppError('This PIN is already in use by another employee', 400);
  }

  const employee = await Employee.create({ ...data, restaurantId });
  res.success(response, employee, 201);
});

// Update employee
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

// Update employee schedule
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

// Remove employee
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

// PIN Clock In / Clock Out (for POS)
export const clockInWithPin = asyncHandler(async (req, response) => {
  const { pin, restaurantId } = req.body;

  if (!pin || !restaurantId) {
    throw new AppError('PIN and Restaurant ID are required', 400);
  }

  const employee = await Employee.findOne({ restaurantId, pin, isActive: true });
  if (!employee) throw new AppError('Invalid PIN', 401);

  // Check if already clocked in today without clock out
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

  if (!pin || !restaurantId) {
    throw new AppError('PIN and Restaurant ID are required', 400);
  }

  const employee = await Employee.findOne({ restaurantId, pin, isActive: true });
  if (!employee) throw new AppError('Invalid PIN', 401);

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
  
  // Calculate hours
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

  if (!pin || !restaurantId) {
    throw new AppError('PIN and Restaurant ID are required', 400);
  }

  const employee = await Employee.findOne({ restaurantId, pin, isActive: true });
  if (!employee) throw new AppError('Invalid PIN', 401);

  res.success(response, employee);
});

export const getPayrollReport = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  
  if (req.user.role === 'merchant') {
    await verifyRestaurantOwnership(restaurantId, req.user._id);
  }

  const employees = await Employee.find({ restaurantId, isActive: true });

  const payroll = employees.map(emp => {
    // Basic payroll calc: total hours worked * hourlyRate
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
