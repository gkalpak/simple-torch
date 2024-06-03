// Imports
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';


// Run
_main();

// Helpers
function _main() {
  // Disable type-checking for file `convert-svg-to-png/src/PNGProvider.js`, because TypeScript gives the following
  // (incorrect?) error:
  // ```
  // node_modules/convert-svg-to-png/src/PNGProvider.js:86:3 - error TS4121: This member cannot have a JSDoc comment
  // with an '@override' tag because its containing class 'PNGProvider' does not extend another class.
  //
  // 86   parseCLIOptions() {}
  //      ~~~~~~~~~~~~~~~
  // ```
  const filePath = fileURLToPath(import.meta.resolve('convert-svg-to-png/src/PNGProvider.js'));
  const fileContent = readFileSync(filePath, 'utf8');
  const noCheckDirective = '// @ts-nocheck';
  if (!fileContent.startsWith(noCheckDirective)) {
    writeFileSync(filePath, `${noCheckDirective}\n\n${fileContent}`);
  }
}
