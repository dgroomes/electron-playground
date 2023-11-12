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
            // https://stackoverflow.com/a/73768719
            devContentSecurityPolicy: "default-src 'self' 'unsafe-eval' 'unsafe-inline' static: http: https: ws:",
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
