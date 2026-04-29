import { useState, useEffect, useRef } from 'react';
import { TimerMode, TimerConfig } from '../types';

interface UseTimerProps {
  config: TimerConfig;
  onSessionComplete: (mode: TimerMode, baseDuration: number, actualDuration: number, overtimeMinutes: number) => void;
}

export function useTimer({ config, onSessionComplete }: UseTimerProps) {
  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState(config.work * 60);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Sync timeLeft with config ONLY when mode changes or timer is explicitly reset
    if (!isActive && !sessionStartTime) {
      if (mode === TimerMode.WORK) setTimeLeft(config.work * 60);
      else if (mode === TimerMode.SHORT_BREAK) setTimeLeft(config.shortBreak * 60);
      else setTimeLeft(config.longBreak * 60);
      setOvertimeSeconds(0);
      setIsOvertime(false);
    }
  }, [config, mode, isActive, sessionStartTime]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (timeLeft > 0) {
          setTimeLeft((prev) => prev - 1);
        } else if (mode === TimerMode.WORK) {
          if (!isOvertime) {
            setIsOvertime(true);
            // Play alert sound when focus period is over
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play();
            } catch (e) {
              console.warn("Audio playback failed", e);
            }
          }
          setOvertimeSeconds((prev) => prev + 1);
        } else {
          // Break time reached 0 - stop automatically but don't finish until user confirms or manually stops
          setIsActive(false);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, isOvertime]);

  const finishSession = () => {
    const baseDuration = mode === TimerMode.WORK ? config.work : (mode === TimerMode.SHORT_BREAK ? config.shortBreak : config.longBreak);
    
    // Calculate actual elapsed minutes
    let actualMinutes: number;
    let overtimeMinutes = 0;

    if (isOvertime) {
      overtimeMinutes = Math.floor(overtimeSeconds / 60);
      actualMinutes = baseDuration + overtimeMinutes;
    } else {
      // Early finish: calculate how many minutes have actually passed
      const elapsedSeconds = (baseDuration * 60) - timeLeft;
      actualMinutes = Math.max(1, Math.floor(elapsedSeconds / 60)); // Min 1 minute if started
    }
    
    onSessionComplete(mode, baseDuration, actualMinutes, overtimeMinutes);
    
    setIsActive(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setSessionStartTime(null);
    if (mode === TimerMode.WORK) {
      setMode(TimerMode.SHORT_BREAK);
    } else {
      setMode(TimerMode.WORK);
    }
  };

  const skipToFocus = () => {
    setIsActive(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setSessionStartTime(null);
    setMode(TimerMode.WORK);
    setTimeLeft(config.work * 60);
  };

  const toggleTimer = () => {
    if (!isActive) {
      if (!sessionStartTime) {
        setSessionStartTime(new Date().toISOString());
      }
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setSessionStartTime(null);
    if (mode === TimerMode.WORK) setTimeLeft(config.work * 60);
    else if (mode === TimerMode.SHORT_BREAK) setTimeLeft(config.shortBreak * 60);
    else setTimeLeft(config.longBreak * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    if (isActive || sessionStartTime) return; // Prevent during active session
    setMode(newMode);
    if (newMode === TimerMode.WORK) setTimeLeft(config.work * 60);
    else if (newMode === TimerMode.SHORT_BREAK) setTimeLeft(config.shortBreak * 60);
    else setTimeLeft(config.longBreak * 60);
  };

  return {
    mode,
    timeLeft,
    overtimeSeconds,
    isActive,
    isOvertime,
    toggleTimer,
    resetTimer,
    finishSession,
    skipToFocus,
    switchMode,
    sessionStartTime,
    totalDurationSeconds: mode === TimerMode.WORK ? config.work * 60 : (mode === TimerMode.SHORT_BREAK ? config.shortBreak * 60 : config.longBreak * 60),
  };
}
