import { DeletedRecord, FocusRecord, MobileSyncConfig } from '../types';

const RECORDS_STORAGE_KEY = 'focus_records';
const DELETIONS_STORAGE_KEY = 'focus_deleted_records';
const SYNC_CONFIG_STORAGE_KEY = 'focusorange_sync_config';
const DB_NAME = 'focusorange-mobile-sync';
const RECORDS_STORE_NAME = 'pendingRecords';
const DELETIONS_STORE_NAME = 'pendingDeletions';

function trimEndpoint(endpoint: string) {
  return endpoint.replace(/\/+$/, '');
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timerId),
  };
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

function openSyncDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECORDS_STORE_NAME)) {
        db.createObjectStore(RECORDS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DELETIONS_STORE_NAME)) {
        db.createObjectStore(DELETIONS_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runStoreTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void
) {
  const db = await openSyncDb();

  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    let result: T | undefined;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export function loadMobileSyncConfig(): MobileSyncConfig {
  return readLocalStorageJson<MobileSyncConfig>(SYNC_CONFIG_STORAGE_KEY, {
    endpoint: '',
    token: '',
  });
}

export function saveMobileSyncConfig(config: MobileSyncConfig) {
  const nextConfig = {
    endpoint: config.endpoint.trim(),
    token: config.token.trim(),
  };

  writeLocalStorageJson(SYNC_CONFIG_STORAGE_KEY, nextConfig);
  return nextConfig;
}

function getKnownDeletions() {
  return readLocalStorageJson<DeletedRecord[]>(DELETIONS_STORAGE_KEY, [])
    .filter((deletion) => deletion && typeof deletion.id === 'string' && deletion.id.length > 0);
}

function rememberLocalDeletions(deletions: DeletedRecord[]) {
  const deletionsById = new Map(getKnownDeletions().map((deletion) => [deletion.id, deletion]));

  for (const deletion of deletions) {
    if (!deletion || typeof deletion.id !== 'string' || deletion.id.length === 0) {
      continue;
    }

    deletionsById.set(deletion.id, {
      id: deletion.id,
      deletedAt: deletion.deletedAt || new Date().toISOString(),
    });
  }

  const nextDeletions = Array.from(deletionsById.values());
  writeLocalStorageJson(DELETIONS_STORAGE_KEY, nextDeletions);
  return nextDeletions;
}

export async function queuePendingRecord(record: FocusRecord) {
  if (typeof indexedDB === 'undefined') {
    return;
  }

  await runStoreTransaction(RECORDS_STORE_NAME, 'readwrite', (store) => store.put(record));
}

export async function queuePendingDeletion(id: string) {
  const deletion = { id, deletedAt: new Date().toISOString() };
  rememberLocalDeletions([deletion]);

  if (typeof indexedDB === 'undefined') {
    return;
  }

  await Promise.all([
    runStoreTransaction(RECORDS_STORE_NAME, 'readwrite', (store) => store.delete(id)),
    runStoreTransaction(DELETIONS_STORE_NAME, 'readwrite', (store) => store.put(deletion)),
  ]);
}

export async function getPendingRecordCount() {
  if (typeof indexedDB === 'undefined') {
    return 0;
  }

  const [records, deletions] = await Promise.all([
    runStoreTransaction<number>(RECORDS_STORE_NAME, 'readonly', (store) => store.count()),
    runStoreTransaction<number>(DELETIONS_STORE_NAME, 'readonly', (store) => store.count()),
  ]);
  return (records || 0) + (deletions || 0);
}

async function getPendingRecords() {
  if (typeof indexedDB === 'undefined') {
    return [];
  }

  return (await runStoreTransaction<FocusRecord[]>(RECORDS_STORE_NAME, 'readonly', (store) => store.getAll())) || [];
}

async function getPendingDeletions() {
  if (typeof indexedDB === 'undefined') {
    return [];
  }

  return (await runStoreTransaction<DeletedRecord[]>(DELETIONS_STORE_NAME, 'readonly', (store) => store.getAll())) || [];
}

async function deletePendingRecords(ids: string[]) {
  if (typeof indexedDB === 'undefined' || ids.length === 0) {
    return;
  }

  await runStoreTransaction(RECORDS_STORE_NAME, 'readwrite', (store) => {
    ids.forEach((id) => store.delete(id));
  });
}

async function deletePendingDeletions(ids: string[]) {
  if (typeof indexedDB === 'undefined' || ids.length === 0) {
    return;
  }

  await runStoreTransaction(DELETIONS_STORE_NAME, 'readwrite', (store) => {
    ids.forEach((id) => store.delete(id));
  });
}

function mergeKnownDeletions(serverDeletedIds: string[]) {
  const now = new Date().toISOString();
  const serverDeletions = serverDeletedIds.map((id) => ({ id, deletedAt: now }));
  const deletions = rememberLocalDeletions(serverDeletions);

  return new Set(deletions.map((deletion) => deletion.id));
}

function uniqueDeletions(deletions: DeletedRecord[]) {
  const deletionsById = new Map<string, DeletedRecord>();

  for (const deletion of deletions) {
    if (!deletion || typeof deletion.id !== 'string' || deletion.id.length === 0) {
      continue;
    }

    deletionsById.set(deletion.id, deletion);
  }

  return Array.from(deletionsById.values());
}

function mergeLocalRecords(serverRecords: FocusRecord[], serverDeletedIds: string[]) {
  const deletedIds = mergeKnownDeletions(serverDeletedIds);
  const localRecords = readLocalStorageJson<FocusRecord[]>(RECORDS_STORAGE_KEY, []);
  const recordsById = new Map<string, FocusRecord>();

  for (const record of [...serverRecords, ...localRecords]) {
    if (deletedIds.has(record.id)) {
      continue;
    }

    if (!recordsById.has(record.id)) {
      recordsById.set(record.id, record);
    }
  }

  const records = Array.from(recordsById.values()).sort((a, b) => (
    new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  ));

  writeLocalStorageJson(RECORDS_STORAGE_KEY, records);
  return records;
}

export async function syncPendingRecords(config: MobileSyncConfig) {
  const endpoint = trimEndpoint(config.endpoint);
  if (!endpoint || !config.token) {
    throw new Error('missing_sync_config');
  }

  const pendingRecords = await getPendingRecords();
  const pendingDeletions = await getPendingDeletions();
  const deletedIds = uniqueDeletions([...getKnownDeletions(), ...pendingDeletions]);
  const timeout = createTimeoutSignal(15_000);
  let response: Response;

  try {
    response = await fetch(`${endpoint}/api/sync/push`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        records: pendingRecords,
        deletedIds,
      }),
      signal: timeout.signal,
    });
  } finally {
    timeout.clear();
  }

  if (!response.ok) {
    throw new Error(`sync_failed_${response.status}`);
  }

  const result = await response.json() as {
    acceptedIds?: string[];
    duplicateIds?: string[];
    rejectedIds?: string[];
    deletedIds?: string[];
    records?: FocusRecord[];
  };

  const syncedIds = [...(result.acceptedIds || []), ...(result.duplicateIds || [])];
  const syncedDeletedIds = result.deletedIds || [];
  await deletePendingRecords(syncedIds);
  await deletePendingDeletions(syncedDeletedIds);
  const records = mergeLocalRecords(
    Array.isArray(result.records) ? result.records : [],
    syncedDeletedIds
  );

  return {
    accepted: result.acceptedIds?.length || 0,
    duplicates: result.duplicateIds?.length || 0,
    rejected: result.rejectedIds?.length || 0,
    deleted: syncedDeletedIds.length,
    pending: await getPendingRecordCount(),
    records,
  };
}
