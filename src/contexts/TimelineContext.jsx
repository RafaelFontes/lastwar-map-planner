import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const TimelineContext = createContext({});

const STORAGE_KEY = 'mapEditor_selectedDay';

function loadSelectedDay(currentDay) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const day = parseInt(stored, 10);
      // Validate: must be between 1 and current day
      if (!isNaN(day) && day >= 1 && day <= currentDay) {
        return day;
      }
    }
  } catch (e) {
    console.warn('Failed to load selected day from localStorage:', e);
  }
  return currentDay;
}

function saveSelectedDay(day) {
  try {
    localStorage.setItem(STORAGE_KEY, String(day));
  } catch (e) {
    console.warn('Failed to save selected day to localStorage:', e);
  }
}

// Season start date: Day 1 started at 2025-11-17 02:00 UTC
const SEASON_START = new Date('2025-11-17T02:00:00Z');
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_ROLLOVER_HOUR = 2; // 2 AM UTC

/**
 * Calculate current day number based on season start
 */
export function getCurrentDay() {
  const now = new Date();
  const diff = now.getTime() - SEASON_START.getTime();
  return Math.floor(diff / MS_PER_DAY) + 1;
}

/**
 * Get time remaining until next day rollover
 */
export function getTimeUntilNextDay() {
  const now = new Date();
  const currentDay = getCurrentDay();
  const nextDayStart = new Date(SEASON_START.getTime() + (currentDay * MS_PER_DAY));
  return nextDayStart.getTime() - now.getTime();
}

/**
 * Format time remaining as HH:MM:SS
 */
export function formatTimeRemaining(ms) {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

export function TimelineProvider({ children }) {
  const currentDay = useMemo(() => getCurrentDay(), []);
  const [selectedDay, setSelectedDay] = useState(() => loadSelectedDay(currentDay));

  // Save selected day to localStorage when it changes
  useEffect(() => {
    saveSelectedDay(selectedDay);
  }, [selectedDay]);

  const isViewingCurrentDay = selectedDay === currentDay;
  const isViewingPast = selectedDay < currentDay;
  const canEdit = isViewingCurrentDay;

  const goToDay = useCallback((day) => {
    if (day >= 1 && day <= currentDay) {
      setSelectedDay(day);
    }
  }, [currentDay]);

  const goToPreviousDay = useCallback(() => {
    if (selectedDay > 1) {
      setSelectedDay(prev => prev - 1);
    }
  }, [selectedDay]);

  const goToNextDay = useCallback(() => {
    if (selectedDay < currentDay) {
      setSelectedDay(prev => prev + 1);
    }
  }, [selectedDay, currentDay]);

  const goToToday = useCallback(() => {
    setSelectedDay(currentDay);
  }, [currentDay]);

  const value = {
    currentDay,
    selectedDay,
    isViewingCurrentDay,
    isViewingPast,
    canEdit,
    goToDay,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    getTimeUntilNextDay,
    formatTimeRemaining,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
