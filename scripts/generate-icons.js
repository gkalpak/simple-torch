'use strict';

// Imports
const {resolve} = require('path');
const {convertToSizes} = require('./utils/svg-to-pngs');

// Constants
const ROOT_DIR = resolve(`${__dirname}/..`);
const SIMPLE_TORCH_SVG_PATH = `${ROOT_DIR}/src/assets/images/simple-torch.svg`;
const SIZES = [128, 192, 512];

// Run
_main(process.argv.slice(2));

// Helpers
async function _main() {
  try {
    await convertToSizes(SIMPLE_TORCH_SVG_PATH, SIZES);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
