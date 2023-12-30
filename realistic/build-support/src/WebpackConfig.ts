import path from "path";
import {Configuration, DefinePlugin, ExternalsPlugin} from "webpack";
import {EnvStrategy} from "./EnvStrategy";
import HtmlWebpackPlugin from "html-webpack-plugin";
import ReactDevToolsScriptAdderPlugin from "./ReactDevToolsScriptAdderPlugin";

/**
 * Represents webpack configurations for the various Electron entry points: main process, renderer process, preload
 * scripts.
 */
export class WebpackConfig {

    constructor(public readonly mainProcessConfig: Configuration,
                public readonly rendererProcessNormalConfig: Configuration,
                public readonly rendererProcessPreloadConfig: Configuration) {
    }

    static create(projectDir: string, envStrategy: EnvStrategy, port: number): WebpackConfig {
        const generator = new WebpackConfigGenerator(projectDir, envStrategy, port);
        return new WebpackConfig(
            generator.generateMainProcessConfig(),
            generator.generateRendererProcessNormalConfig(),
            generator.generateRendererProcessPreloadConfig());
    }
}

class WebpackConfigGenerator {

    readonly #webpackOutputDir: string;
    readonly #envStrategy: EnvStrategy;
    readonly #projectDir: string;
    readonly #port: number;

    constructor(projectDir: string, envStrategy: EnvStrategy, port: number) {
        this.#webpackOutputDir = path.resolve(projectDir, ".webpack");
        this.#envStrategy = envStrategy;
        this.#projectDir = projectDir;
        this.#port = port;
    }

    public generateMainProcessConfig() {
        const config: Configuration = this.mainProcessConfigBasis();
        this.customizeForEnvironment(config);
        return config;
    }

    /**
     * The "basis" of the configuration for the main process.
     *
     * The properties defined here are the same across environments.
     */
    private mainProcessConfigBasis() {
        return {
            target: "electron-main",
            // Know your options when it comes to the 'devtool' configuration, which controls how source maps are generated.
            // See https://webpack.js.org/configuration/devtool/
            devtool: "eval-source-map",
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
            output: {
                filename: "index.js",
                libraryTarget: "commonjs2",
            },
            resolve: {
                extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
            },
            node: {
                __dirname: false,
                __filename: false,
            },
        };
    }

    /**
     * Customize the given configuration with properties that depend on the environment.
     */
    private customizeForEnvironment(config: Configuration) {
        config.entry = path.resolve(this.#projectDir, "./src/main.ts");
        config.output.path = path.resolve(this.#webpackOutputDir, "main");
        config.mode = this.#envStrategy.mode();
        const entryPoint = this.#envStrategy.rendererEntryPoint("main_window", "index.html", this.#port);
        const preloadEntryPoint = this.#envStrategy.rendererPreloadEntryPoint(this.#webpackOutputDir, "main_window")
        const definitions = {
            "MAIN_WINDOW_WEBPACK_ENTRY": entryPoint,
            "process.env.MAIN_WINDOW_WEBPACK_ENTRY": entryPoint,
            "MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY": preloadEntryPoint,
            "process.env.MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY": preloadEntryPoint
        }
        config.plugins = [new DefinePlugin(definitions)];
    }

    /**
     * The "basis" of the configuration for the renderer process.
     *
     * The properties defined here are the same across environments.
     */
    private rendererProcessConfigBasis(): Configuration {
        return {
            target: "web",
            // Let's use 'source-map' instead of the default behavior which uses 'eval'. When 'eval' is used, then we need to
            // relax the Content-Security-Policy rule to allow 'unsafe-eval'. This is not a great trade-off in my case, because
            // I don't need the extra build speed of the default behavior, and I'd prefer to appease the security preferences of
            // the browser, which logs an annoying warning to the console when 'unsafe-eval' is used.
            devtool: "source-map",
            output: {
                globalObject: "self",
            },
            node: {
                __dirname: false,
                __filename: false,
            },
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
                        use: [{loader: "style-loader"}, {loader: "css-loader"}],
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

            resolve: {
                extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
            },
        };
    }

    /**
     * Customize the given configuration renderer process configuration with properties that depend on the environment.
     * This is designed for both the "normal" and preload renderer process config.
     */
    private customizeRendererProcessConfigForEnvironment(config: Configuration) {
        config.mode = this.#envStrategy.mode();
        config.output = {
            path: path.resolve(this.#webpackOutputDir, "renderer"),
            publicPath: this.#envStrategy.publicPath(),
        };
    }

    public generateRendererProcessNormalConfig() {
        const config: Configuration = this.rendererProcessConfigBasis();
        this.customizeRendererProcessConfigForEnvironment(config);

        config.entry = {["main_window"]: "./src/renderer.tsx"};
        config.output.filename = "[name]/index.js";
        config.plugins = [
            new HtmlWebpackPlugin({
                title: "main_window",
                template: "./src/index.html",
                filename: `main_window/index.html`,
                chunks: ["main_window"],
            }),
            new ReactDevToolsScriptAdderPlugin()
        ];

        return config;
    }

    public generateRendererProcessPreloadConfig() {
        const config = this.rendererProcessConfigBasis();
        this.customizeRendererProcessConfigForEnvironment(config);

        config.entry = {["main_window"]: "./src/preload.ts"};
        config.output.filename = "[name]/preload.js";

        // Electron provides certain APIs in the runtime environment. We need to let webpack know about these APIs so
        // that webpack doesn't try to bundle them. If we let webpack attempt to bundle these APIs, then it will
        // successfully "bundle up some source code" for some of them, but for others it will bundle up a "new Error("Can't find module 'xyz'")"
        // expression for other cases. It totally makes sense that this is necessary, but it's not at all clear what
        // these APIs (or loosely "modules") are. The Electron docs enumerate some names when it comes to preload scripts
        // (see https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts) and better yet the Electron Forge
        // source code enumerates some specific names (see https://github.com/electron/forge/blob/main/packages/plugin/webpack/src/WebpackConfig.ts#L310).
        config.plugins = [new ExternalsPlugin("commonjs2", ["electron", "electron/renderer", "electron/common", "events", "timers", "url"])];

        return config;
    }
}
