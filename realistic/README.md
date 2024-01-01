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
By realistic, I don't mean universal, I just mean that this project is the result of a real effort to use and learn the
tooling, and to come up with a design that I would be comfortable using in a real project. There is a large diversity
of other project styles for Electron apps, especially including [electron-builder](https://github.com/electron-userland/electron-builder),
which is a popular alternative to Electron Forge.


## Instructions

Follow these instructions to build and run the app.

1. Pre-requisite: Node.js
    * I used Node v20
2. Pre-requisite: `build-support`
    * **Important**: The `build-support` library must be built before you can develop the main application. Follow the
    instructions in the [`build-support` README](build-support/README.md). You only need to do this the first time and
     then any time you change `build-support`. Re-install it with the following command.
    * ```shell
      npm install --save-dev ./build-support/electron-playground_realistic_build-support-1.0.0.tgz
      ```
3. Install dependencies
    * ```shell
      npm install
      ```
4. Continuously build and run the app
    * ```shell
      npm start
      ```
5. Make the app distribution
    * ```shell
      npm run make
      ```
  * You will then need to find the `.dmg` file in the `out` directory and install it.

Rebuilding and re-installing `build-support` is a bit of a pain. Try this alias to make it easier:

```shell
alias rbs='cd build-support && npm install && npm run build && npm pack && cd .. && npm install --save-dev ./build-support/electron-playground_realistic_build-support-1.0.0.tgz'
```


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


## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* [ ] Maybe use something like trpc to talk between the main process and renderer process?
* [ ] Custom icon (`.ico`). How do you create one? SVG?
* [x] DONE (UPDATE #2: Ok I'm happy enough to just redefine `process.stdout.write` and `process.stderr.write` to write to a file. This in combo with detecting a teletype and Electron's convenient `app.getPath("logs)` is pretty nice) (So difficult, as I already know. I could not get the plist trick to work to write stdout/err to a file. But if run the binary directory instead of using `open`, then I'll see logs in the shell. Fine.) How does logging work from the main process? Where does it go? Well, maybe this would "just work" if I was using
  the DMG maker instead of the ZIP maker. So just wait for that to work again.
* [x] DONE (weird the problem went away; even when I blow away node_modules which is what was giving me falso negative last time) Try to add back the DMG maker using a workaround. 
* [x] DONE Revisit pathing stuff one more time. A little less eval.
* [x] DONE Upgrade version. I know the upgrade to Electron Forge 7.x will fail unfortunately so need to figure that out.


## Finished Wish List Items

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
* [x] DONE Debug logging. Forge is not showing me any webpack logs. This is a problem because I want to develop my own Forge
  plugin that uses webpack, but I need the logging feedback so I can have a hope at learning webpack dev.
* [x] DONE Drop Electron Forge's webpack plugin (phase 1). Try to make my own (we're still going to lean on Webpack heavily)
    * I don't like the lack of accessibility to the `HtmlWebpackPlugin` options (I describe this in code comments).
    * I do need and like Forge for creating the `.dmg`. I looked into using Electron Packager directory and dropping
      Forge altogether but Packager doesn't really want to be used directly and I don't want to try. I estimate a couple
      hundred lines of code/config/comments which I don't want to do.
    * DONE Stop using the plugin but keep using Electron Forge's `WebpackConfig.ts` code. This is an iterative approach.
      * DONE Race condition. I need to wait for the bundle to be created before Forge invokes Electron. I need to not return
        `false` from the startLogic function I think. UPDATE: we should do the "two webpack compiler" design that the
        Electron Forge webpack plugin does. It doesn't make sense to have the webpack-dev-server even be related to the
        main process bundling, and especially so because I just don't see any extension/hooks. I briefly looked at the
        webpack-dev-server middleware but using that directly sheds too much of the normal webpack-dev-server functionality
        (at least, thousands of lines of code which I assume I at least need/want some of that).
      * DONE What is the "asset size limit" warning? 
      * DONE Fix serving problem (missing the port config)
    * DONE Can we do initialization work in an early hook?
    * DONE Get `package` to work. This is when I need to get into Forge's hooks.
    * DONE Abstract a `watchWebpackPromisified` function similar to the `runWebpackPromisified` function.
    * DONE Register convenient shutdown handler when Electron process exits
    * What's the 'packageAfterCopy' hook for? (Update: not sure but seems like it doesn't matter)
