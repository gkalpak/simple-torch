/**
 * @param {string} fileName
 * @param {fs.Stats} fileStat
 */
module.exports = fileName => !/^src([\\/])(?:app|test)(?:\1|$)/.test(fileName);
