const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { createStorageService, exists } = require('./storage.cjs');
const { createSyncServer } = require('./sync-server.cjs');
const { createQuickTunnelManager } = require('./tunnel-manager.cjs');
const { createCloudQueueSyncClient } = require('./cloud-queue-sync.cjs');
const { getEnvCandidatePaths, loadFocusOrangeEnv } = require('./env-loader.cjs');

const APP_NAME = 'FocusOrange';
const LEGACY_USER_DATA_DIR = 'react-example';
const RECORDS_FILE = 'focus-records.json';
const SETTINGS_FILE = 'settings.json';

app.setName(APP_NAME);

const appDataPath = app.getPath('appData');
const targetUserDataPath = path.join(appDataPath, APP_NAME);
const legacyUserDataPath = path.join(appDataPath, LEGACY_USER_DATA_DIR);

app.setPath('userData', targetUserDataPath);
const loadedEnvPaths = loadFocusOrangeEnv(getEnvCandidatePaths({
  appPath: path.join(__dirname, '..'),
  userDataPath: targetUserDataPath,
}));

if (loadedEnvPaths.length > 0) {
  console.log(`FocusOrange loaded env from ${loadedEnvPaths.join(', ')}`);
}

const storage = createStorageService(targetUserDataPath);
let syncServerInstance = null;
let quickTunnelManager = null;
let cloudQueueSyncClient = null;

function notifyRecordsChanged() {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('records:changed');
  }
}

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
  ipcMain.handle('records:create', async (_event, record) => {
    const records = await storage.createRecord(record);
    notifyRecordsChanged();
    return records;
  });
  ipcMain.handle('records:update', async (_event, id, patch) => {
    const records = await storage.updateRecord(id, patch);
    notifyRecordsChanged();
    return records;
  });
  ipcMain.handle('records:delete', async (_event, id) => {
    const records = await storage.deleteRecord(id);
    notifyRecordsChanged();
    return records;
  });
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
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hiddenInset',
    } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(async () => {
  try {
    await migrateLegacyUserDataDirectory();
    registerIpcHandlers();
    const syncServer = createSyncServer(storage, {
      onRecordsChanged: notifyRecordsChanged,
    });
    syncServerInstance = await syncServer.listen();
    console.log(`FocusOrange sync API listening on http://${syncServer.host}:${syncServer.port}`);
    quickTunnelManager = createQuickTunnelManager({
      host: syncServer.host,
      port: syncServer.port,
    });
    quickTunnelManager.start();
    cloudQueueSyncClient = createCloudQueueSyncClient(storage, {
      onRecordsChanged: notifyRecordsChanged,
    });
    cloudQueueSyncClient.start();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('FocusOrange failed to start', error);
    app.quit();
  }
});

app.on('before-quit', () => {
  if (syncServerInstance) {
    syncServerInstance.close();
  }
  if (quickTunnelManager) {
    quickTunnelManager.stop();
  }
  if (cloudQueueSyncClient) {
    cloudQueueSyncClient.stop();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
