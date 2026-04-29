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
