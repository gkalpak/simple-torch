/**
 * @param {string} fileName
 * @param {fs.Stats} fileStat
 */
module.exports = (fileName, fileStats) => fileStats.isFile() && /\bindex\.(?:css|html)$/.test(fileName);
