# build-support

`build-support` is a library that supports the Electron Forge- and webpack-based build process of the main application.


## Overview

Electron Forge and webpack are sophisticated build tools. We need them to build our app, but we also want to tame the
complexity that they introduce. The `build-support` library is designed to encapsulate, abstract and explain the
essential complexity that we need related to these tools. Specifically, this library:

* Defines an Electron Forge plugin (`BuildSupportForgePlugin.ts`)
  * This plugin is purpose-built for the main application. It is full of commentary that is designed to demystify
    the overall development and build flow and to explain some quirks of Electron Forge. 
* Defines custom Electron Forge configuration (`build-support-forge-config.ts`)
  * This configuration is purpose-built for the main application.
* Encapsulates all dev dependencies
  * The effect of this is that the main application only needs to declare a dev dependency on `@electron-playground_realistic/build-support`
    (well you also need to declare a redundant dev dependency on "electron", this is another odd quirk of Electron Forge).
    The main application does not have to manage the long tail of dev dependencies and can instead focus on the
    dependencies that power the actual app, like `react`.

The `build-support` code is written in TypeScript. The types (plus an IDE) have helped me discover, untangle, and
re-discover the many Electron Forge and webpack APIs. The types also help the `build-support` code to be less fragile.
This is important because Electron Forge and webpack plugin development is hard enough already. Aspirationally, I would
love if JSDoc was a good substitute for scenarios like these, but I've found that support in Webstorm just isn't all the
way fleshed out. (The north star is ESM + JSDoc for small projects, but we're just not there in 2023).  


## npm Workspaces: Caution ⚠️

The `build-support` library would naturally be a candidate for an npm workspace. I tried this and unfortunately I found
a series of compatability issues with Electron Forge. The high level issue is that Electron Forge just is not designed
to work with npm workspaces (and as you might now, npm workspaces themselves are a bit of a weak implementation of a
multi-module project). Follow <https://github.com/electron/forge/issues/2306> to see other people's experiences with
this and some workaround ideas.


## Instructions

Follow these instructions to build the `build-support` library distribution.

1. Install the dependencies
    * ```shell
      npm install
      ```
2. Transpile the TypeScript:
    * ```shell
      npm run build
      ```
    * Notice that the `dist/` directory was created.
3. Pack the library distribution
    * ```shell
      npm pack
      ```
    * Notice that the file `electron-playground_realistic_build-support-1.0.0.tgz` was created in the current working
      directory.

