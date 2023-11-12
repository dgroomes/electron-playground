/*
A simple webpack plugin that copies files from one directory to another.

This is a simplified version of the `copy-webpack-plugin` library, which I don't want to use because I want to minimize
third-party dependencies.
*/

const fs = require("fs");

/**
 * A pattern object for specifying file copy operations.
 * @typedef {Object} CopyPattern - Defines the shape of the pattern object for copying files.
 * @property {string} from - The file source path.
 * @property {string} to - The file destination path in the build directory.
 */

/**
 * A simple webpack plugin that copies files into the webpack output directory. In spirit, this is similar to the
 * popular 'copy-webpack-plugin' plugin. I'm writing a custom plugin because I want to minimize dependencies on
 * third-party packages. Plus, you get the added benefit of seeing exactly how the copy works, it's just a few lines
 * of code and uses the Node standard library. Neat.
 */
class WebpackCopyPlugin {

    /**
     * Initializes the plugin with patterns defining the copy operations.
     * @param {CopyPattern[]} patterns - Copy instructions with source and destination paths.
     */
    constructor(patterns) {
        this.patterns = patterns;
    }

    apply(compiler) {
        // For help with the related webpack APIs used here, see https://webpack.js.org/api/compilation-hooks/#processassets
        compiler.hooks.compilation.tap("WebpackCopyPlugin", (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'WebpackCopyPlugin',
                    stage: 'PROCESS_ASSETS_STAGE_ADDITIONS'
                }, () => {
                    for (let pattern of this.patterns) {
                        try {
                            // Read the content of the file
                            const content = fs.readFileSync(pattern.from);
                            const sources = compilation.compiler.webpack.sources;
                            compilation.emitAsset(
                                pattern.to,
                                new sources.RawSource(content)
                            );
                        } catch (err) {
                            // Handle and report errors like missing or inaccessible files during compilation
                            compilation.errors.push(new Error(`Error copying file from ${pattern.from} to ${pattern.to}: ${err.message}`));
                        }
                    }
                });
        });
    }
}

module.exports = WebpackCopyPlugin;
