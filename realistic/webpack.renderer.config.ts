import type {Configuration} from "webpack";
import {rules} from "./webpack.rules";
import {WebpackCopyPlugin} from "./webpack-copy-plugin";

export const rendererConfig: Configuration = {
    module: {
        rules,
    },

    // Let's use 'source-map' instead of the default behavior which uses 'eval'. When 'eval' is used, then we need to
    // relax the Content-Security-Policy rule to allow 'unsafe-eval'. This is not a great trade-off in my case, because
    // I don't need the extra build speed of the default behavior, and I'd prefer to appease the security preferences of
    // the browser, which logs an annoying warning to the console when 'unsafe-eval' is used.
    devtool: "source-map",
    plugins: [
        // Copy over static assets. Why? See the long comment on the 'createStaticProtocol' function in 'main.ts'.
        new WebpackCopyPlugin([{
            from: "src/index.css",
            to: "index.css"
        }]),
    ],
    resolve: {
        extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    },
};
