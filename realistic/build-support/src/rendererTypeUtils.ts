import { WebpackPluginEntryPoint } from './WebpackPluginConfig';

export const hasPreloadScript = (entry: WebpackPluginEntryPoint) => {
  return 'preload' in entry;
};
