const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const notifier = require('node-notifier');

const repoOwner = "Web-Next-Music";
const repoName = "Next-Music-Client";
const currentReleaseVersion = "Next-Music-1.4.0";
const appIcon = path.join(__dirname, 'app/icons/icon.ico');

async function updateCheck() {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
  
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const data = await response.json();
        const latestReleaseVersion = data.tag_name;
  
        if (latestReleaseVersion !== currentReleaseVersion) {
            console.log(`A new version is available: ${latestReleaseVersion}.`);
            notifyUser("Update Available", `New version ${latestReleaseVersion} is available. Preparing to download...`);
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
                        fileStream.write(value, write);
                    }
                }).catch(reject);
            };
            write();
        });
  
        console.log('\nInstaller downloaded. Launching...');
        notifyUser("Ready to Install", `Version ${version} downloaded. Installing now...`);
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

function notifyUser(title, message) {
    notifier.notify({
        title: "Next Music",
        message: message,
        icon: appIcon,
        sound: true, 
        wait: true
    });
}

updateCheck();