* [x] DONE Package does not work. I thought it did. I missed a deep well in the webpack pre-packaging work: the
  `resolveForgeConfig` and `packageAfterCopy` hooks.
    * DONE Implement the effect of `resolveForgeConfig`: ignore everything but `.webpack/` during packaging.
    * DONE Implement the effect of `packageAfterCopy`.
* [x] DONE `ProjectForgePlugin`. Turn the `MyForgeWebpackPlugin` into a project-specific plugin. This plugin is tailored to
  the needs of the project, going further than just webpack-specific things. This is a trade-off. It gives up the generic
  quality of the plugin code (and thus "off-the-shelf reusability") but it removes layers of indirection (good). For
  example, there won't be a need for webpack-merge, or the merging/resolving of the Forge config in the `resolveForConfig`
  hook. 
    * DONE Rename and re-doc
    * DONE Combine config
    * ABANDON (No this is too odd) Consider starting Electron Forge from the Node API instead of the CLI via start script. I'd like to get rid of the
      `forge.config.ts` file if possible. The project plugin is the monolithic entity, including config.
* [x] DONE Drop the `WebpackConfig.ts` code and use my own webpack config (this is phase 2 of the overall custom plugin)
    * DONE Remove `@electron-forge/plugin-webpack` and wholesale copy over the needed code. I will gradually
      rewrite it.
    * DONE (it's not even used; maybe it was used for the native rebuilding which is something I also don't want) The AssetRelocatorPatch is a particularly nasty implementation detail. I don't really want to maintain it.
    * I think keeping the forge config as a standalone const object is fine. I think inlining
      the webpack config closer to code, in the `BuildSupportForgePlugin` is good. It has more dynamic content like resolving
      the absolute paths and the prod/dev differences. The official WebpackForgePlugin proliferates dev/prod checks throughout
      many if statements. I think they were very close to a good model, where the WebpackConfigGenerator should be implemented
      by a "dev strategy" and a "prod strategy". I'm going to take that concept and implement that. But I'm going to keep
      the common code and utility functions separate from the prod/dev stuff (that got too co-mingled in the official
      plugin). `webpack-util.ts` has worked well, I might push more webpack-specific stuff into there.
    * DONE dev/prod strategy objects.
    * DONE (nice, true private class fields worked, but unfortunately I can't seem them in the debugger. Similar to [this YouTrack issue](https://youtrack.jetbrains.com/issue/WEB-52294/Javascript-Debugging-show-private-properties-on-objects-in-watches-variables)) Fix `make` task. There's a problem because Electron Forge has some code to expand fields on the Electron
      Forge config object using Lodash (quite dangerous in my estimation but so be it) and it's reaching all the way into
      the webpack config object which has some fields with `$` in them which are used in the DefinesPlugin. We don't
      want this, it errors. The Forge code just indiscriminately expands all fields. I think I should be able to hide
      them somehow, make them non-enumerable or whatever.
    * DONE Remove support for multiple preload. Let's just fixate to one for now. I need to get a handle on the code.
       * `WebpackPluginEntryPointPreloadOnly` is modelled misleadingly. That type, in practice, actually applies to entry
         points that do indeed have html or js. Similarly, look at the contrasting `isPreloadOnly` and `hasPreloadScript`
         which are type guards for `WebpackPluginEntryPointPreloadOnly`.
         * DONE Remove support for "preload with configuration". This takes a special case in the code, and we
           don't use it.
         * DONE Can I get rid of `WebpackPluginEntryPointNoWindow`?
         * DONE Can I get rid of `WebpackPluginEntryPointPreloadOnly`?
         * DONE `WebpackPluginEntryPointLocalWindow` and `WebpackPluginEntryPointBase` should go away and only leave `WebpackPluginEntryPoint`
     * DONE Remove prefixed entries. Not sure what this is exactly, but I'm not using it. 
     * DONE Remove Node integration flag. Not used.
       * Follow the knock-on collapse.
     * DONE Do we need multiple entrypoints?
     * DONE Visit `buildRendererBaseConfig` and `rendererTargetToWebpackTarget`. They needlessly accept `RendererTarget.SandboxedPreload`
       as their only argument. Also visit `buildRendererConfigForWebOrRendererTarget`, similar thing.
     * DONE Consolidate entry point name/config.
     * DONE Get rid of the config merging code. We don't want cascading behavior.
     * DONE Move basis of main process config closer to the config generation code
     * DONE Move renderer webpack config to the config generation code
     * DONE Combine the WebpackRenderConfigGenerator and WebpackMainConfigGenerator into one class. These classes have become
       smaller now, and also the BuildSupportForgePlugin is now doing too much boilerplate work between the dev/prod and
       render/render-preload/main dimensions. Or, at least consider something.
       * DONE Rename WebpackMainConfigGenerator to just WebpackConfig. 
     * DONE Get rid of WebpackPluginConfig entirely.
* [x] DONE Format the whole project and be consistent with quotes vs double quotes.
* [x] DONE Hot reloading for styles isn't working. That's totally my bad, I knew this and took out the style loader hastily.
  When I change the `index.css` file, the styles should update in the app without a refresh. This is a basic feature
  for a realistic project.
* [x] DONE Remove WebpackRecoverStatsAndInfraLoggingConfigPlugin when we're confident we're completely done with the Forge
  webpack plugin.
* [x] DONE (I went with a `build-support` library) De-scope `ts-node` and the TS-based config files. While I really like the ability to author the Forge and webpack
  config files in TypeScript, it comes with extra build-time complexity that I don't want to pay for, especially in this
  project because this is an Electron demo and not a Node "custom module loader for an alternative language" demo.
  I'm really glad I got to learn and use these concepts (`ts-node`, and rechoir, [Node module loaders and hooks](https://nodejs.org/api/module.html#customization-hooks))
  but now I can de-scope that stuff into a separate project. I don't really want to have the webpack-util or MyForgeWebpackPlugin
  be in the JS though... can I extract it into a sibling npm project/module and then 'link' it or 'pack' it?
* [x] DONE Replace the DMG Electron Forge maker with the ZIP one. The DMG maker is causing an error for me on Dec 2023 on a fresh
  `npm install`. The lineage is particularly obsure (a silently failing optional dependency because of macOS being on Python 3.12
  and/or npm marks previously required dependencies as optional in the lock file?? See <https://github.com/electron/forge/issues/2807#issuecomment-1793508913>
  and follow the links). The Electron Forge templates don't even use the DMG maker so I don't have a strong foundation
  to work from here (the templates support some other makers, which is perfectly reasonable: see <https://github.com/electron/forge/blob/335c388278caa339cdcb253516f1b08d7596cf1d/packages/template/webpack-typescript/package.json#L26>).
  So, we won't outrun official (and "stable") support. Stick to ZIP.
* [x] DONE (Ok I kind of get it but don't want to go much further; docs aren't quite there so it would be a rabbit hole) What is ExternalsPlugin (used in the preload entrypoint)?
    * See <https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts>.
    * DONE I can tell that it does actually create a smaller bundle, but I still don't get it. I want to do something with code
      from "timers" and we'll see what happens.
* [x] DONE Configure `HtmlWebpackPlugin` to support the "with React Dev Tools" or without.
* [ ] SKIP (It's annoying, but it's a convention. Similar conflation with the word "index" and "app") Go away from the `main_window` name because the overloading on the word main is actually extremely confusing, because
  in Electron there is the "main process".
* [x] DONE Clarify the code that deals with paths. This is the tricky code like ``\`file://$\{require('path').resolve(__dirname, '..', '${'renderer'}', '${entryPointName}', '${basename}')}\``;``
  that has so much escaping I can't make sense of it.
    * SKIP (I like the idea and it would work with webpack aliases but there's not enough content there to make it worth it) Maybe just don't have multiple layers of escaping. The thing I need is to dispatch differently in dev vs prod. I
      could have the strategy classes in the real source code and then use a "defines" only to indicate if we're in dev
      or prod via a simple string. This is the least fancy but it's a bit annoying because we're polluting a production
      artifact. Or, webpack is already in the mix so I could bundle the strategy code via a requires, and just use a
      different requires path (via "defines" again)? This reminds of Android build variants and flavors.
    * Can we just use relative paths instead of the `path` stuff?
* [x] DONE Revisit EnvStrategy one more time.


## Reference

* [Electron Packager](https://github.com/electron/packager)
  * > Electron Packager is a command line tool and Node.js library that bundles Electron-based application source code with a renamed Electron executable and supporting files into folders ready for distribution.
