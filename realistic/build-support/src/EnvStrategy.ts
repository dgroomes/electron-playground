import {Configuration} from "webpack";
import path from "path";

/**
 * Encapsulate environment-specific webpack configuration.
 */
export interface EnvStrategy {
    mode(): Configuration["mode"];

    publicPath(): Configuration["output"]["publicPath"];

    rendererPreloadEntryPoint(webpackOutputDir: string, entryPointName: string): string;

    rendererEntryPoint(entryPointName: string, basename: string, port: number): string;
}

export class ProductionEnvStrategy implements EnvStrategy {
    mode(): Configuration["mode"] {
        return "production";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return undefined;
    }

    rendererPreloadEntryPoint(_webpackOutputDir: string, entryPointName: string): string {
        return `require('path').resolve(__dirname, '../renderer', '${entryPointName}', 'preload.js')`;
    }

    rendererEntryPoint(entryPointName: string, basename: string, port: number): string {
        // noinspection ES6RedundantNestingInTemplateLiteral
        return `\`file://$\{require('path').resolve(__dirname, '..', '${'renderer'}', '${entryPointName}', '${basename}')}\``;
    }
}

export class DevelopmentEnvStrategy implements EnvStrategy {
    mode(): Configuration["mode"] {
        return "development";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return "/";
    }

    rendererPreloadEntryPoint(webpackOutputDir: string, entryPointName: string): string {
        return `'${path.resolve(webpackOutputDir, 'renderer', entryPointName, 'preload.js').replace(/\\/g, '\\\\')}'`;
    }

    rendererEntryPoint(entryPointName: string, basename: string, port: number): string {
        const baseUrl = `http://localhost:${port}/${entryPointName}`;
        if (basename !== "index.html") {
            return `'${baseUrl}/${basename}'`;
        }
        return `'${baseUrl}'`;
    }
}
