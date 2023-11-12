import type {ForgeConfig} from "@electron-forge/shared-types";
import {MakerDMG} from "@electron-forge/maker-dmg";
import {WebpackPlugin} from "@electron-forge/plugin-webpack";
import {mainConfig} from "./webpack.main.config";
import {rendererConfig} from "./webpack.renderer.config";

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
    },
    rebuildConfig: {},
    makers: [new MakerDMG({
        // This is an odd one. The name of the application, in general, is whatever the value of the 'name' field is in
        // 'package.json'. That's good and that's what I want. But when it comes to creating the '.dmg' file, the name
        // is so long that it's causing a problem. 'electron-playground_realistic' is 29 characters but this string is
        // used as a macOS "Volume" I guess, and there's a 27-character limit there. I was getting the following error
        // message
        //
        //    electron forge AssertionError [ERR_ASSERTION]: Volume name is not longer than 27 chars
        //
        // So I have to come up with a shorter name here. 'electron-realistic' is only 18 characters, which works.
        name: "electron-realistic"
    })],
    plugins: [
        new WebpackPlugin({
            mainConfig,
            // The Content Security Policy is a useful security feature of browser pages, including in Electron apps.
            // Learn more it at the following links:
            //
            // - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
            // - https://github.com/electron/electron/issues/19775
            //
            // During development time, I think we need a less strict policy for loading the 'index.css' file (I'm not
            // really sure why this happens only at dev-time and not when I run the application bundle...). I get the
            // following error in the logs:
            //
            //     Refused to load the stylesheet 'static://index.css' because it violates the following Content Security Policy directive ...
            //
            // To work around this, the Forge config lets us specify a dev-only policy. I'm using one I got from https://stackoverflow.com/a/73768719
            devContentSecurityPolicy: "default-src 'self' static: http: https: ws: static:",
            renderer: {
                config: rendererConfig,
                entryPoints: [
                    {
                        html: "./src/index.html",
                        js: "./src/renderer.ts",
                        name: "main_window",
                        preload: {
                            js: "./src/preload.ts",
                        },
                    },
                ],
            },
        }),
    ],
};

export default config;
