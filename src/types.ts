/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TimerMode {
  WORK = 'work',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

export interface TimerConfig {
  work: number;
  shortBreak: number;
  longBreak: number;
  themeColor: string;
}

export interface FocusRecord {
  id: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  baseDuration: number; // Configured duration in minutes
  actualDuration: number; // Total duration include overtime in minutes
  overtimeMinutes: number;
  label: string;
  note?: string;
  status: 'completed' | 'interrupted';
  mode: TimerMode;
}

export interface UserSettings {
  config: TimerConfig;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  longBreakInterval: number;
}

export type FocusRecordPatch = Partial<Omit<FocusRecord, 'id'>>;

export interface MobileSyncConfig {
  endpoint: string;
  token: string;
}

export interface DeletedRecord {
  id: string;
  deletedAt: string;
}

export interface DesktopBridge {
  records: {
    getAll: () => Promise<FocusRecord[]>;
    create: (record: FocusRecord) => Promise<FocusRecord[]>;
    update: (id: string, patch: FocusRecordPatch) => Promise<FocusRecord[]>;
    delete: (id: string) => Promise<FocusRecord[]>;
    onChanged?: (callback: () => void) => () => void;
  };
  settings: {
    get: () => Promise<TimerConfig>;
    save: (config: TimerConfig) => Promise<TimerConfig>;
  };
  migration: {
    getState: () => Promise<{
      recordsMissing: boolean;
      settingsMissing: boolean;
    }>;
    importLegacyData: (payload: {
      records?: FocusRecord[];
      settings?: TimerConfig;
    }) => Promise<{
      records: FocusRecord[];
      settings: TimerConfig;
    }>;
  };
}
