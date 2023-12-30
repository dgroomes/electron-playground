import {PluginBase} from "@electron-forge/plugin-base";
import {
    ElectronProcess,
    ForgeMultiHookMap,
    ResolvedForgeConfig,
    StartOptions,
    StartResult
} from "@electron-forge/shared-types";
import {Watching, webpack} from "webpack";
import WebpackDevServer from "webpack-dev-server";
import * as console from "console";
import * as path from "path";
import {webpackRunPromisified, webpackWatchPromisified} from "./webpack-util";
import {DevelopmentEnvStrategy, ProductionEnvStrategy} from "./BuildSupportEnvStrategy";
import {BuildSupportWebpackConfig} from "./BuildSupportWebpackConfig";

/**
 * A custom Electron Forge plugin purpose-built for this project. This plugin is not designed as a generic and reusable
 * piece of software. This plugin is tailored to the exact technology and architecture of this project. Specifically, the
 * plugin incorporates a webpack-based build strategy into the Electron Forge build process. The plugin embeds specific
 * webpack configuration that describes the entrypoints and customizations desired by this project.
 *
 * This plugin is heavily adapted from Electron Forge's own webpack plugin: https://www.electronforge.io/config/plugins/webpack
 * It's not possible to use the official plugin because of some key restrictions. Specifically, the official plugin hard
 * codes the configuration of the HtmlWebpackPlugin, and it disables all webpack logging. See these related links
 *   - https://github.com/electron/forge/blob/b4f6dd9f8da7ba63099e4b802c59d1f56feca0cc/packages/plugin/webpack/src/WebpackConfig.ts#L269
 *   - https://github.com/electron/forge/issues/2968
 *   - https://github.com/electron/forge/blob/b4f6dd9f8da7ba63099e4b802c59d1f56feca0cc/packages/plugin/webpack/src/WebpackPlugin.ts#L309
 *   - https://github.com/electron/forge/blob/b4f6dd9f8da7ba63099e4b802c59d1f56feca0cc/packages/plugin/webpack/src/WebpackPlugin.ts#L311
 */
export class BuildSupportForgePlugin extends PluginBase<null> {
    name: string = "BuildSupportForgePlugin";

    // This is the root directory of the project itself.
    #rootDir: string;

    /*
    This is the directory where webpack will write its output files. This is a form of an "out/" or "build/" directory.
    The official Electron Forge webpack plugin uses a convention of a ".webpack/" directory in the root of the project.
    This is not a common convention in the broader ecosystem but let's follow it here (in part because we have to for
    now, because we're still using the WebpackConfigGenerator which hard codes to that convention).
    */
    #webpackOutputDir: string;
    #alreadyStarted: boolean = false;
    #devConfig: BuildSupportWebpackConfig;
    #prodConfig: BuildSupportWebpackConfig;
    #webpackWatching: Watching;
    readonly #port: number;

    constructor() {
        super(null);
        this.#port = 3000;

        // Make sure to bind class methods to this instance so that they don't become headless. In particular, the startLogic()
        // is called with a different 'this' context in the Electron Forge code. See https://github.com/electron/forge/blob/61d398abde51a21e280e59d319d5a77dbf3f7936/packages/api/core/src/util/plugin-interface.ts#L154
        this.startLogic = this.startLogic.bind(this);
        this.buildForProduction = this.buildForProduction.bind(this);
        this.registerOverallExitHandlerUponElectronExit = this.registerOverallExitHandlerUponElectronExit.bind(this);
    }

