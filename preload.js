const { ipcRenderer } = require('electron');

ipcRenderer.on('insert-css', (event, cssContent) => {
    const style = document.createElement('style');
    style.innerHTML = cssContent;
    document.body.appendChild(style);
});