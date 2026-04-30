const fs = require('fs/promises');
const path = require('path');

const RECORDS_FILE = 'focus-records.json';
const DELETIONS_FILE = 'focus-deletions.json';
const SETTINGS_FILE = 'settings.json';

const DEFAULT_CONFIG = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  themeColor: '#FF8C42',
};

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (_error) {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.name === 'SyntaxError')) {
      return fallbackValue;
    }
    throw error;
  }
}

async function writeJsonAtomic(filePath, data) {
  const dirPath = path.dirname(filePath);
  const tempPath = `${filePath}.tmp`;
  await ensureDir(dirPath);
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

function createStorageService(userDataPath) {
  const recordsPath = path.join(userDataPath, RECORDS_FILE);
  const deletionsPath = path.join(userDataPath, DELETIONS_FILE);
  const settingsPath = path.join(userDataPath, SETTINGS_FILE);

  async function listRecords() {
    const data = await readJsonFile(recordsPath, []);
    return Array.isArray(data) ? data : [];
  }

  async function saveRecords(records) {
    await writeJsonAtomic(recordsPath, records);
    return records;
  }

  async function listDeletions() {
    const data = await readJsonFile(deletionsPath, []);
    return Array.isArray(data) ? data : [];
  }

  async function saveDeletions(deletions) {
    await writeJsonAtomic(deletionsPath, deletions);
    return deletions;
  }

  async function addDeletions(incomingDeletions) {
    const deletions = await listDeletions();
    const deletionsById = new Map(deletions
      .filter((deletion) => deletion && typeof deletion.id === 'string')
      .map((deletion) => [deletion.id, deletion]));

    for (const deletion of incomingDeletions) {
      if (!deletion || typeof deletion.id !== 'string' || deletion.id.length === 0) {
        continue;
      }

      const deletedAt = typeof deletion.deletedAt === 'string' ? deletion.deletedAt : new Date().toISOString();
      deletionsById.set(deletion.id, { id: deletion.id, deletedAt });
    }

    return saveDeletions(Array.from(deletionsById.values()));
  }

  async function createRecord(record) {
    const deletedIds = new Set((await listDeletions()).map((deletion) => deletion.id));
    if (deletedIds.has(record.id)) {
      return listRecords();
    }

    const records = await listRecords();
    const nextRecords = [record, ...records];
    return saveRecords(nextRecords);
  }

  async function mergeRecords(incomingRecords, incomingDeletions = []) {
    const deletions = await addDeletions(incomingDeletions);
    const deletedIds = new Set(deletions.map((deletion) => deletion.id));
    const records = await listRecords();
    const keptRecords = records.filter((record) => record && !deletedIds.has(record.id));
    const existingIds = new Set(keptRecords.map((record) => record && record.id).filter(Boolean));
    const acceptedRecords = [];
    const duplicateIds = [];

    for (const record of incomingRecords) {
      if (deletedIds.has(record.id)) {
        duplicateIds.push(record.id);
        continue;
      }

      if (existingIds.has(record.id)) {
        duplicateIds.push(record.id);
        continue;
      }

      existingIds.add(record.id);
      acceptedRecords.push(record);
    }

    if (acceptedRecords.length === 0) {
      if (keptRecords.length !== records.length) {
        await saveRecords(keptRecords);
      }

      return {
        records: keptRecords,
        acceptedIds: [],
        duplicateIds,
        deletedIds: Array.from(deletedIds),
      };
    }

    const nextRecords = [...acceptedRecords, ...keptRecords].sort((a, b) => (
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    ));

    await saveRecords(nextRecords);

    return {
      records: nextRecords,
      acceptedIds: acceptedRecords.map((record) => record.id),
      duplicateIds,
      deletedIds: Array.from(deletedIds),
    };
  }

  async function updateRecord(id, patch) {
    const records = await listRecords();
    const nextRecords = records.map((record) => (
      record.id === id ? { ...record, ...patch, id: record.id } : record
    ));
    return saveRecords(nextRecords);
  }

  async function deleteRecord(id) {
    const records = await listRecords();
    const nextRecords = records.filter((record) => record.id !== id);
    await addDeletions([{ id, deletedAt: new Date().toISOString() }]);
    return saveRecords(nextRecords);
  }

  async function getSettings() {
    const data = await readJsonFile(settingsPath, DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG, ...data };
  }

  async function saveSettings(config) {
    const nextConfig = { ...DEFAULT_CONFIG, ...config };
    await writeJsonAtomic(settingsPath, nextConfig);
    return nextConfig;
  }

  async function getMigrationState() {
    const [records, settings] = await Promise.all([
      readJsonFile(recordsPath, null),
      readJsonFile(settingsPath, null),
    ]);

    return {
      recordsMissing: records === null,
      settingsMissing: settings === null,
    };
  }

  async function importLegacyData(payload) {
    const { records, settings } = payload || {};
    const tasks = [];

    if (Array.isArray(records)) {
      tasks.push(saveRecords(records));
    }

    if (settings && typeof settings === 'object') {
      tasks.push(saveSettings(settings));
    }

    await Promise.all(tasks);

    return {
      records: await listRecords(),
      settings: await getSettings(),
    };
  }

  return {
    listRecords,
    listDeletions,
    createRecord,
    mergeRecords,
    updateRecord,
    deleteRecord,
    getSettings,
    saveSettings,
    getMigrationState,
    importLegacyData,
  };
}

module.exports = {
  DEFAULT_CONFIG,
  createStorageService,
  exists,
};
