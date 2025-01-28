const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');

const repoOwner = "Web-Next-Music";
const repoName = "Next-Music-Client";
const currentReleaseVersion = "Next-Music-1.4.1";

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 250,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
            <head><title>Update</title></head>
            <body style="font-family: Arial, sans-serif; background-color: rgba(0,0,0,0.7); color: white; padding: 20px; user-select: none;">
                <h2>Update Available</h2>
                <p id="message">Checking for updates...</p>
                <p id="progress">Progress: 0%</p>
                <div style="width: 100%; background-color: #444; height: 20px; border-radius: 5px; margin-top: 10px;">
                    <div id="progress-bar" style="height: 100%; background-color: #2BFEF5; width: 0%; border-radius: 5px;"></div>
                </div>
                <p id="speed" style="margin-top: 10px;">Speed: 0 MB/s</p>
            </body>
        </html>
    `));

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11') {
        event.preventDefault();
        }
    });
}

async function updateCheck() {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Error: ${response.status}`);

        const data = await response.json();
        const latestReleaseVersion = data.tag_name;

        if (latestReleaseVersion !== currentReleaseVersion) {
            console.log(`A new version is available: ${latestReleaseVersion}.`);
            createWindow();
            updateWindowMessage(`New version ${latestReleaseVersion} is available. Preparing to download...`);
            const installerUrl = `https://github.com/${repoOwner}/${repoName}/releases/download/${latestReleaseVersion}/${latestReleaseVersion}-Setup.exe`;
            await downloadInstaller(installerUrl, latestReleaseVersion);
        } else {
            console.log("You are using the latest version.");
        }
    } catch (error) {
        console.error("Error checking for updates:", error);
    }
}

async function downloadInstaller(url, version) {
    const tempDir = path.join(os.tmpdir(), `${version}-Setup.exe`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download installer. HTTP Status: ${response.status}`);

        const totalSize = response.headers.get('content-length');
        if (!totalSize) throw new Error('Content-Length header is missing.');

        const fileStream = fs.createWriteStream(tempDir);
        const readableStream = response.body;

        let downloadedSize = 0;
        let previousProgress = 0;

        console.log('Downloading installer...');
        await new Promise((resolve, reject) => {
            const reader = readableStream.getReader();

            const write = () => {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        fileStream.end();
                        console.log("\nDownload complete.");
                        resolve();
                    } else {
                        downloadedSize += value.length;
                        const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
                        process.stdout.write(`\rProgress: ${progress}% (${downloadedSize} / ${totalSize} bytes)`);

                        // Calculate download speed in MB/s
                        const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
                        const speed = (downloadedSize / 1024 / 1024 / elapsedTime).toFixed(2); // in MB/s
                        updateSpeed(speed);

                        // Update the progress bar
                        if (progress !== previousProgress) {
                            previousProgress = progress;
                            updateProgress(progress, speed);
                        }

                        fileStream.write(value, write);
                    }
                }).catch(reject);
            };
            write();
        });

        console.log('\nInstaller downloaded. Launching...');
        updateWindowMessage(`Version ${version} downloaded. Installing now...`);
        process.exit();
        exec(tempDir, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error launching installer: ${stderr}`);
                return;
            }
            console.log(`Installer launched: ${stdout}`);
        });
    } catch (error) {
        console.error(`Error downloading installer: ${error.message}`);
    }
}

function updateWindowMessage(message) {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`document.getElementById('message').innerText = '${message}';`);
    }
}

function updateProgress(progress, speed) {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
            document.getElementById('progress').innerText = 'Progress: ${progress}%';
            document.getElementById('progress-bar').style.width = '${progress}%';
        `);
    }
}

function updateSpeed(speed) {
    if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`document.getElementById('speed').innerText = 'Speed: ${speed} MB/s';`);
    }
}

let startTime = Date.now();

updateCheck();