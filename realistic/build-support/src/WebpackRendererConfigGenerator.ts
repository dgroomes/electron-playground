import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration} from 'webpack';
import {EnvStrategy} from './EnvStrategy';

import {MAIN_WINDOW, WebpackPluginEntryPoint, WebpackPreloadEntryPoint,} from './WebpackPluginConfig';

export default class WebpackRendererConfigGenerator {

  private configGenerator: () => Configuration;
  private readonly webpackDir: string;
  private envStrategy: EnvStrategy;

  constructor(configGenerator: () => Configuration, projectDir: string, envStrategy: EnvStrategy) {
    this.configGenerator = configGenerator;
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.envStrategy = envStrategy;
  }

  /**
   * Turn the Forge-provided webpack config into a true webpack config.
   * @param entryPoint
   */
  generateConfig(entryPoint: WebpackPluginEntryPoint): Configuration[] {
    const configs: Configuration[] = [];

    configs.push(this.buildConfig(entryPoint));

    if ('preload' in entryPoint) {
      configs.push(this.buildPreloadConfig(entryPoint.preload));
    }

    return configs;
  }

  /**
   * Enrich the supplied config with common properties. This side effects the given configuration object.
   */
  private enrichWithCommonConfig(config: webpack.Configuration) {
    config.target = 'web';
    // Let's use 'source-map' instead of the default behavior which uses 'eval'. When 'eval' is used, then we need to
    // relax the Content-Security-Policy rule to allow 'unsafe-eval'. This is not a great trade-off in my case, because
    // I don't need the extra build speed of the default behavior, and I'd prefer to appease the security preferences of
    // the browser, which logs an annoying warning to the console when 'unsafe-eval' is used.
    config.devtool = "source-map";
    config.mode = this.envStrategy.mode();
    config.output = {
      path: path.resolve(this.webpackDir, 'renderer'),
      filename: '[name]/index.js',
      globalObject: 'self',
      publicPath: this.envStrategy.publicPath(),
    };
    config.node = {
      __dirname: false,
      __filename: false,
    };
  }

  private buildConfig(
    entryPoint: WebpackPluginEntryPoint
  ): Configuration | null {
    const returnConfig: webpack.Configuration = this.configGenerator();
    this.enrichWithCommonConfig(returnConfig);

    returnConfig.entry = { [MAIN_WINDOW]: entryPoint.js };
    returnConfig.output.filename = '[name]/index.js';
    returnConfig.plugins = [
      new HtmlWebpackPlugin({
        title: MAIN_WINDOW,
        template: entryPoint.html,
        filename: `${MAIN_WINDOW}/index.html`,
        chunks: [MAIN_WINDOW],
      })
    ];

    return returnConfig;
  }

  private buildPreloadConfig(preload: WebpackPreloadEntryPoint) {
    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];
    const returnConfig = this.configGenerator();
    this.enrichWithCommonConfig(returnConfig);

    returnConfig.entry = { [MAIN_WINDOW]: preload.js };
    returnConfig.output.filename = '[name]/preload.js';
    returnConfig.plugins = [new webpack.ExternalsPlugin('commonjs2', externals)];

    return returnConfig
  }
}
