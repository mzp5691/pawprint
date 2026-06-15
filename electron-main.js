const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, screen } = require('electron')
const path = require('path')
const Store = require('electron-store')

Menu.setApplicationMenu(null)

const store = new Store()

let mainWindow
let tray = null
let noteWindows = {}

function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('爪印')

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => showMainWindow() },
    { label: '新建爪印', click: () => createNewNote() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', () => showMainWindow())
}

function showMainWindow() {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
}

function createMainWindow() {
  const savedBounds = store.get('mainWindowBounds')
  const bounds = savedBounds 
    ? { ...savedBounds, width: 280 }
    : { width: 280, height: 600 }

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
  if (bounds.x === undefined || bounds.x < 0 || bounds.x > screenWidth - 100) {
    bounds.x = Math.floor((screenWidth - bounds.width) / 2)
  }
  if (bounds.y === undefined || bounds.y < 0 || bounds.y > screenHeight - 100) {
    bounds.y = Math.floor((screenHeight - bounds.height) / 2)
  }

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.removeMenu()

  const isPinned = store.get('settings.mainWindowPinned', false)
  if (isPinned) {
    mainWindow.setAlwaysOnTop(true)
  }

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
}

function createNoteWindow(noteId, options = {}) {
  if (noteWindows[noteId] && !noteWindows[noteId].isDestroyed()) {
    noteWindows[noteId].show()
    noteWindows[noteId].focus()
    return noteWindows[noteId]
  }

  let noteData = store.get(`notes.${noteId}`)
  const isNew = !noteData
  if (!noteData) {
    noteData = {
      id: noteId,
      title: '',
      content: '',
      x: 100 + Math.floor(Math.random() * 200),
      y: 100 + Math.floor(Math.random() * 100),
      width: 320,
      height: 420,
      opacity: 0.95,
      alwaysOnTop: false
    }
  }

  const noteWindow = new BrowserWindow({
    width: noteData.width,
    height: noteData.height,
    x: noteData.x,
    y: noteData.y,
    frame: false,
    resizable: true,
    movable: true,
    transparent: true,
    alwaysOnTop: noteData.alwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  noteWindow.setOpacity(noteData.opacity)

  const viewType = options.type === 'view' ? 'view' : 'note'
  if (process.env.NODE_ENV === 'development') {
    noteWindow.loadURL(`http://localhost:5173?type=${viewType}&id=${noteId}`)
  } else {
    noteWindow.loadFile(path.join(__dirname, 'dist', 'index.html'), {
      query: { type: viewType, id: noteId }
    })
  }

  noteWindows[noteId] = noteWindow

  noteWindow.on('move', () => {
    const { x, y } = noteWindow.getBounds()
    updateNotePosition(noteId, x, y)
  })

  noteWindow.on('resize', () => {
    const { width, height } = noteWindow.getBounds()
    updateNoteSize(noteId, width, height)
  })

  noteWindow.on('closed', () => {
    delete noteWindows[noteId]
    const noteData = store.get(`notes.${noteId}`)
    if (noteData && !noteData.title && !noteData.content) {
      store.delete(`notes.${noteId}`)
    }
    notifyMainNotesChanged()
  })

  return noteWindow
}

function notifyMainNotesChanged() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('notes-changed')
  }
}

function updateNotePosition(noteId, x, y) {
  const noteData = store.get(`notes.${noteId}`, {})
  noteData.x = x
  noteData.y = y
  store.set(`notes.${noteId}`, noteData)
}

function updateNoteSize(noteId, width, height) {
  const noteData = store.get(`notes.${noteId}`, {})
  noteData.width = width
  noteData.height = height
  store.set(`notes.${noteId}`, noteData)
}

function createNewNote() {
  const noteId = `note-${Date.now()}`
  createNoteWindow(noteId)
  notifyMainNotesChanged()
}

ipcMain.on('create-note', (event, options) => {
  const noteId = options.id || `note-${Date.now()}`
  createNoteWindow(noteId, options)
  event.returnValue = noteId
  notifyMainNotesChanged()
})

ipcMain.on('save-note', (event, noteId, data) => {
  let noteData = store.get(`notes.${noteId}`, {})
  Object.assign(noteData, { id: noteId }, data)
  store.set(`notes.${noteId}`, noteData)
  notifyMainNotesChanged()
})

ipcMain.on('update-note', (event, noteId, data) => {
  const noteData = store.get(`notes.${noteId}`, {})
  Object.assign(noteData, data)
  store.set(`notes.${noteId}`, noteData)

  if (noteWindows[noteId]) {
    if (data.opacity !== undefined) {
      noteWindows[noteId].setOpacity(data.opacity)
    }
    if (data.alwaysOnTop !== undefined) {
      noteWindows[noteId].setAlwaysOnTop(data.alwaysOnTop)
    }
  }
  notifyMainNotesChanged()
})

ipcMain.on('delete-note', (event, noteId) => {
  store.delete(`notes.${noteId}`)
  if (noteWindows[noteId]) {
    noteWindows[noteId].close()
  }
  notifyMainNotesChanged()
})

ipcMain.on('get-notes', (event) => {
  const notes = store.get('notes', {})
  event.returnValue = notes
})

ipcMain.on('show-main', () => {
  showMainWindow()
})

ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
})

ipcMain.on('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
})

ipcMain.on('window-set-always-on-top', (event, flag) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(flag)
    store.set('settings.mainWindowPinned', flag)
  }
})

ipcMain.on('window-set-opacity', (event, val) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(val)
  }
})

ipcMain.on('save-setting', (event, key, val) => {
  store.set(`settings.${key}`, val)
})

ipcMain.on('get-settings', (event) => {
  event.returnValue = store.get('settings', {})
})

app.whenReady().then(() => {
  createMainWindow()
  createTray()

  globalShortcut.register('CommandOrControl+N', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('shortcut-create-note')
    }
  })

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    showMainWindow()
  })

  app.on('activate', () => {
    showMainWindow()
  })
})

app.on('before-quit', () => {
  app.isQuitting = true
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
