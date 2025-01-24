const { app, BrowserWindow, Notification, shell, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const nextMusicDirectory = path.join(process.env.LOCALAPPDATA, 'Next Music');
const addonsDirectory = path.join(nextMusicDirectory, 'Addons');
const configFilePath = path.join(nextMusicDirectory, 'config.json');
let tray = null;
let mainWindow = null;
let config = { isNextMusic: false, areAddonsEnabled: true, appVersion: '' };

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
        body: 'Directory Next Music has been created. Click to open.',
        silent: false,
        icon: path.join(__dirname, 'icon.ico'),
    });

    notification.on('click', () => {
        shell.openPath(nextMusicDirectory).catch(err => {
            console.error('Error opening folder:', err);
        });
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

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'New design',
            type: 'checkbox',
            checked: config.isNextMusic,
            click: (menuItem) => {
                config.isNextMusic = menuItem.checked;
                saveConfig();
                loadMainUrl();
            }
        },
        {
            label: 'Enable extensions',
            type: 'checkbox',
            checked: config.areAddonsEnabled,
            click: (menuItem) => {
                config.areAddonsEnabled = menuItem.checked;
                saveConfig();
                mainWindow.reload();
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Open Next Music folder',
            click: () => {
                shell.openPath(nextMusicDirectory).catch(err => {
                    console.error('Error opening folder:', err);
                });
            }
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
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

function loadMainUrl() {
    const url = config.isNextMusic ? 'https://next.music.yandex.ru/' : 'https://music.yandex.ru/';
    mainWindow.loadURL(url).catch(err => {
        console.error('Error loading URL:', err);
    });
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
                    const relativePath = path.relative(addonsDirectory, filePath);
                    fs.readFile(filePath, 'utf8', (err, content) => {
                        if (err) {
                            console.error(`Error reading ${file}:`, err);
                            return;
                        }
                        callback(content, relativePath);
                    });
                }
            });
        });
    });
}

function applyAddons() {
    if (config.areAddonsEnabled) {
        console.log('Loading addons:');

        loadFilesFromDirectory(addonsDirectory, '.css', (cssContent, relativePath) => {
            console.log(`Loading main CSS file: ${relativePath}`);
            // Отправляем CSS в рендерер через IPC
            mainWindow.webContents.send('insert-css', cssContent);
        });

        loadFilesFromDirectory(addonsDirectory, '.js', (jsContent, relativePath) => {
            console.log(`Loading JS file: ${relativePath}`);
            mainWindow.webContents.executeJavaScript(jsContent).catch(err => {
                console.error('Error executing JS:', err);
            });
        });
    } else {
        console.log('Addons are disabled');
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),  // Подключаем preload.js
        }
    });

    loadMainUrl();

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded');
        applyAddons();
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Load error: ${errorDescription} (code: ${errorCode})`);
    });
}

function watchAddonsDirectory() {
    fs.watch(addonsDirectory, { recursive: true }, (eventType, filename) => {
        if (filename && (eventType === 'rename' || eventType === 'change')) {
            console.log(`File ${filename} has been ${eventType}. Reloading window.`);
            mainWindow.reload(); // Перезагружаем окно
        }
    });
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show(); // Показываем окно, если оно было скрыто
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        ensureDirectories();
        createWindow();
        createTray();
        watchAddonsDirectory();  // Наблюдение за изменениями в папке расширений
    }).catch(err => {
        console.error('Error during app initialization:', err);
    });
}

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