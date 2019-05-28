'use strict';

// Imports
const {createConverter} = require('convert-svg-to-png');

// Exports
module.exports = {
  convertToSizes,
};

// Helpers
async function convertToSizes(inputFilePath, sizes) {
  const converter = createConverter();
  const convertedFilePaths = [];

  try {
    for (const size of sizes) {
      const width = size;
      const height = size;
      const outputFilePath = inputFilePath.replace(/\.svg$/, `-${width}x${height}.png`);
      convertedFilePaths.push(await converter.convertFile(inputFilePath, {width, height, outputFilePath}));
    }
  } finally {
    await converter.destroy();
  }

  return convertedFilePaths;
}
