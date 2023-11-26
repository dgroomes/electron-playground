#!/usr/bin/env node

/*
This script generates the `package.json` files for this project. Run it with `node package-json.mjs` or `./package-json.mjs`.

Using a JavaScript file to generate the `package.json` file gives us a solution for commenting the many dependencies,
scripts, and other configuration. npm will likely not support a solution for providing comments in the `package.json`
file. In theory, npm could support a `package.jsonc` or `package.json5` file but this idea hasn't gained traction for
certain technical reasons. Follow this discussion for more information (and hopefully, one day, an official solution): https://github.com/npm/cli/issues/793.

Any developer reading the `package.json` and wondering what a particular package is or why it's declared
as a dependency can come to the `package-json.mjs` file and find an explainer comment. This is essential for
maintainability, especially for people who are new to the project (or me returning to the project after a long time).
*/

import fs from "fs";

const versions = {
    typescript: "^5.2", // TypeScript releases: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
    electron: "^27.0.4", // Electron releases: https://releases.electronjs.org/releases/stable
    electronForge: "^6.4.2", // Electron Forge releases: https://github.com/electron/forge/releases
    tsLoader: "^9.5.0", // ts-loader releases: https://github.com/TypeStrong/ts-loader/releases
    react: "^18.2.0", // React releases: https://legacy.reactjs.org/versions
    reactTypes: "^18.2.37", // @types/react releases: https://www.npmjs.com/package/@types/react
    reactDomTypes: "^18.2.15", // @types/react-dom releases: https://www.npmjs.com/package/@types/react-dom
    electronDevtoolsInstaller: "^3.2.0", // Electron DevTools Installer releases: https://github.com/MarshallOfSound/electron-devtools-installer/releases
    cssLoader: "^6.8.1", // css-loader releases: https://github.com/webpack-contrib/css-loader/releases
    styleLoader: "^3.3.3", // style-loader releases: https://github.com/webpack-contrib/style-loader/releases
};

/**
 * Generate a 'package.json' file.
 *
 * @param directory The directory to write the 'package.json' file to.
 * @param dryRun If true, the 'package.json' file will not be written.
 * @param packageJsonContent The content of the 'package.json' file, as a JavaScript object.
 */
function generatePackageJson(directory, dryRun, packageJsonContent) {
    const packageJsonString = JSON.stringify(packageJsonContent, null, 2) + "\n";
    const path = directory + "/package.json";

    console.log(`Writing 'package.json' file to '${path}'...`);
    if (dryRun) {
        console.log("DRY RUN. File not written.");
        return;
    }

    fs.writeFile(path, packageJsonString, (err) => {
        if (err) throw new Error(`Failed to write 'package.json' file to '${path}': ${err}`);
    });
}

generatePackageJson(".", false, {
    name: "electron-playground_realistic",
    version: "1.0.0",
    description: "A demo Electron app showing a realistic project setup supported by tooling like Electron Forge and webpack.",
    main: ".webpack/main",
    scripts: {
        start: "DEBUG=true electron-forge start",

        // Start the app in a configuration that will connect to the external/standalone React Developer Tools instance.
        // You must have already started the React Developer Tools app before running this command.
        "start:react-devtools": "ELECTRON_PLAYGROUND_CONNECT_TO_REACT_DEVTOOLS=true electron-forge start",

        package: "DEBUG=true electron-forge package",
        make: "electron-forge make",
    },
    license: "UNLICENSED",
    dependencies: {
        "react": versions.react,
        "react-dom": versions.react,
    },
    devDependencies: {
        /*
        The "file:" prefix is the form for declaring a dependency on a local package. The 'electron-playground_realistic_build-support-1.0.0.tgz'
        file is not actually checked into Git; you must build it locally as a prerequisite to building the root project.
        See the README in 'build-support/' for instructions.

        Tip: You don't have to handwrite a dependency declaration like this. You can still use the familiar 'npm install'
        command, just point to the relative path of the '.tgz' file but make sure to include a leading './' in the path
        otherwise npm will interpret it as a package name and try to download it from the npm registry. You'll get a 404.
        Here is the command I used:

            npm install --save-dev ./build-support/electron-playground_realistic_build-support-1.0.0.tgz

        */
        "electron-playground_realistic_build-support": "file:build-support/electron-playground_realistic_build-support-1.0.0.tgz",

        /*
        WORKAROUND. There is a quirky behavior in Electron Forge that we have to workaround. Electron Forge has some
        special introspective code that looks for the "electron" package among dev dependencies. I think it is literally
        inspecting either the package.json or the package-lock.json file. Unfortunately, it doesn't use a smart algorithm
        because it's not finding "electron" even though it's included as a transitive dev dependency by way of the dev
        dependency on "electron-playground_realistic_build-support". The defect presents itself with this error:

            [FAILED] Could not find any Electron packages in devDependencies

            An unhandled rejection has occurred inside Forge:
            Error: Could not find any Electron packages in devDependencies
            at getElectronModuleName (/Users/dave/repos/personal/electron-playground/realistic/node_modules/@electron-forge/core-utils/dist/electron-version.js:51:15)

        This same issue happens when you try to use Electron Forge with an npm workspaces-based project (something I
        tried for a while and failed). See this related issue: https://github.com/electron/forge/issues/2306.

        The workaround is to just declare "electron" as a dev dependency.
        */
        electron: versions.electron,

        "@types/react": versions.reactTypes,
        "@types/react-dom": versions.reactDomTypes,
    },
});

generatePackageJson("build-support", false, {
    name: "electron-playground_realistic_build-support",
    version: "1.0.0",
    private: true,
    exports: {
        "./plugin": "./dist/BuildSupportForgePlugin.js",
        "./config": "./dist/build-support-forge-config.js"
    },
    scripts: {
        // The 'build-support' library has a small amount of source code, and it should rarely change. We can afford
        // to use the TypeScript compiler ('tsc') directly to transpile the source code into JavaScript instead of using
        // a more sophisticated build tool like webpack. I don't want to deal with an extra webpack configuration.
        build: "tsc",
    },
    devDependencies: {
        typescript: versions.typescript
    },
    dependencies: {
        electron: versions.electron,
        "@electron-forge/cli": versions.electronForge,
        "@electron-forge/maker-dmg": versions.electronForge,
        "@electron-forge/plugin-webpack": versions.electronForge,
        "ts-loader": versions.tsLoader,
        "css-loader": versions.cssLoader,
        "style-loader": versions.styleLoader,

        // We want DevTools available to us during development time. There is not a first-party Electron package for
        // doing automatically, but the Electron docs (https://www.electronjs.org/docs/latest/tutorial/devtools-extension)
        //  reference a useful third-party solution: https://github.com/MarshallOfSound/electron-devtools-installer
        "electron-devtools-installer": versions.electronDevtoolsInstaller,
    },
});
