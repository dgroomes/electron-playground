import type {ForgeConfig} from "@electron-forge/shared-types";
import {MakerDMG} from "@electron-forge/maker-dmg";
import {WebpackPlugin} from "@electron-forge/plugin-webpack";
import {mainConfig} from "./webpack.main.config";
import {rendererConfig} from "./webpack.renderer.config";

/**
 * This is one piece in the puzzle of our integration to React Developer Tools. See the related note in the README.
 * We provide two different HTML entry points. One is the regular 'index.html' file, and the other is the same thing but
 * with the addition of a <script> tag that loads code from the external React Developer Tools instance/server.
 *
 * I don't like the duplication in the two HTML files, but at least it is understandable. I would rather inject the <script>
 * tag conditionally using a template snippet (thanks to the 'html-webpack-plugin' plugin) but unfortunately Electron Forge
 * does not have an extension point to the `new HtmlWebpackPlugin()` call where we would pass a flag. See these related
 * links:
 *   - https://github.com/electron/forge/blob/b4f6dd9f8da7ba63099e4b802c59d1f56feca0cc/packages/plugin/webpack/src/WebpackConfig.ts#L269
 *   - https://github.com/electron/forge/issues/2968
 */
function htmlEntrypoint(): string {
    if (process.env.ELECTRON_PLAYGROUND_CONNECT_TO_REACT_DEVTOOLS === 'true') {
        return "./src/index_connect_react_devtools.html";
    } else {
        return "./src/index.html";
    }
}

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
                        html: htmlEntrypoint(),
                        js: "./src/renderer.tsx",
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
