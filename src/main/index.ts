///<reference path="../../typings/custom.d.ts"/>
import "source-map-support/register"
import {app, BrowserWindow, globalShortcut} from "electron"
import "common/util/Ext"
import createMenu from "./Menu"
import getLogger from "common/log/Logger"
import {checkMainWindow} from "./MainWindow"
import EventHub from "common/events/Event"
import {isDarwin} from "common/Process"
import 'common/util/ErrorHandler'

const Sugar = require("sugar")
Sugar.extend()

const log = getLogger(__filename)


log.info("Starting")


// DISABLE WEB-SECURITY
app.commandLine.appendSwitch('disable-web-security')
//app.commandLine.append('js-flags',"--experimental-modules")
// Quit application when all windows are closed
app.on('window-all-closed', () => {
	if (isDarwin()) {
		app.quit()
	}
})

app.on('activate', async () => {
	// On macOS it is common to re-create a window
	// even after all windows have been closed
  await checkMainWindow()
})

// Create main BrowserWindow when electron is ready
app.on('ready', async () => {
	createMenu()
  registerShortcuts()
  app.on("browser-window-focus", registerShortcuts)
  app.on("browser-window-blur", unregisterShortcuts)

	require('electron-context-menu')()

	// BOOTSTRAP
	await (require("./Bootstrap")).default

	await checkMainWindow()

})

async function getZoomFactor():Promise<number> {
	return await (new Promise<number>(resolve => BrowserWindow.getFocusedWindow().webContents.getZoomFactor(resolve)))
}

const Shortcuts = [
	{
		accelerator: 'CommandOrControl+Option+I',
		handler() {
			BrowserWindow.getAllWindows().forEach(it => it.webContents.toggleDevTools())
		}
	},
  {
    accelerator: 'CommandOrControl+Shift+I',
    handler() {
      BrowserWindow.getAllWindows().forEach(it => it.webContents.toggleDevTools())
    }
  },
	{
		accelerator: 'F7',
		handler() {
			BrowserWindow.getFocusedWindow().webContents.executeJavaScript("debugger;")
				.catch(err => log.error("Failed to execute debugger", err))
		}
	},
	{
		accelerator: 'CommandOrControl+r',
		handler() {
			BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache()
		}
	},
	{
		accelerator: 'CommandOrControl+Shift+Plus',
		handler: async ():Promise<void> => {
			let zoom = await getZoomFactor()
			zoom = Math.min(zoom + 0.2, 2.0)
			log.info(`Setting zoom: ${zoom}`)
			BrowserWindow.getAllWindows().forEach(win => win.webContents.setZoomFactor(zoom))
		}
	},
	{
		accelerator: 'CommandOrControl+Shift+-',
		handler: async ():Promise<void> => {
			let zoom = await getZoomFactor()
			zoom = Math.max(zoom - 0.2, 0.6)
			log.info(`Setting zoom: ${zoom}`)
			BrowserWindow.getAllWindows().forEach(win => win.webContents.setZoomFactor(zoom))
		}
	}

]



function registerShortcuts():void {
	Shortcuts.forEach(config => {
		globalShortcut.register(config.accelerator,config.handler)
	})

}

function unregisterShortcuts():void {
	Shortcuts.forEach(config => {
		globalShortcut.unregister(config.accelerator)
	})
}
