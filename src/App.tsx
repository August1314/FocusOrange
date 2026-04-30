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
import { BarChart3, Settings } from 'lucide-react';
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
    '--theme-primary-soft': `${config.themeColor}20`, // 20 (hex) is approx 12.5% opacity
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
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-rose-100 selection:text-rose-900"
      style={themeStyle}
    >
      <div className="window-drag fixed inset-x-0 top-0 z-30 hidden h-16 bg-slate-50/90 backdrop-blur-sm dark:bg-slate-950/90 lg:block" aria-hidden="true" />
      <header className="fixed inset-x-0 top-0 z-40 hidden h-16 lg:block">
        <div className="ml-56 flex h-full items-center px-6">
          <div className="window-drag min-w-0 flex-1 self-stretch" aria-hidden="true" />

          <div className="window-no-drag flex items-center gap-2">
            <button
              onClick={() => setCurrentView('settings')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:text-slate-100"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-900 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:text-slate-100"
              aria-label="Open stats"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16 lg:max-w-none lg:px-0 lg:py-0">
        <div className="lg:grid lg:grid-cols-[224px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="lg:order-2">
            <main className="min-h-[500px] lg:ml-0 lg:pt-20 lg:pr-8 lg:pb-10">
              {appError && (
                <div className="mb-6 mx-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 lg:mx-0">
                  {appError}
                </div>
              )}
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

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] -z-20 opacity-50" />
    </div>
  );
}
