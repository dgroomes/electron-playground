import { Configuration } from "webpack";


/**
 * Encapsulate environment-specific webpack configuration.
 */
export interface EnvStrategy {
    mode(): Configuration["mode"];
    devtool(): Configuration["devtool"];
    publicPath(): Configuration["output"]["publicPath"];
}

export class ProductionEnvStrategy implements EnvStrategy {
    mode(): Configuration["mode"] {
        return "production";
    }

    devtool(): Configuration["devtool"] {
        return "source-map";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return undefined;
    }
}

export class DevelopmentEnvStrategy implements EnvStrategy {
    mode(): Configuration["mode"] {
        return "development";
    }

    devtool(): Configuration["devtool"] {
        return "eval-source-map";
    }

    publicPath(): Configuration["output"]["publicPath"] {
        return "/";
    }
}
