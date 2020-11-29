/**
 * This JavaScript code will be run as a "preload" script. For more information about how "preload" scripts work see the
 * documentation for BrowserWindow and specifically scroll down to the "webPreferences" option: https://www.electronjs.org/docs/api/browser-window
 *
 * The BrowserWindow's webPreferences supports only one "preload" script but we have multiple things we want to execute.
 * So, we can "require" each of the JavaScript source files containing the code we want to execute. This "preload.js"
 * file just serves to delegate to those files.
 */

require('./detect-versions');
require('./message-passing');