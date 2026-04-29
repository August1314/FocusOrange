const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusOrangeDesktop', {
  records: {
    getAll: () => ipcRenderer.invoke('records:getAll'),
    create: (record) => ipcRenderer.invoke('records:create', record),
    update: (id, patch) => ipcRenderer.invoke('records:update', id, patch),
    delete: (id) => ipcRenderer.invoke('records:delete', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (config) => ipcRenderer.invoke('settings:save', config),
  },
  migration: {
    getState: () => ipcRenderer.invoke('migration:getState'),
    importLegacyData: (payload) => ipcRenderer.invoke('migration:importLegacyData', payload),
  },
});
