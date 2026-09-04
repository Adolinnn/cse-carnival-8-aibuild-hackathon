import React from 'react';
import { SchedulesView } from '../components/schedules/SchedulesView';

export function SchedulesPage({ schedules, session, onNavigate }) {
  return (
    <div className="w-full page-enter" id="page-schedules">
      <SchedulesView schedules={schedules} session={session} onNavigate={onNavigate} />
    </div>
  );
}

export default SchedulesPage;
