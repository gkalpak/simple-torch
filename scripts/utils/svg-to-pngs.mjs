// Imports
import {createConverter} from 'convert-svg-to-png';
import {executablePath} from 'puppeteer';


// Exports
export {
  convertToSizes,
};

// Helpers
async function convertToSizes(inputFilePath, sizes) {
  const converter = await createConverter({launch: {executablePath}});
  const convertedFilePaths = [];

  try {
    for (const size of sizes) {
      const width = size;
      const height = size;
      const outputFilePath = inputFilePath.replace(/\.svg$/, `-${width}x${height}.png`);

      convertedFilePaths.push(await converter.convertFile(inputFilePath, {height, outputFilePath, width}));
    }
  } finally {
    await converter.close();
  }

  return convertedFilePaths;
}
