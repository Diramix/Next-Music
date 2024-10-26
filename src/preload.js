const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Здесь можете добавить функции для взаимодействия
});
