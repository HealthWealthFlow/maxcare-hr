import React from 'react';
import { useLeave } from '../../context/LeaveContext';
import { ViewTab } from '../../types/leave';
import { APP_ASSETS, APP_META } from '../../data/mockData';

export const Sidebar: React.FC = () => {
  const { mode, currentTab, setCurrentTab, leaveRequests } = useLeave();

  const pendingCount = leaveRequests.filter(r => r.status === 'pending').length;

  const employeeNav: { id: ViewTab; label: string; icon: string; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'apply', label: 'Apply', icon: 'add_circle' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  const managerNav: { id: ViewTab; label: string; icon: string; badge?: number }[] = [
    { id: 'manager-dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { id: 'manager-requests', label: 'Requests', icon: 'pending_actions', badge: pendingCount },
    { id: 'manager-calendar', label: 'Calendar', icon: 'event' },
    { id: 'manager-employees', label: 'Employees', icon: 'group' },
    { id: 'manager-reports', label: 'Reports', icon: 'analytics' },
    { id: 'manager-assistant', label: 'AI Assistant', icon: 'smart_toy' },
    { id: 'manager-settings', label: 'Settings', icon: 'settings' },
  ];

  const activeNav = mode === 'employee' ? employeeNav : managerNav;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#f3f3fe] border-r border-[#e1e2ed] z-50 flex-col py-6">
      {/* Brand Header */}
      <div className="px-6 flex items-center gap-2 mb-8">
        <img
          alt="Company Leave Logo"
          className="h-8 w-auto object-contain"
          src={APP_ASSETS.logo}
        />
        <span className="text-xl font-bold text-[#004ac6] tracking-tight">
          {mode === 'employee' ? APP_META.name : APP_META.managerLabel}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1">
        {activeNav.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#2563eb] text-white shadow-sm font-semibold'
                  : 'text-[#434655] hover:bg-[#e7e7f3] hover:text-[#191b23]'
              }`}
            >
              <div className="flex items-center">
                <span className={`material-symbols-outlined mr-3 text-[20px] ${isActive ? 'text-white' : 'text-[#434655]'}`}>
                  {item.icon}
                </span>
                {item.label}
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-[#2563eb]' : 'bg-[#c04400] text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
