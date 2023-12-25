import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import {merge as webpackMerge} from 'webpack-merge';
import {EnvStrategy} from './EnvStrategy';

import {WebpackPluginConfig, WebpackPluginEntryPoint,} from './WebpackPluginConfig';
import {hasPreloadScript,} from './rendererTypeUtils';

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
    if (!pluginConfig.renderer.entryPoints || !Array.isArray(pluginConfig.renderer.entryPoints)) {
      throw new Error('Required config option "renderer.entryPoints" has not been defined');
    }

    this.pluginConfig = pluginConfig;
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.envStrategy = envStrategy;
  }

  generateConfig(entryPoints: WebpackPluginEntryPoint[]): Configuration[] {
    const entryPointsForTarget = {
      web: [] as WebpackPluginEntryPoint[],
      sandboxedPreload: [] as WebpackPluginEntryPoint[],
    };

    for (const entry of entryPoints) {
      entryPointsForTarget['web'].push(entry);

      if (hasPreloadScript(entry)) {
        entryPointsForTarget['sandboxedPreload'].push(entry);
      }
    }

    const rendererConfigs =
      [
        this.buildRendererConfig(entryPointsForTarget.web, RendererTarget.Web),
        this.buildRendererConfig(entryPointsForTarget.sandboxedPreload, RendererTarget.SandboxedPreload),
      ].filter(config => config !== null);

    return rendererConfigs.filter(function <T>(item: T | null): item is T {
      return item !== null;
    });
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
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget.Web
  ): Configuration | null {

    // This cast is a short term workaround as we eventually thin out the types.
    const entryPointsCast = entryPoints as WebpackPluginEntryPoint[];

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

    for (const entryPoint of entryPointsCast) {
      entry[entryPoint.name] = [entryPoint.js];

      plugins.push(
          new HtmlWebpackPlugin({
            title: entryPoint.name,
            template: entryPoint.html,
            filename: `${entryPoint.name}/index.html`,
            chunks: [entryPoint.name],
          }) as WebpackPluginInstance
      );
    }
    return webpackMerge(baseConfig, rendererConfig() || {}, { entry, output, plugins });
  }

  private buildRendererConfigForPreloadOrSandboxedPreloadTarget(
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget.SandboxedPreload
  ): Configuration | null {
    if (entryPoints.length === 0) {
      return null;
    }

    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = this.pluginConfig.renderer.config();

    for (const entryPoint of entryPoints) {
      if (entryPoint.preload === undefined) {
        throw new Error('Expected a preload script to be defined for this entry point but none was found.');
      }
      entry[entryPoint.name] = [entryPoint.preload.js];
    }
    const config: Configuration = {
      target: rendererTargetToWebpackTarget(target),
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

  private buildRendererConfig(entryPoints: WebpackPluginEntryPoint[], target: RendererTarget): webpack.Configuration | null {
    if (entryPoints.length === 0) {
      return null;
    }
    if (target === RendererTarget.Web) {
      return this.buildRendererConfigForWebOrRendererTarget(entryPoints, target);
    } else if (target === RendererTarget.SandboxedPreload) {
      return this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(entryPoints, target);
    } else {
      throw new Error('Invalid renderer entry point detected.');
    }
  }
}
