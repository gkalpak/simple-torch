// Imports
import {resolve} from 'node:path';
import {argv, exit} from 'node:process';

import sh from 'shelljs';

import {hash, hashFile} from './utils/hash-utils.mjs';


sh.set('-e');

// Constants
const ROOT_DIR = resolve(`${import.meta.dirname}/..`);
const PKG_PATH = `${ROOT_DIR}/package.json`;
const OUT_DIR = `${ROOT_DIR}/out`;
const OUT_INDEX_PATH = `${OUT_DIR}/index.html`;
const OUT_SW_PATH = `${OUT_DIR}/sw.js`;

// Run
_main(argv.slice(2));

// Helpers
async function _main(args) {
  try {
    const production = args.includes('--production');
    /** @type {import('../package.json')} */
    const pkg = JSON.parse(sh.cat(PKG_PATH));
    const repoUrl = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
    const sha = sh.exec('git rev-parse --verify HEAD', {silent: true}).trim();

    // Copy files.
    sh.mkdir('-p', OUT_DIR);
    sh.cp('-r', 'src/!(app|test)', OUT_DIR);

    // Replace ENV placeholders.
    sh.sed('-i', /<PLACEHOLDER:PRODUCTION>/g, `${production}`, OUT_INDEX_PATH);
    sh.sed('-i', /<PLACEHOLDER:REPO_URL>/g, `${repoUrl}`, OUT_INDEX_PATH);
    sh.sed('-i', /<PLACEHOLDER:SHA>/g, `${sha}`, OUT_INDEX_PATH);
    sh.sed('-i', /<PLACEHOLDER:VERSION>/g, `${pkg.version}`, OUT_INDEX_PATH);

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
    exit(1);
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
  return /** @type {import('node:fs').Dirent[] & import('shelljs').ShellArray} */ (sh.ls('-lR', OUT_DIR)).
    filter(x => x.isFile() && !x.name.startsWith('test/') && !x.name.endsWith('.map') && (x.name !== 'sw.js')).
    map(x => x.name);
}
