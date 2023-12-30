import type {ForgeConfig} from "@electron-forge/shared-types";
import {MakerDMG} from "@electron-forge/maker-dmg";
import {BuildSupportForgePlugin} from "./BuildSupportForgePlugin";

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
    makers: [new MakerDMG({
        // This is an odd one. The name of the application, in general, is whatever the value of the 'name' field is in
        // 'package.json'. That's good and that's what I want. But when it comes to creating the '.dmg' file, the name
        // is so long that it's causing a problem. 'electron-playground_realistic' is 29 characters but this string is
        // used as a macOS "Volume" I guess, and there's a 27-character limit there. I was getting the following error
        // message
        //
        //    electron forge AssertionError [ERR_ASSERTION]: Volume name is not longer than 27 chars
        //
        // So I have to come up with a shorter name here. 'electron-realistic' is only 18 characters, which works.
        name: "electron-realistic"
    })],
    plugins: [
        new BuildSupportForgePlugin(),
    ],
};

// noinspection JSUnusedGlobalSymbols
export default config;
