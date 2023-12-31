import {app, BrowserWindow} from "electron";
import path from "path";
import fs from "fs";

// This allows TypeScript to be aware of the magic constants that are created by webpack DefinePlugin
// that tells the Electron app where to look for the Webpack-bundled app code (depending on whether you're running in
// development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

/*
When the program is installed, it will be launched in a way where standard output and standard error are routed to a
dead end. We still want to be able to log things and have them show up somewhere, so we'll redefine the Node.js standard
out/err writers to write to a log file when we detect that we're not connected to a teletype (TTY).

Conveniently, Electron has an 'app' object and a `getPath` method that gives us an idiomatic place to put log files.
We can redirect standard output and standard error to write to the log file. On macOS, this will be '~/Library/Logs/electron-playground_realistic'.
*/
if (!process.stdout.isTTY) {
    const logsFile = path.join(app.getPath("logs"), "main.log");
    console.log("Redirecting standard output and standard error to", logsFile);
    const writeStream = fs.createWriteStream(logsFile);
    process.stdout.write = process.stderr.write = writeStream.write.bind(writeStream);
}

console.log("Hello from main.ts!");

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


