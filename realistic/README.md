# realistic

A demo Electron app showing a realistic project setup supported by tooling like [Electron Forge](https://github.com/electron/forge) and webpack.

> A complete tool for building modern Electron applications.
> 
> Electron Forge unifies the existing (and well maintained) build tools for Electron development into a simple, easy to
> use package so that anyone can jump right in to Electron development.
> 
> -- <cite>https://github.com/electron/forge</cite>


## Overview

**NOTE**: This project was developed on macOS. It is for my own personal use.

Electron applications are full-fledged desktop applications, and as such, entail a lot of building and packaging work
to take your application from conception to the hands of end users. Electron Forge is an official subproject of Electron
that is designed to make the building, serving and packaging process easy. I think it's the right tool for the job. I'm
also using webpack in this project, which I think is a natural choice because Electron and webpack are both part of the
[OpenJS Foundation](https://openjsf.org/).

This project is me learning the supporting tooling that it takes to develop and build a realistic Electron application.


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


## Instructions for React DevTools

When you develop a React application, you'll likely want the power of the excellent [React Developer Tools](https://react.dev/learn/react-developer-tools)
which helps you see the React component tree and inspect the props and state of each component. Usually, we use this as
a browser extension. Unfortunately, in an Electron environment in 2023 we don't have that option because of the after-effects
of the Manifest V3 and rightful challenges to implementing it in projects like Electron. See these discussions for more
information:

* [`electron/electron` GitHub issue #37876: *[Bug] chrome.scripting API not implemented for extensions using Manifest V3*](https://github.com/electron/electron/issues/37876)
* [`electron/electron` GitHub issue #36545: *[Bug] Failed to load React Devtools*](https://github.com/electron/electron/issues/36545)
* [`facebook/react` GitHub issue #25843: *[DevTools Bug]: Electron support broken in 4.27*](https://github.com/facebook/react/issues/25843)

Fortunately, React Developer Tools is designed to run in many different environments. We just have to eject from our
normal expectation of using it as a browser extension and instead run it in a "standalone" mode, as suggested by [this
StackOverflow answer](https://stackoverflow.com/a/74330841) which points to the (very nice) documentation in the [`react-devtools` package](https://github.com/facebook/react/tree/main/packages/react-devtools#usage-with-react-dom).
It's a bit circuitous, because the standalone React Developer Tools is itself an Electron app, but it works.

Follows these instructions to install and run React Developer Tools in standalone mode and connect it to from our app:

1. Install React Developer Tools globally:
   * ```shell
     npm install -g react-devtools
     ```
2. Run React Developer Tools in standalone mode:
   * ```shell
     react-devtools
     ```
3. Run our app but with a special flag to connect to the standalone React Developer Tools:
   * ```shell
     npm run start:react-devtools
     ```


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
* [x] DONE Use React devtools. How do devtools/plugins work in Electron?
    * The browser extension does not work. Manifest v3 plugins don't totally work in Electron. There is progress though. See <https://github.com/electron/electron/issues/37876#issuecomment-1795774611>)
    * DONE There is an interesting alternative though, which ejects from the extension and just runs React DevTools in "standalone"
    way: <https://github.com/electron/electron/issues/36545#issuecomment-1652665436>.
    * DONE Pass a flag somehow so that the `localhost:8097` script gets loaded.
* [x] DONE Instructions for packaging and installing.
* [ ] Maybe use something like trpc to talk between the main process and renderer process?
* [ ] Custom icon (`.ico`). How do you create one? SVG?
* [ ] Consider dropping Electron Forge's webpack plugin. Try to make my own (we're still going to lean on Webpack heavily)
    * I don't like the lack of accessibility to the `HtmlWebpackPlugin` options (I describe this in code comments).
    * I do need and like Forge for creating the `.dmg`. I looked into using Electron Packager directory and dropping
      Forge altogether but Packager doesn't really want to be used directly and I don't want to try. I estimate a couple
      hundred lines of code/config/comments which I don't want to do.
* [ ] Hot reloading isn't working. When I change the `index.css` file it should hot reload.


## Reference

* [Electron Packager](https://github.com/electron/packager)
  * > Electron Packager is a command line tool and Node.js library that bundles Electron-based application source code with a renamed Electron executable and supporting files into folders ready for distribution.
