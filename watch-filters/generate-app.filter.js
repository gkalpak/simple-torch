/**
 * @param {string} fileName
 * @param {fs.Stats} fileStat
 */
module.exports = fileName => !/^src([\\/])app(?:\1|$)/.test(fileName);
