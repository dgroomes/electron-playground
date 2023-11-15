import {Compiler, Configuration} from "webpack";

/**
 * A simple webpack plugin that copies files into the webpack output directory. In spirit, this is similar to the
 * popular 'copy-webpack-plugin' plugin. I'm writing a custom plugin because I want to minimize dependencies on
 * third-party packages. Plus, you get the added benefit of seeing exactly how the copy works, it's just a few lines
 * of code and uses the Node standard library. Neat.
 */

/**
 * A simple webpack plugin that recovers the original configuration for the 'stats' and 'infrastructureLogging' items in
 * your webpack configuration. This is workaround (a hack) because Electron Forge overrides these entries for the sake
 * of suppressing logs, but you might need and want webpack logs. See
 *
 *   - https://github.com/electron/forge/blob/b4f6dd9f8da7ba63099e4b802c59d1f56feca0cc/packages/plugin/webpack/src/WebpackPlugin.ts#L309
 *   - https://github.com/electron/forge/blob/b4f6dd9f8da7ba63099e4b802c59d1f56feca0cc/packages/plugin/webpack/src/WebpackPlugin.ts#L311
 */
export class WebpackRecoverStatsAndInfraLoggingConfigPlugin {

    private configuration: Configuration;

    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    apply(compiler: Compiler) {
        console.warn("WebpackRecoverStatsAndInfraLoggingConfigPlugin.apply()");
        compiler.options.stats = this.configuration.stats;
        compiler.options.infrastructureLogging = this.configuration.infrastructureLogging;
    }
}
