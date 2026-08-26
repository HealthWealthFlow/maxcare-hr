import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { todayISO, currentMonthYear } from '../../lib/dates';

function isOptionalHoliday(desc: string): boolean {
  const d = (desc || '').toLowerCase();
  return d.includes('selected') || d.includes('optional');
}

export const TeamCalendar: React.FC = () => {
  const { leaveRequests, holidays, employees } = useLeave();
  const initial = currentMonthYear();
  const [currentMonth, setCurrentMonth] = useState<number>(initial.month);
  const [currentYear, setCurrentYear] = useState<number>(initial.year);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate calendar dates for the month
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const adjustedFirstDay = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dateISO = `${currentYear}-${monthStr}-${dayStr}`;
    calendarDays.push({ day: d, dateISO });
  }

  // Find leaves and holidays for a given date
  const getItemsForDate = (dateISO: string) => {
    const activeLeaves = leaveRequests.filter(r => {
      if (r.status !== 'approved' && r.status !== 'pending') return false;
      return dateISO >= r.startDate && dateISO <= r.endDate;
    });

    const holiday = holidays.find(h => h.date === dateISO);
    return { leaves: activeLeaves, holiday };
  };

  const selectedDateData = getItemsForDate(selectedDate);
  const selectedHoliday = holidays.find(h => h.date === selectedDate);

  const holidaysInMonth = holidays.filter(h => {
    const hMonth = parseInt(h.date.split('-')[1], 10) - 1;
    const hYear = parseInt(h.date.split('-')[0], 10);
    return hMonth === currentMonth && hYear === currentYear;
  });

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
            Team Calendar
          </h1>
          <p className="text-sm text-[#434655] mt-1">
            View team availability, scheduled leaves, and statutory public holidays.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#c3c6d7] shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-[#ededf9] text-[#434655] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <span className="font-bold text-sm px-2 text-[#191b23]">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-[#ededf9] text-[#434655] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
          <button
            onClick={() => {
              const now = currentMonthYear();
              setCurrentMonth(now.month);
              setCurrentYear(now.year);
              setSelectedDate(todayISO());
            }}
            className="text-xs font-bold text-[#004ac6] hover:bg-[#dbe1ff]/60 px-3 py-1.5 rounded-xl transition-colors ml-1"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend Chips */}
      <div className="flex flex-wrap gap-4 text-xs font-medium text-[#434655] bg-[#f3f3fe] px-4 py-3 rounded-2xl border border-[#e1e2ed]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#004ac6]"></span>
          <span>Annual Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#006e2d]"></span>
          <span>Unpaid Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0f766e]"></span>
          <span>Medical Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]"></span>
          <span>Emergency Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#795290]"></span>
          <span>Mandatory Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c04400]"></span>
          <span>Optional Holiday</span>
        </div>
      </div>

      {/* Main Grid & Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-[#e1e2ed]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-[#737686] mb-3 pb-2 border-b border-[#e1e2ed]">
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div className="text-[#ba1a1a]/70">SAT</div>
            <div className="text-[#ba1a1a]/70">SUN</div>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((item, index) => {
              if (!item) {
                return <div key={`empty-${index}`} className="min-h-[85px] md:min-h-[100px] rounded-xl bg-transparent"></div>;
              }

              const { leaves, holiday } = getItemsForDate(item.dateISO);
              const isSelected = selectedDate === item.dateISO;
              const isToday = item.dateISO === todayISO();

              return (
                <div
                  key={item.dateISO}
                  onClick={() => setSelectedDate(item.dateISO)}
                  className={`min-h-[85px] md:min-h-[100px] p-1.5 md:p-2 rounded-xl transition-all cursor-pointer flex flex-col justify-between border ${
                    isSelected
                      ? 'border-[#004ac6] bg-[#f3f3fe] ring-2 ring-[#004ac6]/30 shadow-xs'
                      : 'border-[#e1e2ed]/80 bg-white hover:border-[#c3c6d7] hover:bg-[#faf8ff]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#004ac6] text-white'
                          : isSelected
                          ? 'text-[#004ac6] font-extrabold'
                          : 'text-[#191b23]'
                      }`}
                    >
                      {item.day}
                    </span>
                    {holiday && (
                      <span
                        className={`w-2 h-2 rounded-full ${isOptionalHoliday(holiday.description) ? 'bg-[#c04400]' : 'bg-[#795290]'}`}
                        title={holiday.name}
                      ></span>
                    )}
                  </div>

                  {/* Badges / Employee Leaves in Cell */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {holiday && (
                      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate ${isOptionalHoliday(holiday.description) ? 'bg-[#ffe8d1] text-[#c04400]' : 'bg-[#ebdcfc] text-[#795290]'}`}>
                        {holiday.name}
                      </div>
                    )}
                    {leaves.slice(0, 2).map((l) => {
                      const bg =
                        l.type === 'annual'
                          ? 'bg-[#dbe1ff] text-[#004ac6]'
                          : l.type === 'unpaid'
                          ? 'bg-[#dcfce7] text-[#006e2d]'
                          : l.type === 'sick'
                          ? 'bg-[#ccfbf1] text-[#0f766e]'
                          : 'bg-[#fee2e2] text-[#ba1a1a]';
                      return (
                        <div
                          key={l.id}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate ${bg}`}
                        >
                          {l.employeeName.split(' ')[0]}
                        </div>
                      );
                    })}
                    {leaves.length > 2 && (
                      <div className="text-[9px] text-[#737686] font-semibold px-1">
                        +{leaves.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e1e2ed] space-y-5">
            <div className="border-b border-[#e1e2ed] pb-4">
              <span className="text-xs font-bold text-[#737686] uppercase tracking-wider">
                Selected Date
              </span>
              <h3 className="text-xl font-bold text-[#191b23] mt-0.5">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </h3>
            </div>

            {/* Holiday Callout if on this date */}
            {selectedHoliday && (
              <div className={`p-3.5 rounded-2xl flex items-center gap-3 border ${isOptionalHoliday(selectedHoliday.description) ? 'bg-[#fff3e8] border-[#ffd2a8]' : 'bg-[#f5eeff] border-[#d6bbfb]'}`}>
                <span className={`material-symbols-outlined text-2xl ${isOptionalHoliday(selectedHoliday.description) ? 'text-[#c04400]' : 'text-[#795290]'}`}>
                  celebration
                </span>
                <div>
                  <div className={`text-sm font-bold ${isOptionalHoliday(selectedHoliday.description) ? 'text-[#c04400]' : 'text-[#795290]'}`}>
                    {selectedHoliday.name}
                  </div>
                  <div className="text-xs text-[#737686]">
                    {isOptionalHoliday(selectedHoliday.description) ? 'Optional Company-Selected Holiday' : 'Mandatory Company Holiday'}
                  </div>
                </div>
              </div>
            )}

            {/* Team on Leave */}
            <div>
              <h4 className="text-xs font-bold text-[#434655] uppercase tracking-wider mb-3">
                On Leave ({selectedDateData.leaves.length})
              </h4>

              {selectedDateData.leaves.length === 0 ? (
                <div className="p-6 text-center bg-[#faf8ff] rounded-2xl border border-dashed border-[#c3c6d7]">
                  <span className="material-symbols-outlined text-3xl text-[#737686]/60 mb-1">
                    check_circle
                  </span>
                  <p className="text-xs text-[#434655]">All team members are available on this date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateData.leaves.map((l) => (
                    <div
                      key={l.id}
                      className="p-3.5 bg-[#f3f3fe] rounded-2xl flex items-center justify-between border border-[#e1e2ed]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={l.employeeAvatar}
                          alt={l.employeeName}
                          className="w-10 h-10 rounded-full object-cover shadow-2xs border border-white"
                        />
                        <div>
                          <div className="text-sm font-bold text-[#191b23]">
                            {l.employeeName}
                          </div>
                          <div className="text-xs text-[#737686]">
                            {l.employeeRole}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          l.type === 'annual'
                            ? 'bg-[#dbe1ff] text-[#004ac6]'
                            : l.type === 'unpaid'
                            ? 'bg-[#dcfce7] text-[#006e2d]'
                            : l.type === 'sick'
                            ? 'bg-[#ccfbf1] text-[#0f766e]'
                            : 'bg-[#fee2e2] text-[#ba1a1a]'
                        }`}
                      >
                        {l.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Month Holidays summary */}
          <div className="bg-[#ededf9] rounded-3xl p-5 border border-[#e1e2ed]">
            <h4 className="text-xs font-bold text-[#191b23] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#004ac6]">
                flag
              </span>
              Company Holidays in {monthNames[currentMonth]}
            </h4>

            {holidaysInMonth.length === 0 ? (
              <p className="text-xs text-[#737686]">No company holidays scheduled this month.</p>
            ) : (
              <div className="space-y-2">
                {holidaysInMonth.map(h => {
                  const opt = isOptionalHoliday(h.description);
                  return (
                    <div key={h.id} className="flex items-center justify-between gap-2 text-xs bg-white p-2.5 rounded-xl border border-[#e1e2ed]">
                      <div className="min-w-0">
                        <div className="font-bold text-[#191b23] truncate">{h.name}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${opt ? 'text-[#c04400]' : 'text-[#795290]'}`}>
                          {opt ? 'Optional' : 'Mandatory'}
                        </div>
                      </div>
                      <span className={`font-medium shrink-0 px-2 py-0.5 rounded-md ${opt ? 'bg-[#fff3e8] text-[#c04400]' : 'bg-[#f5eeff] text-[#795290]'}`}>
                        {h.day} {h.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
