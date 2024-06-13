// Imports
import {resolve} from 'node:path';
import {exit} from 'node:process';

import {convertToSizes} from './utils/svg-to-pngs.mjs';


// Constants
const ROOT_DIR = resolve(`${import.meta.dirname}/..`);
const SIMPLE_TORCH_SVG_PATH = `${ROOT_DIR}/src/app/assets/images/simple-torch.svg`;
const SIZES = [128, 180, 192, 512];

// Run
_main();

// Helpers
async function _main() {
  try {
    await convertToSizes(SIMPLE_TORCH_SVG_PATH, SIZES);
  } catch (err) {
    console.error(err);
    exit(1);
  }
}
