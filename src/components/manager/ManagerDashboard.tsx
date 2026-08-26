import React from 'react';
import { useLeave } from '../../context/LeaveContext';
import { todayISO, currentYearMonthPrefix, formatShortDate } from '../../lib/dates';

export const ManagerDashboard: React.FC = () => {
  const { leaveRequests, employees, setCurrentTab, setSelectedRequestIdForReview } = useLeave();

  const today = todayISO();
  const yearMonth = currentYearMonthPrefix();
  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const todayOnLeave = leaveRequests.filter(r => r.status === 'approved' && today >= r.startDate && today <= r.endDate);
  const upcomingCount = leaveRequests.filter(r => r.status === 'approved' && r.startDate >= today).length;
  const thisMonthTotalDays = leaveRequests
    .filter(r => r.status === 'approved' && r.startDate.startsWith(yearMonth))
    .reduce((sum, r) => sum + r.durationDays, 0);

  const handleReview = (reqId: string) => {
    setSelectedRequestIdForReview(reqId);
    setCurrentTab('manager-requests');
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-sm text-[#434655] mt-1">
            Review and manage team leave requests, monitor workforce availability, and manage policy.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentTab('manager-reports')}
            className="bg-white hover:bg-[#faf8ff] text-[#191b23] border border-[#c3c6d7] text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">summarize</span>
            Leave Reports
          </button>
          <button
            onClick={() => setCurrentTab('manager-employees')}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Adjust Balances
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Requests */}
        <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Pending Requests
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#ffdbce] text-[#973400] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </span>
          </div>
          <div className="text-3xl font-bold text-[#973400] mb-1">
            {pendingRequests.length}
          </div>
          <p className="text-xs text-[#737686]">Action required immediately</p>
        </div>

        {/* Today On Leave */}
        <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Today On Leave
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#dbe1ff] text-[#004ac6] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </span>
          </div>
          <div className="text-3xl font-bold text-[#191b23] mb-1">
            {todayOnLeave.length}
          </div>
          <p className="text-xs text-[#737686]">Currently out of office</p>
        </div>

        {/* Upcoming Leave */}
        <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Upcoming Leave
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#dcfce7] text-[#006e2d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            </span>
          </div>
          <div className="text-3xl font-bold text-[#191b23] mb-1">
            {upcomingCount}
          </div>
          <p className="text-xs text-[#737686]">Upcoming approved leave</p>
        </div>

        {/* This Month Leaves */}
        <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              This Month Leaves
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#ebdcfc] text-[#795290] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </span>
          </div>
          <div className="text-3xl font-bold text-[#191b23] mb-1">
            {thisMonthTotalDays} <span className="text-base font-medium text-[#434655]">Days</span>
          </div>
          <p className="text-xs text-[#737686]">Total team days consumed</p>
        </div>
      </div>

      {/* Action Required: Pending Requests List */}
      <section className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-[#e1e2ed] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#973400] text-[22px]">
              warning
            </span>
            <h2 className="text-xl font-bold text-[#191b23]">
              Action Required ({pendingRequests.length})
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#737686]">
            Sorted by priority
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-5xl text-[#006e2d] mb-2">
              task_alt
            </span>
            <h3 className="text-lg font-bold text-[#191b23]">All Caught Up!</h3>
            <p className="text-xs text-[#737686] mt-1">There are no pending leave applications to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#faf8ff] hover:bg-[#f3f3fe] rounded-2xl p-5 border border-[#e1e2ed] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Employee Info & Leave Specs */}
                <div className="flex items-start gap-4">
                  <img
                    src={req.employeeAvatar}
                    alt={req.employeeName}
                    className="w-12 h-12 rounded-full object-cover shadow-2xs border-2 border-white shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-base text-[#191b23]">
                        {req.employeeName}
                      </span>
                      <span className="text-xs text-[#737686]">
                        • {req.employeeRole}
                      </span>
                      <span className="bg-[#ededf9] text-[#434655] font-bold text-[10px] px-2 py-0.5 rounded-md">
                        {req.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="font-bold text-[#004ac6] capitalize">
                        {req.type === 'annual' ? 'Annual Leave' : req.type === 'sick' ? 'Medical Leave' : req.type === 'emergency' ? 'Emergency Leave' : 'Unpaid Leave'}
                      </span>
                      <span className="text-[#191b23] font-semibold">
                        {req.startDate === req.endDate
                          ? `${req.startDate} (${req.durationDays} Day)`
                          : `${req.startDate} to ${req.endDate} (${req.durationDays} Days)`}
                      </span>

                      {/* Notice Tag */}
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        req.isLate 
                          ? 'bg-[#ffdad6] text-[#ba1a1a]' 
                          : 'bg-[#dcfce7] text-[#006e2d]'
                      }`}>
                        {req.actualNoticeDays} Days Notice {req.isLate && '⚠️ LATE'}
                      </span>
                    </div>

                    <p className="text-xs text-[#434655] pt-0.5 line-clamp-1">
                      <span className="font-medium text-[#191b23]">Reason: </span>
                      {req.reason}
                    </p>
                  </div>
                </div>

                {/* Review Action */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleReview(req.id)}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>Review Application</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today on Leave quick roster */}
      <section className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs">
        <h3 className="text-base font-bold text-[#191b23] mb-4">
          Today on Leave ({formatShortDate(today)})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {todayOnLeave.map(l => (
            <div key={l.id} className="p-3.5 bg-[#f3f3fe] rounded-2xl flex items-center gap-3 border border-[#e1e2ed]">
              <img src={l.employeeAvatar} alt={l.employeeName} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-bold text-xs text-[#191b23]">{l.employeeName}</div>
                <div className="text-[11px] text-[#737686]">{l.employeeRole}</div>
                <div className="text-[10px] font-semibold text-[#004ac6] mt-0.5 capitalize">{l.type} Leave</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
