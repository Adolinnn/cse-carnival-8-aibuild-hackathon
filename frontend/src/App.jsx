import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AgentDrawer } from './components/agent/AgentDrawer';
import { ToastContainer } from './components/common/Toast';
import { useAuth, useTheme, useCampusData, useSimulatedClock } from './hooks';
import {
  DashboardPage,
  SchedulesPage,
  RoomsPage,
  EventsPage,
  AnnouncementsPage,
  AssignmentsPage,
  AgentConfigPage,
  LoginPage,
} from './pages';

export function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const { session, setSession, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data, counts } = useCampusData(session);
  const {
    simulatedDate,
    setSimulatedDate,
    simulatedTime,
    setSimulatedTime,
  } = useSimulatedClock();

  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [externalQuery, setExternalQuery] = useState(undefined);
  const [globalSearch, setGlobalSearch] = useState('');

  // Determine current active tab from browser URL path
  const getTabFromPath = useCallback((pathname) => {
    const segment = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
    const validTabs = [
      'dashboard',
      'schedules',
      'rooms',
      'events',
      'announcements',
      'assignments',
      'agent-config',
    ];
    if (validTabs.includes(segment)) return segment;
    return 'dashboard';
  }, []);

  const activeTab = getTabFromPath(location.pathname);

  // Synchronize browser URL endpoint when tab changes
  const handleNavigate = useCallback(
    (tabId) => {
      const target = tabId === 'dashboard' ? '/dashboard' : `/${tabId}`;
      if (location.pathname !== target) {
        navigate(target);
      }
    },
    [location.pathname, navigate]
  );

  // Authentication & route redirection guards
  useEffect(() => {
    const isLoginRoute = location.pathname.toLowerCase() === '/login';

    if (!isAuthenticated) {
      if (!isLoginRoute) {
        navigate('/login', { replace: true });
      }
    } else {
      if (isLoginRoute || location.pathname === '/') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, navigate]);

  const handleOpenAgentWithQuery = (query) => {
    setExternalQuery(query);
    setIsAgentOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // If unauthenticated or on login page, render LoginPage
  if (!isAuthenticated || location.pathname.toLowerCase() === '/login') {
    return (
      <LoginPage
        onLogin={(newSession) => {
          setSession(newSession);
          navigate('/dashboard', { replace: true });
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'schedules':
        return (
          <SchedulesPage
            schedules={data.schedules}
            session={session}
            onNavigate={handleNavigate}
          />
        );
      case 'rooms':
        return (
          <RoomsPage
            rooms={data.rooms}
            session={session}
            simulatedDate={simulatedDate}
            simulatedTime={simulatedTime}
            onNavigate={handleNavigate}
          />
        );
      case 'events':
        return (
          <EventsPage
            events={data.events}
            session={session}
            onNavigate={handleNavigate}
          />
        );
      case 'announcements':
        return (
          <AnnouncementsPage
            announcements={data.announcements}
            session={session}
            onNavigate={handleNavigate}
          />
        );
      case 'assignments':
        return (
          <AssignmentsPage
            assignments={data.assignments}
            session={session}
            simulatedDate={simulatedDate}
            onNavigate={handleNavigate}
          />
        );
      case 'agent-config':
        return isAdmin ? (
          <AgentConfigPage session={session} />
        ) : (
          <DashboardPage
            schedules={data.schedules}
            rooms={data.rooms}
            events={data.events}
            announcements={data.announcements}
            assignments={data.assignments}
            simulatedDate={simulatedDate}
            simulatedTime={simulatedTime}
            onNavigate={handleNavigate}
            onOpenAgentWithQuery={handleOpenAgentWithQuery}
            session={session}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardPage
            schedules={data.schedules}
            rooms={data.rooms}
            events={data.events}
            announcements={data.announcements}
            assignments={data.assignments}
            simulatedDate={simulatedDate}
            simulatedTime={simulatedTime}
            onNavigate={handleNavigate}
            onOpenAgentWithQuery={handleOpenAgentWithQuery}
            session={session}
          />
        );
    }
  };

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        counts={counts}
        session={session}
        onLogout={handleLogout}
        onToggleAgent={() => setIsAgentOpen((prev) => !prev)}
        isAgentOpen={isAgentOpen}
        simulatedDate={simulatedDate}
        setSimulatedDate={setSimulatedDate}
        simulatedTime={simulatedTime}
        setSimulatedTime={setSimulatedTime}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSearch={setGlobalSearch}
      >
        {renderActivePage()}
      </AppLayout>

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
    </>
  );
}

export default App;
