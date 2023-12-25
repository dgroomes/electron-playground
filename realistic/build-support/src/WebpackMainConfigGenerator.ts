import path from 'path';
import {Configuration, DefinePlugin} from 'webpack';
import {EnvStrategy} from './EnvStrategy';

import {
  MAIN_WINDOW,
  WebpackPluginEntryPoint,
  WebpackPluginRendererConfig
} from './WebpackPluginConfig';

// noinspection JSUnusedGlobalSymbols
export default class WebpackMainConfigGenerator {

  private config: Configuration;
  private readonly webpackOutputDir: string;
  private envStrategy: EnvStrategy;
  private projectDir: string;
  private pluginRendererConfig: WebpackPluginRendererConfig;
  private port: number;

  constructor(config: Configuration, projectDir: string, envStrategy: EnvStrategy, pluginRendererConfig: WebpackPluginRendererConfig, port: number) {
    this.config = config;
    this.webpackOutputDir = path.resolve(projectDir, '.webpack');
    this.envStrategy = envStrategy;
    this.projectDir = projectDir;
    this.pluginRendererConfig = pluginRendererConfig;
    this.port = port;
  }

  /**
   * This was ported from the WebpackConfigGenerator. It's a bit awkward right now.
   * @private
   */
  public generateConfig() : Configuration {
    const mainConfig = this.config;
    mainConfig.entry = path.resolve(this.projectDir, "./src/main.ts");
    mainConfig.output.path = path.resolve(this.webpackOutputDir, 'main');
    mainConfig.mode =  this.envStrategy.mode()
    mainConfig.plugins = [new DefinePlugin(this.getDefines(this.envStrategy))];
    return mainConfig;
  }

  /**
   * This was ported from the WebpackConfigGenerator. It's a bit awkward right now.
   */
  private getDefines(envStrategy: EnvStrategy): Record<string, string> {
    const defines: Record<string, string> = {};
    const entryPoint = this.pluginRendererConfig.entryPoint;
    const entryKey = this.toEnvironmentVariable(entryPoint);
    defines[entryKey] = envStrategy.rendererEntryPoint(MAIN_WINDOW, 'index.html', this.port);
    defines[`process.env.${entryKey}`] = defines[entryKey];

    const preloadDefineKey = this.toEnvironmentVariable(entryPoint, true);
    defines[preloadDefineKey] = envStrategy.preloadDefine(this.webpackOutputDir, MAIN_WINDOW);
    defines[`process.env.${preloadDefineKey}`] = defines[preloadDefineKey];

    return defines;
  }

  private toEnvironmentVariable(entryPoint: WebpackPluginEntryPoint, preload = false): string {
    const suffix = preload ? '_PRELOAD_WEBPACK_ENTRY' : '_WEBPACK_ENTRY';
    return `${MAIN_WINDOW.toUpperCase().replace(/ /g, '_')}${suffix}`;
  }
}
