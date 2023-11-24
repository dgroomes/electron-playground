import type {Configuration} from "webpack";
import {rules} from "./webpack.rules";
import {WebpackRecoverStatsAndInfraLoggingConfigPlugin} from "./WebpackRecoverStatsAndInfraLoggingConfigPlugin";

export const rendererConfig: Configuration = {
    plugins: [],
    stats: {
        logging: "verbose",
    },
    infrastructureLogging: {
        level: "verbose",
    },
    module: {
        rules: [
            ...rules,
            {
                test: /\.css$/,
                use: [{loader: 'style-loader'}, {loader: 'css-loader'}],
            }
        ],
    },
    performance: {
        // During development, the bundle size exceeds a default webpack configuration which exists as a "performance
        // hint". This is annoying because it's not actionable. The bundle is so large because we're using style-loader
        // and other things and somehow this gets over 250KiB (I'm surprised by that). But this is a normal/mainstream
        // setup, so we consider the warning message a false alarm. Turn it off. See the related discussion: https://github.com/webpack/webpack/issues/3486
        hints: false
    },

    // Let's use 'source-map' instead of the default behavior which uses 'eval'. When 'eval' is used, then we need to
    // relax the Content-Security-Policy rule to allow 'unsafe-eval'. This is not a great trade-off in my case, because
    // I don't need the extra build speed of the default behavior, and I'd prefer to appease the security preferences of
    // the browser, which logs an annoying warning to the console when 'unsafe-eval' is used.
    devtool: "source-map",
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    },
};

rendererConfig.plugins.push(new WebpackRecoverStatsAndInfraLoggingConfigPlugin({
    stats: rendererConfig.stats,
    infrastructureLogging: rendererConfig.infrastructureLogging
}));
