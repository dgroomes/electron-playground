#!/usr/bin/env node

/*
This script generates the `package.json` file for this project. Run it with `node package-json.mjs` or `./package-json.mjs`.

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

    // ts-node releases: https://github.com/TypeStrong/ts-node/releases
    //
    // Be careful, ts-node is an optional transitive peer dependency of Electron Forge (although I don't think it's actually
    // declared as a peer dependency). You need to be careful when selecting the version. ts-node is needed by rechoir,
    // which is used to transpile TypeScript-based build scripts like 'forge.config.ts'.
    tsNode: "^10.9.1",

    react: "^18.2.0", // React releases: https://legacy.reactjs.org/versions
    reactTypes: "^18.2.37", // @types/react releases: https://www.npmjs.com/package/@types/react
    reactDomTypes: "^18.2.15", // @types/react-dom releases: https://www.npmjs.com/package/@types/react-dom
    electronDevtoolsInstaller: "^3.2.0", // Electron DevTools Installer releases: https://github.com/MarshallOfSound/electron-devtools-installer/releases
    cssLoader: "^6.8.1", // css-loader releases: https://github.com/webpack-contrib/css-loader/releases
    styleLoader: "^3.3.3", // style-loader releases: https://github.com/webpack-contrib/style-loader/releases
};

// Define a package.json structure using an object.
// We can add comments to explain each section and its purpose.
const packageJsonContent = {
    name: "electron-playground_realistic",
    version: "1.0.0",
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
        "@electron-forge/cli": versions.electronForge,
        "@electron-forge/maker-dmg": versions.electronForge,
        "@electron-forge/plugin-webpack": versions.electronForge,
        electron: versions.electron,

        // 'ts-loader' enables webpack to transpile TypeScript source code into JavaScript.
        "ts-loader": versions.tsLoader,

        // 'ts-node' lets us write most of our development scripts in TypeScript. For example, we can write a
        // 'forge.config.ts' file instead of a 'forge.config.js' file. I find this really helpful because it helps us
        // discover the APIs of Forge and webpack using auto-completions. See the related discussions about 'ts-node' in
        // Electron Forge:
        //  - https://github.com/electron/forge/pull/2993
        //  - https://github.com/electron/forge/pull/3016
        //
        // It's an optional dependency We could omit it and write our scripts in JavaScript instead.
        "ts-node": versions.tsNode,

        typescript: versions.typescript,
        "@types/react": versions.reactTypes,
        "@types/react-dom": versions.reactDomTypes,

        "css-loader": versions.cssLoader,
        "style-loader": versions.styleLoader,

        // We want DevTools available to us during development time. There is not a first-party Electron package for
        // doing automatically, but the Electron docs (https://www.electronjs.org/docs/latest/tutorial/devtools-extension)
        //  reference a useful third-party solution: https://github.com/MarshallOfSound/electron-devtools-installer
        "electron-devtools-installer": versions.electronDevtoolsInstaller,
    },
};

// Convert to a formatted JSON string.
const packageJsonString = JSON.stringify(packageJsonContent, null, 2) + "\n";

// Write the 'package.json' file to disk.
fs.writeFile("package.json", packageJsonString, (err) => {
    if (err) throw new Error(`Failed to write 'package.json' file: ${err}`);
    console.log("'package.json' has been generated!");
});
