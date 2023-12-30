import {Configuration} from "webpack";
import path from "path";

/**
 * Encapsulate environment-specific configuration.
 */
export interface EnvStrategy {
    mode(): Configuration["mode"];

    publicPath(): Configuration["output"]["publicPath"];

    rendererPreloadEntryPoint(webpackOutputDir: string): string;

    rendererEntryPoint(port: number): string;
}

export class ProductionEnvStrategy implements EnvStrategy {
    mode(): Configuration["mode"] {
        return "production";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return undefined;
    }

    rendererPreloadEntryPoint(_webpackOutputDir: string): string {
        return "require('path').resolve(__dirname, '../renderer/main_window/preload.js')";
    }

    rendererEntryPoint(_port: number): string {
        return "`file://${require('path').resolve(__dirname, '../renderer/main_window/index.html')}`";
    }
}

export class DevelopmentEnvStrategy implements EnvStrategy {
    mode(): Configuration["mode"] {
        return "development";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return "/";
    }

    rendererPreloadEntryPoint(webpackOutputDir: string): string {
        return JSON.stringify(path.resolve(webpackOutputDir, 'renderer/main_window/preload.js'));
    }

    rendererEntryPoint(port: number): string {
        return JSON.stringify(`http://localhost:${port}/main_window`);
    }
}
