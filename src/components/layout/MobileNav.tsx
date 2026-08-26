import React from 'react';
import { useLeave } from '../../context/LeaveContext';
import { ViewTab } from '../../types/leave';

export const MobileNav: React.FC = () => {
  const { mode, currentTab, setCurrentTab } = useLeave();

  const employeeNav: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'apply', label: 'Apply', icon: 'add_circle' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar_month' },
    { id: 'history', label: 'History', icon: 'history' },
  ];

  const managerNav: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'manager-dashboard', label: 'Dash', icon: 'space_dashboard' },
    { id: 'manager-requests', label: 'Tasks', icon: 'pending_actions' },
    { id: 'manager-calendar', label: 'Plan', icon: 'event' },
    { id: 'manager-employees', label: 'Team', icon: 'group' },
    { id: 'manager-assistant', label: 'AI', icon: 'smart_toy' },
  ];

  const items = mode === 'employee' ? employeeNav : managerNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white h-16 flex items-center justify-around border-t border-[#c3c6d7]/60 z-50 shadow-lg">
      {items.map(item => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive ? 'text-[#004ac6] font-semibold' : 'text-[#434655]'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${isActive ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
