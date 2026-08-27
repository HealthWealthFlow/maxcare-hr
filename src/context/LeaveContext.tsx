import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Employee, 
  LeaveRequest, 
  PublicHoliday, 
  LeavePolicy, 
  AdjustmentRecord, 
  PortalMode, 
  ViewTab,
  LeaveType,
  User
} from '../types/leave';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_HOLIDAYS, 
  INITIAL_POLICY, 
  INITIAL_ADJUSTMENTS,
  APP_ASSETS 
} from '../data/mockData';
import { proRateEntitlement } from '../lib/dates';
import { sheetsApiUrl, fetchSheetSnapshot, pushSheetAction } from '../lib/sheets';

// Bump this whenever the seed data in mockData.ts changes so the app re-loads it
// instead of keeping stale localStorage from an earlier session.
const DATA_VERSION = 'v9';

function readSeed<T>(key: string, fallback: T): T {
  if (localStorage.getItem('leavehr_data_version') !== DATA_VERSION) return fallback;
  const saved = localStorage.getItem(key);
  return saved ? (JSON.parse(saved) as T) : fallback;
}

// Default login accounts. The manager can reset staff passwords in the Team Roster.
// Note: stored per-browser (localStorage) — on a static GitHub Pages deploy there's no server.
const SEED_USERS: User[] = [
  { id: 'user-manager', name: 'Maxcare Pharmacy', username: 'Maxcare', password: 'Maxcare@2026', role: 'manager' },
  { id: 'user-lee', name: 'Lee Xin Mei', username: 'Lee Xin Mei', password: 'Lee@2026', role: 'employee', employeeId: 'emp-1' },
  { id: 'user-nurul', name: 'Nurul Farahin', username: 'Nurul Farahin', password: 'Nurul@2026', role: 'employee', employeeId: 'emp-2' },
  { id: 'user-chow', name: 'Chow Mei Yen', username: 'Chow Mei Yen', password: 'Chow@2026', role: 'employee', employeeId: 'emp-3' },
];

interface LeaveContextType {
  mode: PortalMode;
  setMode: (mode: PortalMode) => void;
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  currentUser: Employee;
  employees: Employee[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  selectedEmployee: Employee;
  activeEmployeeId: string;
  setActiveEmployeeId: (id: string) => void;
  users: User[];
  login: (username: string, password: string) => { ok: boolean; error?: string };
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
  setUserPassword: (employeeId: string, newPassword: string) => void;
  logout: () => void;
  leaveRequests: LeaveRequest[];
  adjustments: AdjustmentRecord[];
  holidays: PublicHoliday[];
  policy: LeavePolicy;
  selectedRequestIdForReview: string | null;
  setSelectedRequestIdForReview: (id: string | null) => void;
  
  // Actions
  applyLeave: (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedDate' | 'employeeId' | 'employeeName' | 'employeeRole' | 'employeeAvatar' | 'department'>) => LeaveRequest;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
  saveAdjustment: (employeeId: string, type: LeaveType, days: number, reason: string) => void;
  updateEmployeeAvatar: (employeeId: string, dataUrl: string) => void;
  updatePolicy: (newPolicy: Partial<LeavePolicy>) => void;
  addHoliday: (name: string, date: string, description?: string) => void;
  deleteHoliday: (holidayId: string) => void;
  calculateWorkingDays: (startDateStr: string, endDateStr: string) => number;
  calculateNoticeDays: (startDateStr: string) => number;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => Boolean(localStorage.getItem('maxcare_loggedin_user')));
  const [mode, setMode] = useState<PortalMode>(() => (localStorage.getItem('leavehr_mode') === 'manager' ? 'manager' : 'employee'));
  const [currentTab, setCurrentTab] = useState<ViewTab>(() => (localStorage.getItem('leavehr_mode') === 'manager' ? 'manager-dashboard' : 'home'));
  const [employees, setEmployees] = useState<Employee[]>(() => readSeed('leavehr_employees', INITIAL_EMPLOYEES));
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => readSeed('leavehr_requests', INITIAL_LEAVE_REQUESTS));
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>(() => readSeed('leavehr_adjustments', INITIAL_ADJUSTMENTS));
  const [holidays, setHolidays] = useState<PublicHoliday[]>(() => readSeed('leavehr_holidays', INITIAL_HOLIDAYS));
  const [policy, setPolicy] = useState<LeavePolicy>(() => readSeed('leavehr_policy', INITIAL_POLICY));

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-1');
  const [selectedRequestIdForReview, setSelectedRequestIdForReview] = useState<string | null>('REQ-9921A');
  // Which staff member the employee portal is currently "viewing as" (preview switch).
  // On reload, restore the account tied to the logged-in user (so their own info shows).
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>(() => {
    const savedUserId = localStorage.getItem('maxcare_loggedin_user');
    if (!savedUserId) return 'emp-1';
    try {
      const list: User[] = JSON.parse(localStorage.getItem('maxcare_users') || '[]');
      const u = list.find((x) => x.id === savedUserId) || SEED_USERS.find((x) => x.id === savedUserId);
      if (u && u.employeeId) return u.employeeId;
    } catch {
      /* ignore */
    }
    return 'emp-1';
  });

