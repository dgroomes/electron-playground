# electron-playground

📚 Learning and exploring Electron.

> Build cross-platform desktop apps with JavaScript, HTML, and CSS
>
> -- <cite>https://www.electronjs.org</cite>


## Overview

This is a simple Electron app I use as a working example for my own reference. It is adapted from the official Electron
quick-start app <https://github.com/electron/electron-quick-start>.


## Instructions

Follow these instructions to build and run the app.

1. Pre-requisite: Node.js
   * I used Node v20
2. Install dependencies:
   * ```shell
     npm install
     ```
3. Run the app:
   * ```shell
     npm start
     ```
   * Success! It should look something like this:

     ![screenshot](screenshot.png)


## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* [x] DONE How does the "preload" lifecycle work exactly? How does ipc work? How do Web Workers work? I'd like to try injecting
  the version data using one of these methods instead of what I'm doing in the `detect-versions.js` script.  
* [x] DONE Send a message from the mainProcess to the renderer process
* [x] DONE Upgrades and fix for failing preload script (Electron 20 change I think)
* [ ] Revisit the `nodeIntegration: true` configuration. I needed this after migrating from Electron 18 to 22 because
  ["sandbox mode" is enabled by default starting in 20](https://www.electronjs.org/docs/latest/tutorial/sandbox). I'm not
  sure if I really need "node integration" or if I can get away with sandbox mode disabled, or even better yet, there is
  a more secure/idiomatic way to detect environment/platform versions like Node/Chromium/Electron and pass these values
  to the frontend (I bet there is).


## Reference

* [Electron official site: Tutorial on "Context Isolation"](https://www.electronjs.org/docs/tutorial/context-isolation)
* [StackOverflow answer about "preload" scripts](https://stackoverflow.com/a/59814127)
* [Electron official site: API for "BrowserWindow"](https://www.electronjs.org/docs/api/browser-window)
* [Electron official site: API for "webContents" and sending messages](https://www.electronjs.org/docs/api/web-contents#contentssendchannel-args)
