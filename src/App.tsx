/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTimer } from './hooks/useTimer';
import { useRecords } from './hooks/useRecords';
import { Navigation, ViewType } from './components/Navigation';
import { SessionTimer } from './components/timer/SessionTimer';
import { FocusHistory } from './components/history/FocusHistory';
import { StatsView } from './components/stats/StatsView';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { TimerConfig, TimerMode } from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('timer');
  const [config, setConfig] = useState<TimerConfig>(() => {
    const saved = localStorage.getItem('timer_config');
    const defaultData = { work: 25, shortBreak: 5, longBreak: 15, themeColor: '#FF8C42' };
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
  });

  const themeStyle = {
    '--theme-primary': config.themeColor,
    '--theme-primary-soft': `${config.themeColor}20`, // 20 (hex) is approx 12.5% opacity
  } as React.CSSProperties;

  const { records, addRecord, updateRecordNote, deleteRecord } = useRecords();

  const onSessionComplete = (mode: TimerMode, baseDuration: number, actualDuration: number, overtimeMinutes: number) => {
    addRecord({
      startTime: new Date(Date.now() - actualDuration * 60000).toISOString(),
      endTime: new Date().toISOString(),
      baseDuration,
      actualDuration,
      overtimeMinutes,
      mode,
      status: 'completed',
      label: mode === TimerMode.WORK ? 'Focus' : 'Break',
    });
  };

  const timer = useTimer({ config, onSessionComplete });

  const handleUpdateConfig = (newConfig: TimerConfig) => {
    setConfig(newConfig);
    localStorage.setItem('timer_config', JSON.stringify(newConfig));
    setCurrentView('timer');
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-rose-100 selection:text-rose-900"
      style={themeStyle}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        
        {/* Bento Header */}
        <header className="flex justify-between items-center mb-10 px-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200 dark:shadow-none"
              style={{ backgroundColor: config.themeColor }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">FocusFlow</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Productivity Studio</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
             <div 
               className="px-4 py-2 bg-white dark:bg-slate-900 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
               style={{ borderColor: `${config.themeColor}30`, color: config.themeColor }}
             >
               Live Session
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              {currentView === 'timer' && (
                <SessionTimer 
                  mode={timer.mode}
                  timeLeft={timer.timeLeft}
                  isActive={timer.isActive}
                  onToggle={timer.toggleTimer}
                  onReset={timer.resetTimer}
                  onModeSwitch={timer.switchMode}
                  totalDurationSeconds={timer.totalDurationSeconds}
                  isOvertime={timer.isOvertime}
                  overtimeSeconds={timer.overtimeSeconds}
                  onFinish={timer.finishSession}
                  onSkipBreak={timer.skipToFocus}
                  isSessionActive={!!timer.sessionStartTime}
                  themeColor={config.themeColor}
                />
              )}
              {currentView === 'history' && (
                <FocusHistory 
                  records={records}
                  onDelete={deleteRecord}
                  onUpdateNote={updateRecordNote}
                  themeColor={config.themeColor}
                />
              )}
              {currentView === 'stats' && (
                <StatsView 
                  records={records}
                  themeColor={config.themeColor}
                />
              )}
              {currentView === 'settings' && (
                <SettingsDialog 
                  config={config}
                  onUpdate={handleUpdateConfig}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <Navigation currentView={currentView} onViewChange={setCurrentView} themeColor={config.themeColor} />
      </div>

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] -z-20 opacity-50" />
    </div>
  );
}

