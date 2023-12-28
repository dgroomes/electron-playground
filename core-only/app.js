/*
This file is the primary source of JavaScript for the web page (i.e. the renderer process and Chromium). By contrast,
"main.js" is the entrypoint for the Electron application's "main" process which executes in the Node.js runtime
environment.
*/

/**
 * When the DOM is loaded paint the environmental version information.
 */
window.addEventListener("DOMContentLoaded", () => {
    {
        let element = document.getElementById("chrome-version");
        let version = window.detectVersions.chromeVersion;
        element.innerText = `Version: ${version}`;
    }

    {
        let element = document.getElementById("node-version");
        let version = window.detectVersions.nodeVersion;
        element.innerText = `Version: ${version}`;
    }

    {
        let element = document.getElementById("electron-version");
        let version = window.detectVersions.electronVersion;
        element.innerText = `Version: ${version}`;
    }
});

window.messagePassing.registerCallbackForMessages( (message) => {
    console.log(`Received a message: ${message}`);
});