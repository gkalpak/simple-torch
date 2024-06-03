// Imports
import convertSvgToPng from 'convert-svg-to-png';


// Exports
export {
  convertToSizes,
};

// Helpers
async function convertToSizes(inputFilePath, sizes) {
  const converter = convertSvgToPng.createConverter({});
  const convertedFilePaths = [];

  try {
    for (const size of sizes) {
      const width = size;
      const height = size;
      const outputFilePath = inputFilePath.replace(/\.svg$/, `-${width}x${height}.png`);
      convertedFilePaths.push(await converter.convertFile(inputFilePath, {height, outputFilePath, width}));
    }
  } finally {
    await converter.destroy();
  }

  return convertedFilePaths;
}
