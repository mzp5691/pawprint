const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  createNote: (options) => ipcRenderer.sendSync('create-note', options),
  saveNote: (id, data) => ipcRenderer.send('save-note', id, data),
  updateNote: (noteId, data) => ipcRenderer.send('update-note', noteId, data),
  deleteNote: (noteId) => ipcRenderer.send('delete-note', noteId),
  getNotes: () => ipcRenderer.sendSync('get-notes'),
  showMain: () => ipcRenderer.send('show-main'),
  onNotesChanged: (callback) => ipcRenderer.on('notes-changed', callback),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowSetAlwaysOnTop: (flag) => ipcRenderer.send('window-set-always-on-top', flag),
  windowSetOpacity: (val) => ipcRenderer.send('window-set-opacity', val),
  saveSetting: (key, val) => ipcRenderer.send('save-setting', key, val),
  getSettings: () => ipcRenderer.sendSync('get-settings'),
  onShortcutCreateNote: (callback) => ipcRenderer.on('shortcut-create-note', callback)
})
