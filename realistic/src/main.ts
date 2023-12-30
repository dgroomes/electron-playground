import {app, BrowserWindow} from "electron";

// This allows TypeScript to be aware of the magic constants that are created by webpack DefinePlugin
// that tells the Electron app where to look for the Webpack-bundled app code (depending on whether you're running in
// development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

app.on("ready", async function onReady() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        },
    });

    // and load the index.html of the app.
    await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Because this is a demo program, let's always open the DevTools when the app starts.
    mainWindow.webContents.openDevTools();
});


