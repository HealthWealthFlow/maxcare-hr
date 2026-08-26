import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { APP_ASSETS } from '../../data/mockData';
import { currentYear, toLocalISO } from '../../lib/dates';

export const SettingsView: React.FC = () => {
  const { policy, updatePolicy, holidays, addHoliday, deleteHoliday, changePassword, users } = useLeave();

  const account = users.find(u => u.role === 'manager');

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) {
      setPwMsg({ ok: false, text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'New password and confirmation do not match.' });
      return;
    }
    const res = changePassword(curPw, newPw);
    if (!res.ok) {
      setPwMsg({ ok: false, text: res.error || 'Could not change password.' });
      return;
    }
    setCurPw('');
    setNewPw('');
    setConfirmPw('');
    setPwMsg({ ok: true, text: 'Password updated successfully.' });
  };

  const now = new Date();
  const nowTimestamp = `${toLocalISO(now)} ${now.toLocaleTimeString('en-US', { hour12: false })}`;

  const [annualNotice, setAnnualNotice] = useState<number>(policy.annualNoticeDays);
  const [unpaidNotice, setUnpaidNotice] = useState<number>(policy.unpaidNoticeDays);
  const [emergencyNotice, setEmergencyNotice] = useState<number>(policy.emergencyNoticeDays);
  const [emergencyTreatment, setEmergencyTreatment] = useState(policy.emergencyTreatment);
  const [workingDays, setWorkingDays] = useState(policy.workingDays);

  const [showAddHolidayModal, setShowAddHolidayModal] = useState<boolean>(false);
  const [newHolidayName, setNewHolidayName] = useState<string>('');
  const [newHolidayDate, setNewHolidayDate] = useState<string>('2026-12-25');
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePolicy({
      annualNoticeDays: Number(annualNotice),
      unpaidNoticeDays: Number(unpaidNotice),
      emergencyNoticeDays: Number(emergencyNotice),
      emergencyTreatment,
      workingDays
    });
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 3000);
  };

  const handleCreateHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) return;
    addHoliday(newHolidayName, newHolidayDate);
    setShowAddHolidayModal(false);
    setNewHolidayName('');
  };

  const toggleDay = (dayKey: keyof typeof workingDays) => {
    setWorkingDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#191b23] tracking-tight">
            Policy Settings
          </h1>
          <p className="text-sm text-[#434655] mt-1">
            Configure advance notice rules, operational schedules, and statutory public holidays.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Save Changes
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Notice Rules & Working Schedule */}
        <div className="lg:col-span-6 space-y-6">
          {/* Notice Period Rules */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-[#e1e2ed] pb-3">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px]">
                notifications_active
              </span>
              <h2 className="text-base font-bold text-[#191b23]">
                Notice Period Rules
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                  Annual Leave Notice (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={annualNotice}
                  onChange={(e) => setAnnualNotice(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] font-bold border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                />
                <p className="text-[11px] text-[#737686] mt-1">
                  Applications submitted with fewer days will be flagged as late.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                  Unpaid Leave Notice (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={unpaidNotice}
                  onChange={(e) => setUnpaidNotice(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] font-bold border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                  Emergency Leave Notice (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={emergencyNotice}
                  onChange={(e) => setEmergencyNotice(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] font-bold border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                  Emergency Leave Treatment
                </label>
                <select
                  value={emergencyTreatment}
                  onChange={(e) => setEmergencyTreatment(e.target.value as any)}
                  className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] font-semibold border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                >
                  <option value="deduct_annual">Deduct from Annual Leave</option>
                  <option value="unpaid">Convert to Unpaid Leave</option>
                  <option value="separate">Track Separately (No Deduction)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Working Schedule */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-[#e1e2ed] pb-3">
              <span className="material-symbols-outlined text-[#004ac6] text-[20px]">
                schedule
              </span>
              <h2 className="text-base font-bold text-[#191b23]">
                Company Working Days
              </h2>
            </div>

            <p className="text-xs text-[#737686]">
              Unselected days are treated as non-working days and excluded from leave calculations.
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'mon', label: 'Mon' },
                { key: 'tue', label: 'Tue' },
                { key: 'wed', label: 'Wed' },
                { key: 'thu', label: 'Thu' },
                { key: 'fri', label: 'Fri' },
                { key: 'sat', label: 'Sat' },
                { key: 'sun', label: 'Sun' },
              ].map((d) => {
                const isSelected = workingDays[d.key as keyof typeof workingDays];
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key as keyof typeof workingDays)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#004ac6] text-white shadow-2xs'
                        : 'bg-[#faf8ff] text-[#737686] border border-[#c3c6d7]/60 hover:bg-[#ededf9]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Public Holidays & System Time */}
        <div className="lg:col-span-6 space-y-6">
          {/* Statutory Public Holidays */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-[#e1e2ed] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#795290] text-[20px]">
                  flag
                </span>
                <h2 className="text-base font-bold text-[#191b23]">
                  Statutory Public Holidays ({currentYear()})
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAddHolidayModal(true)}
                className="text-xs font-bold text-[#004ac6] hover:bg-[#dbe1ff]/60 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Holiday
              </button>
            </div>

            <div className="space-y-3">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 bg-[#f3f3fe] rounded-2xl flex items-center justify-between border border-[#e1e2ed]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-[#e1e2ed] shadow-2xs">
                      <span className="text-xs font-extrabold text-[#795290] leading-none">
                        {h.day}
                      </span>
                      <span className="text-[9px] font-bold text-[#737686] uppercase leading-none mt-1">
                        {h.month}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#191b23]">{h.name}</div>
                      <div className="text-[10px] text-[#737686]">{h.description}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteHoliday(h.id)}
                    className="text-[#737686] hover:text-[#ba1a1a] p-1.5 rounded-lg hover:bg-white transition-colors"
                    title="Delete Holiday"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* System Time Card */}
          <div className="bg-[#ededf9] rounded-3xl p-6 border border-[#e1e2ed] relative overflow-hidden space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={APP_ASSETS.systemTimeGears}
                alt="System Clock Status"
                className="w-14 h-14 rounded-2xl object-cover shadow-2xs border border-white"
              />
              <div>
                <h3 className="text-sm font-bold text-[#191b23]">System Time Engine</h3>
                <p className="text-xs text-[#006e2d] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#006e2d]"></span>
                  Active & Synced with HR Cloud Server
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#e1e2ed] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#737686]">Reference Timestamp:</span>
                <span className="font-bold text-[#191b23]">{nowTimestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#737686]">Timezone:</span>
                <span className="font-semibold text-[#004ac6]">Asia/Kuala_Lumpur (GMT+8)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddHolidayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddHolidayModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl z-10 space-y-4">
            <h3 className="text-lg font-bold text-[#191b23]">Add Public Holiday</h3>

            <form onSubmit={handleCreateHoliday} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#434655] uppercase block mb-1">
                  Holiday Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deepavali"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full bg-[#faf8ff] rounded-xl p-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#434655] uppercase block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full bg-[#faf8ff] rounded-xl p-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHolidayModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434655] hover:bg-[#ededf9] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-xl shadow-xs"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Security (change password) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-5">
        <h3 className="text-lg font-bold text-[#191b23] border-b border-[#e1e2ed] pb-3">Account Security</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
              Username (cannot be changed)
            </label>
            <input
              value={account?.username || ''}
              disabled
              className="w-full bg-[#f3f3fe] rounded-xl px-3.5 py-2.5 text-xs text-[#737686] border border-[#e1e2ed]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
              required
              className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                required
                className="w-full bg-[#faf8ff] rounded-xl px-3.5 py-2.5 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6]"
              />
            </div>
          </div>
          {pwMsg && (
            <p className={`text-xs font-semibold flex items-center gap-1 ${pwMsg.ok ? 'text-[#006e2d]' : 'text-[#ba1a1a]'}`}>
              <span className="material-symbols-outlined text-[16px]">{pwMsg.ok ? 'check_circle' : 'error'}</span>
              {pwMsg.text}
            </p>
          )}
          <button
            type="submit"
            className="bg-[#004ac6] hover:bg-[#003ea8] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">password</span>
            Update Password
          </button>
        </form>
      </div>

      {/* Save Notification */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006e2d] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-bold">Policy settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};
