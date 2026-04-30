import { DesktopBridge, FocusRecord, FocusRecordPatch, TimerConfig } from '../types';
import { queuePendingDeletion, queuePendingRecord } from './mobile-sync';

const RECORDS_STORAGE_KEY = 'focus_records';
const SETTINGS_STORAGE_KEY = 'timer_config';

const DEFAULT_CONFIG: TimerConfig = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  themeColor: '#FF8C42',
};

declare global {
  interface Window {
    focusOrangeDesktop?: DesktopBridge;
  }
}

function getDesktopBridge() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.focusOrangeDesktop;
}

function readLocalStorageJson<T>(key: string, fallback: T) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch (_error) {
    return fallback;
  }
}

function writeLocalStorageJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function migrateLegacyLocalStorageData() {
  const bridge = getDesktopBridge();
  if (!bridge || typeof window === 'undefined') {
    return null;
  }

  const migrationState = await bridge.migration.getState();
  const legacyRecords = readLocalStorageJson<FocusRecord[]>(RECORDS_STORAGE_KEY, []);
  const legacySettings = readLocalStorageJson<TimerConfig>(SETTINGS_STORAGE_KEY, DEFAULT_CONFIG);

  const shouldImportRecords = migrationState.recordsMissing && legacyRecords.length > 0;
  const shouldImportSettings = migrationState.settingsMissing && window.localStorage.getItem(SETTINGS_STORAGE_KEY) !== null;

  if (!shouldImportRecords && !shouldImportSettings) {
    return null;
  }

  return bridge.migration.importLegacyData({
    records: shouldImportRecords ? legacyRecords : undefined,
    settings: shouldImportSettings ? legacySettings : undefined,
  });
}

export async function loadRecords() {
  const bridge = getDesktopBridge();
  if (bridge) {
    return bridge.records.getAll();
  }

  return readLocalStorageJson<FocusRecord[]>(RECORDS_STORAGE_KEY, []);
}

export async function createRecord(record: FocusRecord) {
  const bridge = getDesktopBridge();
  if (bridge) {
    return bridge.records.create(record);
  }

  const records = readLocalStorageJson<FocusRecord[]>(RECORDS_STORAGE_KEY, []);
  const nextRecords = [record, ...records];
  writeLocalStorageJson(RECORDS_STORAGE_KEY, nextRecords);
  await queuePendingRecord(record);
  return nextRecords;
}

export async function updateRecord(id: string, patch: FocusRecordPatch) {
  const bridge = getDesktopBridge();
  if (bridge) {
    return bridge.records.update(id, patch);
  }

  const records = readLocalStorageJson<FocusRecord[]>(RECORDS_STORAGE_KEY, []);
  const nextRecords = records.map((record) => (
    record.id === id ? { ...record, ...patch, id: record.id } : record
  ));
  writeLocalStorageJson(RECORDS_STORAGE_KEY, nextRecords);
  return nextRecords;
}

export async function deleteRecord(id: string) {
  const bridge = getDesktopBridge();
  if (bridge) {
    return bridge.records.delete(id);
  }

  const records = readLocalStorageJson<FocusRecord[]>(RECORDS_STORAGE_KEY, []);
  const nextRecords = records.filter((record) => record.id !== id);
  writeLocalStorageJson(RECORDS_STORAGE_KEY, nextRecords);
  await queuePendingDeletion(id);
  return nextRecords;
}

export async function loadSettings() {
  const bridge = getDesktopBridge();
  if (bridge) {
    return bridge.settings.get();
  }

  return {
    ...DEFAULT_CONFIG,
    ...readLocalStorageJson<TimerConfig>(SETTINGS_STORAGE_KEY, DEFAULT_CONFIG),
  };
}

export async function saveSettings(config: TimerConfig) {
  const bridge = getDesktopBridge();
  if (bridge) {
    return bridge.settings.save(config);
  }

  const nextConfig = { ...DEFAULT_CONFIG, ...config };
  writeLocalStorageJson(SETTINGS_STORAGE_KEY, nextConfig);
  return nextConfig;
}

export { DEFAULT_CONFIG };
