// Electron main process for the desktop (.exe) build of CM Simulator.
//
// This wraps the EXISTING offline web build (produced by `npm run build:offline`
// into `dist/`) in a native window. It does not change the web app in any way —
// it just points a desktop window at the same static files. Because the offline
// build uses relative asset paths (`base: './'`) and stores data in the local
// browser storage, it runs fully offline with no server, no Firebase, no login.

import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Path to the built offline app. In development this is <repo>/dist; when packaged
// by electron-builder the same folder is bundled next to this file inside the app.
const indexHtml = path.join(__dirname, '..', 'dist', 'index.html')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d0f12',
    title: 'CM Simulator',
    autoHideMenuBar: true,
    webPreferences: {
      // The renderer only runs the static web app; it needs no Node access.
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadFile(indexHtml)

  // Open any external (http/https) links in the user's real browser rather than
  // inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  createWindow()

  // macOS: re-create a window when the dock icon is clicked and none are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS where apps stay alive.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
