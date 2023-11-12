# realistic

NOT YET FULLY IMPLEMENTED

A demo Electron app showing a realistic project setup supported tooling like [Electron Forge](https://github.com/electron/forge).

> A complete tool for building modern Electron applications.
> 
> Electron Forge unifies the existing (and well maintained) build tools for Electron development into a simple, easy to
> use package so that anyone can jump right in to Electron development.
> 
> -- <cite>https://github.com/electron/forge</cite>


## Overview

Electron applications are full-fledged desktop applications, and as such, entail a lot of building and packaging work
to take your application from conception to the hands of end users. Electron Forge is an official subproject of Electron
that is designed to make this process easier (or in my hope, at least serve as a rich example).

This project is me learning Electron Forge. I scaffolded this project using `npx create-electron-app` and I've adapted
it from there. I later learned that there richer scaffolding options and these would have suited me better. For example,
in another directory, I tried `npm init electron-app@latest my-temp-project -- --template=webpack-typescript`.

**NOTE**: This project was developed on macOS. It is for my own personal use.


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
4. Package the app:
    * ```shell
      npm run make
      ```
    * You will then need to find the `.dmg` file in the `out` directory and install it.


## Notes

https://www.electronforge.io/config/plugins/webpack


## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* [x] DONE Scaffold the app.
* [x] DONE (working but crufty) Bundle (in prep for TypeScript). Probably use webpack because Electron and webpack are both part of the OpenJS Foundation. Seems
  like the right thing to do (even though I like esbuild).
* [x] DONE TypeScript
* [x] DONE "Generated package.json" because we need comments around the build setup.
* [x] DONE Forget the windows and linux stuff.
* [x] DONE Fix the CSS bundling/serving. I can get 'index.css' when I run the app with `npm start` but when I install the
  app via `.dmg` I get a 404 at runtime. See <https://gist.github.com/bbudd/2a246a718b7757584950b4ed98109115?permalink_comment_id=3297282#gistcomment-3297282>
* [x] DONE Replace the now-deprecated `registerFileProtocol` with `handle`.
* [x] DONE Get rid of the native rebuilding stuff. I'm not using that. That's super advanced. I don't have a use case
  for that right now.
* [x] DONE Can I get rid of 'fork-ts-checker-webpack-plugin'? I know it's good in theory but this is a demo application.
* [x] DONE (No we need it) Can I not use `ts-node` and just use `tsc`? Again, we want to reduce dependencies.
* [x] DONE Comment all the extra webpack deps. Do we really need to explicitly declare a dependency on them? Why doesn't the
* [x] DONE `import` in `.ts` files never `require`.
* [x] DONE Consider converting `webpack-copy-plugin` to TS.
* [x] DONE Revisit the Content Security Policy stuff. Does the Forge webpack plugin do that for us? 
* [x] DONE React
* [ ] React devtools? How do devtools/plugins work in Electron? 
* [x] DONE Instructions for packaging and installing.
* [ ] Maybe use something like trpc to talk between the main process and renderer process?
* [ ] Custom icon (`.ico`). How do you create one? SVG?
