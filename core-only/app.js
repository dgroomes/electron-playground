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

    // I'm a bit surprised by this, but I guess with the default Electron settings, the web page can read any file on your
    // filesystem that the Electron process has access to. Here, we're reading the README.md file in the root of the
    // project, which is up one directory level from where the 'electron' command was executed. I think you're supposed
    // to reach for a custom protocol handler to limit this but before doing that I'd like to find some docs (or the code)
    // that explains or implements the default behavior.
    fetch('../README.md')
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error(error));
});
