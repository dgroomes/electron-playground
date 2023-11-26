import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import {merge as webpackMerge} from 'webpack-merge';
import {EnvStrategy} from './EnvStrategy';

import {
  WebpackPluginConfig,
  WebpackPluginEntryPoint,
  WebpackPluginEntryPointLocalWindow,
  WebpackPluginEntryPointPreloadOnly
} from './WebpackPluginConfig';
import {
  isLocalOrNoWindowEntries,
  isLocalWindow,
  isPreloadOnly,
  isPreloadOnlyEntries
} from './rendererTypeUtils';

enum RendererTarget {
  Web,
  ElectronRenderer,
  ElectronPreload,
  SandboxedPreload,
}

enum WebpackTarget {
  Web = 'web',
  ElectronPreload = 'electron-preload',
  ElectronRenderer = 'electron-renderer',
}

function rendererTargetToWebpackTarget(target: RendererTarget): WebpackTarget {
  switch (target) {
    case RendererTarget.Web:
    case RendererTarget.SandboxedPreload:
      return WebpackTarget.Web;
    case RendererTarget.ElectronPreload:
      return WebpackTarget.ElectronPreload;
    case RendererTarget.ElectronRenderer:
      return WebpackTarget.ElectronRenderer;
  }
}

export default class WebpackConfigGenerator {

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

  async getRendererConfig(entryPoints: WebpackPluginEntryPoint[]): Promise<Configuration[]> {
    const entryPointsForTarget = {
      web: [] as (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPoint)[],
      electronRenderer: [] as (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPoint)[],
      electronPreload: [] as WebpackPluginEntryPointPreloadOnly[],
      sandboxedPreload: [] as WebpackPluginEntryPointPreloadOnly[],
    };

    for (const entry of entryPoints) {
      const target = entry.nodeIntegration ?? this.pluginConfig.renderer.nodeIntegration ? 'electronRenderer' : 'web';
      const preloadTarget = entry.nodeIntegration ?? this.pluginConfig.renderer.nodeIntegration ? 'electronPreload' : 'sandboxedPreload';

      if (isPreloadOnly(entry)) {
        entryPointsForTarget[preloadTarget].push(entry);
      } else {
        entryPointsForTarget[target].push(entry);
        if (isLocalWindow(entry) && entry.preload) {
          entryPointsForTarget[preloadTarget].push({...entry, preload: entry.preload});
        }
      }
    }

    const rendererConfigs = await Promise.all(
      [
        await this.buildRendererConfigs(entryPointsForTarget.web, RendererTarget.Web),
        await this.buildRendererConfigs(entryPointsForTarget.electronRenderer, RendererTarget.ElectronRenderer),
        await this.buildRendererConfigs(entryPointsForTarget.electronPreload, RendererTarget.ElectronPreload),
        await this.buildRendererConfigs(entryPointsForTarget.sandboxedPreload, RendererTarget.SandboxedPreload),
      ].reduce((configs, allConfigs) => allConfigs.concat(configs))
    );

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

  private async buildRendererConfigForWebOrRendererTarget(
    entryPoints: WebpackPluginEntryPoint[],
    target: RendererTarget.Web | RendererTarget.ElectronRenderer
  ): Promise<Configuration | null> {
    if (!isLocalOrNoWindowEntries(entryPoints)) {
      throw new Error('Invalid renderer entry point detected.');
    }

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

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([entryPoint.js]);

      if (isLocalWindow(entryPoint)) {
        plugins.push(
          new HtmlWebpackPlugin({
            title: entryPoint.name,
            template: entryPoint.html,
            filename: `${entryPoint.name}/index.html`,
            chunks: [entryPoint.name].concat(entryPoint.additionalChunks || []),
          }) as WebpackPluginInstance
        );
      }
    }
    return webpackMerge(baseConfig, rendererConfig() || {}, { entry, output, plugins });
  }

  private async buildRendererConfigForPreloadOrSandboxedPreloadTarget(
    entryPoints: WebpackPluginEntryPointPreloadOnly[],
    target: RendererTarget.ElectronPreload | RendererTarget.SandboxedPreload
  ): Promise<Configuration | null> {
    if (entryPoints.length === 0) {
      return null;
    }

    const externals = ['electron', 'electron/renderer', 'electron/common', 'events', 'timers', 'url'];

    const entry: webpack.Entry = {};
    const baseConfig: webpack.Configuration = this.buildRendererBaseConfig(target);
    const rendererConfig = entryPoints[0].preload?.config || this.pluginConfig.renderer.config();

    for (const entryPoint of entryPoints) {
      entry[entryPoint.name] = (entryPoint.prefixedEntries || []).concat([entryPoint.preload.js]);
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
      plugins: target === RendererTarget.ElectronPreload ? [] : [new webpack.ExternalsPlugin('commonjs2', externals)],
    };
    return webpackMerge(baseConfig, rendererConfig || {}, config);
  }

  private async buildRendererConfigs(entryPoints: WebpackPluginEntryPoint[], target: RendererTarget): Promise<Promise<webpack.Configuration | null>[]> {
    if (entryPoints.length === 0) {
      return [];
    }
    const rendererConfigs = [];
    if (target === RendererTarget.Web || target === RendererTarget.ElectronRenderer) {
      rendererConfigs.push(this.buildRendererConfigForWebOrRendererTarget(entryPoints, target));
      return rendererConfigs;
    } else if (target === RendererTarget.ElectronPreload || target === RendererTarget.SandboxedPreload) {
      if (!isPreloadOnlyEntries(entryPoints)) {
        throw new Error('Invalid renderer entry point detected.');
      }

      const entryPointsWithPreloadConfig: WebpackPluginEntryPointPreloadOnly[] = [],
        entryPointsWithoutPreloadConfig: WebpackPluginEntryPointPreloadOnly[] = [];
      entryPoints.forEach((entryPoint) => (entryPoint.preload.config ? entryPointsWithPreloadConfig : entryPointsWithoutPreloadConfig).push(entryPoint));

      rendererConfigs.push(this.buildRendererConfigForPreloadOrSandboxedPreloadTarget(entryPointsWithoutPreloadConfig, target));
      entryPointsWithPreloadConfig.forEach((entryPoint) => {
        rendererConfigs.push(this.buildRendererConfigForPreloadOrSandboxedPreloadTarget([entryPoint], target));
      });
      return rendererConfigs;
    } else {
      throw new Error('Invalid renderer entry point detected.');
    }
  }
}
