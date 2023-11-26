import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import {merge as webpackMerge} from 'webpack-merge';

import {
  WebpackPluginConfig,
  WebpackPluginEntryPoint,
  WebpackPluginEntryPointLocalWindow,
  WebpackPluginEntryPointPreloadOnly
} from './Config';
import {
  isLocalOrNoWindowEntries,
  isLocalWindow,
  isNoWindow,
  isPreloadOnly,
  isPreloadOnlyEntries
} from './rendererTypeUtils';

type EntryType = string | string[] | Record<string, string | string[]>;
type WebpackMode = 'production' | 'development';

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
  private readonly isProd: boolean;

  private pluginConfig: WebpackPluginConfig;

  private readonly port: number;

  private readonly projectDir: string;

  private readonly webpackDir: string;
  private readonly mode: WebpackMode;

  constructor(pluginConfig: WebpackPluginConfig, projectDir: string, isProd: boolean, port: number) {
    if (!pluginConfig.renderer.entryPoints || !Array.isArray(pluginConfig.renderer.entryPoints)) {
      throw new Error('Required config option "renderer.entryPoints" has not been defined');
    }

    this.pluginConfig = pluginConfig;
    this.projectDir = projectDir;
    this.webpackDir = path.resolve(projectDir, '.webpack');
    this.isProd = isProd;
    this.port = port;
    this.mode = this.isProd ? 'production' : 'development';

    console.debug('Config mode:', this.mode);
  }

  private rendererEntryPoint(entryPoint: WebpackPluginEntryPoint, basename: string): string {
    if (this.isProd) {
      return `\`file://$\{require('path').resolve(__dirname, '..', '${'renderer'}', '${entryPoint.name}', '${basename}')}\``;
    }
    const baseUrl = `http://localhost:${this.port}/${entryPoint.name}`;
    if (basename !== 'index.html') {
      return `'${baseUrl}/${basename}'`;
    }
    return `'${baseUrl}'`;
  }

  private toEnvironmentVariable(entryPoint: WebpackPluginEntryPoint, preload = false): string {
    const suffix = preload ? '_PRELOAD_WEBPACK_ENTRY' : '_WEBPACK_ENTRY';
    return `${entryPoint.name.toUpperCase().replace(/ /g, '_')}${suffix}`;
  }

  private getPreloadDefine(entryPoint: WebpackPluginEntryPoint): string {
    if (!isNoWindow(entryPoint)) {
      if (this.isProd) {
        return `require('path').resolve(__dirname, '../renderer', '${entryPoint.name}', 'preload.js')`;
      }
      return `'${path.resolve(this.webpackDir, 'renderer', entryPoint.name, 'preload.js').replace(/\\/g, '\\\\')}'`;
    } else {
      // If this entry-point has no configured preload script just map this constant to `undefined`
      // so that any code using it still works.  This makes quick-start / docs simpler.
      return 'undefined';
    }
  }

  private getDefines(): Record<string, string> {
    const defines: Record<string, string> = {};
    for (const entryPoint of this.pluginConfig.renderer.entryPoints) {
      const entryKey = this.toEnvironmentVariable(entryPoint);
      if (isLocalWindow(entryPoint)) {
        defines[entryKey] = this.rendererEntryPoint(entryPoint, 'index.html');
      } else {
        defines[entryKey] = this.rendererEntryPoint(entryPoint, 'index.js');
      }
      defines[`process.env.${entryKey}`] = defines[entryKey];

      const preloadDefineKey = this.toEnvironmentVariable(entryPoint, true);
      defines[preloadDefineKey] = this.getPreloadDefine(entryPoint);
      defines[`process.env.${preloadDefineKey}`] = defines[preloadDefineKey];
    }

    return defines;
  }

  async getMainConfig(): Promise<Configuration> {
    const mainConfig = this.pluginConfig.mainConfig;

    if (!mainConfig.entry) {
      throw new Error('Required option "mainConfig.entry" has not been defined');
    }
    const fix = (item: EntryType): EntryType => {
      if (typeof item === 'string') return (fix([item]) as string[])[0];
      if (Array.isArray(item)) {
        return item.map((val) => (val.startsWith('./') ? path.resolve(this.projectDir, val) : val));
      }
      const ret: Record<string, string | string[]> = {};
      for (const key of Object.keys(item)) {
        ret[key] = fix(item[key]) as string | string[];
      }
      return ret;
    };
    mainConfig.entry = fix(mainConfig.entry as EntryType);

    return webpackMerge(
      {
        devtool: 'source-map',
        target: 'electron-main',
        mode: this.mode,
        output: {
          path: path.resolve(this.webpackDir, 'main'),
          filename: 'index.js',
          libraryTarget: 'commonjs2',
        },
        plugins: [new webpack.DefinePlugin(this.getDefines())],
        node: {
          __dirname: false,
          __filename: false,
        },
      },
      mainConfig || {}
    );
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
      devtool: this.isProd ? 'source-map' : 'eval-source-map',
      mode: this.mode,
      output: {
        path: path.resolve(this.webpackDir, 'renderer'),
        filename: '[name]/index.js',
        globalObject: 'self',
        ...(this.isProd ? {} : { publicPath: '/' }),
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
      ...(this.isProd ? {} : { publicPath: '/' }),
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
    return webpackMerge(baseConfig, rendererConfig || {}, { entry, output, plugins });
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
    const rendererConfig = entryPoints[0].preload?.config || this.pluginConfig.renderer.config;

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
        ...(this.isProd ? {} : { publicPath: '/' }),
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
