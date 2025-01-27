const { shell } = require('electron');

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