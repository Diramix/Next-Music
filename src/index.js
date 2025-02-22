const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const appIcon = path.join(__dirname, 'app/icons/icon.ico');

eval(require('fs').readFileSync(require('path').join(__dirname, 'app', 'tray', 'tray.js'), 'utf8'));

const nextMusicDirectory = path.join(process.env.LOCALAPPDATA, 'Next Music');
const addonsDirectory = path.join(nextMusicDirectory, 'Addons');
const configFilePath = path.join(nextMusicDirectory, 'config.json');

let mainWindow = null;
let config = {
    // Window Settings
    alwaysOnTop: false,
    freeWindowResize: false,
    opacity03: false,
    // Program Settings
    newDesign: true, 
    addonsEnabled: false,
    autoUpdate: true,
    // Launch Settings
    preloadWindow: true,
    autoLaunch: false, 
    startMinimized: false 
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        ensureDirectories();
        loadConfig();
        updateAutoLaunch(config.autoLaunch);
        createWindow();
        createTray();
        cfgUpdater();
    });

    // Settings renderer
    ipcMain.on('update-config', (event, newConfig) => {
        config = { ...config, ...newConfig };
        saveConfig();
    });

    ipcMain.on('set-always-on-top', () => {
        if (mainWindow) {
            mainWindow.setAlwaysOnTop(config.alwaysOnTop);
        }
    });

    ipcMain.on('free-window-resize', () => {
        if (mainWindow) {
            const minWidth = config.freeWindowResize ? 0 : 800;
            const minHeight = config.freeWindowResize ? 0 : 650;
            mainWindow.setMinimumSize(minWidth, minHeight);
        }
    });

    ipcMain.on('opacity-03', () => {
        if (mainWindow) {
            mainWindow.setOpacity(config.opacity03 ? 0.3 : 1);
        }
    });     

    ipcMain.on('restart-app', () => {
        const execPath = process.argv[0];
        app.relaunch();
        app.exit();
    });

    ipcMain.on('small-restart', () => {
        if (mainWindow) {
            mainWindow.reload();
            loadMainUrl();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}

function isOnline() {
    return new Promise((resolve) => {
        require('dns').resolve('google.com', (err) => {
            resolve(!err);
        });
    });
}

function cfgUpdater() {
    if (config.autoUpdate) {
        eval(require('fs').readFileSync(require('path').join(__dirname, 'app', 'updater', 'updater.js'), 'utf8'))
    }
}

function ensureDirectories() {
    if (!fs.existsSync(nextMusicDirectory)) {
        fs.mkdirSync(nextMusicDirectory, { recursive: true });
        showNotification();
    }
    if (!fs.existsSync(configFilePath)) {
        saveConfig();
    } else {
        loadConfig();
    }
    if (!fs.existsSync(addonsDirectory)) {
        fs.mkdirSync(addonsDirectory, { recursive: true });
    }
}

function showNotification() {
    const notification = new Notification({
        title: 'Next Music',
        body: 'Directory Next Music has been created.',
        silent: false,
        icon: appIcon,
    });
    
    notification.show();
}

function loadConfig() {
    try {
        const data = fs.readFileSync(configFilePath, 'utf8');
        config = JSON.parse(data);
    } catch (err) {
        console.error('Error loading config:', err);
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving config:', err);
    }
}

function updateAutoLaunch(enable) {
    app.setLoginItemSettings({ openAtLogin: enable });
}

function createPreloadWindow() {
    preloadWindow = new BrowserWindow({
        width: 240,
        height: 280,
        backgroundColor: '#000',
        show: true,
        resizable: false,
        fullscreenable: false,
        movable: true,
        frame: false,
        transparent: false,
        roundedCorners: true,
        icon: appIcon,
    });

    preloadWindow.loadURL('file://' + __dirname + '/app/preload/preload.html');
}

function createWindow() {
    const showWindow = !config.startMinimized;

    if (config.preloadWindow && !config.startMinimized) {
        createPreloadWindow();
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        minWidth: config.freeWindowResize ? 0 : 800,
        minHeight: config.freeWindowResize ? 0 : 650,
        opacity: config.opacity03 ? 0.3 : 1,
        alwaysOnTop: config.alwaysOnTop,
        backgroundColor: '#0D0D0D',
        icon: appIcon,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false,
    });

    loadMainUrl();
    
    mainWindow.webContents.on('did-finish-load', async () => {
        if (await isOnline()) {
            if (config.preloadWindow && !config.startMinimized) {
                try {
                    preloadWindow.close();
                } catch (err) {
                    console.log('Preload window is missing');
                }
            }
            applyAddons();
            if (!config.startMinimized) {
                mainWindow.show();
            }
        } else {
            console.log('No internet connection.');
            app.exit();
        }
    });

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    if (config.startMinimized) {
        mainWindow.hide();
    } else if (!config.preloadWindow) {
        mainWindow.show();
    }
}

function loadMainUrl() {
    const url = config.newDesign ? 'https://next.music.yandex.ru/' : 'https://music.yandex.ru/';
    mainWindow.loadURL(url).catch(err => { console.error('Error loading URL:', err); });
}

function applyAddons() {
    if (config.addonsEnabled) {
        console.log('Loading addons:');
        loadFilesFromDirectory(addonsDirectory, '.css', (cssContent, filePath) => {
            console.log(`Load CSS: ${path.relative(addonsDirectory, filePath)}`);
            const script = `(() => {
                const style = document.createElement('style');
                style.textContent = \`${cssContent.replace(/\\/g, '\\\\').replace(/`/g, '\`')}\`;
                document.body.appendChild(style);
            })();`;
            mainWindow.webContents.executeJavaScript(script).catch(err => {
                console.error('Error inserting CSS:', err);
            });
        });
        loadFilesFromDirectory(addonsDirectory, '.js', (jsContent, filePath) => {
            console.log(`Load JS: ${path.relative(addonsDirectory, filePath)}`);
            mainWindow.webContents.executeJavaScript(jsContent).catch(err => {
                console.error('Error executing JS:', err);
            });
        });
    } else {
        console.log('Addons are disabled');
    }
}

function loadFilesFromDirectory(directory, extension, callback) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }
        files.forEach(file => {
            const filePath = path.join(directory, file);
            fs.stat(filePath, (err, stat) => {
                if (err) {
                    console.error('Error stating file:', err);
                    return;
                }
                if (stat.isDirectory()) {
                    loadFilesFromDirectory(filePath, extension, callback);
                } else if (path.extname(file) === extension) {
                    fs.readFile(filePath, 'utf8', (err, content) => {
                        if (err) {
                            console.error(`Error reading ${file}:`, err);
                            return;
                        }
                        callback(content, filePath);
                    });
                }
            });
        });
    });
}