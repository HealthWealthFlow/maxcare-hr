import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { LeaveType } from '../../types/leave';

export const TeamRoster: React.FC = () => {
  const { 
    employees, 
    selectedEmployeeId, 
    setSelectedEmployeeId, 
    selectedEmployee,
    adjustments, 
    saveAdjustment,
    setUserPassword
  } = useLeave();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [adjType, setAdjType] = useState<LeaveType>('annual');
  const [adjDays, setAdjDays] = useState<number>(2);
  const [adjReason, setAdjReason] = useState<string>('Performance bonus leave awarded by management.');
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);
  const [staffNewPw, setStaffNewPw] = useState<string>('');
  const [staffPwMsg, setStaffPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSetPassword = () => {
    setStaffPwMsg(null);
    if (staffNewPw.length < 6) {
      setStaffPwMsg({ ok: false, text: 'Password must be at least 6 characters.' });
      return;
    }
    setUserPassword(selectedEmployee.id, staffNewPw);
    setStaffNewPw('');
    setStaffPwMsg({ ok: true, text: `Password set for ${selectedEmployee.name}.` });
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const employeeAdjustments = adjustments.filter(a => a.employeeId === selectedEmployee.id);

  const currentEntitlement = adjType === 'annual' 
    ? selectedEmployee.entitlements.annualTotal 
    : selectedEmployee.entitlements.sickTotal;

  const calculatedNewTotal = Math.max(0, currentEntitlement + (Number(adjDays) || 0));

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjReason.trim()) return;

    saveAdjustment(selectedEmployee.id, adjType, Number(adjDays), adjReason);
    setShowSavedNotification(true);
    setTimeout(() => {
      setShowSavedNotification(false);
    }, 3000);
  };

  const availableAL = Math.max(0, selectedEmployee.entitlements.annualTotal - selectedEmployee.entitlements.annualUsed - selectedEmployee.entitlements.annualPending);

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
          Team Roster & Balances
        </h1>
        <p className="text-sm text-[#434655] mt-1">
          Manage team members, monitor real-time leave quotas, and perform audited balance adjustments.
        </p>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Employee List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-[#e1e2ed] shadow-xs space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#737686] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search team members..."
                className="w-full bg-[#faf8ff] rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
              />
            </div>

            <div className="space-y-2">
              {filteredEmployees.map((emp) => {
                const isSelected = emp.id === selectedEmployee.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-[#dbe1ff]/60 border-[#004ac6] shadow-2xs'
                        : 'bg-white hover:bg-[#f3f3fe] border-[#e1e2ed]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover shadow-2xs border border-white shrink-0"
                      />
                      <div>
                        <div className="text-sm font-bold text-[#191b23]">{emp.name}</div>
                        <div className="text-[11px] text-[#737686]">{emp.department} • {emp.empCode}</div>
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-[18px] text-[#737686]">
                      chevron_right
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Selected Employee Overview & Adjustments */}
        <div className="lg:col-span-8 space-y-6">
          {/* Employee Header */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white"
              />
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl font-bold text-[#191b23]">
                    {selectedEmployee.name}
                  </h2>
                  <span className="bg-[#dcfce7] text-[#006e2d] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-[#434655] font-medium">{selectedEmployee.role}</p>
                <p className="text-xs text-[#737686]">{selectedEmployee.department} • {selectedEmployee.email}</p>
              </div>
            </div>

            <div className="bg-[#f3f3fe] px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#004ac6] border border-[#e1e2ed]">
              {selectedEmployee.empCode}
            </div>
          </div>

          {/* 3 Quick Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* AL */}
            <div className="bg-[#f3f3fe] p-4 rounded-2xl border border-[#e1e2ed]">
              <span className="text-[11px] font-bold text-[#434655] uppercase">Annual Leave</span>
              <div className="text-2xl font-bold text-[#191b23] my-1">
                {availableAL} <span className="text-xs font-normal text-[#434655]">Avail</span>
              </div>
              <div className="text-[10px] text-[#737686] flex justify-between">
                <span>Total: {selectedEmployee.entitlements.annualTotal}</span>
                <span>Used: {selectedEmployee.entitlements.annualUsed}</span>
              </div>
            </div>

            {/* Unpaid */}
            <div className="bg-white p-4 rounded-2xl border border-[#e1e2ed]">
              <span className="text-[11px] font-bold text-[#434655] uppercase">Unpaid Leave</span>
              <div className="text-2xl font-bold text-[#191b23] my-1">
                {selectedEmployee.entitlements.unpaidApprovedYTD} <span className="text-xs font-normal text-[#434655]">Days</span>
              </div>
              <div className="text-[10px] text-[#737686]">
                Pending: {selectedEmployee.entitlements.unpaidPending} Day(s)
              </div>
            </div>

            {/* Emergency */}
            <div className="bg-white p-4 rounded-2xl border border-[#e1e2ed]">
              <span className="text-[11px] font-bold text-[#434655] uppercase">Emergency Leave</span>
              <div className="text-2xl font-bold text-[#191b23] my-1">
                {selectedEmployee.entitlements.emergencyApprovedYTD} <span className="text-xs font-normal text-[#434655]">Days</span>
              </div>
              <div className="text-[10px] text-[#737686]">
                Pending: {selectedEmployee.entitlements.emergencyPending} Day(s)
              </div>
            </div>
          </div>

          {/* Manual Balance Adjustment Form */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-[#e1e2ed] pb-3">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px]">
                tune
              </span>
              <h3 className="text-base font-bold text-[#191b23]">
                Manual Balance Adjustment
              </h3>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                    Leave Type
                  </label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as LeaveType)}
                    className="w-full bg-[#faf8ff] rounded-xl px-3 py-2.5 text-xs text-[#191b23] font-medium border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                    Adjustment (Days)
                  </label>
                  <input
                    type="number"
                    value={adjDays}
                    onChange={(e) => setAdjDays(parseInt(e.target.value, 10) || 0)}
                    placeholder="+2 or -1"
                    className="w-full bg-[#faf8ff] rounded-xl px-3 py-2.5 text-xs text-[#191b23] font-bold border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                  />
                </div>
              </div>

              {/* Effective Calculation Preview Box */}
              <div className="p-3 bg-[#dbe1ff]/40 rounded-xl border border-[#b4c5ff]/50 flex items-center justify-between text-xs">
                <span className="text-[#434655] font-medium">Impact Preview:</span>
                <div className="font-bold text-[#004ac6]">
                  Current Total: {currentEntitlement} Days → New Total: {calculatedNewTotal} Days ({adjDays >= 0 ? `+${adjDays}` : adjDays} Days)
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Performance bonus leave awarded by management."
                  className="w-full bg-[#faf8ff] rounded-xl px-3 py-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>

          {/* Adjustment History & Audit */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#191b23] border-b border-[#e1e2ed] pb-3">
              Adjustment History & Audit Log
            </h3>

            {employeeAdjustments.length === 0 ? (
              <p className="text-xs text-[#737686] italic py-3">No manual adjustments recorded for this employee.</p>
            ) : (
              <div className="space-y-3">
                {employeeAdjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="p-4 bg-[#faf8ff] rounded-2xl border border-[#e1e2ed] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold px-2 py-0.5 rounded-md ${adj.days >= 0 ? 'bg-[#dcfce7] text-[#006e2d]' : 'bg-[#fee2e2] text-[#ba1a1a]'}`}>
                          {adj.days >= 0 ? `+${adj.days}` : adj.days} Days ({adj.type.toUpperCase()})
                        </span>
                        <span className="text-[#737686]">{adj.date}</span>
                      </div>
                      <p className="text-[#191b23] font-medium">{adj.reason}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#434655] font-semibold shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-[#737686]">verified_user</span>
                      <span>{adj.byUser}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Set / Reset Staff Password */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#191b23] border-b border-[#e1e2ed] pb-3">
              Set / Reset Password
            </h3>
            <p className="text-xs text-[#737686]">
              Set a new password for <span className="font-semibold text-[#191b23]">{selectedEmployee.name}</span>. They can
              change it later from their own Profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={staffNewPw}
                onChange={(e) => setStaffNewPw(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="flex-1 bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
              />
              <button
                onClick={handleSetPassword}
                className="bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                Set Password
              </button>
            </div>
            {staffPwMsg && (
              <p className={`text-xs font-semibold flex items-center gap-1 ${staffPwMsg.ok ? 'text-[#006e2d]' : 'text-[#ba1a1a]'}`}>
                <span className="material-symbols-outlined text-[16px]">{staffPwMsg.ok ? 'check_circle' : 'error'}</span>
                {staffPwMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Saved Toast */}
      {showSavedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006e2d] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-bold">Adjustment successfully applied and logged to audit!</span>
        </div>
      )}
    </div>
  );
};
