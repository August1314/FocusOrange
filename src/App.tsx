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
import { MobileSyncConfig, TimerConfig, TimerMode } from './types';
import { BarChart3, Settings, Sparkles } from 'lucide-react';
import { DEFAULT_CONFIG, loadSettings, migrateLegacyLocalStorageData, saveSettings } from './lib/desktop-storage';
import {
  getPendingRecordCount,
  loadMobileSyncConfig,
  saveMobileSyncConfig,
  syncPendingRecords,
} from './lib/mobile-sync';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('timer');
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [syncConfig, setSyncConfig] = useState<MobileSyncConfig>(() => loadMobileSyncConfig());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastAutoSyncAttempt, setLastAutoSyncAttempt] = useState(0);

  const themeStyle = {
    '--theme-primary': config.themeColor,
    '--theme-primary-soft': `${config.themeColor}20`,
  } as React.CSSProperties;

  const { records, error: recordsError, addRecord, reloadRecords, updateRecordNote, deleteRecord } = useRecords();

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSettings() {
      try {
        const migrated = await migrateLegacyLocalStorageData();
        if (migrated && !cancelled) {
          setConfig(migrated.settings);
        }

        const loadedConfig = await loadSettings();
        if (!cancelled) {
          setConfig(loadedConfig);
          setSettingsError(null);
        }
      } catch (error) {
        console.error('Failed to load settings', error);
        if (!cancelled) {
          setConfig(DEFAULT_CONFIG);
          setSettingsError('Failed to load saved settings. Using defaults.');
        }
      }
    }

    bootstrapSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getPendingRecordCount()
      .then(setPendingSyncCount)
      .catch(() => setPendingSyncCount(0));
  }, [records]);

  const onSessionComplete = async (mode: TimerMode, baseDuration: number, actualDuration: number, overtimeMinutes: number) => {
    await addRecord({
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

  const handleUpdateConfig = async (newConfig: TimerConfig) => {
    try {
      const savedConfig = await saveSettings(newConfig);
      setConfig(savedConfig);
      setSettingsError(null);
      setCurrentView('timer');
    } catch (error) {
      console.error('Failed to save settings', error);
      setSettingsError('Failed to save settings.');
    }
  };

  const handleSyncConfigChange = (newConfig: MobileSyncConfig) => {
    setSyncConfig(saveMobileSyncConfig(newConfig));
  };

  const handleSyncNow = async () => {
    try {
      setSyncStatus('Syncing...');
      const result = await syncPendingRecords(syncConfig);
      await reloadRecords();
      setPendingSyncCount(result.pending);
      setSyncStatus(`Synced ${result.accepted} new, ${result.deleted} deleted, skipped ${result.duplicates} duplicate, rejected ${result.rejected}.`);
    } catch (error) {
      console.error('Failed to sync records', error);
      setSyncStatus('Sync failed. Check the Mac API URL, token, and whether your Mac is online.');
    }
  };

  useEffect(() => {
    if (!syncConfig.endpoint || !syncConfig.token || pendingSyncCount === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastAutoSyncAttempt < 30_000) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setLastAutoSyncAttempt(Date.now());
      void handleSyncNow();
    }, 800);

    return () => window.clearTimeout(timerId);
  }, [pendingSyncCount, syncConfig.endpoint, syncConfig.token, lastAutoSyncAttempt]);

  useEffect(() => {
    const handleOnline = () => {
      getPendingRecordCount()
        .then((count) => {
          setPendingSyncCount(count);
          if (count > 0 && syncConfig.endpoint && syncConfig.token) {
            setLastAutoSyncAttempt(0);
          }
        })
        .catch(() => setPendingSyncCount(0));
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncConfig.endpoint, syncConfig.token]);

  const appError = recordsError || settingsError;
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-700 font-sans"
      style={themeStyle}
    >
      {/* Ambient background glow */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${config.themeColor}30, transparent 70%)` }}
      />
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none -z-10"
        style={{ background: `radial-gradient(circle, ${config.themeColor}20, transparent 70%)` }}
      />

      <div className="window-drag fixed inset-x-0 top-0 z-30 hidden h-16 bg-white/70 backdrop-blur-xl dark:bg-slate-950/70 lg:block" aria-hidden="true" />
      <header className="fixed inset-x-0 top-0 z-40 hidden h-16 lg:block">
        <div className="ml-56 flex h-full items-center px-6">
          <div className="window-drag min-w-0 flex-1 self-stretch" aria-hidden="true" />

          <div className="window-no-drag flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('settings')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:text-slate-900 hover:shadow-md dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700/50 dark:hover:text-slate-100"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('stats')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-500 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:text-slate-900 hover:shadow-md dark:bg-slate-800/80 dark:text-slate-300 dark:ring-slate-700/50 dark:hover:text-slate-100"
              aria-label="Open stats"
            >
              <BarChart3 className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16 lg:max-w-none lg:px-0 lg:py-0">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="lg:order-2">
            <main className="min-h-[500px] lg:ml-0 lg:pt-20 lg:pr-10 lg:pb-12">
              <AnimatePresence mode="wait">
                {appError && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6 mx-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 backdrop-blur-sm px-5 py-4 text-sm font-medium text-amber-900 shadow-sm lg:mx-0"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      {appError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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
                      syncConfig={syncConfig}
                      pendingSyncCount={pendingSyncCount}
                      syncStatus={syncStatus}
                      onSyncConfigChange={handleSyncConfigChange}
                      onSyncNow={handleSyncNow}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          <div className="lg:order-1">
            <Navigation currentView={currentView} onViewChange={setCurrentView} themeColor={config.themeColor} />
          </div>
        </div>
      </div>

      {/* Enhanced Grid Background with subtle animation */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,#1e293b_1px,transparent_1px)] [background-size:40px_40px] -z-20 opacity-40" />
    </div>
  );
}
