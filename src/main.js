const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

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
                        callback(content);
                    });
                }
            });
        });
    });
}

function createWindow() {
    const win = new BrowserWindow({
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

    win.loadURL('https://music.yandex.ru/');

    win.webContents.on('did-finish-load', () => {
        console.log('Page loaded');

        // Load CSS from Custom Theme
        const customThemeDirectory = path.join(__dirname, 'mod', 'Custom Theme');
        const cssPath = path.join(customThemeDirectory, 'style.css');
        fs.readFile(cssPath, 'utf8', (err, cssContent) => {
            if (err) {
                console.warn('No CSS file found in Custom Theme or error reading it:', err);
                return;
            }
            win.webContents.executeJavaScript(`
                const style = document.createElement('style');
                style.innerHTML = \`${cssContent}\`;
                document.head.appendChild(style);
            `);
        });

        // Load CSS and JS files from addons directory (including subdirectories)
        const addonsDirectory = path.join(__dirname, 'mod', 'addons');
        loadFilesFromDirectory(addonsDirectory, '.css', (cssContent) => {
            win.webContents.executeJavaScript(`
                const style = document.createElement('style');
                style.innerHTML = \`${cssContent}\`;
                document.head.appendChild(style);
            `);
        });

        loadFilesFromDirectory(addonsDirectory, '.js', (jsContent) => {
            win.webContents.executeJavaScript(jsContent);
        });
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Load error: ${errorDescription} (code: ${errorCode})`);
    });
}

app.whenReady().then(createWindow);

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
