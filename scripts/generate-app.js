'use strict';

// Imports
const {resolve} = require('path');
const sh = require('shelljs');
const {hash, hashFile} = require('./utils/hash-utils');

sh.set('-e');

// Constants
const ROOT_DIR = resolve(`${__dirname}/..`);
const OUT_DIR = `${ROOT_DIR}/out`;
const OUT_INDEX_PATH = `${OUT_DIR}/index.html`;
const OUT_SW_PATH = `${OUT_DIR}/sw.js`;

// Run
_main(process.argv.slice(2));

// Helpers
async function _main(args) {
  try {
    const production = args.includes('--production');
    const version = process.env.npm_package_version;

    // Copy files.
    sh.mkdir('-p', OUT_DIR);
    sh.cp('-r', 'src/!(app|test)', OUT_DIR);

    // Replace ENV placeholders.
    sh.sed('-i', /<PLACEHOLDER:PRODUCTION>/g, `${production}`, OUT_INDEX_PATH);
    sh.sed('-i', /<PLACEHOLDER:VERSION>/g, `${version}`, OUT_INDEX_PATH);

    // In production mode...
    if (production) {
      // Replace SW placeholders.
      const files = swFindFilesToCache();
      const hashes = await swComputeHashes(files);

      const swHashRepl = await hash(hashes.join());
      const filesToCacheRepl = swCreateFilesToCacheReplacement(files, hashes);

      sh.sed('-i', /<PLACEHOLDER:SW_HASH>/g, swHashRepl, OUT_SW_PATH);
      sh.sed('-i', /'<PLACEHOLDER:FILES_TO_CACHE>': ''/g, filesToCacheRepl, OUT_SW_PATH);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function swComputeHashes(files) {
  return Promise.all(files.map(filePath => hashFile(`${OUT_DIR}/${filePath}`)));
}

function swCreateFilesToCacheReplacement(files, hashes) {
  const indexAlias = './';
  const indexHash = hashes[files.indexOf('index.html')];

  files = [indexAlias, ...files];
  hashes = [indexHash, ...hashes];

  return `${files.map((filePath, i) => `\n    '${filePath}': '${hashes[i]}',`).join('')}\n`;
}

function swFindFilesToCache() {
  return sh.
    ls('-lR', OUT_DIR).
    filter(x => x.isFile() && !x.name.startsWith('test/') && !x.name.endsWith('.map') && (x.name !== 'sw.js')).
    map(x => x.name);
}
