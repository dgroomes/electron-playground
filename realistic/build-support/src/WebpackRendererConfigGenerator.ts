import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import {merge as webpackMerge} from 'webpack-merge';
import {EnvStrategy} from './EnvStrategy';

import {WebpackPluginConfig, WebpackPluginEntryPoint,} from './WebpackPluginConfig';

enum RendererTarget {
  Web,
  SandboxedPreload,
}

enum WebpackTarget {
  Web = 'web',
}

function rendererTargetToWebpackTarget(target: RendererTarget): WebpackTarget {
  switch (target) {
    case RendererTarget.Web:
    case RendererTarget.SandboxedPreload:
      return WebpackTarget.Web;
  }
}

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

    configs.push(this.buildRendererConfig(entryPoint, RendererTarget.Web));

    if ('preload' in entryPoint) {
      configs.push(this.buildRendererConfig(entryPoint, RendererTarget.SandboxedPreload));
    }

    return configs;
  }

  private buildRendererBaseConfig(target: RendererTarget): webpack.Configuration {
    return {
      target: rendererTargetToWebpackTarget(target),
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
    entryPoint: WebpackPluginEntryPoint,
    target: RendererTarget.Web
  ): Configuration | null {
    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = this.pluginConfig.renderer.config;

    const output = {
      path: path.resolve(this.webpackDir, 'renderer'),
      filename: '[name]/index.js',
      globalObject: 'self',
      publicPath: this.envStrategy.publicPath(),
    };
    const plugins: webpack.WebpackPluginInstance[] = [];

    entry[entryPoint.name] = [entryPoint.js];

    plugins.push(
        new HtmlWebpackPlugin({
          title: entryPoint.name,
          template: entryPoint.html,
          filename: `${entryPoint.name}/index.html`,
          chunks: [entryPoint.name],
        }) as WebpackPluginInstance
    );
    return webpackMerge(baseConfig, rendererConfig() || {}, { entry, output, plugins });
  }

  private buildRendererConfigForPreloadOrSandboxedPreloadTarget(
    entryPoint: WebpackPluginEntryPoint
  ): Configuration {
    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(RendererTarget.SandboxedPreload);
    const rendererConfig = this.pluginConfig.renderer.config();

    if (entryPoint.preload === undefined) {
      throw new Error('Expected a preload script to be defined for this entry point but none was found.');
    }
    entry[entryPoint.name] = [entryPoint.preload.js];
    const config: Configuration = {
      target: rendererTargetToWebpackTarget(RendererTarget.SandboxedPreload),
      entry,
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

  private buildRendererConfig(entryPoint: WebpackPluginEntryPoint, target: RendererTarget): webpack.Configuration {
    if (target === RendererTarget.Web) {
      return this.buildRendererConfigForWebOrRendererTarget(entryPoint, target);
    } else if (target === RendererTarget.SandboxedPreload) {
      return this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(entryPoint);
    } else {
      throw new Error('Invalid renderer entry point detected.');
    }
  }
}
