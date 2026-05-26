'use strict';

/**
 * @param {string} fileName
 * @return boolean
 */
module.exports = fileName => !/^src([\\/])app\1(?:js(?:\1|$)|sw\.ts$|tsconfig\.json$)/.test(fileName);
