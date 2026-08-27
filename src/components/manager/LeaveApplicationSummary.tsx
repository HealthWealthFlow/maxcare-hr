import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';

type PeriodMode = 'year' | 'month' | 'all';

const leaveTypeLabel = (t: string) =>
  t === 'annual' ? 'Annual' : t === 'sick' ? 'Medical' : t === 'emergency' ? 'Emergency' : 'Unpaid';

const decisionBadge = (status: string): { text: string; cls: string } => {
  if (status === 'approved') return { text: 'Approved', cls: 'bg-[#dcfce7] text-[#006e2d]' };
  if (status === 'rejected') return { text: 'Rejected', cls: 'bg-[#fee2e2] text-[#ba1a1a]' };
  return { text: 'Pending', cls: 'bg-[#ffdbce] text-[#973400]' };
};

export const LeaveApplicationSummary: React.FC = () => {
  const { leaveRequests, employees } = useLeave();
  const [empFilter, setEmpFilter] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodMode>('year');
  const [year, setYear] = useState<string>('2026');
  const [month, setMonth] = useState<string>('01');

  const selectedEmp = employees.find((e) => e.id === empFilter);
  const join = selectedEmp?.joinDate || '2020-01-01';

  const inRange = (r: { startDate: string }) => {
    const d = r.startDate;
    if (period === 'year') return d.startsWith(year);
    if (period === 'month') return d.startsWith(`${year}-${month}`);
    // up-to-date since the employee first started working
    return empFilter === 'all' ? true : d >= join;
  };

  const requests = leaveRequests
    .filter((r) => (empFilter === 'all' ? true : r.employeeId === empFilter))
    .filter(inRange)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0));

  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Leave Type', 'Leave Date(s)', 'Days', 'Reason of Leave', 'Date Applied', 'Supporting Document', 'Decision', 'Rejection Reason'];
    const rows = requests.map((r) => {
      const dates = r.startDate === r.endDate ? r.startDate : `${r.startDate} to ${r.endDate}`;
      const decision = r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending';
      return [
        `"${r.employeeName}"`,
        leaveTypeLabel(r.type),
        `"${dates}"`,
        r.durationDays,
        `"${r.reason}"`,
        r.submittedDate,
        `"${r.supportingDocName || ''}"`,
        decision,
        `"${r.rejectionReason || ''}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Leave_Applications_Summary_${period}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-3xl p-5 border border-[#e1e2ed] shadow-xs flex flex-col md:flex-row flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#434655] uppercase">Employee</span>
          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            className="bg-[#faf8ff] text-xs font-semibold text-[#191b23] px-3 py-2 rounded-xl border border-[#c3c6d7] focus:outline-none cursor-pointer"
          >
            <option value="all">All Employees</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.empCode})</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#434655] uppercase">Period</span>
          <div className="flex gap-1 bg-[#f3f3fe] rounded-xl p-1">
            {(['year', 'month', 'all'] as PeriodMode[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  period === p ? 'bg-white text-[#004ac6] shadow-2xs' : 'text-[#434655]'
                }`}
              >
                {p === 'year' ? 'Yearly' : p === 'month' ? 'Monthly' : 'Up-to-date'}
              </button>
            ))}
          </div>
        </div>

        {period !== 'all' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#434655] uppercase">Year</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-[#faf8ff] text-xs font-semibold px-3 py-2 rounded-xl border border-[#c3c6d7] focus:outline-none cursor-pointer"
            >
              {['2026', '2025', '2024'].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {period === 'month' && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#434655] uppercase">Month</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-[#faf8ff] text-xs font-semibold px-3 py-2 rounded-xl border border-[#c3c6d7] focus:outline-none cursor-pointer"
            >
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleExportCSV}
          className="ml-auto bg-[#004ac6] hover:bg-[#003ea8] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      {/* Summary count */}
      <p className="text-xs text-[#737686] px-1">
        {requests.length} leave application{requests.length === 1 ? '' : 's'} in this period.
      </p>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#e1e2ed] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f3f3fe] text-[#434655] uppercase font-bold text-[11px] border-b border-[#e1e2ed]">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-3">Leave Type</th>
                <th className="py-3 px-3">Leave Date(s)</th>
                <th className="py-3 px-3 text-center">Days</th>
                <th className="py-3 px-3">Reason of Leave</th>
                <th className="py-3 px-3">Date Applied</th>
                <th className="py-3 px-3">Supporting Doc</th>
                <th className="py-3 px-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e2ed]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#737686] italic">
                    No leave applications in this period.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const d = decisionBadge(r.status);
                  const dates = r.startDate === r.endDate ? r.startDate : `${r.startDate} to ${r.endDate}`;
                  return (
                    <tr key={r.id} className="hover:bg-[#faf8ff] transition-colors align-top">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#191b23] text-sm">{r.employeeName}</div>
                        <div className="text-[11px] text-[#737686]">{r.id}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#434655]">{leaveTypeLabel(r.type)}</td>
                      <td className="py-3 px-3 text-[#191b23]">{dates}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#191b23]">{r.durationDays}</td>
                      <td className="py-3 px-3 text-[#434655] max-w-[220px]">{r.reason || '—'}</td>
                      <td className="py-3 px-3 text-[#434655]">{r.submittedDate}</td>
                      <td className="py-3 px-3 text-[#434655]">{r.supportingDocName || '—'}</td>
                      <td className="py-3 px-3">
                        <span className={`font-bold px-2 py-1 rounded-full text-[10px] ${d.cls}`}>{d.text}</span>
                        {r.status === 'rejected' && r.rejectionReason && (
                          <div className="text-[10px] text-[#ba1a1a] mt-1 max-w-[200px]">{r.rejectionReason}</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
