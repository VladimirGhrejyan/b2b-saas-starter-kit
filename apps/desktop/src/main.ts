import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {app, BrowserWindow} from 'electron'

import {webDistDirectory} from './web-dist-path.js'

export class DesktopApp {
  static start(): void {
    void app.whenReady().then(() => {
      DesktopApp.openWindow()
    })

    app.on('window-all-closed', DesktopApp.quitWhenWindowsClosed)
  }

  private static openWindow(): void {
    const window = new BrowserWindow({
      webPreferences: {
        preload: path.join(path.dirname(fileURLToPath(import.meta.url)), 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    void window.loadFile(path.join(webDistDirectory(), 'index.html'))
  }

  private static quitWhenWindowsClosed(): void {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  }
}

DesktopApp.start()
