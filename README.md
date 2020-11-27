# electron-playground

📚 Learning and exploring Electron.

> Build cross-platform desktop apps with JavaScript, HTML, and CSS
>
> -- <cite>https://www.electronjs.org</cite>

## Description

This is a simple Electron I use as a working example for my own reference. It is adapted from the official Electron
quick-start app <https://github.com/electron/electron-quick-start>.

## Instructions

Requires: Node.js

1. Install dependencies with `npm install`
1. Run the app with `npm start`

## Wish List

General clean ups, TODOs and things I wish to implement for this project:

* How does the "preload" lifecycle work exactly? How does ipc work? How do Web Workers work? I'd like to try injecting
  the version data using one of these methods instead of what I'm doing in the `detect-versions.js` script.  