    // noinspection JSUnusedGlobalSymbols
    init(_dir: string, _config: ResolvedForgeConfig) {
        this.#rootDir = _dir;
        this.#webpackOutputDir = path.resolve(this.#rootDir, ".webpack");
        this.#devConfig = BuildSupportWebpackConfig.create(this.#rootDir, new DevelopmentEnvStrategy(this.#port));
        this.#prodConfig = BuildSupportWebpackConfig.create(this.#rootDir, new ProductionEnvStrategy());
        super.init(this.#rootDir, _config);
    }

    /**
     * Build the production webpack bundles. This process is different from the dev workflow in the following ways:
     * <pre>
     *     - There is no watching. This is a one-shot build.
     *     - There is no dev server.
     *     - The bundles are minimized (I'm not sure what other optimizations webpack is doing).
     * </pre>
     *
     * This method is designed to be used to build the program before handing it back off to Electron Forge for
     * packaging. This method is NOT designed to be used for your live development workflow. The live development
     * workflow is supported by the startLogic() method.
     */
    private async buildForProduction() {
        // Because there is no watching, and no dev servers involved, we can afford to express all webpack 'Configuration'
        // objects into the same webpack compiler object. Then, we just invoke the compiler once. We promisify the call.
        const config = [this.#prodConfig.mainProcessConfig, this.#prodConfig.rendererProcessPreloadConfig, this.#prodConfig.rendererProcessNormalConfig];
        const compiler = webpack(config);
        const stats = await webpackRunPromisified(compiler);
        if (stats.hasErrors()) {
            throw new Error(`Compilation failed. Please change the source code to resolve all type errors. ${stats.toString()}`);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Electron Forge has a "hooks" system that allows plugins to extend the build process.
     *
     * See https://www.electronforge.io/config/hooks
     * See https://www.electronforge.io/advanced/extending-electron-forge/writing-plugins
     */
    getHooks(): ForgeMultiHookMap {
        return {
            prePackage: this.buildForProduction,
            postStart: this.registerOverallExitHandlerUponElectronExit
        };
    }

    /**
     * Build and watch the main process bundles, and build/watch/server the renderer process bundles.
     */
    async startLogic(_startOpts: StartOptions): Promise<StartResult> {
        console.log("MyForgeWebpackPlugin.startLogic() called");

        if (this.#alreadyStarted) return false;
        this.#alreadyStarted = true;

        // Compile the main process bundles. The returned promise resolves when the compilation is complete.
        const mainCompiler = webpack(this.#devConfig.mainProcessConfig);
        const compileMainPromise = webpackWatchPromisified(mainCompiler).currentCompilation();

        const rendererServer = await this.rendererServer();
        const startPromise = await rendererServer.start();

        await Promise.all([compileMainPromise, startPromise]);
        return false; // I'm not really sure what this return value means but 'false' is normal.
    }

    /**
     *  Create and configure a webpack compiler and webpack-dev-server for the renderer process bundles.
     */
    private async rendererServer(): Promise<WebpackDevServer> {
        const compiler = webpack([this.#devConfig.rendererProcessPreloadConfig, this.#devConfig.rendererProcessNormalConfig]);

        const devServerConfig: WebpackDevServer.Configuration = {
            hot: true,
            devMiddleware: {
                writeToDisk: true,
            },
            historyApiFallback: true, // Not sure what this is. I copied it from Forge's own WebpackDevServer config.
            port: this.#port,
            setupExitSignals: true, // Not sure what this is. I copied it from Forge's own WebpackDevServer config.
            static: path.resolve(this.#webpackOutputDir, "renderer"), // I don't think I should qualify this anymore. Well... I haven't thought through the implications of not using two webpack compilers.
            headers: {

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
                "Content-Security-Policy": "default-src 'self' http: https: ws:; style-src-elem 'self' 'unsafe-inline'"
            },
        };

        return new WebpackDevServer(devServerConfig, compiler);
    }

    /**
     * Register a shutdown handler that will stop the webpack watcher and exit the entire Node process. This is a
     * preference. Specifically, when we're in our development flow, we normally make code changes and let them live
     * reload. When we're done developing, we close the window. When we close the window, it would be nice if the whole
     * Node process (the webpack dev server) stopped too.
     */
    async registerOverallExitHandlerUponElectronExit(_config: ResolvedForgeConfig, electronProcess: ElectronProcess) {
        electronProcess.on("exit", () => {
            if (electronProcess.restarted) return;
            this.#webpackWatching?.close(() => {
            });
            process.exit();
        });
    }
}
