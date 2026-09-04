import React from 'react';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';

export function DashboardPage({
  schedules,
  rooms,
  events,
  announcements,
  assignments,
  simulatedDate,
  simulatedTime,
  onNavigate,
  onOpenAgentWithQuery,
  session,
}) {
  return (
    <div className="w-full page-enter" id="page-dashboard">
      <DashboardOverview
        schedules={schedules}
        rooms={rooms}
        events={events}
        announcements={announcements}
        assignments={assignments}
        simulatedDate={simulatedDate}
        simulatedTime={simulatedTime}
        onNavigate={onNavigate}
        onOpenAgentWithQuery={onOpenAgentWithQuery}
        session={session}
      />
    </div>
  );
}

export default DashboardPage;
