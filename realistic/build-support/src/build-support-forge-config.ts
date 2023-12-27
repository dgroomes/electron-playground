import type {ForgeConfig} from "@electron-forge/shared-types";
import {MakerZIP} from "@electron-forge/maker-zip";
import {WebpackPluginConfig} from "./WebpackPluginConfig";
import {BuildSupportForgePlugin} from "./BuildSupportForgePlugin";

const webpackPluginConfig: WebpackPluginConfig = {
    // The Content Security Policy (CSP) is a useful security feature of browser pages, including in Electron apps.
    // Learn more it at the following links:
    //
    // - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
    // - https://github.com/electron/electron/issues/19775
    //
    // We need to include 'ws:' because webpack uses WebSockets for reloading changed resources. This feature
    // is called Hot Module Reloading (HMR).
    //
    // We need 'unsafe-inline' for styles, because the effect of webpack's 'style-loader' is that the web page
    // applies its styles by some JavaScript code that appends a '<style>' element to the '<head>' element. To me,
    // this is NOT inline styles, it's just an internal style sheet. Inline styles would be setting the style
    // attribute on individual elements. So, I'm pretty confused. Also, in the same surprising spirit, even with
    // a seemingly conservative CSP, you can still set styles via the CSS object model in JavaScript (see https://stackoverflow.com/q/36870421).
    // So, I haven't really figured out this CSP thing, but I'm leaving this note to at least preserve some basic
    // understanding.
    //
    // Specifically, without the CSP I get the error message:
    //
    //     Refused to apply inline style because it violates the following Content Security Policy (insertBySelector.js:32)
    //
    // And when I put a breakpoint at this line, I can tell it's trying to add a 'style' element to the 'head'
    // element. Again, this is NOT an inline style. And I can't find any language in MDN that defines inline
    // styles, but if I dig through to the CSP specs and proposals I would eventually find some logic.
    devContentSecurityPolicy: "default-src 'self' http: https: ws:; style-src-elem 'self' 'unsafe-inline'"
};

const config: ForgeConfig = {
    packagerConfig: {

        /*
        ASAR reference: https://www.electronjs.org/docs/latest/tutorial/asar-archives
        In a real app, you would usually bundle it into an ASAR archive. For your development workflow and debugging,
        you might want to disable this. This makes me think I need to get serious about defining a "dev" mode and a "prod"
        mode flag to handle differences like this. Should I handle it via an environment variable, in an npm start
        script?
        */
        asar: true,

        /*
        Apparently, Electron Packager by default copies the full contents of files and directories from the project root
        into the application bundle. (It has an ounce of rules, because it didn't copy the `.git/` directory, but interestingly
        it copied the `.gitignore`). So, we need to tell Electron Packager to NOT copy all this stuff. The 'ignore'
        configuration is the solution. But we don't want to enumerate the things to ignore because that list is large and
        evolving. Instead, we would rather express "include only things in the '.webpack/' directory". It's hard to
        express "not matching" directly in a regex, so we can implement an "ignore" function.
        */
        ignore: (path: string) => {
            // For some reason, we get an empty string. Semantically this doesn't make sense. But if you ignore this
            // entry then nothing gets copied and the build fails. I think it probably represents the root directory,
            // but really they should have used "." or "/" for that case. It's a quirk.
            if (path === "") return false;

            const partOfBundle = path.startsWith("/.webpack/");
            if (partOfBundle) return false;

            const isBundle = path === "/.webpack";
            if (isBundle) return false;

            // The 'package.json' file is required by Electron Packager or Forge, and I'm not really sure why. I know
            // that it uses the "main" field to determine the entry point of the application. But I don't get why the
            // whole file needs to be bundled.
            return path !== "/package.json";
        }
    },
    rebuildConfig: {},
    makers: [new MakerZIP({}, ['darwin'])],
    plugins: [
        new BuildSupportForgePlugin(webpackPluginConfig),
    ],
};

// noinspection JSUnusedGlobalSymbols
export default config;
