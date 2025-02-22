const { ipcRenderer } = require('electron');

// Параметры:
// needRestart - Полный перезапуск программы.
// needUpdate - Обновление страницы и ссылки (loadMainUrl).

const settings = [
    { id: 'newDesign', needUpdate: true },
    { id: 'addonsEnabled', needUpdate: true },
    { id: 'alwaysOnTop' },
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

        toggleAlwaysOnTop = setting.alwaysOnTop
    });

    ipcRenderer.send('update-config', newConfig);
    ipcRenderer.send('set-always-on-top', toggleAlwaysOnTop);
    window.close();

    if (needRestart) {
        ipcRenderer.send('restart-app');
    } else if (needUpdate) {
        ipcRenderer.send('small-restart');
    }
};

// tooltip-target
// const labels = document.querySelectorAll('.textButton');

// labels.forEach(label => {
//     label.addEventListener('mouseenter', function() {
//         const tooltipText = label.querySelector('input').getAttribute('data-tooltip');
//         const tooltipTarget = document.querySelector('.tooltip-target');
//         tooltipTarget.textContent = tooltipText;
//         tooltipTarget.style.visibility = 'visible';
//         tooltipTarget.style.opacity = 1;
//     });

//     label.addEventListener('mouseleave', function() {
//         const tooltipTarget = document.querySelector('.tooltip-target');
//         tooltipTarget.style.visibility = 'hidden';
//         tooltipTarget.style.opacity = 0;
//     });
// });

// Смена цвета кнопок
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.querySelectorAll('.textButton').forEach(label => {
            const checkbox = label.querySelector('input');
            label.classList.toggle('active', checkbox.checked);
            label.addEventListener('click', () => {
                checkbox.checked = !checkbox.checked;
                label.classList.toggle('active', checkbox.checked);
            });
        });
    }, 50);
});