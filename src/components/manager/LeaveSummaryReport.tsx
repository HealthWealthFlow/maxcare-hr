import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { LeaveApplicationSummary } from './LeaveApplicationSummary';

export const LeaveSummaryReport: React.FC = () => {
  const { employees, setSelectedEmployeeId, setCurrentTab } = useLeave();
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [view, setView] = useState<'balance' | 'applications'>('applications');

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.empCode.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Name', 'Department', 'Role', 'AL Entitlement', 'AL Used', 'AL Pending', 'AL Available', 'Unpaid Used', 'Emergency Used'];
    const rows = employees.map(emp => {
      const avail = Math.max(0, emp.entitlements.annualTotal - emp.entitlements.annualUsed - emp.entitlements.annualPending);
      return [
        emp.empCode,
        `"${emp.name}"`,
        `"${emp.department}"`,
        `"${emp.role}"`,
        emp.entitlements.annualTotal,
        emp.entitlements.annualUsed,
        emp.entitlements.annualPending,
        avail,
        emp.entitlements.unpaidApprovedYTD,
        emp.entitlements.emergencyApprovedYTD
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leave_Summary_Report_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departments = ['all', ...Array.from(new Set(employees.map(e => e.department)))];

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto space-y-8">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
            Leave Summary Report
          </h1>
          <p className="text-sm text-[#434655] mt-1">
            {view === 'applications'
              ? 'Per-leave-application summary: reason, dates, supporting doc and decision.'
              : 'Comprehensive team leave balance statement for FY 2026.'}
          </p>
          <div className="flex gap-1 bg-[#f3f3fe] rounded-xl p-1 mt-3 w-fit">
            <button
              onClick={() => setView('applications')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === 'applications' ? 'bg-white text-[#004ac6] shadow-2xs' : 'text-[#434655]'
              }`}
            >
              Leave Applications
            </button>
            <button
              onClick={() => setView('balance')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                view === 'balance' ? 'bg-white text-[#004ac6] shadow-2xs' : 'text-[#434655]'
              }`}
            >
              Team Balances
            </button>
          </div>
        </div>

        {view === 'balance' && (
          <button
            onClick={handleExportCSV}
            className="bg-[#004ac6] hover:bg-[#003ea8] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV Report
          </button>
        )}
      </div>

      {view === 'applications' ? (
        <LeaveApplicationSummary />
      ) : (
        <>
      {/* Filter Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-[#e1e2ed] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#737686] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or ID..."
            className="w-full bg-[#faf8ff] rounded-xl pl-10 pr-3 py-2 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
          />
        </div>

        {/* Dept Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#434655] uppercase">Dept:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-[#faf8ff] text-xs font-semibold text-[#191b23] px-3 py-2 rounded-xl border border-[#c3c6d7] focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Departments</option>
            {departments.filter(d => d !== 'all').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-3xl border border-[#e1e2ed] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f3f3fe] text-[#434655] uppercase font-bold text-[11px] border-b border-[#e1e2ed]">
              <tr>
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4 text-center">AL Entitlement</th>
                <th className="py-4 px-4 text-center">AL Used</th>
                <th className="py-4 px-4 text-center">AL Pending</th>
                <th className="py-4 px-4 text-center">AL Available</th>
                <th className="py-4 px-4 text-center">Unpaid (YTD)</th>
                <th className="py-4 px-4 text-center">Emergency (YTD)</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e2ed]">
              {filteredEmployees.map((emp) => {
                const available = Math.max(0, emp.entitlements.annualTotal - emp.entitlements.annualUsed - emp.entitlements.annualPending);
                return (
                  <tr key={emp.id} className="hover:bg-[#faf8ff] transition-colors">
                    {/* Employee */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-9 h-9 rounded-full object-cover shadow-2xs border border-white"
                        />
                        <div>
                          <div className="font-bold text-[#191b23] text-sm">{emp.name}</div>
                          <div className="text-[11px] text-[#737686]">{emp.empCode}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-4 text-[#434655] font-medium">
                      {emp.department}
                    </td>

                    {/* AL Total */}
                    <td className="py-4 px-4 text-center font-bold text-[#191b23]">
                      {emp.entitlements.annualTotal}
                    </td>

                    {/* AL Used */}
                    <td className="py-4 px-4 text-center font-bold text-[#434655]">
                      {emp.entitlements.annualUsed}
                    </td>

                    {/* AL Pending */}
                    <td className="py-4 px-4 text-center font-bold text-[#973400]">
                      {emp.entitlements.annualPending}
                    </td>

                    {/* AL Available */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-xs bg-[#dcfce7] text-[#006e2d] px-2.5 py-1 rounded-full">
                        {available} Days
                      </span>
                    </td>

                    {/* Unpaid */}
                    <td className="py-4 px-4 text-center font-semibold text-[#191b23]">
                      {emp.entitlements.unpaidApprovedYTD}
                    </td>

                    {/* Emergency */}
                    <td className="py-4 px-4 text-center font-semibold text-[#191b23]">
                      {emp.entitlements.emergencyApprovedYTD}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedEmployeeId(emp.id);
                          setCurrentTab('manager-employees');
                        }}
                        className="text-[#004ac6] hover:text-[#003ea8] font-bold text-xs hover:underline"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
