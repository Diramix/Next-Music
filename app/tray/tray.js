const { Tray, Menu, shell, BrowserWindow } = require('electron');
const path = require('path');

let tray = null;
let settingsWindow = null;
const appIcon = path.join(__dirname, 'app/icons/icon.ico');
const nextMusicDirectory = path.join(process.env.LOCALAPPDATA, 'Next Music');

function createTray() {
    tray = new Tray(appIcon);
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Next Music folder',
            click: () => {
                shell.openPath(nextMusicDirectory).catch(err => {
                    console.error('Error opening folder:', err);
                });
            }
        },
        {
            label: 'Settings',
            click: createSettingsWindow
        },
        {
            type: 'separator'
        },
        {
            label: 'Download extensions',
            click: () => {
                shell.openExternal('https://github.com/Web-Next-Music/Next-Music-Extensions');
            }
        },
        {
            label: 'Donate',
            click: () => {
                shell.openExternal('https://boosty.to/diramix');
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Exit',
            click: () => {
                app.exit();
            }
        }
    ]);
    tray.setToolTip('Next Music');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
    });
}

function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 400,
        height: 349,
        resizable: false,
        autoHideMenuBar: true,
        icon: appIcon,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    settingsWindow.loadURL(`file://${path.join(__dirname, 'app/settings/settings.html')}`);

    settingsWindow.webContents.on('did-finish-load', () => {
        settingsWindow.webContents.send('load-config', config);
    });

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

module.exports = { createTray };
