import HtmlWebpackPlugin from "html-webpack-plugin";
import {Compiler} from "webpack";

/**
 * Add a special script tag to the generated HTML page that will and connect to the standalone React DevTools app.
 * See the related notes in the README.
 */
export default class ReactDevToolsScriptAdderPlugin {

    public apply(compiler: Compiler): void {
        if (process.env.ELECTRON_PLAYGROUND_CONNECT_TO_REACT_DEVTOOLS !== "true") return;

        compiler.hooks.compilation.tap('ReactDevToolsScriptAdderPlugin', compilation => {
            HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapPromise('ReactDevToolsScriptAdderPlugin', async data => {
                    const scriptTag = HtmlWebpackPlugin.createHtmlTagObject('script', {
                        src: "http://localhost:8097"
                    });

                    data.assetTags.scripts.push(scriptTag);

                    return data;
                }
            );
        });
    }
}
