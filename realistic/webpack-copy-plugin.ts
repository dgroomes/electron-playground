/*
A simple webpack plugin that copies files from one directory to another.

This is a simplified version of the `copy-webpack-plugin` library, which I don't want to use because I want to minimize
third-party dependencies.
*/

import fs from "fs";
import {Compiler, Compilation} from "webpack";


interface CopyPattern {
    /**
     * The source file to copy. For example, "src/index.html".
     */
    from: string;

    /**
     * The destination file to copy to. For example, "dist/index.html".
     */
    to: string;
}

/**
 * A simple webpack plugin that copies files into the webpack output directory. In spirit, this is similar to the
 * popular 'copy-webpack-plugin' plugin. I'm writing a custom plugin because I want to minimize dependencies on
 * third-party packages. Plus, you get the added benefit of seeing exactly how the copy works, it's just a few lines
 * of code and uses the Node standard library. Neat.
 */
export class WebpackCopyPlugin {

    private readonly patterns: CopyPattern[];

    /**
     * Initializes the plugin with patterns defining the copy operations.
     * @param patterns - Copy instructions with source and destination paths.
     */
    constructor(patterns: CopyPattern[]) {
        this.patterns = patterns;
    }

    apply(compiler: Compiler) {
        // For help with the related webpack APIs used here, see https://webpack.js.org/api/compilation-hooks/#processassets
        compiler.hooks.compilation.tap("WebpackCopyPlugin", (compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'WebpackCopyPlugin',
                    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
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
                            throw new Error(`Error copying file from ${pattern.from} to ${pattern.to}: ${err.message}`);
                        }
                    }
                });
        });
    }
}