  const [users, setUsers] = useState<User[]>(() => {
    if (localStorage.getItem('leavehr_data_version') !== DATA_VERSION) return SEED_USERS;
    const saved = localStorage.getItem('maxcare_users');
    return saved ? (JSON.parse(saved) as User[]) : SEED_USERS;
  });
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => localStorage.getItem('maxcare_loggedin_user'));

  // Optional Google Sheets backend (set VITE_SHEETS_API_URL); empty → use localStorage.
  const SHEETS_URL = sheetsApiUrl();

  // Persistence to local storage
  useEffect(() => {
    localStorage.setItem('leavehr_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('leavehr_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('leavehr_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem('leavehr_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('leavehr_policy', JSON.stringify(policy));
  }, [policy]);

  useEffect(() => {
    localStorage.setItem('leavehr_loggedin', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('leavehr_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('maxcare_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('maxcare_loggedin_user', loggedInUserId || '');
  }, [loggedInUserId]);

  useEffect(() => {
    localStorage.setItem('leavehr_data_version', DATA_VERSION);
  }, []);

  // Auto-rollover: at the start of each new year, recompute each employee's pro-rated
  // entitlement for that year and reset the year's used/pending counters (history is kept).
  useEffect(() => {
    const year = String(new Date().getFullYear());
    const prevYear = localStorage.getItem('maxcare_entitlements_year');
    if (prevYear === year) return;

    setEmployees(emps =>
      emps.map(emp => {
        const full = emp.fullEntitlements || { annual: emp.entitlements.annualTotal, medical: emp.entitlements.sickTotal };
        const join = emp.joinDate || '2024-01-01';
        const annualTotal = proRateEntitlement(full.annual, join, Number(year));
        const sickTotal = proRateEntitlement(full.medical, join, Number(year));
        const base = { ...emp, entitlements: { ...emp.entitlements, annualTotal, sickTotal } };
        // First time (no stored year) → keep the seeded used/pending. New year → reset them.
        if (!prevYear) return base;
        return {
          ...base,
          entitlements: {
            ...base.entitlements,
            annualUsed: 0,
            annualPending: 0,
            unpaidApprovedYTD: 0,
            unpaidPending: 0,
            emergencyApprovedYTD: 0,
            emergencyPending: 0,
            sickUsed: 0,
          },
        };
      }),
    );
    localStorage.setItem('maxcare_entitlements_year', year);
  }, []);

  // Load all data from Google Sheets on mount when configured (localStorage is the fallback).
  useEffect(() => {
    if (!SHEETS_URL) return;
    fetchSheetSnapshot(SHEETS_URL)
      .then((snap) => {
        if (!snap) return;
        if (snap.employees?.length) setEmployees(snap.employees);
        if (snap.leaveRequests) setLeaveRequests(snap.leaveRequests);
        if (snap.adjustments) setAdjustments(snap.adjustments);
        if (snap.holidays) setHolidays(snap.holidays);
        if (snap.policy) setPolicy(snap.policy);
      })
      .catch(() => {});
  }, []);

  const currentUser = employees.find(e => e.id === activeEmployeeId) || employees[0];
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || currentUser;

  // Calculate working days between two dates taking into account company operational days and public holidays
  const calculateWorkingDays = (startDateStr: string, endDateStr: string): number => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    const holidayDates = new Set(holidays.map(h => h.date));

    while (cur <= end) {
      const dayOfWeek = cur.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
      const isWorkingDay = 
        (dayOfWeek === 1 && policy.workingDays.mon) ||
        (dayOfWeek === 2 && policy.workingDays.tue) ||
        (dayOfWeek === 3 && policy.workingDays.wed) ||
        (dayOfWeek === 4 && policy.workingDays.thu) ||
        (dayOfWeek === 5 && policy.workingDays.fri) ||
        (dayOfWeek === 6 && policy.workingDays.sat) ||
        (dayOfWeek === 0 && policy.workingDays.sun);

      const dateISO = cur.toISOString().split('T')[0];
      const isHoliday = holidayDates.has(dateISO);

      if (isWorkingDay && !isHoliday) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return Math.max(1, count);
  };

  const calculateNoticeDays = (startDateStr: string): number => {
    if (!startDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(startDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Push an employee's full balance row to the Google Sheet (keeps the Sheet in sync).
  const pushEmployee = (emp: Employee) => {
    if (!SHEETS_URL) return;
    pushSheetAction(SHEETS_URL, 'updateEmployee', {
      id: emp.id, empCode: emp.empCode, name: emp.name, role: emp.role, department: emp.department,
      avatar: emp.avatar, email: emp.email, phone: emp.phone, status: emp.status, joinDate: emp.joinDate || '',
      annualFull: emp.fullEntitlements?.annual ?? emp.entitlements.annualTotal,
      medicalFull: emp.fullEntitlements?.medical ?? emp.entitlements.sickTotal,
      annualTotal: emp.entitlements.annualTotal, annualUsed: emp.entitlements.annualUsed, annualPending: emp.entitlements.annualPending,
      unpaidApprovedYTD: emp.entitlements.unpaidApprovedYTD, unpaidPending: emp.entitlements.unpaidPending,
      emergencyApprovedYTD: emp.entitlements.emergencyApprovedYTD, emergencyPending: emp.entitlements.emergencyPending,
      sickTotal: emp.entitlements.sickTotal, sickUsed: emp.entitlements.sickUsed,
    });
  };

  const login = (username: string, password: string): { ok: boolean; error?: string } => {
    const user = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase());
    if (!user || user.password !== password) return { ok: false, error: 'Invalid username or password.' };
    setLoggedInUserId(user.id);
    if (user.role === 'manager') {
      setMode('manager');
      setCurrentTab('manager-dashboard');
    } else {
      setMode('employee');
      if (user.employeeId) setActiveEmployeeId(user.employeeId);
      setCurrentTab('home');
    }
    setIsLoggedIn(true);
    return { ok: true };
  };

  const changePassword = (currentPassword: string, newPassword: string): { ok: boolean; error?: string } => {
    if (!loggedInUserId) return { ok: false, error: 'You are not signed in.' };
    const user = users.find(u => u.id === loggedInUserId);
    if (!user) return { ok: false, error: 'Account not found.' };
    if (user.password !== currentPassword) return { ok: false, error: 'Current password is incorrect.' };
    setUsers(prev => prev.map(u => (u.id === loggedInUserId ? { ...u, password: newPassword } : u)));
    return { ok: true };
  };

  const setUserPassword = (employeeId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => (u.employeeId === employeeId ? { ...u, password: newPassword } : u)));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setLoggedInUserId(null);
    setActiveEmployeeId('emp-1');
    setMode('employee');
    setCurrentTab('home');
  };

  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'status' | 'submittedDate' | 'employeeId' | 'employeeName' | 'employeeRole' | 'employeeAvatar' | 'department'>) => {
    const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const today = new Date().toISOString().split('T')[0];

    const newRequest: LeaveRequest = {
      ...req,
      id: newId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeRole: currentUser.role,
      employeeAvatar: currentUser.avatar,
      department: currentUser.department,
      status: 'pending',
      submittedDate: today
    };

    setLeaveRequests(prev => [newRequest, ...prev]);

    pushSheetAction(SHEETS_URL, 'addLeave', {
      id: newRequest.id, employeeId: newRequest.employeeId, employeeName: newRequest.employeeName,
      employeeRole: newRequest.employeeRole, department: newRequest.department, type: newRequest.type,
      startDate: newRequest.startDate, endDate: newRequest.endDate, durationDays: newRequest.durationDays,
      reason: newRequest.reason, status: newRequest.status, submittedDate: newRequest.submittedDate,
      isLate: newRequest.isLate, requiredNoticeDays: newRequest.requiredNoticeDays, actualNoticeDays: newRequest.actualNoticeDays,
    });

    // Update current employee's pending count (+ keep the Sheet in sync)
    const emp = currentUser;
    const ent = { ...emp.entitlements };
    if (req.type === 'annual') {
      ent.annualPending += req.durationDays;
    } else if (req.type === 'unpaid') {
      ent.unpaidPending += req.durationDays;
    } else if (req.type === 'emergency') {
      ent.emergencyPending += req.durationDays;
      // Emergency is allocated from Annual Leave → reserve against annual too.
      if (policy.emergencyTreatment === 'deduct_annual') {
        ent.annualPending += req.durationDays;
      }
    }
    const updatedEmp = { ...emp, entitlements: ent };
    setEmployees(prev => prev.map(e => (e.id === emp.id ? updatedEmp : e)));
    pushEmployee(updatedEmp);

    return newRequest;
  };

  const approveRequest = (requestId: string) => {
    const targetReq = leaveRequests.find(r => r.id === requestId);
    if (!targetReq || targetReq.status === 'approved') return;

    setLeaveRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'approved' };
      }
      return r;
    }));

    // Update employee balances (+ keep the Sheet in sync)
    const targetEmp = employees.find(e => e.id === targetReq.employeeId);
    if (targetEmp) {
      const ent = { ...targetEmp.entitlements };
      if (targetReq.type === 'annual') {
        ent.annualPending = Math.max(0, ent.annualPending - targetReq.durationDays);
        ent.annualUsed += targetReq.durationDays;
      } else if (targetReq.type === 'unpaid') {
        ent.unpaidPending = Math.max(0, ent.unpaidPending - targetReq.durationDays);
        ent.unpaidApprovedYTD += targetReq.durationDays;
      } else if (targetReq.type === 'emergency') {
        ent.emergencyPending = Math.max(0, ent.emergencyPending - targetReq.durationDays);
        ent.emergencyApprovedYTD += targetReq.durationDays;
        if (policy.emergencyTreatment === 'deduct_annual') {
          // Move the reserved annual from pending to used (emergency consumes annual).
          ent.annualPending = Math.max(0, ent.annualPending - targetReq.durationDays);
          ent.annualUsed += targetReq.durationDays;
        }
      } else if (targetReq.type === 'sick') {
        ent.sickUsed += targetReq.durationDays;
      }
      const updatedEmp = { ...targetEmp, entitlements: ent };
      setEmployees(prev => prev.map(e => (e.id === targetEmp.id ? updatedEmp : e)));
      pushEmployee(updatedEmp);
    }

    pushSheetAction(SHEETS_URL, 'setStatus', { id: requestId, status: 'approved' });
  };

  const rejectRequest = (requestId: string, reason: string) => {
    const targetReq = leaveRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    setLeaveRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'rejected', rejectionReason: reason };
      }
      return r;
    }));

    // Clear pending count (+ keep the Sheet in sync)
    const targetEmp = employees.find(e => e.id === targetReq.employeeId);
    if (targetEmp) {
      const ent = { ...targetEmp.entitlements };
      if (targetReq.type === 'annual') {
        ent.annualPending = Math.max(0, ent.annualPending - targetReq.durationDays);
      } else if (targetReq.type === 'unpaid') {
        ent.unpaidPending = Math.max(0, ent.unpaidPending - targetReq.durationDays);
      } else if (targetReq.type === 'emergency') {
        ent.emergencyPending = Math.max(0, ent.emergencyPending - targetReq.durationDays);
        // Release the annual that was reserved for this emergency.
        if (policy.emergencyTreatment === 'deduct_annual') {
          ent.annualPending = Math.max(0, ent.annualPending - targetReq.durationDays);
        }
      }
      const updatedEmp = { ...targetEmp, entitlements: ent };
      setEmployees(prev => prev.map(e => (e.id === targetEmp.id ? updatedEmp : e)));
      pushEmployee(updatedEmp);
    }

    pushSheetAction(SHEETS_URL, 'setStatus', { id: requestId, status: 'rejected', rejectionReason: reason });
  };

  const saveAdjustment = (employeeId: string, type: LeaveType, days: number, reason: string) => {
    const newAdj: AdjustmentRecord = {
      id: `adj-${Date.now()}`,
      employeeId,
      type,
      days,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      reason,
      byUser: 'HR Manager',
      byAvatar: APP_ASSETS.hrDirectorAvatar
    };

    setAdjustments(prev => [newAdj, ...prev]);

    // Update the employee's entitlement total (+ keep the Sheet in sync)
    const targetEmp = employees.find(e => e.id === employeeId);
    if (targetEmp) {
      const ent = { ...targetEmp.entitlements };
      if (type === 'annual') {
        ent.annualTotal = Math.max(0, ent.annualTotal + days);
      } else if (type === 'sick') {
        ent.sickTotal = Math.max(0, ent.sickTotal + days);
      }
      const updatedEmp = { ...targetEmp, entitlements: ent };
      setEmployees(prev => prev.map(e => (e.id === targetEmp.id ? updatedEmp : e)));
      pushEmployee(updatedEmp);
    }

    pushSheetAction(SHEETS_URL, 'addAdjustment', {
      id: newAdj.id, employeeId: newAdj.employeeId, type: newAdj.type, days: newAdj.days,
      date: newAdj.date, reason: newAdj.reason, byUser: newAdj.byUser,
    });
  };

  const updateEmployeeAvatar = (employeeId: string, dataUrl: string) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, avatar: dataUrl } : emp
    ));
  };

  const updatePolicy = (newPolicy: Partial<LeavePolicy>) => {
    setPolicy(prev => {
      const next = { ...prev, ...newPolicy };
      pushSheetAction(SHEETS_URL, 'updatePolicy', {
        annualNoticeDays: next.annualNoticeDays, unpaidNoticeDays: next.unpaidNoticeDays,
        emergencyNoticeDays: next.emergencyNoticeDays, emergencyTreatment: next.emergencyTreatment,
        mon: next.workingDays.mon, tue: next.workingDays.tue, wed: next.workingDays.wed, thu: next.workingDays.thu,
        fri: next.workingDays.fri, sat: next.workingDays.sat, sun: next.workingDays.sun,
      });
      return next;
    });
  };

  const addHoliday = (name: string, date: string, description: string = 'Statutory Public Holiday') => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const newH: PublicHoliday = {
      id: `hol-${Date.now()}`,
      name,
      date,
      day,
      month,
      description
    };
    setHolidays(prev => [...prev, newH]);
    pushSheetAction(SHEETS_URL, 'addHoliday', {
      id: newH.id, name: newH.name, date: newH.date, day: newH.day, month: newH.month, description: newH.description,
    });
  };

  const deleteHoliday = (holidayId: string) => {
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    pushSheetAction(SHEETS_URL, 'deleteHoliday', { id: holidayId });
  };

  return (
    <LeaveContext.Provider
      value={{
        mode,
        setMode,
        currentTab,
        setCurrentTab,
        isLoggedIn,
        setIsLoggedIn,
        currentUser,
        employees,
        selectedEmployeeId,
        setSelectedEmployeeId,
        selectedEmployee,
        activeEmployeeId,
        setActiveEmployeeId,
        users,
        login,
        changePassword,
        setUserPassword,
        logout,
        leaveRequests,
        adjustments,
        holidays,
        policy,
        selectedRequestIdForReview,
        setSelectedRequestIdForReview,
        applyLeave,
        approveRequest,
        rejectRequest,
        saveAdjustment,
        updateEmployeeAvatar,
        updatePolicy,
        addHoliday,
        deleteHoliday,
        calculateWorkingDays,
        calculateNoticeDays
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
};

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
};
