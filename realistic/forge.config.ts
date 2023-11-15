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
            // The Content Security Policy (CSP) is a useful security feature of browser pages, including in Electron apps.
            // Learn more it at the following links:
            //
            // - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
            // - https://github.com/electron/electron/issues/19775
            //
            // We need to include 'ws:' because webpack uses WebSockets for reloading changed resources. This feature
            // is called Hot Module Reloading (HMR).
            //
            // We need 'unsafe-inline' for styles, because the effect of webpack's 'style-loader' is that the web page
            // applies its styles by some JavaScript code that appends a '<style>' element to the '<head>' element. To me,
            // this is NOT inline styles, it's just an internal style sheet. Inline styles would be setting the style
            // attribute on individual elements. So, I'm pretty confused. Also, in the same surprising spirit, even with
            // a seemingly conservative CSP, you can still set styles via the CSS object model in JavaScript (see https://stackoverflow.com/q/36870421).
            // So, I haven't really figured out this CSP thing, but I'm leaving this note to at least preserve some basic
            // understanding.
            //
            // Specifically, without the CSP I get the error message:
            //
            //     Refused to apply inline style because it violates the following Content Security Policy (insertBySelector.js:32)
            //
            // And when I put a breakpoint at this line, I can tell it's trying to add a 'style' element to the 'head'
            // element. Again, this is NOT an inline style. And I can't find any language in MDN that defines inline
            // styles, but if I dig through to the CSP specs and proposals I would eventually find some logic.
            devContentSecurityPolicy: "default-src 'self' http: https: ws:; style-src-elem 'self' 'unsafe-inline'",
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
