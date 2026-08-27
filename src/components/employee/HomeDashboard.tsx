import React from 'react';
import { useLeave } from '../../context/LeaveContext';
import { formatLongDate, todayISO, formatDateRange, completedMonthsOfService, earnedToDate, getGreeting, monthsInCurrentYear } from '../../lib/dates';

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div>
    <span className="block text-xs font-bold text-[#434655] uppercase tracking-wider mb-1">{label}</span>
    <span className="text-2xl font-bold text-[#191b23]">{value}</span>
  </div>
);

const UsageBar: React.FC<{ used: number; pending: number; total: number }> = ({ used, pending, total }) => {
  const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;
  const pendPct = total > 0 ? Math.round((pending / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-medium mb-2 text-[#434655]">
        <span>Usage Progress</span>
        <span>{usedPct}%</span>
      </div>
      <div className="h-2.5 w-full bg-[#e1e2ed] rounded-full overflow-hidden flex">
        <div
          className="h-full bg-[#004ac6] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, usedPct)}%` }}
        ></div>
        <div
          className="h-full bg-[#ffb599] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100 - usedPct, pendPct)}%` }}
        ></div>
      </div>
    </div>
  );
};

const EarnApplied: React.FC<{ earned: number; applied: number; cap: number; showEarned?: boolean }> = ({ earned, applied, cap, showEarned = true }) => {
  const earnedPct = cap > 0 ? Math.min(100, (earned / cap) * 100) : 0;
  const appliedPct = cap > 0 ? Math.min(100, (applied / cap) * 100) : 0;
  return (
    <div className="mt-5 space-y-4 border-t border-[#e1e2ed] pt-4">
      {showEarned && (
        <div>
          <div className="flex justify-between text-xs font-bold text-[#434655] mb-1">
            <span>Earn to Date</span>
            <span>
              {earned} / {cap} days (Max)
            </span>
          </div>
          <div className="h-4 w-full bg-[#e1e2ed] rounded-full overflow-hidden">
            <div className="h-full bg-[#006e2d] rounded-full" style={{ width: `${earnedPct}%` }}></div>
          </div>
        </div>
      )}
      <div>
        <div className="flex justify-between text-xs font-bold text-[#434655] mb-1">
          <span>Leaves Applied</span>
          <span>
            {applied} / {cap} days (Max)
          </span>
        </div>
        <div className="h-4 w-full bg-[#e1e2ed] rounded-full overflow-hidden">
          <div className="h-full bg-[#c04400] rounded-full" style={{ width: `${appliedPct}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export const HomeDashboard: React.FC = () => {
  const { currentUser, leaveRequests, setCurrentTab, setSelectedRequestIdForReview } = useLeave();

  const today = todayISO();
  const ent = currentUser.entitlements;
  const join = currentUser.joinDate || '2024-01-01';
  const userRequests = leaveRequests.filter(r => r.employeeId === currentUser.id);

  // Pro-rata for mid-year joiners (months the employee works in the current year).
  const months = completedMonthsOfService(join);
  const monthsInYear = monthsInCurrentYear(join);
  const emergencyMax = Math.max(1, Math.floor((3 * monthsInYear) / 12));
  // Earned-to-Date (Annual & Medical use the accrual formula; Emergency is the pro-rated fixed allowance).
  const annualEarned = earnedToDate(ent.annualTotal, join);
  const medicalEarned = earnedToDate(ent.sickTotal, join);

  const leaveTypes = [
    {
      key: 'annual',
      title: 'Annual Leave 2026',
      icon: 'flight_takeoff',
      badge: `${Math.max(0, ent.annualTotal - ent.annualUsed - ent.annualPending)} Days Available`,
      total: ent.annualTotal,
      used: ent.annualUsed,
      pending: ent.annualPending,
      hasIndicator: true,
      earned: annualEarned,
      applied: ent.annualUsed + ent.annualPending,
      remarks: `Pro-rated ${ent.annualTotal} days for ${monthsInYear} months of service; earned to date ${annualEarned} days (${ent.annualTotal} ÷ 12 × ${months}).`,
    },
    {
      key: 'medical',
      title: 'Medical Leave 2026',
      icon: 'medical_services',
      badge: `${Math.max(0, ent.sickTotal - ent.sickUsed)} Days Available`,
      total: ent.sickTotal,
      used: ent.sickUsed,
      pending: 0,
      hasIndicator: true,
      showEarned: false,
      earned: medicalEarned,
      applied: ent.sickUsed,
      remarks: `Pro-rated ${ent.sickTotal} days for ${monthsInYear} months of service. Used via Medical Certificate (MC).`,
    },
    {
      key: 'emergency',
      title: 'Emergency Leave 2026',
      icon: 'medication',
      badge: `${Math.max(0, emergencyMax - ent.emergencyApprovedYTD - ent.emergencyPending)} Days Available`,
      total: emergencyMax,
      used: ent.emergencyApprovedYTD,
      pending: ent.emergencyPending,
      hasIndicator: true,
      showEarned: false,
      earned: emergencyMax,
      applied: ent.emergencyApprovedYTD + ent.emergencyPending,
      remarks: `Fixed at 3 days per year — pro-rated to ${emergencyMax} days for ${monthsInYear} months of service.`,
    },
    {
      key: 'unpaid',
      title: 'Unpaid Leave 2026',
      icon: 'money_off',
      badge: `${ent.unpaidApprovedYTD} Days Approved`,
      total: null,
      used: ent.unpaidApprovedYTD,
      pending: ent.unpaidPending,
      hasIndicator: false,
      earned: null,
      applied: null,
      remarks: 'No fixed entitlement — subject to manager approval.',
    },
  ];

  // Upcoming leave: the next approved leave that is today or later (fallback to any approved)
  const upcomingLeave =
    userRequests.find(r => r.status === 'approved' && r.endDate >= today) ||
    userRequests.find(r => r.status === 'approved');

  const recentList = userRequests.slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="bg-[#7cf994]/40 text-[#006e2d] font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
            APPROVED
          </span>
        );
      case 'pending':
        return (
          <span className="bg-[#ffdbce] text-[#973400] font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
            PENDING
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-[#ffdad6] text-[#ba1a1a] font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
            REJECTED
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-[#006e2d]';
      case 'pending':
        return 'bg-[#973400]';
      case 'rejected':
        return 'bg-[#ba1a1a]';
      default:
        return 'bg-[#737686]';
    }
  };

  return (
    <div className="flex flex-col w-full gap-8 max-w-6xl mx-auto">
      {/* Top Welcome Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
            {getGreeting()}, {currentUser.name}.
          </h1>
          <p className="text-base text-[#434655] mt-1 font-normal">{formatLongDate()}</p>
        </div>
        <button
          onClick={() => setCurrentTab('apply')}
          className="bg-[#004ac6] hover:bg-[#003ea8] text-white font-semibold text-sm px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 min-h-[48px]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Apply Leave
        </button>
      </section>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: 4 Leave Cards */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {leaveTypes.map((l) => {
              const exceeds = l.total !== null && (l.applied ?? 0) > l.total;
              return (
              <article
                key={l.key}
                className="bg-white rounded-2xl p-6 shadow-xs border-t-4 border-t-[#004ac6] border-x border-b border-[#e1e2ed]/60 relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#004ac6] text-[22px]">{l.icon}</span>
                    <h3 className="text-lg font-bold text-[#191b23]">{l.title}</h3>
                  </div>
                  <span className="bg-[#2563eb] text-white font-semibold text-xs px-3 py-1 rounded-full w-fit shadow-xs whitespace-nowrap">
                    {l.badge}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Stat label="Entitlement" value={l.total ?? '—'} />
                  <Stat label="Used" value={l.used} />
                  <Stat label="Pending" value={l.pending} />
                </div>

                {l.total !== null && <UsageBar used={l.used} pending={l.pending} total={l.total} />}

                {l.hasIndicator && l.total !== null && (
                  <EarnApplied earned={l.earned ?? 0} applied={l.applied ?? 0} cap={l.total} showEarned={l.showEarned} />
                )}

                <p className={`mt-4 ${exceeds ? 'text-sm font-bold text-[#dc2626]' : 'text-xs text-[#737686]'}`}>
                  Remarks: {l.remarks}
                </p>
              </article>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Upcoming Leave & Recent Applications */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Upcoming Leave */}
          <section className="bg-[#ededf9] rounded-2xl p-5 shadow-xs border border-[#e1e2ed]/60">
            <h3 className="text-base font-bold text-[#191b23] mb-4 px-1">Upcoming Leave</h3>
            {upcomingLeave ? (
              <div className="bg-white rounded-xl p-4 relative overflow-hidden group hover:-translate-y-0.5 transition-transform border border-[#e1e2ed]/40 shadow-2xs">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#006e2d]"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold text-[#434655] uppercase tracking-wider">
                    {upcomingLeave.type === 'annual' ? 'Annual Leave' : upcomingLeave.type === 'sick' ? 'Medical Leave' : upcomingLeave.type === 'emergency' ? 'Emergency Leave' : 'Unpaid Leave'}
                  </span>
                  <span className="bg-[#7cf994]/40 text-[#006e2d] font-bold px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
                    APPROVED
                  </span>
                </div>
                <p className="text-lg font-bold text-[#191b23] mb-0.5">
                  {formatDateRange(upcomingLeave.startDate, upcomingLeave.endDate)}
                </p>
                <p className="text-sm text-[#434655]">
                  {upcomingLeave.durationDays} {upcomingLeave.durationDays === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#434655] italic p-3">No approved upcoming leaves.</p>
            )}
          </section>

          {/* Recent Applications */}
          <section className="bg-white rounded-2xl p-5 shadow-xs border border-[#e1e2ed]/60 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-base font-bold text-[#191b23]">Recent Applications</h3>
              <button
                onClick={() => setCurrentTab('history')}
                className="text-xs font-bold text-[#004ac6] hover:text-[#003ea8] transition-colors"
              >
                View All
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {recentList.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setCurrentTab('history')}
                  className="p-3 hover:bg-[#f3f3fe] rounded-xl transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden border border-transparent hover:border-[#e1e2ed]"
                >
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 ${getStatusBorderColor(req.status)} group-hover:h-3/4 transition-all rounded-r-full`}></div>
                  <div className="pl-3">
                    <p className="font-bold text-[#191b23] text-sm mb-0.5 capitalize">
                      {req.type === 'annual' ? 'Annual Leave' : req.type === 'sick' ? 'Medical Leave' : req.type === 'emergency' ? 'Emergency Leave' : 'Unpaid Leave'}
                    </p>
                    <p className="text-xs text-[#434655]">
                      {req.startDate === req.endDate
                        ? `${req.startDate.split('-')[2]} ${new Date(req.startDate).toLocaleDateString('en-US', { month: 'short' })} • ${req.durationDays} Day`
                        : `${req.startDate.split('-')[2]} ${new Date(req.startDate).toLocaleDateString('en-US', { month: 'short' })} - ${req.endDate.split('-')[2]} ${new Date(req.endDate).toLocaleDateString('en-US', { month: 'short' })} • ${req.durationDays} Days`}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
