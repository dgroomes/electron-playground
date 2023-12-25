import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import {merge as webpackMerge} from 'webpack-merge';
import {EnvStrategy} from './EnvStrategy';

import {
  MAIN_WINDOW,
  WebpackPluginConfig,
  WebpackPluginEntryPoint,
  WebpackPreloadEntryPoint,
} from './WebpackPluginConfig';

export default class WebpackRendererConfigGenerator {

  private pluginConfig: WebpackPluginConfig;
  private readonly webpackDir: string;
  private envStrategy: EnvStrategy;

  constructor(pluginConfig: WebpackPluginConfig, projectDir: string, envStrategy: EnvStrategy) {
    if (!pluginConfig.renderer.entryPoint) {
      throw new Error('Required config option "renderer.entryPoint" has not been defined');
    }

    this.pluginConfig = pluginConfig;
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.envStrategy = envStrategy;
  }

  /**
   * Turn the Forge-provided webpack config into a true webpack config.
   * @param entryPoint
   */
  generateConfig(entryPoint: WebpackPluginEntryPoint): Configuration[] {
    const configs: Configuration[] = [];

    configs.push(this.buildRendererConfigForWebOrRendererTarget(entryPoint));

    if ('preload' in entryPoint) {
      configs.push(this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(entryPoint.preload));
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

  private buildRendererConfigForWebOrRendererTarget(
    entryPoint: WebpackPluginEntryPoint
  ): Configuration | null {
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig();
    const rendererConfig = this.pluginConfig.renderer.config;

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

    return webpackMerge(baseConfig, rendererConfig() || {}, config);
  }

  private buildRendererConfigForPreloadOrSandboxedPreloadTarget(preload: WebpackPreloadEntryPoint) {
    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig();
    const rendererConfig = this.pluginConfig.renderer.config();

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
    return webpackMerge(baseConfig, rendererConfig || {}, config);
  }
}
