import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';

export function useCampusData(session) {
  const [data, setData] = useState({
    schedules: dataService.getSchedules(session),
    rooms: dataService.getRooms(),
    events: dataService.getEvents(session),
    announcements: dataService.getAnnouncements(session),
    assignments: dataService.getAssignments(session),
  });

  const syncData = useCallback(() => {
    setData({
      schedules: dataService.getSchedules(session),
      rooms: dataService.getRooms(),
      events: dataService.getEvents(session),
      announcements: dataService.getAnnouncements(session),
      assignments: dataService.getAssignments(session),
    });
  }, [session]);

  useEffect(() => {
    syncData();

    const unsubscribe = dataService.subscribe(syncData);
    window.addEventListener('campusos:data-change', syncData);

    return () => {
      unsubscribe();
      window.removeEventListener('campusos:data-change', syncData);
    };
  }, [syncData]);

  const refreshFromBackend = useCallback(async () => {
    return dataService.refreshFromBackend(session);
  }, [session]);

  const counts = {
    schedules: data.schedules.length,
    rooms: data.rooms.length,
    events: data.events.length,
    announcements: data.announcements.length,
    assignments: data.assignments.length,
  };

  return {
    data,
    counts,
    refreshFromBackend,
  };
}
