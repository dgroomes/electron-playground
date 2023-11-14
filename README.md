# electron-playground

📚 Learning and exploring Electron.

> Build cross-platform desktop apps with JavaScript, HTML, and CSS
>
> -- <cite>https://www.electronjs.org</cite>


## Overview

This repository is for me to learn and explore Electron using runnable example programs.


## Standalone Subprojects

This repository illustrates different concepts, patterns and examples via standalone subprojects. Each subproject is
completely independent of the others and do not depend on the root project. This _standalone subproject constraint_
forces the subprojects to be complete and maximizes the reader's chances of successfully running, understanding, and
re-using the code.

The subprojects include:


### `core-only/`

A simple Electron app that showcases core APIs and nothing else.

See the README in [core-only/](core-only/).


### `realistic/`

A demo Electron app showing a realistic project setup supported by tooling like [Electron Forge](https://github.com/electron/forge) and webpack.

See the README in [realistic/](realistic/).


## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* [x] DONE Add a subproject that uses [Electron Forge](https://github.com/electron/forge). This is an official Electron project
  and perhaps is the recommended way to scaffold and build your project. Does it handle hot reloading? Let's find out!
  Stay vigilant though. If it turns out to be too complicated or flaky, it's valid to not recommend using it.
