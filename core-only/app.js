/*
This file is the primary source of JavaScript for the web page (i.e. the renderer process and Chromium). By contrast,
"main.js" is the entrypoint for the Electron application's "main" process which executes in the Node.js runtime
environment.
*/

/**
 * When the DOM is loaded, call the special "environmentInformation" function exposed by the preload script and write
 * the information to the DOM.
 */
window.addEventListener("DOMContentLoaded", () => {
    let info = window.environmentInformation();

    {
        let element = document.getElementById("chrome-version");
        let version = info.chromeVersion;
        element.innerText = `Version: ${version}`;
    }

    {
        let element = document.getElementById("node-version");
        let version = info.nodeVersion;
        element.innerText = `Version: ${version}`;
    }

    {
        let element = document.getElementById("electron-version");
        let version = info.electronVersion;
        element.innerText = `Version: ${version}`;
    }
});
