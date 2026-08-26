import React from 'react';
import { useLeave } from '../../context/LeaveContext';
import { APP_ASSETS, APP_META } from '../../data/mockData';

export const Header: React.FC = () => {
  const { mode, setCurrentTab, currentUser, logout, employees, activeEmployeeId, setActiveEmployeeId } = useLeave();

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-[#faf8ff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 md:px-8 border-b border-[#e1e2ed]/60">
      {/* Brand / Current Portal */}
      <div className="flex items-center gap-2">
        <img
          alt="Company Leave Logo"
          className="h-8 w-auto object-contain"
          src={APP_ASSETS.logo}
        />
        <span className="font-semibold text-lg text-[#004ac6]">
          {mode === 'employee' ? APP_META.name : APP_META.managerLabel}
        </span>
      </div>

      {/* Staff portal: "Viewing as" employee switcher */}
      {mode === 'employee' && (
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">Viewing as</span>
          <select
            value={activeEmployeeId}
            onChange={(e) => setActiveEmployeeId(e.target.value)}
            className="bg-white text-xs font-semibold text-[#004ac6] border border-[#c3c6d7] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#004ac6] cursor-pointer"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} • {emp.empCode}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Right User & Actions */}
      <div className="flex items-center gap-3">
        {mode === 'employee' ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-[#434655] font-medium">
              {currentUser.name}
            </span>
            <button
              onClick={() => setCurrentTab('profile')}
              className="relative group p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#2563eb] transition-all"
              title="View Profile"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shadow-sm"
                src={currentUser.avatar}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#006e2d] border-2 border-white rounded-full"></span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-[#434655] font-medium">
              {APP_META.adminLabel}
            </span>
            <button
              onClick={() => setCurrentTab('manager-settings')}
              className="relative group p-0.5 rounded-full ring-2 ring-transparent hover:ring-[#2563eb] transition-all"
              title="Pharmacy Admin Settings"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shadow-sm"
                src={APP_ASSETS.hrDirectorAvatar}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#2563eb] border-2 border-white rounded-full"></span>
            </button>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={logout}
          className="text-[#434655] hover:text-[#ba1a1a] p-1.5 rounded-lg hover:bg-[#ededf9] transition-colors"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </header>
  );
};
