import type {Configuration} from "webpack";
import {rules} from "./webpack.rules";

export const rendererConfig: Configuration = {
    module: {
        rules: [
            ...rules,
            {
                test: /\.css$/,
                use: [{loader: 'style-loader'}, {loader: 'css-loader'}],
            }
        ],
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
