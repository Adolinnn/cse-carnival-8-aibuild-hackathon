import { useState } from 'react';
import { DEFAULT_SIMULATED_DATE, DEFAULT_SIMULATED_TIME } from '../constants/campus';

export function useSimulatedClock() {
  const [simulatedDate, setSimulatedDate] = useState(DEFAULT_SIMULATED_DATE);
  const [simulatedTime, setSimulatedTime] = useState(DEFAULT_SIMULATED_TIME);

  const resetClock = () => {
    setSimulatedDate(DEFAULT_SIMULATED_DATE);
    setSimulatedTime(DEFAULT_SIMULATED_TIME);
  };

  return {
    simulatedDate,
    setSimulatedDate,
    simulatedTime,
    setSimulatedTime,
    resetClock,
  };
}
