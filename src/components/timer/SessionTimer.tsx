import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Briefcase, Play, Pause, Coffee } from 'lucide-react';
import { TimerMode } from '../../types';
import { formatTime, cn } from '../../lib/utils';
import { CatProgress } from './CatProgress';

interface SessionTimerProps {
  mode: TimerMode;
  timeLeft: number;
  overtimeSeconds: number;
  isActive: boolean;
  isOvertime: boolean;
  onToggle: () => void;
  onReset: () => void;
  onFinish: () => void;
  onSkipBreak: () => void;
  onModeSwitch: (mode: TimerMode) => void;
  totalDurationSeconds: number;
  isSessionActive: boolean;
  themeColor: string;
}

export function SessionTimer({
  mode,
  timeLeft,
  overtimeSeconds,
  isActive,
  isOvertime,
  onToggle,
  onReset,
  onFinish,
  onSkipBreak,
  onModeSwitch,
  totalDurationSeconds,
  isSessionActive,
  themeColor
}: SessionTimerProps) {
  const isWorkMode = mode === TimerMode.WORK;
  const isTransitioningToBreak = !isSessionActive && mode !== TimerMode.WORK;

  const progress = isOvertime ? 1 : Math.max(0, Math.min(1, (totalDurationSeconds - timeLeft) / totalDurationSeconds));
  const accentColor = isWorkMode ? themeColor : '#10b981';
  const sessionStatus = isSessionActive ? 'Session active' : 'Ready to start';
  const sessionTargetMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));

  // Calculate progress ring
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-center justify-center gap-6 lg:max-w-[700px] xl:max-w-none xl:grid xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start xl:gap-8">
      <div className="xl:min-w-0">
        {/* Mobile Header */}
        <div className="flex flex-col items-center gap-2 xl:hidden mb-4">
          <motion.h2
            className="text-xs font-black uppercase tracking-[0.4em]"
            style={{ color: accentColor }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {isWorkMode ? 'Focus Mode' : 'Rest Mode'}
          </motion.h2>
          {isSessionActive && (
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Session Active</span>
            </div>
          )}
        </div>

        <CatProgress
          progress={progress}
          themeColor={accentColor}
          isActive={isActive}
          className="xl:hidden"
        />

        {/* Main Timer Card */}
        <div className="relative flex w-full flex-col items-center overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-white/90 px-6 py-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-900/30 sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:min-h-[540px] xl:justify-center">
          {/* Top accent bar */}
          <motion.div
            className="absolute left-0 top-0 h-1.5 w-full"
            style={{ backgroundColor: accentColor }}
            animate={{ opacity: isActive ? [0.6, 1, 0.6] : 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Status badges */}
          <AnimatePresence mode="wait">
            {isOvertime ? (
              <motion.div
                key="overtime"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="absolute right-5 top-5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg sm:right-6 sm:top-6 xl:hidden"
                style={{
                  backgroundColor: themeColor,
                  boxShadow: `0 4px 15px -2px ${themeColor}50`
                }}
              >
                Overtime +{formatTime(overtimeSeconds)}
              </motion.div>
            ) : isTransitioningToBreak ? (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-5 top-5 rounded-full bg-emerald-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg sm:right-6 sm:top-6 xl:hidden"
                style={{ boxShadow: '0 4px 15px -2px rgba(16, 185, 129, 0.4)' }}
              >
                Break Pending
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Progress Ring (Desktop) */}
          <div className="hidden xl:block absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 400">
              <circle
                cx="200"
                cy="200"
                r="120"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-slate-100 dark:text-slate-800"
              />
              <motion.circle
                cx="200"
                cy="200"
                r="120"
                fill="none"
                stroke={accentColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                transform="rotate(-90 200 200)"
                opacity="0.3"
              />
            </svg>
          </div>

          {/* Timer Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isOvertime ? 'overtime' : mode}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{
                opacity: 1,
                scale: isOvertime ? 1.05 : 1,
                y: 0,
                transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
              }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={cn(
                'relative my-8 text-[clamp(4.5rem,15vw,7rem)] font-black leading-none tracking-tighter sm:my-10 lg:my-12',
                isWorkMode || isOvertime ? 'text-slate-800 dark:text-slate-100' : 'text-emerald-500'
              )}
              style={{ color: isOvertime ? themeColor : undefined }}
            >
              <motion.div
                animate={isActive ? {
                  scale: [1, 1.015, 1],
                  opacity: [1, 0.92, 1],
                } : {}}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(timeLeft)}
              </motion.div>

              {/* Subtle glow effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 blur-3xl -z-10 opacity-20"
                  style={{ backgroundColor: accentColor }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Session Info */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {sessionTargetMinutes} minute {isWorkMode ? 'focus' : 'break'} session
            </p>
          </motion.div>

          {/* Controls */}
          <div className="flex w-full max-w-[400px] flex-col gap-4 sm:max-w-[440px]">
            <div className="flex gap-3 sm:gap-4">
              {/* Main Action Button */}
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onToggle}
                className={cn(
                  'group relative flex-1 overflow-hidden rounded-[1.75rem] px-6 py-4 text-base font-bold transition-all shadow-xl sm:px-8 sm:py-5 sm:text-lg',
                  isActive
                    ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-white'
                )}
                style={!isActive ? {
                  backgroundColor: accentColor,
                  boxShadow: `0 12px 30px -8px ${accentColor}50`
                } : {}}
              >
                {/* Button shine effect */}
                {!isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5" />
                      PAUSE
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      {isWorkMode ? 'START FOCUS' : 'START BREAK'}
                    </>
                  )}
                </span>
              </motion.button>

              {/* Secondary Action Button */}
              {isSessionActive ? (
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onFinish}
                  className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700 hover:shadow-md dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-[4.25rem] sm:w-[4.25rem]"
                  title="Finish Session"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  >
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                  </motion.div>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.08, rotate: -180 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onReset}
                  className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700 hover:shadow-md dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-[4.25rem] sm:w-[4.25rem]"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.button>
              )}
            </div>

            {/* Skip Break Button */}
            <AnimatePresence>
              {!isWorkMode && !isActive && (
                <motion.button
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  whileHover={{ scale: 1.02, backgroundColor: `${themeColor}15` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSkipBreak}
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-all dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                >
                  <Coffee className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  Skip break & Start Focus
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Mode Switcher */}
        {!isSessionActive && isWorkMode && (
          <motion.div
            className="mt-4 flex gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 p-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50 xl:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {[TimerMode.WORK, TimerMode.SHORT_BREAK].map((m) => (
              <button
                key={m}
                onClick={() => onModeSwitch(m)}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all sm:px-5',
                  mode === m
                    ? 'bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                )}
              >
                {m === TimerMode.WORK ? 'Pomodoro' : 'Short Break'}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Desktop Sidebar Info */}
      <div className="hidden xl:flex xl:flex-col xl:gap-5 xl:rounded-[2rem] xl:border xl:border-slate-200/80 xl:bg-white/90 xl:p-6 xl:shadow-xl xl:shadow-slate-200/30 xl:backdrop-blur-xl xl:dark:border-slate-700/50 xl:dark:bg-slate-900/90 xl:dark:shadow-slate-900/20">
        {/* Mode Header */}
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <p
            className="text-[10px] font-black uppercase tracking-[0.35em]"
            style={{ color: accentColor }}
          >
            {isWorkMode ? 'Focus Mode' : 'Rest Mode'}
          </p>
          <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {formatTime(timeLeft)}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500">
            {sessionTargetMinutes} min target
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-2xl bg-slate-50/80 px-5 py-4 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: isSessionActive ? accentColor : '#94a3b8',
                boxShadow: isSessionActive ? `0 0 8px ${accentColor}60` : 'none'
              }}
            />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p>
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            {sessionStatus}
          </p>
        </div>

        {/* Progress Card */}
        <div className="rounded-2xl bg-slate-50/80 px-5 py-5 dark:bg-slate-800/60">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Progress</p>
            <motion.span
              className="text-lg font-bold text-slate-700 dark:text-slate-200"
              key={Math.round(progress * 100)}
              initial={{ scale: 1.2, color: accentColor }}
              animate={{ scale: 1, color: '#334155' }}
              transition={{ duration: 0.3 }}
            >
              {Math.round(progress * 100)}%
            </motion.span>
          </div>
          <CatProgress
            progress={progress}
            themeColor={accentColor}
            isActive={isActive}
            className="!mb-0 !h-12 !px-0"
          />
        </div>

        {/* Mode Switcher */}
        {!isSessionActive && (
          <div className="flex gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 p-1.5 dark:border-slate-700/50 dark:bg-slate-800/50">
            {[TimerMode.WORK, TimerMode.SHORT_BREAK].map((m) => (
              <button
                key={m}
                onClick={() => onModeSwitch(m)}
                className={cn(
                  'flex-1 rounded-full px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                  mode === m
                    ? 'bg-white text-slate-900 shadow-md dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                )}
              >
                {m === TimerMode.WORK ? 'Pomodoro' : 'Short Break'}
              </button>
            ))}
          </div>
        )}

        {/* Status Badges */}
        <AnimatePresence>
          {isOvertime && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-full px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-lg"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 4px 15px -2px ${themeColor}50`
              }}
            >
              Overtime +{formatTime(overtimeSeconds)}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isTransitioningToBreak && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="rounded-full bg-emerald-500 px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-lg"
              style={{ boxShadow: '0 4px 15px -2px rgba(16, 185, 129, 0.4)' }}
            >
              Break Pending
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
