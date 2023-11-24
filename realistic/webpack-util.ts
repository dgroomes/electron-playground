import {Compiler, MultiCompiler, MultiStats, Stats, Watching} from 'webpack';

/*
webpack utility functions
*/

/**
 * Invoke a webpack compiler's run() method, but in a promisified way.
 *
 * Instead of passing your user code as a callback, you can await the returned promise and handle the result via the
 * normal promise mechanisms: '.then()' and '.catch()'.
 * <pre>
 * // Usage example
 * webpackRunPromisified(compiler);
 *     .then(stats => {
 *         if (stats.hasErrors()) {
 *             console.warn("Compilation errors", stats.toString());
 *         } else {
 *             console.log("Compilation successful");
 *         }
 *     })
 *     .catch(err => {
 *         console.error("Fatal error", err);
 *     });
 * </pre>
 */
export function webpackRunPromisified(compiler: Compiler): Promise<Stats>;

/**
 * The same as 'webpackRunPromisified(compiler: Compiler)', but for a MultiCompiler.
 */
export function webpackRunPromisified(compiler: MultiCompiler): Promise<MultiStats>;

export function webpackRunPromisified(compiler: Compiler | MultiCompiler): Promise<Stats | MultiStats> {
    return new Promise((resolve, reject) => {
        compiler.run((err: Error | null, stats: Stats | MultiStats) => {
            // Remember, the webpack compiler will only error if something "very wrong" happens. If the compilation
            // fails due to, say, a TypeScript type error, this is considered a normal compilation result because webpack
            // itself didn't error, there was a problem with the user's source code. In that case, the "stats" object
            // describes the compilation errors.
            if (err) return reject(err);

            return resolve(stats);
        });
    });
}

/**
 * Invoke a webpack compiler's watch() method, but in a promisified way.
 *
 * Instead of passing your user code as a callback, you can await the returned promise and handle the result via the
 * normal promise mechanisms: '.then()' and '.catch()'.
 *
 * Because this is a watch() invocation, the compiler may execute many compilation events. So, we can't just return a
 * single promise. We need to represent each new compilation event with a new promise. The returned PromisifiedWatcher
 * object has a method called currentCompilation() that returns a promise that resolves when the current compilation
 * completes or errors.
 *
 * <pre>
 * // Usage example
 * const watcher = webpackWatchPromisified(compiler);
 *
 * watcher.currentCompilation()
 *     .then(stats => {
 *         if (stats.hasErrors()) {
 *             console.warn("Compilation errors", stats.toString());
 *         } else {
 *             console.log("Compilation successful");
 *         }
 *     })
 *     .catch(err => {
 *         console.error("Fatal error", err);
 *     });
 * </pre>
 *
 * @param compiler
 */
export function webpackWatchPromisified(compiler: Compiler): PromisifiedWatcher {
    let rejectCurrent: (reason?: any) => void;
    let resolveCurrent: (value: Stats | PromiseLike<Stats>) => void;
    let currentPromise: Promise<Stats>;

    const watching = compiler.watch({}, (err: Error | null, stats: Stats) => {
        if (err) {
            if (rejectCurrent) {
                rejectCurrent(err);
            }

            // Because this is a fatal error, we don't bother resetting the promise. The watcher is dead.
            return;
        }

        if (resolveCurrent) {
            resolveCurrent(stats);
        }
        resetPromise();
    });

    function resetPromise() {
        currentPromise = new Promise<Stats>((resolve, reject) => {
            resolveCurrent = resolve;
            rejectCurrent = reject;
        });
    }

    resetPromise();

    return {
        watching,
        currentCompilation() {
            return currentPromise;
        }
    };
}

interface PromisifiedWatcher {
    /**
     * The underlying webpack 'Watching' object. You can use this to stop or inspect the watch process.
     */
    watching: Watching;

    /**
     * A promise that resolves when the next compilation completes or errors.
     */
    currentCompilation: () => Promise<Stats>;
}
