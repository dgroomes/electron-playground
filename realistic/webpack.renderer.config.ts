import type {Configuration} from "webpack";
import {rules} from "./webpack.rules";
import WebpackCopyPlugin from "./webpack-copy-plugin";

export const rendererConfig: Configuration = {
    module: {
        rules,
    },
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
