const { app, BrowserWindow, Notification, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const addonsDirectory = path.join(process.env.LOCALAPPDATA, 'Next Music', 'Addons');
let tray = null;
let mainWindow = null;
let appVersion = '';

function ensureAddonsDirectory() {
    if (!fs.existsSync(addonsDirectory)) {
        fs.mkdirSync(addonsDirectory, { recursive: true });
        showNotification();
    }
}

function showNotification() {
    const notification = new Notification({
        title: 'Next Music',
        body: 'Создана директория Next Music. Нажмите чтобы открыть.',
        silent: false,
        icon: path.join(__dirname, 'icon.ico'),
    });

    notification.on('click', () => {
        shell.openPath(path.join(process.env.LOCALAPPDATA, 'Next Music')).catch(err => {
            console.error('Error opening folder:', err);
        });
    });

    notification.show();
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Открыть папку Next Music',
            click: () => {
                shell.openPath(path.join(process.env.LOCALAPPDATA, 'Next Music')).catch(err => {
                    console.error('Error opening folder:', err);
                });
            }
        },
        {
            label: 'Донат',
            click: () => {
                shell.openExternal('https://boosty.to/diramix');
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Закрыть',
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
                    console.log(`Loading file: ${relativePath}`);
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

function loadVersion() {
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        appVersion = packageJson.version || '';
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
            preload: path.join(__dirname, 'preload.js'),
        }
    });

    mainWindow.loadURL('https://music.yandex.ru/').catch(err => {
        console.error('Error loading URL:', err);
    });

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded');
        ensureAddonsDirectory();

        loadFilesFromDirectory(addonsDirectory, '.css', (cssContent, filePath) => {
            mainWindow.webContents.insertCSS(cssContent).catch(err => {
                console.error(`Error inserting CSS from file ${filePath}:`, err);
            });
        });

        loadFilesFromDirectory(addonsDirectory, '.js', (jsContent, filePath) => {
            mainWindow.webContents.executeJavaScript(jsContent).catch(err => {
                console.error(`Error executing JS from file ${filePath}:`, err);
            });
        });
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Load error: ${errorDescription} (code: ${errorCode})`);
    });
}

app.whenReady().then(() => {
    loadVersion();
    createWindow();
    createTray();
}).catch(err => {
    console.error('Error during app initialization:', err);
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
