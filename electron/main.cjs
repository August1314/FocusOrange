const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { createStorageService, exists } = require('./storage.cjs');

const APP_NAME = 'FocusOrange';
const LEGACY_USER_DATA_DIR = 'react-example';
const RECORDS_FILE = 'focus-records.json';
const SETTINGS_FILE = 'settings.json';

app.setName(APP_NAME);

const appDataPath = app.getPath('appData');
const targetUserDataPath = path.join(appDataPath, APP_NAME);
const legacyUserDataPath = path.join(appDataPath, LEGACY_USER_DATA_DIR);

app.setPath('userData', targetUserDataPath);

const storage = createStorageService(targetUserDataPath);

async function migrateLegacyUserDataDirectory() {
  const [targetHasRecords, targetHasSettings, legacyHasRecords, legacyHasSettings] = await Promise.all([
    exists(path.join(targetUserDataPath, RECORDS_FILE)),
    exists(path.join(targetUserDataPath, SETTINGS_FILE)),
    exists(path.join(legacyUserDataPath, RECORDS_FILE)),
    exists(path.join(legacyUserDataPath, SETTINGS_FILE)),
  ]);

  if (targetHasRecords || targetHasSettings || (!legacyHasRecords && !legacyHasSettings)) {
    return;
  }

  await fs.mkdir(path.dirname(targetUserDataPath), { recursive: true });
  await fs.cp(legacyUserDataPath, targetUserDataPath, { recursive: true, force: false, errorOnExist: false });
}

function registerIpcHandlers() {
  ipcMain.handle('records:getAll', () => storage.listRecords());
  ipcMain.handle('records:create', (_event, record) => storage.createRecord(record));
  ipcMain.handle('records:update', (_event, id, patch) => storage.updateRecord(id, patch));
  ipcMain.handle('records:delete', (_event, id) => storage.deleteRecord(id));
  ipcMain.handle('settings:get', () => storage.getSettings());
  ipcMain.handle('settings:save', (_event, config) => storage.saveSettings(config));
  ipcMain.handle('migration:getState', () => storage.getMigrationState());
  ipcMain.handle('migration:importLegacyData', (_event, payload) => storage.importLegacyData(payload));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 720,
    title: 'FocusOrange',
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(async () => {
  await migrateLegacyUserDataDirectory();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
