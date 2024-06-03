'use strict';

/**
 * @param {string} fileName
 * @return boolean
 */
module.exports = fileName => !/^src([\\/])(?:app|test)(?:\1|$)/.test(fileName);
