import {Configuration} from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

export interface WebpackPluginEntryPoint {
  /**
   * Relative or absolute path to the HTML template file for this entry point.
   */
  html: string;
  /**
   * Relative or absolute path to the main JS file for this entry point.
   */
  js: string;
  /**
   * Information about the preload script for this entry point. If you don't use
   * preload scripts, you don't need to set this.
   */
  preload?: WebpackPreloadEntryPoint;
}

export interface WebpackPreloadEntryPoint {
  /**
   * Relative or absolute path to the preload JS file.
   */
  js: string;
  /**
   * Additional entries to put in the array of entries for this preload script,
   * useful if you need to set up things like error reporting as separate
   * entry files into your application.
   */
  prefixedEntries?: string[];
}

export interface WebpackPluginConfig {
  /**
   * Instructs webpack to emit a JSON file containing statistics about modules, the dependency
   * graph, and various other build information for the main process. This file is located in
   * `.webpack/main/stats.json`, but is not packaged with your app.
   */
  jsonStats?: boolean;
  /**
   * The TCP port for the dev servers. Defaults to 3000.
   */
  port?: number;
  /**
   * The TCP port for web-multi-logger. Defaults to 9000.
   */
  loggerPort?: number;
  /**
   * In the event that webpack has been configured with `devtool: sourcemap` (or any other option
   * which results in `.map` files being generated), this option will cause the source map files be
   * packaged with your app. By default, they are not included.
   */
  packageSourceMaps?: boolean;
  /**
   * Sets the [`Content-Security-Policy` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
   * for the Webpack development server.
   *
   * Normally you would want to only specify this as a `<meta>` tag. However, in development mode,
   * the Webpack plugin uses the `devtool: eval-source-map` source map setting for efficiency
   * purposes. This requires the `'unsafe-eval'` source for the `script-src` directive that wouldn't
   * normally be recommended to use. If this value is set, make sure that you keep this
   * directive-source pair intact if you want to use source maps.
   *
   * Default: `default-src 'self' 'unsafe-inline' data:;`
   * `script-src 'self' 'unsafe-eval' 'unsafe-inline' data:`
   */
  devContentSecurityPolicy?: string;
  /**
   * Overrides for [`webpack-dev-server`](https://webpack.js.org/configuration/dev-server/) options.
   *
   * The following options cannot be overridden here:
   * * `port` (use the `port` config option)
   * * `static`
   * * `setupExitSignals`
   * * `headers.Content-Security-Policy` (use the `devContentSecurityPolicy` config option)
   */
  devServer?: Omit<WebpackDevServer.Configuration, 'port' | 'static' | 'setupExitSignals' | 'Content-Security-Policy'>;
}
