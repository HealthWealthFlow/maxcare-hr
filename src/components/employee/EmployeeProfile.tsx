import React, { useId, useState } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { APP_ASSETS, APP_META } from '../../data/mockData';

export const EmployeeProfile: React.FC = () => {
  const { currentUser, setCurrentTab, updateEmployeeAvatar, changePassword, users } = useLeave();

  const fileInputId = useId();
  const account = users.find(u => u.employeeId === currentUser.id);

  // Change password
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('Image must be under 4MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => alert('Could not read that image. Please try another file.');
      img.onload = () => {
        // Downscale to a max 512px square so it fits comfortably in localStorage.
        const MAX = 512;
        let width = img.width;
        let height = img.height;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG keeps the stored size small; the context saves it to localStorage.
        updateEmployeeAvatar(currentUser.id, canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-[#e1e2ed] flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md border-4 border-[#f3f3fe]"
          />
          <label
            htmlFor={fileInputId}
            className="absolute bottom-1 right-1 w-7 h-7 bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-white transition-colors"
            title="Change profile photo"
          >
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </label>
          <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <span className="absolute bottom-1 -left-1 w-4 h-4 bg-[#006e2d] border-2 border-white rounded-full"></span>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-[#191b23]">
              {currentUser.name}
            </h1>
            <span className="bg-[#dbe1ff] text-[#004ac6] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {currentUser.empCode}
            </span>
          </div>
          <p className="text-base text-[#434655] font-medium">{currentUser.role}</p>
          <p className="text-xs text-[#737686]">{currentUser.department} • Full-time</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-xs text-[#434655]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#737686]">mail</span>
              {currentUser.email}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#737686]">call</span>
              {currentUser.phone}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCurrentTab('apply')}
            className="bg-[#004ac6] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#003ea8] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Apply Leave
          </button>
        </div>
      </div>

      {/* Balance Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Annual Leave */}
        <div className="bg-[#f3f3fe] rounded-3xl p-6 border border-[#e1e2ed] space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Annual Leave
            </span>
            <span className="material-symbols-outlined text-[#004ac6]">flight_takeoff</span>
          </div>
          <div className="text-3xl font-bold text-[#191b23]">
            {Math.max(0, currentUser.entitlements.annualTotal - currentUser.entitlements.annualUsed - currentUser.entitlements.annualPending)}{' '}
            <span className="text-sm font-normal text-[#434655]">Days Left</span>
          </div>
          <div className="text-xs text-[#737686] space-y-1">
            <div className="flex justify-between">
              <span>Total Entitlement:</span>
              <span className="font-semibold text-[#191b23]">{currentUser.entitlements.annualTotal} Days</span>
            </div>
            <div className="flex justify-between">
              <span>Used YTD:</span>
              <span className="font-semibold text-[#191b23]">{currentUser.entitlements.annualUsed} Days</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Review:</span>
              <span className="font-semibold text-[#c04400]">{currentUser.entitlements.annualPending} Days</span>
            </div>
          </div>
        </div>

        {/* Unpaid Leave */}
        <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Unpaid Leave
            </span>
            <span className="material-symbols-outlined text-[#006e2d]">money_off</span>
          </div>
          <div className="text-3xl font-bold text-[#191b23]">
            {currentUser.entitlements.unpaidApprovedYTD}{' '}
            <span className="text-sm font-normal text-[#434655]">Days Taken</span>
          </div>
          <div className="text-xs text-[#737686] space-y-1">
            <div className="flex justify-between">
              <span>Approved YTD:</span>
              <span className="font-semibold text-[#191b23]">{currentUser.entitlements.unpaidApprovedYTD} Days</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Approval:</span>
              <span className="font-semibold text-[#c04400]">{currentUser.entitlements.unpaidPending} Days</span>
            </div>
          </div>
        </div>

        {/* Emergency Leave */}
        <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] space-y-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Emergency Leave
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a]">medical_services</span>
          </div>
          <div className="text-3xl font-bold text-[#191b23]">
            {currentUser.entitlements.emergencyApprovedYTD}{' '}
            <span className="text-sm font-normal text-[#434655]">Days Used</span>
          </div>
          <div className="text-xs text-[#737686] space-y-1">
            <div className="flex justify-between">
              <span>Notice Requirement:</span>
              <span className="font-semibold text-[#006e2d]">0 Days (Immediate)</span>
            </div>
            <div className="flex justify-between">
              <span>Policy Treatment:</span>
              <span className="font-semibold text-[#191b23]">Deduct from AL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-[#e1e2ed] space-y-6">
        <h3 className="text-lg font-bold text-[#191b23] border-b border-[#e1e2ed] pb-3">
          Employment & Reporting Line
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="block text-xs font-bold text-[#737686] uppercase mb-1">Direct Manager</span>
            <div className="flex items-center gap-3 mt-2">
              <img src={APP_ASSETS.hrDirectorAvatar} alt="Pharmacy Manager" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-bold text-[#191b23]">{APP_META.managerLabel}</div>
                <div className="text-xs text-[#737686]">Pharmacy In-Charge</div>
              </div>
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-[#737686] uppercase mb-1">Working Schedule</span>
            <p className="font-medium text-[#191b23] mt-2">Monday – Friday (09:00 AM – 06:00 PM)</p>
            <p className="text-xs text-[#737686]">Saturday & Sunday Off</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-[#e1e2ed] space-y-5">
        <h3 className="text-lg font-bold text-[#191b23] border-b border-[#e1e2ed] pb-3">Account Security</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs font-bold text-[#434655] uppercase tracking-wider block mb-1.5">
              Username (cannot be changed)
            </label>
            <input
              value={account?.username || currentUser.empCode}
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
    </div>
  );
};
