import {PluginBase} from "@electron-forge/plugin-base";

type MyForgeWebpackPluginConfig = {

}

/**
 * WORK IN PROGRESS
 *
 * Let's incrementally develop this plugin. We can start with a "do nothing" plugin. We want to enable debug logs
 * in Electron Forge's software machinery and learn from there. A stepping stone goal is if we can wire in a working
 * 'webpack(...)' call into the build process.
 */
export class MyForgeWebpackPlugin extends PluginBase<MyForgeWebpackPluginConfig> {
  name: string = "MyForgeWebpackPlugin";
}
