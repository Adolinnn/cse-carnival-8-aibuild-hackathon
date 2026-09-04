import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_SIMULATED_DATE, DEFAULT_SIMULATED_TIME } from '../constants/campus';

/**
 * useSimulatedClock
 * Provides a dynamic clock that ticks every second while maintaining
 * the simulated campus baseline date (September 2026).
 *
 * It supports:
 * - Second-by-second live ticking (e.g. 10:00:00 -> 10:00:01)
 * - HH:MM or HH:MM:SS format output
 * - User time/date overrides that continue ticking forward smoothly
 * - Seamless day rollover when 23:59:59 turns to 00:00:00
 */
export function useSimulatedClock() {
  const [simulatedDate, setSimulatedDateState] = useState(DEFAULT_SIMULATED_DATE);

  // Parse initial simulated time into hours, minutes, seconds
  const [hours, minutes] = DEFAULT_SIMULATED_TIME.split(':').map(Number);
  const [currentSeconds, setCurrentSeconds] = useState(hours * 3600 + minutes * 60);

  // Interval timer for real-time ticking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSeconds((prev) => {
        const next = prev + 1;
        // Day rollover check (86400 seconds in a day)
        if (next >= 86400) {
          // Advance the date by 1 day
          setSimulatedDateState((prevDate) => {
            const d = new Date(prevDate + 'T12:00:00Z');
            d.setUTCDate(d.getUTCDate() + 1);
            return d.toISOString().split('T')[0];
          });
          return next - 86400;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format to HH:MM (for schedule / booking comparisons)
  const h = Math.floor(currentSeconds / 3600);
  const m = Math.floor((currentSeconds % 3600) / 60);
  const s = currentSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  const simulatedTime = `${pad(h)}:${pad(m)}`;
  const simulatedTimeWithSeconds = `${pad(h)}:${pad(m)}:${pad(s)}`;

  const setSimulatedTime = useCallback((newTimeString) => {
    if (!newTimeString) return;
    const parts = newTimeString.split(':').map(Number);
    const newH = parts[0] || 0;
    const newM = parts[1] || 0;
    const newS = parts[2] || 0;
    setCurrentSeconds(newH * 3600 + newM * 60 + newS);
  }, []);

  const setSimulatedDate = useCallback((newDateString) => {
    if (newDateString) setSimulatedDateState(newDateString);
  }, []);

  const resetClock = useCallback(() => {
    setSimulatedDateState(DEFAULT_SIMULATED_DATE);
    const [defH, defM] = DEFAULT_SIMULATED_TIME.split(':').map(Number);
    setCurrentSeconds(defH * 3600 + defM * 60);
  }, []);

  return {
    simulatedDate,
    setSimulatedDate,
    simulatedTime,
    simulatedTimeWithSeconds,
    setSimulatedTime,
    resetClock,
  };
}
