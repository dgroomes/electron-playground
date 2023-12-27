import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration} from 'webpack';
import {EnvStrategy} from './EnvStrategy';

/**
 * Generate Webpack configurations for the renderer process: a "normal" entrypoint and entrypoint for the preload script.
 */
export default class WebpackRendererConfigGenerator {

  private readonly webpackDir: string;
  private envStrategy: EnvStrategy;

  constructor(projectDir: string, envStrategy: EnvStrategy) {
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.envStrategy = envStrategy;
  }

  /**
   * The "basis" of the configuration for the renderer process.
   *
   * The properties defined here are the same across environments.
   */
  private configBasis() : Configuration {
    return {
      target: 'web',
      // Let's use 'source-map' instead of the default behavior which uses 'eval'. When 'eval' is used, then we need to
      // relax the Content-Security-Policy rule to allow 'unsafe-eval'. This is not a great trade-off in my case, because
      // I don't need the extra build speed of the default behavior, and I'd prefer to appease the security preferences of
      // the browser, which logs an annoying warning to the console when 'unsafe-eval' is used.
      devtool: "source-map",
      output: {
        globalObject: 'self',
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

      resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
      },
    };
  }

  /**
   * Customize the given configuration with properties that depend on the environment.
   */
  private customizeForEnvironment(config: webpack.Configuration) {
    config.mode = this.envStrategy.mode();
    config.output = {
      path: path.resolve(this.webpackDir, 'renderer'),
      publicPath: this.envStrategy.publicPath(),
    };
  }

  public generateNormalConfig(): Configuration {
    const config: webpack.Configuration = this.configBasis();
    this.customizeForEnvironment(config);

    config.entry = { ["main_window"]: "./src/renderer.tsx" };
    config.output.filename = '[name]/index.js';
    config.plugins = [
      new HtmlWebpackPlugin({
        title: "main_window",
        template: htmlEntrypoint(),
        filename: `main_window/index.html`,
        chunks: ["main_window"],
      })
    ];

    return config;
  }

  public generatePreloadConfig() : Configuration {
    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];
    const config = this.configBasis();
    this.customizeForEnvironment(config);

    config.entry = { ["main_window"]: "./src/preload.ts" };
    config.output.filename = '[name]/preload.js';
    config.plugins = [new webpack.ExternalsPlugin('commonjs2', externals)];

    return config
  }
}

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
