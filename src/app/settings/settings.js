const { ipcRenderer } = require('electron');

// Параметры:
// needRestart - Полный перезапуск программы.
// needUpdate - Обновление страницы и ссылки (loadMainUrl).

const settings = [
    { id: 'newDesign', needUpdate: true },
    { id: 'addonsEnabled', needUpdate: true },
    { id: 'autoUpdate', needRestart: true },
    { id: 'preloadWindow' },
    { id: 'autoLaunch' },
    { id: 'startMinimized' }
];

let currentConfig = {};

ipcRenderer.on('load-config', (event, config) => {
    currentConfig = config;
    settings.forEach(setting => {
        document.getElementById(setting.id).checked = config[setting.id];
    });
});

document.getElementById('saveButton').onclick = () => {
    const newConfig = {};
    let needRestart = false;
    let needUpdate = false;

    settings.forEach(setting => {
        const value = document.getElementById(setting.id).checked;
        newConfig[setting.id] = value;

        if (setting.needRestart && value !== currentConfig[setting.id]) {
            needRestart = true;
        } else if (setting.needUpdate && value !== currentConfig[setting.id]) {
            needUpdate = true;
        }
    });

    ipcRenderer.send('update-config', newConfig);
    window.close();

    if (needRestart) {
        ipcRenderer.send('restart-app');
    } else if (needUpdate) {
        ipcRenderer.send('small-restart');
    }
};
