import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { SchedulesView } from './components/schedules/SchedulesView';
import { RoomsView } from './components/rooms/RoomsView';
import { EventsView } from './components/events/EventsView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { AgentConfigView } from './components/agent/AgentConfigView';
import { AgentDrawer } from './components/agent/AgentDrawer';
import { LoginView } from './components/auth/LoginView';
import { ToastContainer } from './components/common/Toast';
import {
  dataService,
  DEFAULT_SIMULATED_DATE,
  DEFAULT_SIMULATED_TIME,
} from './services/dataService';
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Sparkles,
  Megaphone,
  BookOpenCheck,
  Settings,
  LogOut,
} from 'lucide-react';

export function App() {
  // Always show login page first upon entering or reloading the site
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [simulatedDate, setSimulatedDate] = useState(DEFAULT_SIMULATED_DATE);
  const [simulatedTime, setSimulatedTime] = useState(DEFAULT_SIMULATED_TIME);
  const [externalQuery, setExternalQuery] = useState(undefined);
  const [globalSearch, setGlobalSearch] = useState('');

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('campusos_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light'; // Default to light mode as user requested
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('campusos_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Reactive data state initialized from dataService
  const [data, setData] = useState({
    schedules: dataService.getSchedules(),
    rooms: dataService.getRooms(),
    events: dataService.getEvents(),
    announcements: dataService.getAnnouncements(),
    assignments: dataService.getAssignments(),
  });

  // Subscribe to dataService updates
  useEffect(() => {
    const handleDataChange = () => {
      setData({
        schedules: dataService.getSchedules(),
        rooms: dataService.getRooms(),
        events: dataService.getEvents(),
        announcements: dataService.getAnnouncements(),
        assignments: dataService.getAssignments(),
      });
    };

    const unsubscribe = dataService.subscribe(handleDataChange);
    window.addEventListener('campusos:data-change', handleDataChange);

    return () => {
      unsubscribe();
      window.removeEventListener('campusos:data-change', handleDataChange);
    };
  }, [session]);

  const handleOpenAgentWithQuery = (query) => {
    setExternalQuery(query);
    setIsAgentOpen(true);
  };

  const handleLogout = () => {
    dataService.clearSession();
    setSession(null);
    setActiveTab('dashboard');
  };

  // If no tenant session, render LoginView
  if (!session) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <LoginView
          onLogin={(newSession) => setSession(newSession)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <ToastContainer />
      </div>
    );
  }

  const counts = {
    schedules: data.schedules.length,
    rooms: data.rooms.length,
    events: data.events.length,
    announcements: data.announcements.length,
    assignments: data.assignments.length,
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'schedules':
        return <SchedulesView schedules={data.schedules} session={session} onNavigate={setActiveTab} />;
      case 'rooms':
        return <RoomsView rooms={data.rooms} session={session} simulatedDate={simulatedDate} onNavigate={setActiveTab} />;
      case 'events':
        return <EventsView events={data.events} session={session} onNavigate={setActiveTab} />;
      case 'announcements':
        return <AnnouncementsView announcements={data.announcements} session={session} onNavigate={setActiveTab} />;
      case 'assignments':
        return <AssignmentsView assignments={data.assignments} session={session} onNavigate={setActiveTab} />;
      case 'agent-config':
        return session.role === 'admin' ? (
          <AgentConfigView session={session} />
        ) : (
          <DashboardOverview
            schedules={data.schedules}
            rooms={data.rooms}
            events={data.events}
            announcements={data.announcements}
            assignments={data.assignments}
            simulatedDate={simulatedDate}
            simulatedTime={simulatedTime}
            onNavigate={setActiveTab}
            onOpenAgentWithQuery={handleOpenAgentWithQuery}
            session={session}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardOverview
            schedules={data.schedules}
            rooms={data.rooms}
            events={data.events}
            announcements={data.announcements}
            assignments={data.assignments}
            simulatedDate={simulatedDate}
            simulatedTime={simulatedTime}
            onNavigate={setActiveTab}
            onOpenAgentWithQuery={handleOpenAgentWithQuery}
            session={session}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFB] text-slate-900 dark:bg-[#090d16] dark:text-slate-100 selection:bg-[#C5BAFF] selection:text-slate-900 dark:selection:bg-indigo-500 dark:selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Top Header */}
      <Header
        onToggleAgent={() => setIsAgentOpen((prev) => !prev)}
        isAgentOpen={isAgentOpen}
        onSearch={setGlobalSearch}
        simulatedDate={simulatedDate}
        setSimulatedDate={setSimulatedDate}
        simulatedTime={simulatedTime}
        setSimulatedTime={setSimulatedTime}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
          session={session}
          onLogout={handleLogout}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FBFBFB]/95 border-[#C4D9FF] dark:bg-[#090d16]/95 dark:border-slate-800 backdrop-blur-lg border-t py-1.5 px-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none w-full">
          {[
            { id: 'dashboard', label: 'Hub', icon: LayoutDashboard },
            { id: 'schedules', label: 'Routine', icon: CalendarDays },
            { id: 'rooms', label: 'Rooms', icon: DoorOpen },
            { id: 'events', label: 'Events', icon: Sparkles },
            { id: 'announcements', label: 'Notices', icon: Megaphone },
            { id: 'assignments', label: 'Tasks', icon: BookOpenCheck },
            ...(session?.role === 'admin' ? [{ id: 'agent-config', label: 'AI Config', icon: Settings }] : []),
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 min-w-[48px] ${
                  isActive
                    ? 'text-indigo-700 dark:text-campus-400 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors shrink-0 min-w-[44px]"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </nav>

      {/* AI Copilot Side Drawer */}
      <AgentDrawer
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        simulatedDate={simulatedDate}
        simulatedTime={simulatedTime}
        externalQuery={externalQuery}
        clearExternalQuery={() => setExternalQuery(undefined)}
      />

      <ToastContainer />
    </div>
  );
}

export default App;
