const {app, BrowserWindow} = require('electron')
const path = require('path')

/*
 * Register a listener to create the browser window when Electron is "ready"
 */
app.whenReady().then(() => {
    let detectVersionsScript = path.join(__dirname, 'detect-versions.js');

    let options = {
        webPreferences: {
            preload: detectVersionsScript,
            contextIsolation: true
        }
    };

    let window = new BrowserWindow(options);

    window.loadFile('index.html')
        .then(_void => {
            console.log("The page was loaded!");
        }).catch(error => {
        console.error(`The page failed to load. ${error}`);
    });
});

app.on('window-all-closed', function () {
    app.quit();
});
