import React from 'react';
import { EventsView } from '../components/events/EventsView';

export function EventsPage({ events, session, onNavigate }) {
  return (
    <div className="w-full page-enter" id="page-events">
      <EventsView events={events} session={session} onNavigate={onNavigate} />
    </div>
  );
}

export default EventsPage;
