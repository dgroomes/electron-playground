import {Configuration} from "webpack";
import path from "path";
import * as url from "url";

/**
 * Encapsulate environment-specific configuration.
 */
export interface BuildSupportEnvStrategy {
    mode(): Configuration["mode"];

    publicPath(): Configuration["output"]["publicPath"];

    rendererPreloadEntryPoint(webpackOutputDir: string): string;

    rendererEntryPoint(): string;
}

export class ProductionEnvStrategy implements BuildSupportEnvStrategy {
    mode(): Configuration["mode"] {
        return "production";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return undefined;
    }

    rendererPreloadEntryPoint(_webpackOutputDir: string): string {
        return "require('path').resolve(__dirname, '../renderer/main_window/preload.js')";
    }

    rendererEntryPoint(): string {
        return "require('url').pathToFileURL(require('path').resolve(__dirname, '../renderer/main_window/index.html')).toString()";
    }
}

export class DevelopmentEnvStrategy implements BuildSupportEnvStrategy {

    readonly #port: number;

    constructor(port: number) {
        this.#port = port;
    }

    mode(): Configuration["mode"] {
        return "development";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return "/";
    }

    rendererPreloadEntryPoint(webpackOutputDir: string): string {
        return JSON.stringify(path.resolve(webpackOutputDir, "renderer/main_window/preload.js"));
    }

    rendererEntryPoint(): string {
        const entryPointUrl = url.format({
            protocol: "http",
            hostname: "localhost",
            port: this.#port,
            pathname: "main_window"
        });
        return JSON.stringify(entryPointUrl);
    }
}
