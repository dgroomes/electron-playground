import { WebpackPluginEntryPoint, WebpackPluginEntryPointLocalWindow } from './WebpackPluginConfig';

/**
 * Reusable type predicate functions to narrow down the type of the WebpackPluginEntryPoint
 */

export const isLocalWindow = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointLocalWindow => {
  return !!(entry as any).html;
};

export const hasPreloadScript = (entry: WebpackPluginEntryPoint) => {
  return 'preload' in entry;
};
