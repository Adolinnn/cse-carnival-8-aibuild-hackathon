import React from 'react';
import { RoomsView } from '../components/rooms/RoomsView';

export function RoomsPage({ rooms, session, simulatedDate, simulatedTime, onNavigate }) {
  return (
    <div className="w-full page-enter" id="page-rooms">
      <RoomsView
        rooms={rooms}
        session={session}
        simulatedDate={simulatedDate}
        simulatedTime={simulatedTime}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default RoomsPage;
