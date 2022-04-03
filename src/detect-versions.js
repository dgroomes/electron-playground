/*
Detects versions of Chromium, Node, and Electron and shares those values via the "contextBridge" API to the renderer
process/Chromium. Read about the "contextBridge" at https://www.electronjs.org/docs/tutorial/context-isolation and
https://www.electronjs.org/docs/api/context-bridge
*/

const {contextBridge} = require('electron');

contextBridge.exposeInMainWorld("detectVersions", {
    chromeVersion: process.versions['chrome'],
    nodeVersion: process.versions['node'],
    electronVersion: process.versions['electron']
});
