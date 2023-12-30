/*
This JavaScript code will be run as a "preload" script.

Preload scripts are a difficult concept to understand because they bridge the gap between two worlds: the JavaScript
environment in the Electron "main" process and the JavaScript environment in a web page. There are many security
concepts involved with bridging these two worlds. Two of the most important configuration options are sandboxing and
context isolation. Read the Electron documentation carefully to understand everything. Here are some related links:

* https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process The Electron documentation about
  the "renderer" process.
* https://github.com/electron/forge/issues/3425#issuecomment-1837259270 A comment about how the "nodeIntegration" option
  is basically obsoleted in a world where Chromium sandboxing and Electron's context isolation options exist.
* https://www.electronjs.org/docs/api/browser-window The API documentation for BrowserWindow. Scroll down to the
  "webPreferences" option.
* https://www.electronjs.org/docs/latest/api/context-bridge The API documentation for the "contextBridge" module.

This particular preload script is executed with context isolation and sandboxing (the default). The script detects
versions of Chromium, Node, and Electron and shares those values via the "contextBridge" API to the web page's JavaScript
environment. Read about the "contextBridge" at https://www.electronjs.org/docs/tutorial/context-isolation and https://www.electronjs.org/docs/api/context-bridge

Access to Node.js APIs (like "process") is an odd concept in a sandboxed environment. A sandboxed preload script doesn't
have access to the real Node.js environment, but it has access to special polyfills that Electron provides. Read about
this in the "Process Sandboxing" page of the Electron docs: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
*/
console.log("Hello from 'preload.js'!");

const {contextBridge} = require("electron");

function environmentInformation() {
    return {
        chromeVersion: process.versions["chrome"],
        nodeVersion: process.versions["node"],
        electronVersion: process.versions["electron"]
    };
}

/**
 * Expose the "environmentInformation" function to the JavaScript environment in the web page. Using the context bridge
 * judiciously is important for security. Only expose what you need and understand the security implications of exposing
 * something.
 */
contextBridge.exposeInMainWorld("environmentInformation", environmentInformation);
