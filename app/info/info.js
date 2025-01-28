const { shell } = require('electron');
const fs = require('fs');

// Buttons
document.getElementById("women").addEventListener("click", () => {
    const nya = new Audio('./assets/nya.mp3');
    nya.play();
    shell.openExternal("https://shikimori.one/Diramix");
});

document.getElementById("discordBtn").addEventListener("click", () => {
    shell.openExternal("https://discord.gg/ky6bcdy7KA");
});

document.getElementById("githubBtn").addEventListener("click", () => {
    shell.openExternal("https://github.com/diramix");
});

document.getElementById("boostyBtn").addEventListener("click", () => {
    shell.openExternal("https://boosty.to/diramix");
});

document.getElementById("youtubeBtn").addEventListener("click", () => {
    shell.openExternal("https://www.youtube.com/@Diram1x");
});

// parse version
let currentPkgVersion;

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    currentPkgVersion = 'v' + packageJson.version || 'Version not specified';
} catch (error) {
    currentPkgVersion = 'Error reading package.json';
}

document.querySelector(".version").textContent = currentPkgVersion;

const title = `Next Music ${currentPkgVersion} By Diramix`
document.querySelector(".nm_title").textContent = title;