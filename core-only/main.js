/*
This file is the entrypoint that Electron uses to call into our own code. The code in this file is executed in the
Electron "main" process. By contrast, "app.js" is the primary source of JavaScript for the web page itself.
*/

const {app, BrowserWindow} = require("electron")
const path = require("path")

/*
 * Register a listener to create the browser window when Electron is "ready"
 */
app.whenReady().then(async () => {
    let preloadScript = path.join(__dirname, "preload.js");

    let options = {
        webPreferences: {
            preload: preloadScript,
            contextIsolation: true,
            nodeIntegration: true
        }
    };

    let window = new BrowserWindow(options);

    try {
        await window.loadFile("index.html");
    } catch (error) {
        console.error(`The page failed to load. ${error}`);
        return;
    }

    console.log("The page was loaded!");
});

app.on("window-all-closed", function () {
    app.quit();
});
