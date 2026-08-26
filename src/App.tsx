import React from 'react';
import { LeaveProvider, useLeave } from './context/LeaveContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

// Employee Components
import { HomeDashboard } from './components/employee/HomeDashboard';
import { ApplyLeave } from './components/employee/ApplyLeave';
import { LeaveHistory } from './components/employee/LeaveHistory';
import { TeamCalendar } from './components/employee/TeamCalendar';
import { EmployeeProfile } from './components/employee/EmployeeProfile';

// Manager Components
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { LeaveReview } from './components/manager/LeaveReview';
import { TeamRoster } from './components/manager/TeamRoster';
import { SettingsView } from './components/manager/SettingsView';
import { LeaveSummaryReport } from './components/manager/LeaveSummaryReport';
import { ManagerAssistant } from './components/manager/ManagerAssistant';

// Auth Component
import { LoginView } from './components/auth/LoginView';
import { DevicePreview } from './components/DevicePreview';

const MainLayout: React.FC = () => {
  const { isLoggedIn, currentTab } = useLeave();

  if (!isLoggedIn) {
    return <LoginView />;
  }

  const renderContent = () => {
    switch (currentTab) {
      // Employee Tabs
      case 'home':
        return <HomeDashboard />;
      case 'apply':
        return <ApplyLeave />;
      case 'history':
        return <LeaveHistory />;
      case 'calendar':
        return <TeamCalendar />;
      case 'profile':
        return <EmployeeProfile />;

      // Manager Tabs
      case 'manager-dashboard':
        return <ManagerDashboard />;
      case 'manager-requests':
        return <LeaveReview />;
      case 'manager-calendar':
        return <TeamCalendar />;
      case 'manager-employees':
        return <TeamRoster />;
      case 'manager-settings':
        return <SettingsView />;
      case 'manager-reports':
        return <LeaveSummaryReport />;
      case 'manager-assistant':
        return <ManagerAssistant />;

      default:
        return <HomeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b23] flex">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pt-20 md:pt-24 pb-20 md:pb-12 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <MobileNav />
      </div>
    </div>
  );
};

export function App() {
  // Hide the device toolbar inside the embedded preview frame (avoids recursion).
  const embedded = typeof window !== 'undefined' && window.location.search.includes('preview=embedded');
  return (
    <LeaveProvider>
      <MainLayout />
      <DevicePreview embedded={embedded} />
    </LeaveProvider>
  );
}

export default App;
