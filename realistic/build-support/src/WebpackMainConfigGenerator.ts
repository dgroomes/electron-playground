import path from 'path';
import {Configuration, DefinePlugin} from 'webpack';
import {EnvStrategy} from './EnvStrategy';

/**
 * Generate a Webpack configuration for the main process.
 */
export default class WebpackMainConfigGenerator {

  readonly #webpackOutputDir: string;
  readonly #envStrategy: EnvStrategy;
  readonly #projectDir: string;
  readonly #port: number;

  constructor(projectDir: string, envStrategy: EnvStrategy, port: number) {
    this.#webpackOutputDir = path.resolve(projectDir, '.webpack');
    this.#envStrategy = envStrategy;
    this.#projectDir = projectDir;
    this.#port = port;
  }

  /**
   * This was ported from the WebpackConfigGenerator. It's a bit awkward right now.
   * @private
   */
  public generateConfig() : Configuration {
    const config: Configuration = this.configBasis();
    this.customizeForEnvironment(config);
    return config;
  }

  /**
   * The "basis" of the configuration for the main process.
   *
   * The properties defined here are the same across environments.
   */
  private configBasis() {
      return {
          target: 'electron-main',
          // Know your options when it comes to the 'devtool' configuration, which controls how source maps are generated.
          // See https://webpack.js.org/configuration/devtool/
          devtool: 'eval-source-map',
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
              filename: 'index.js',
              libraryTarget: 'commonjs2',
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
    private customizeForEnvironment(config) {
        config.entry = path.resolve(this.#projectDir, "./src/main.ts");
        config.output.path = path.resolve(this.#webpackOutputDir, 'main');
        config.mode = this.#envStrategy.mode();
        const entryPoint = this.#envStrategy.rendererEntryPoint("main_window", 'index.html', this.#port);
        const preloadEntryPoint = this.#envStrategy.rendererPreloadEntryPoint(this.#webpackOutputDir, "main_window")
        const definitions = {
            "MAIN_WINDOW_WEBPACK_ENTRY": entryPoint,
            "process.env.MAIN_WINDOW_WEBPACK_ENTRY": entryPoint,
            "MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY": preloadEntryPoint,
            "process.env.MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY": preloadEntryPoint
        }
        config.plugins = [new DefinePlugin(definitions)];
    }
}
