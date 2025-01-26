const { ipcRenderer } = require('electron');

// Обработчик для загрузки конфигурации
ipcRenderer.on('load-config', (event, config) => {
    document.getElementById('newDesign').checked = config.isNextMusic;
    document.getElementById('enableExtensions').checked = config.areAddonsEnabled;
    document.getElementById('autoLaunch').checked = config.autoLaunch;
    document.getElementById('startMinimized').checked = config.startMinimized;
});

document.getElementById('saveButton').onclick = () => {
    const newConfig = {
        isNextMusic: document.getElementById('newDesign').checked,
        areAddonsEnabled: document.getElementById('enableExtensions').checked,
        autoLaunch: document.getElementById('autoLaunch').checked,
        startMinimized: document.getElementById('startMinimized').checked,
    };
    ipcRenderer.send('update-config', newConfig);
    window.close();
};