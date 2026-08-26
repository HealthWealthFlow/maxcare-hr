import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLeave } from '../../context/LeaveContext';
import { LeaveType, LeaveStatus } from '../../types/leave';
import { APP_META } from '../../data/mockData';
import { todayISO } from '../../lib/dates';

export const LeaveHistory: React.FC = () => {
  const { leaveRequests, currentUser } = useLeave();
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Printable monthly report
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportMonth, setReportMonth] = useState<string>(todayISO().slice(0, 7)); // YYYY-MM

  const userRequests = leaveRequests.filter(r => r.employeeId === currentUser.id);

  const filteredRequests = userRequests.filter(r => {
    const matchesYear = r.startDate.startsWith(selectedYear);
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesYear && matchesType && matchesStatus;
  });

  const totalTakenDays = userRequests
    .filter(r => r.status === 'approved' && r.startDate.startsWith(selectedYear))
    .reduce((sum, r) => sum + r.durationDays, 0);

  // --- Report data for the selected month ---
  const reportRequests = userRequests.filter(r => r.startDate.startsWith(reportMonth));
  const reportMonthLabel = new Date(`${reportMonth}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const reportTotalDays = reportRequests.reduce((s, r) => s + r.durationDays, 0);
  const reportApprovedDays = reportRequests
    .filter(r => r.status === 'approved')
    .reduce((s, r) => s + r.durationDays, 0);
  const reportPendingDays = reportRequests
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.durationDays, 0);

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="bg-[#7cf994]/40 text-[#006e2d] font-bold px-3 py-1 rounded-full text-xs tracking-wider uppercase inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006e2d]"></span>
            APPROVED
          </span>
        );
      case 'pending':
        return (
          <span className="bg-[#ffdbce] text-[#973400] font-bold px-3 py-1 rounded-full text-xs tracking-wider uppercase inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#973400]"></span>
            PENDING
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-[#ffdad6] text-[#ba1a1a] font-bold px-3 py-1 rounded-full text-xs tracking-wider uppercase inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBorderColor = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return 'border-l-4 border-l-[#006e2d]';
      case 'pending':
        return 'border-l-4 border-l-[#c04400]';
      case 'rejected':
        return 'border-l-4 border-l-[#ba1a1a]';
      default:
        return 'border-l-4 border-l-[#737686]';
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-8">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
            Leave History
          </h1>
          <p className="text-sm text-[#434655] mt-1">
            Track and review your past and upcoming leave applications.
          </p>
        </div>

        {/* Controls: Year, Report Month, Print */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#c3c6d7] shadow-2xs">
            <span className="text-xs font-bold text-[#434655] uppercase">Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#191b23] focus:outline-none cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#c3c6d7] shadow-2xs">
            <span className="text-xs font-bold text-[#434655] uppercase">Month</span>
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#191b23] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setReportOpen(true)}
            className="bg-[#004ac6] hover:bg-[#003ea8] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Monthly Report
          </button>
        </div>
      </div>

      {/* Hero Summary Card */}
      <div className="bg-[#f3f3fe] rounded-3xl p-6 md:p-8 shadow-xs border border-[#e1e2ed] relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1 relative z-10">
          <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
            Total Taken This Year
          </span>
          <div className="text-3xl md:text-4xl font-bold text-[#191b23]">
            {totalTakenDays} <span className="text-base font-medium text-[#434655]">Days</span>
          </div>
          <p className="text-xs text-[#737686]">
            Includes all approved annual, unpaid, and emergency leaves for {selectedYear}.
          </p>
        </div>
        <div className="hidden sm:block opacity-15 pointer-events-none pr-4">
          <span className="material-symbols-outlined text-8xl text-[#004ac6]">
            flight_takeoff
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-center justify-between pt-2">
        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'annual', label: 'Annual Leave' },
            { id: 'sick', label: 'Medical Leave' },
            { id: 'unpaid', label: 'Unpaid Leave' },
            { id: 'emergency', label: 'Emergency Leave' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                typeFilter === f.id
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'bg-white text-[#434655] border border-[#c3c6d7]/60 hover:bg-[#ededf9]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'approved', label: 'Approved' },
            { id: 'pending', label: 'Pending' },
            { id: 'rejected', label: 'Rejected' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? 'bg-[#191b23] text-white'
                  : 'bg-[#ededf9] text-[#434655] hover:bg-[#e1e2ed]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Applications List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#e1e2ed]">
            <span className="material-symbols-outlined text-5xl text-[#c3c6d7] mb-2">
              event_busy
            </span>
            <h3 className="text-lg font-bold text-[#191b23]">No leave records found</h3>
            <p className="text-sm text-[#434655] mt-1">
              Try adjusting your year, type, or status filters.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <article
              key={req.id}
              className={`bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-[#e1e2ed] transition-all hover:shadow-md ${getStatusBorderColor(
                req.status
              )}`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-[#191b23] capitalize">
                      {req.type === 'annual'
                        ? 'Annual Leave'
                        : req.type === 'sick'
                        ? 'Medical Leave'
                        : req.type === 'emergency'
                        ? 'Emergency Leave'
                        : 'Unpaid Leave'}
                    </span>
                    <span className="text-xs text-[#737686] font-medium bg-[#f3f3fe] px-2 py-0.5 rounded-md">
                      {req.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-[#434655]">
                    <span className="font-semibold text-[#191b23] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#004ac6]">
                        date_range
                      </span>
                      {req.startDate === req.endDate
                        ? `${req.startDate} • ${req.durationDays} Day`
                        : `${req.startDate} to ${req.endDate} • ${req.durationDays} Days`}
                    </span>
                    
                    <span className="flex items-center gap-1 text-xs">
                      <span className="material-symbols-outlined text-[16px] text-[#737686]">
                        schedule
                      </span>
                      {req.actualNoticeDays} Days Notice {req.isLate && <span className="text-[#ba1a1a] font-bold">(Late)</span>}
                    </span>
                  </div>

                  <div className="text-sm text-[#434655] pt-1">
                    <span className="font-medium text-[#191b23]">Reason: </span>
                    {req.reason}
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                  {getStatusBadge(req.status)}
                  <span className="text-xs text-[#737686]">
                    Submitted {req.submittedDate}
                  </span>
                </div>
              </div>

              {/* Rejection Details Callout if rejected */}
              {req.status === 'rejected' && req.rejectionReason && (
                <div className="mt-4 p-3.5 bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    report_problem
                  </span>
                  <div>
                    <span className="font-bold">Reason for Rejection: </span>
                    {req.rejectionReason}
                  </div>
                </div>
              )}
            </article>
          ))
        )}
      </div>

      {/* Printable Monthly Report Modal (portaled to <body> so it prints independently of the app) */}
      {reportOpen &&
        createPortal(
          <div className="print-modal-wrap fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="no-print absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setReportOpen(false)}></div>
            <div className="print-modal-card relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
            <div className="p-6 md:p-8 print-area">
              {/* Report header */}
              <div className="border-b-2 border-[#191b23] pb-4 mb-4">
                <h2 className="text-xl font-bold text-[#191b23]">{APP_META.company}</h2>
                <p className="text-xs text-[#434655]">{APP_META.name} — Monthly Leave Summary</p>
              </div>

              {/* Employee info */}
              <div className="text-sm mb-4">
                <div className="font-bold text-lg text-[#191b23]">
                  {currentUser.name} <span className="text-[#434655] font-semibold">({currentUser.empCode})</span>
                </div>
                <div className="text-[#434655]">
                  {currentUser.role} • {currentUser.department}
                </div>
                <div className="text-xs text-[#737686] mt-1">
                  Report month: <span className="font-bold text-[#191b23]">{reportMonthLabel}</span>
                </div>
              </div>

              {/* Leave records */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#191b23]">
                    <th className="py-1.5 font-bold">Date(s)</th>
                    <th className="font-bold">Type</th>
                    <th className="font-bold text-center">Days</th>
                    <th className="font-bold">Status</th>
                    <th className="font-bold">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-[#737686]">No leave records for this month.</td>
                    </tr>
                  ) : (
                    reportRequests.map(r => (
                      <tr key={r.id} className="border-b border-[#e1e2ed]">
                        <td className="py-1.5">{r.startDate === r.endDate ? r.startDate : `${r.startDate} to ${r.endDate}`}</td>
                        <td className="capitalize">{r.type}</td>
                        <td className="text-center">{r.durationDays}</td>
                        <td className="uppercase">{r.status}</td>
                        <td>{r.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs">
                <div className="bg-[#faf8ff] rounded-xl p-3">
                  <div className="text-[#434655]">Total Days</div>
                  <div className="text-xl font-bold text-[#191b23]">{reportTotalDays}</div>
                </div>
                <div className="bg-[#dcfce7]/40 rounded-xl p-3">
                  <div className="text-[#006e2d]">Approved</div>
                  <div className="text-xl font-bold text-[#006e2d]">{reportApprovedDays}</div>
                </div>
                <div className="bg-[#ffdbce]/50 rounded-xl p-3">
                  <div className="text-[#973400]">Pending</div>
                  <div className="text-xl font-bold text-[#973400]">{reportPendingDays}</div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-8 pt-6 border-t border-dashed border-[#737686]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                  <div>
                    <div className="text-[#434655] mb-12">Employee Acknowledgement & Signature</div>
                    <div className="h-px bg-[#191b23]"></div>
                    <div className="flex justify-between mt-1">
                      <span className="font-semibold">Name: {currentUser.name}</span>
                      <span>Date: __________</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[#434655] mb-12">Prepared by ({APP_META.managerLabel})</div>
                    <div className="h-px bg-[#191b23]"></div>
                    <div className="flex justify-between mt-1">
                      <span className="font-semibold">Name: __________</span>
                      <span>Date: __________</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions (not printed) */}
            <div className="no-print p-4 border-t border-[#e1e2ed] flex justify-end gap-2">
              <button
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#434655] hover:bg-[#ededf9] rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold bg-[#004ac6] text-white rounded-xl shadow-xs"
              >
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
