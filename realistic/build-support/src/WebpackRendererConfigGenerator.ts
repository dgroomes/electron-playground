import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import {merge as webpackMerge} from 'webpack-merge';
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

  private buildRendererBaseConfig(): webpack.Configuration {
    return {
      target: 'web',
      devtool: this.envStrategy.devtool(),
      mode: this.envStrategy.mode(),
      output: {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
        publicPath: this.envStrategy.publicPath(),
      },
      node: {
        __dirname: false,
        __filename: false,
      },
      plugins: [],
    };
  }

  private buildConfig(
    entryPoint: WebpackPluginEntryPoint
  ): Configuration | null {
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig();
    const userConfig = this.configGenerator();

    const output = {
      path: path.resolve(this.webpackDir, 'renderer'),
      filename: '[name]/index.js',
      globalObject: 'self',
      publicPath: this.envStrategy.publicPath(),
    };
    const plugins: webpack.WebpackPluginInstance[] = [];

    plugins.push(
        new HtmlWebpackPlugin({
          title: MAIN_WINDOW,
          template: entryPoint.html,
          filename: `${MAIN_WINDOW}/index.html`,
          chunks: [MAIN_WINDOW],
        }) as WebpackPluginInstance
    );
    const config : Configuration = {
      entry: { [MAIN_WINDOW]: entryPoint.js },
      output,
      plugins
    };

    return webpackMerge(baseConfig, userConfig || {}, config);
  }

  private buildPreloadConfig(preload: WebpackPreloadEntryPoint) {
    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig();
    const userConfig = this.configGenerator();

    const config: Configuration = {
      target: 'web',
      entry: { [MAIN_WINDOW]: preload.js },
      output: {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/preload.js',
        globalObject: 'self',
        publicPath: this.envStrategy.publicPath(),
      },
      plugins: [new webpack.ExternalsPlugin('commonjs2', externals)],
    };
    return webpackMerge(baseConfig, userConfig || {}, config);
  }
}
