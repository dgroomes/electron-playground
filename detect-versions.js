/*
 * Detects versions of Chromium, Node, Electron and writes them into the DOM. NOTE: for static information like these
 * version numbers I would prefer to write the version numbers directly into the HTML before shipping the HTML document
 * to Chromium. In other words, I would prefer to server-side render (SSR) the content instead of rendering the content
 * after-the-fact via DOM manipulation in JavaScript code that uses the Document APIs. SSR seems like a better order in
 * my opinion, in this case. Interestingly, the Electron programming model seems to bias towards the "Single-Page
 * Application" (SPA) paradigm. See this commentary: https://stackoverflow.com/a/24618996. This is perfectly fine and my
 * development experience with Electron so far has been really good. The docs are great. So I'll continue to bear in
 * mind the SPA bias because it is idiomatic but I am curious to model an Electron app with SSR.
 *
 * This will run as a "preload" script. For more info about how "preload" scripts work see the documentation for
 * BrowserWindow and specifically scroll down to the "webPreferences" option: https://www.electronjs.org/docs/api/browser-window
 */

console.log("Hello from 'detect-versions.js'");

window.addEventListener('DOMContentLoaded', () => {
    console.log("Hello from 'detect-versions.js' after 'DOMContentLoaded'");
    {
        let element = document.getElementById(`chrome-version`);
        let version = process.versions['chrome'];
        element.innerText = `Version: ${version}`;
    }

    {
        let element = document.getElementById(`node-version`);
        let version = process.versions['node'];
        element.innerText = `Version: ${version}`;
    }

    {
        let element = document.getElementById(`electron-version`);
        let version = process.versions['electron'];
        element.innerText = `Version: ${version}`;
    }
});
