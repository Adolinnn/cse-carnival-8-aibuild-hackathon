import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import { api } from '../services/api';

export function useCampusData(session) {
  const [data, setData] = useState({
    schedules: dataService.getSchedules(session),
    rooms: dataService.getRooms(),
    events: dataService.getEvents(session),
    announcements: dataService.getAnnouncements(session),
    assignments: dataService.getAssignments(session),
  });

  const [backendStats, setBackendStats] = useState(null);

  const fetchBackendStats = useCallback(async () => {
    try {
      const stats = await api.getStats(session);
      if (stats && typeof stats === 'object') {
        setBackendStats(stats);
      }
    } catch (e) {
      // Graceful fallback to client counts if backend is offline
    }
  }, [session]);

  const syncData = useCallback(() => {
    setData({
      schedules: dataService.getSchedules(session),
      rooms: dataService.getRooms(),
      events: dataService.getEvents(session),
      announcements: dataService.getAnnouncements(session),
      assignments: dataService.getAssignments(session),
    });
    fetchBackendStats();
  }, [session, fetchBackendStats]);

  useEffect(() => {
    syncData();

    const unsubscribe = dataService.subscribe(syncData);
    window.addEventListener('campusos:data-change', syncData);

    // Initial backend stats fetch
    fetchBackendStats();

    return () => {
      unsubscribe();
      window.removeEventListener('campusos:data-change', syncData);
    };
  }, [syncData, fetchBackendStats]);

  const refreshFromBackend = useCallback(async () => {
    const res = await dataService.refreshFromBackend(session);
    await fetchBackendStats();
    return res;
  }, [session, fetchBackendStats]);

  // Use dynamic backend stats if available; otherwise fallback to local data count
  const counts = {
    schedules: backendStats?.schedules ?? data.schedules.length,
    rooms: backendStats?.rooms ?? data.rooms.length,
    events: backendStats?.events ?? data.events.length,
    announcements: backendStats?.announcements ?? data.announcements.length,
    assignments: backendStats?.assignments ?? data.assignments.length,
  };

  return {
    data,
    counts,
    backendStats,
    refreshFromBackend,
  };
}
