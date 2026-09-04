import React from 'react';
import { AnnouncementsView } from '../components/announcements/AnnouncementsView';

export function AnnouncementsPage({ announcements, session, onNavigate }) {
  return (
    <div className="w-full page-enter" id="page-announcements">
      <AnnouncementsView
        announcements={announcements}
        session={session}
        onNavigate={onNavigate}
      />
    </div>
  );
}

export default AnnouncementsPage;
