import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Cat } from 'lucide-react';
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
  
  // Transition state: Work mode ended but break hasn't started OR manually finished work
  const isTransitioningToBreak = !isSessionActive && mode !== TimerMode.WORK;

  const progress = isOvertime ? 1 : Math.max(0, Math.min(1, (totalDurationSeconds - timeLeft) / totalDurationSeconds));
  const accentColor = isWorkMode ? themeColor : '#10b981';

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-center justify-center gap-5 lg:max-w-[700px]">
      <div className="flex flex-col items-center gap-1">
        <h2 
          className="text-xs font-black uppercase tracking-[0.4em] transition-colors"
          style={{ color: accentColor }}
        >
          {isWorkMode ? "Focus Mode" : "Rest Mode"}
        </h2>
        {isSessionActive && (
          <div className="flex items-center gap-1.5">
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Active</span>
          </div>
        )}
      </div>

      <CatProgress 
        progress={progress} 
        themeColor={accentColor}
        isActive={isActive} 
      />

      <div className="relative flex w-full flex-col items-center overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white px-6 py-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div 
          className="absolute top-0 left-0 h-1.5 w-full transition-all duration-700" 
          style={{ backgroundColor: accentColor }}
        />
        
        <AnimatePresence mode="wait">
          {isOvertime ? (
            <motion.div 
              key="overtime"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute right-5 top-5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm sm:right-6 sm:top-6"
              style={{ backgroundColor: themeColor }}
            >
              Overtime +{formatTime(overtimeSeconds)}
            </motion.div>
          ) : isTransitioningToBreak ? (
            <motion.div 
              key="pending"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-5 top-5 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white sm:right-6 sm:top-6"
            >
              Break Pending
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div 
            key={isOvertime ? 'overtime' : mode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: isOvertime ? 1.1 : 1,
              transition: { duration: 0.4, ease: "easeOut" }
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "my-6 text-[clamp(4.25rem,14vw,6.5rem)] font-black leading-none tracking-tighter transition-colors duration-500 sm:my-7 lg:my-8",
              isWorkMode || isOvertime ? "text-slate-800 dark:text-slate-100" : "text-emerald-500"
            )}
            style={{ color: isOvertime ? themeColor : undefined }}
          >
            <motion.div
              animate={isActive ? {
                scale: [1, 1.01, 1],
                opacity: [1, 0.95, 1],
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(timeLeft)}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="flex w-full max-w-[380px] flex-col gap-3 sm:max-w-[420px]">
          <div className="flex gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggle}
              className={cn(
                "flex-1 rounded-[1.5rem] px-5 py-3.5 text-base font-bold transition-all shadow-lg sm:px-6 sm:py-4 sm:text-lg",
                isActive 
                  ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900" 
                  : "text-white"
              )}
              style={!isActive ? { 
                backgroundColor: accentColor,
                boxShadow: `0 10px 25px -5px ${accentColor}40`
              } : {}}
            >
              {isActive ? 'PAUSE' : isWorkMode ? 'START FOCUS' : 'START BREAK'}
            </motion.button>
            
            {isSessionActive && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFinish}
                className="flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-[1.35rem] bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 sm:h-16 sm:w-16"
                title="Finish Session"
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.div>
              </motion.button>
            )}

            {!isSessionActive && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-[1.35rem] bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 sm:h-16 sm:w-16"
                title="Reset Timer"
              >
                <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {!isWorkMode && !isActive && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                whileHover={{ scale: 1.01, backgroundColor: `${themeColor}10`, color: themeColor }}
                onClick={onSkipBreak}
                className="w-full rounded-2xl border border-dashed border-slate-200 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors dark:border-slate-800"
              >
                Skip break & Start Focus
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {!isSessionActive && isWorkMode && (
        <div className="flex gap-2 rounded-full border border-slate-200 bg-slate-100 p-1.5 dark:border-slate-700/50 dark:bg-slate-800/50">
          {[TimerMode.WORK, TimerMode.SHORT_BREAK].map((m) => (
            <button
              key={m}
              onClick={() => onModeSwitch(m)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all sm:px-5",
                mode === m 
                  ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {m === TimerMode.WORK ? 'Pomodoro' : 'Short Break'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
