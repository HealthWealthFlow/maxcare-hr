export type LeaveType = 'annual' | 'unpaid' | 'emergency' | 'sick';

export type LeaveStatus = 'approved' | 'pending' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  employeeAvatar: string;
  department: string;
  type: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  reason: string;
  status: LeaveStatus;
  submittedDate: string;
  rejectionReason?: string;
  supportingDocName?: string;
  isLate: boolean;
  requiredNoticeDays: number;
  actualNoticeDays: number;
}

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  email: string;
  phone: string;
  status: 'active' | 'on_leave' | 'inactive';
  joinDate?: string; // YYYY-MM-DD — used for Earn-to-Date leave calculation
  // The FULL per-year allowance (before pro-rating), used to auto-roll entitlements each year.
  fullEntitlements?: { annual: number; medical: number };
  entitlements: {
    annualTotal: number;
    annualUsed: number;
    annualPending: number;
    unpaidApprovedYTD: number;
    unpaidPending: number;
    emergencyApprovedYTD: number;
    emergencyPending: number;
    sickTotal: number;
    sickUsed: number;
  };
}

export interface AdjustmentRecord {
  id: string;
  employeeId: string;
  type: LeaveType;
  days: number; // positive for addition, negative for subtraction
  date: string;
  reason: string;
  byUser: string;
  byAvatar?: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: string;
  month: string;
  description: string;
}

export interface LeavePolicy {
  annualNoticeDays: number;
  unpaidNoticeDays: number;
  emergencyNoticeDays: number;
  emergencyTreatment: 'deduct_annual' | 'unpaid' | 'separate';
  workingDays: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
}

export type PortalMode = 'employee' | 'manager';

/** A login account. Staff map to an employee record; the manager account is separate. */
export interface User {
  id: string;
  name?: string; // display label
  username: string; // cannot be edited
  password: string;
  role: PortalMode;
  employeeId?: string; // only for staff
}

export type ViewTab = 
  // Employee Tabs
  | 'home' 
  | 'apply' 
  | 'calendar' 
  | 'history' 
  | 'profile' 
  // Manager Tabs
  | 'manager-dashboard' 
  | 'manager-requests' 
  | 'manager-calendar' 
  | 'manager-employees' 
  | 'manager-settings' 
  | 'manager-reports'
  | 'manager-assistant';
