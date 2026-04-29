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

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full">
      
      {/* Header State Indicator */}
      <div className="flex flex-col items-center gap-1">
        <h2 
          className="text-xs font-black uppercase tracking-[0.4em] transition-colors"
          style={{ color: isWorkMode ? themeColor : '#10b981' }}
        >
          {isWorkMode ? "Focus Mode" : "Rest Mode"}
        </h2>
        {isSessionActive && (
          <div className="flex items-center gap-1.5">
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isWorkMode ? themeColor : '#10b981' }}
            />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Active</span>
          </div>
        )}
      </div>

      <CatProgress 
        progress={progress} 
        themeColor={isWorkMode ? themeColor : '#10b981'}
        isActive={isActive} 
      />

      {/* Main Bento Tile */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 flex flex-col items-center relative overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-1.5 transition-all duration-700" 
          style={{ backgroundColor: isWorkMode ? themeColor : '#10b981' }}
        />
        
        {/* Overtime/Status Badge */}
        <AnimatePresence mode="wait">
          {isOvertime ? (
            <motion.div 
              key="overtime"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 px-3 py-1 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              Overtime +{formatTime(overtimeSeconds)}
            </motion.div>
          ) : isTransitioningToBreak ? (
            <motion.div 
              key="pending"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 right-6 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
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
              "text-[100px] md:text-[130px] font-black tabular-nums tracking-tighter leading-none my-8 transition-colors duration-500",
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

        {/* Action Controls */}
        <div className="flex flex-col gap-4 w-full max-w-sm">
          
          {/* Main Action Layer */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onToggle}
              className={cn(
                "flex-1 py-5 rounded-2xl text-xl font-bold transition-all shadow-lg",
                isActive 
                  ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900" 
                  : "text-white"
              )}
              style={!isActive ? { 
                backgroundColor: isWorkMode ? themeColor : '#10b981',
                boxShadow: `0 10px 25px -5px ${isWorkMode ? themeColor : '#10b981'}40`
              } : {}}
            >
              {isActive ? 'PAUSE' : isWorkMode ? 'START FOCUS' : 'START BREAK'}
            </motion.button>
            
            {/* Contextual Secondary Button */}
            {isSessionActive && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFinish}
                className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                title="Finish Session"
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Briefcase className="w-6 h-6" />
                </motion.div>
              </motion.button>
            )}

            {!isSessionActive && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-6 h-6" />
              </motion.button>
            )}
          </div>

          {/* Transition / Skip Layer */}
          <AnimatePresence>
            {!isWorkMode && !isActive && (
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                whileHover={{ scale: 1.01, backgroundColor: `${themeColor}10`, color: themeColor }}
                onClick={onSkipBreak}
                className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl"
              >
                Skip break & Start Focus
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Mode Switcher (ONLY when IDLE) */}
      {!isSessionActive && isWorkMode && (
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700/50">
          {[TimerMode.WORK, TimerMode.SHORT_BREAK].map((m) => (
            <button
              key={m}
              onClick={() => onModeSwitch(m)}
              className={cn(
                "px-5 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-wider",
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
