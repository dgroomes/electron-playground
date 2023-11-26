import type {ForgeConfig} from "@electron-forge/shared-types";
import {MakerDMG} from "@electron-forge/maker-dmg";
import {WebpackPlugin, WebpackPluginConfig} from "@electron-forge/plugin-webpack";
import {BuildSupportForgePlugin} from "./BuildSupportForgePlugin";

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

const webpackPluginConfig: WebpackPluginConfig = {
    mainConfig: {
        entry: "./src/main.ts",
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: /(node_modules|\.webpack)/,
                    use: {
                        loader: "ts-loader",
                    },
                },
            ],
        },
        resolve: {
            extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
        },
    },
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
        config: {
            plugins: [],
            stats: {
                logging: "verbose",
            },
            infrastructureLogging: {
                level: "verbose",
            },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        exclude: /(node_modules|\.webpack)/,
                        use: {
                            loader: "ts-loader",
                        },
                    },
                    {
                        test: /\.css$/,
                        use: [{loader: 'style-loader'}, {loader: 'css-loader'}],
                    }
                ],
            },
            performance: {
                // During development, the bundle size exceeds a default webpack configuration which exists as a "performance
                // hint". This is annoying because it's not actionable. The bundle is so large because we're using style-loader
                // and other things and somehow this gets over 250KiB (I'm surprised by that). But this is a normal/mainstream
                // setup, so we consider the warning message a false alarm. Turn it off. See the related discussion: https://github.com/webpack/webpack/issues/3486
                hints: false
            },

            // Let's use 'source-map' instead of the default behavior which uses 'eval'. When 'eval' is used, then we need to
            // relax the Content-Security-Policy rule to allow 'unsafe-eval'. This is not a great trade-off in my case, because
            // I don't need the extra build speed of the default behavior, and I'd prefer to appease the security preferences of
            // the browser, which logs an annoying warning to the console when 'unsafe-eval' is used.
            devtool: "source-map",
            resolve: {
                extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
            },
        },
        // Entrypoints are an Electron Forge concept, but they closely resemble webpack 'Entry' objects.
        // You might have multiple entrypoints if say you're product has a "new UI" and an "old UI". Or maybe
        // you just have a multipage application with pages like "/home", "/about", "/contact", and you handle
        // page transitions from the electron main process.
        entryPoints: [
            {
                name: "main_window",
                html: htmlEntrypoint(),
                js: "./src/renderer.tsx",
                preload: {
                    js: "./src/preload.ts",
                },
            },
        ],
    },
};

const config: ForgeConfig = {
    packagerConfig: {

        /*
        ASAR reference: https://www.electronjs.org/docs/latest/tutorial/asar-archives
        In a real app, you would usually bundle it into an ASAR archive. For your development workflow and debugging,
        you might want to disable this. This makes me think I need to get serious about defining a "dev" mode and a "prod"
        mode flag to handle differences like this. Should I handle it via an environment variable, in an npm start
        script?
        */
        asar: true,

        /*
        Apparently, Electron Packager by default copies the full contents of files and directories from the project root
        into the application bundle. (It has an ounce of rules, because it didn't copy the `.git/` directory, but interestingly
        it copied the `.gitignore`). So, we need to tell Electron Packager to NOT copy all this stuff. The 'ignore'
        configuration is the solution. But we don't want to enumerate the things to ignore because that list is large and
        evolving. Instead, we would rather express "include only things in the '.webpack/' directory". It's hard to
        express "not matching" directly in a regex so we can implement an "ignore" function.
        */
        ignore: (path: string) => {
            // For some reason, we get an empty string. Semantically this doesn't make sense. But if you ignore this
            // entry then nothing gets copied and the build fails. I think it probably represents the root directory,
            // but really they should have used "." or "/" for that case. It's a quirk.
            if (path === "") return false;

            const partOfBundle = path.startsWith("/.webpack/");
            if (partOfBundle) return false;

            const isBundle = path === "/.webpack";
            if (isBundle) return false;

            // The 'package.json' file is required by Electron Packager or Forge, and I'm not really sure why. I know
            // that it uses the "main" field to determine the entry point of the application. But I don't get why the
            // whole file needs to be bundled.
            return path !== "/package.json";
        }
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
        new BuildSupportForgePlugin(webpackPluginConfig),
        // new WebpackPlugin(webpackPluginConfig),
    ],
};

export default config;
