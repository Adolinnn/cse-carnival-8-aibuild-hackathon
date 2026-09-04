import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout({
  children,
  activeTab,
  setActiveTab,
  counts,
  session,
  onLogout,
  onToggleAgent,
  isAgentOpen,
  simulatedDate,
  setSimulatedDate,
  simulatedTime,
  setSimulatedTime,
  theme,
  onToggleTheme,
  onSearch,
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 selection:bg-[#C5BAFF] selection:text-slate-900 dark:selection:bg-indigo-500 dark:selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Top Header */}
      <Header
        onToggleAgent={onToggleAgent}
        isAgentOpen={isAgentOpen}
        onSearch={onSearch}
        simulatedDate={simulatedDate}
        setSimulatedDate={setSimulatedDate}
        simulatedTime={simulatedTime}
        setSimulatedTime={setSimulatedTime}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={onToggleTheme}
        session={session}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
          session={session}
          onLogout={onLogout}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        session={session}
        onLogout={onLogout}
      />
    </div>
  );
}
