'use strict';

// Imports
const {resolve} = require('path');
const sh = require('shelljs');

sh.set('-e');

// Constants
const ROOT_DIR = resolve(__dirname, '..');
const OUT_DIR = `${ROOT_DIR}/out`;
const OUT_INDEX_PATH = `${OUT_DIR}/index.html`;

// Run
_main(process.argv.slice(2));

// Helpers
async function _main() {
  const version = process.env.npm_package_version;

  // Copy files.
  sh.mkdir('-p', OUT_DIR);
  sh.cp('-r', 'src/!(app|test)', OUT_DIR);

  // Replace ENV placeholders.
  sh.sed('-i', /<PLACEHOLDER:VERSION>/g, `${version}`, OUT_INDEX_PATH);
}
