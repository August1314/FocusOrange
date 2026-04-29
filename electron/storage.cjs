const fs = require('fs/promises');
const path = require('path');

const RECORDS_FILE = 'focus-records.json';
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
  const settingsPath = path.join(userDataPath, SETTINGS_FILE);

  async function listRecords() {
    const data = await readJsonFile(recordsPath, []);
    return Array.isArray(data) ? data : [];
  }

  async function saveRecords(records) {
    await writeJsonAtomic(recordsPath, records);
    return records;
  }

  async function createRecord(record) {
    const records = await listRecords();
    const nextRecords = [record, ...records];
    return saveRecords(nextRecords);
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
    createRecord,
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
