const { ipcRenderer } = require('electron');

// Обработчик для загрузки конфигурации
ipcRenderer.on('load-config', (event, config) => {
    document.getElementById('newDesign').checked = config.newDesign;
    document.getElementById('enableExtensions').checked = config.addonsEnabled;
    document.getElementById('autoUpdate').checked = config.autoUpdate;
    document.getElementById('preloadWindow').checked = config.preloadWindow;
    document.getElementById('autoLaunch').checked = config.autoLaunch;
    document.getElementById('startMinimized').checked = config.startMinimized;
});

document.getElementById('saveButton').onclick = () => {
    const newConfig = {
        newDesign: document.getElementById('newDesign').checked,
        addonsEnabled: document.getElementById('enableExtensions').checked,
        autoUpdate: document.getElementById('autoUpdate').checked,
        preloadWindow: document.getElementById('preloadWindow').checked,
        autoLaunch: document.getElementById('autoLaunch').checked,
        startMinimized: document.getElementById('startMinimized').checked,
    };
    ipcRenderer.send('update-config', newConfig);

    ipcRenderer.send('restart-app');
};