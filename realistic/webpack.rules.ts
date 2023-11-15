import type {ModuleOptions} from "webpack";

export const rules: Required<ModuleOptions>["rules"] = [
    {
        test: /\.tsx?$/,
        exclude: /(node_modules|\.webpack)/,
        use: {
            loader: "ts-loader",
        },
    },
];