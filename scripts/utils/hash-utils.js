// Imports
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';


// Enum: Algorithm
const Algorithm = {
  Md5: 'md5',
  Sha1: 'sha1',
  Sha256: 'sha256',
  Sha512: 'sha512',
};

// Exports
export {
  Algorithm,
  hash,
  hashFile
};

// Helpers
function hash(data, algorithm = Algorithm.Md5) {
  return new Promise((resolve, reject) => {
    try {
      const hash = createHash(algorithm);
      hash.update(data);
      resolve(hash.digest('hex'));
    } catch (err) {
      reject(err);
    }
  });
}

function hashFile(filePath, algorithm = Algorithm.Md5) {
  return new Promise((resolve, reject) => {
    try {
      const hash = createHash(algorithm);
      const input = createReadStream(filePath);
      let data;

      input.
        on('error', reject).
        on('readable', () => ((data = input.read())) ? hash.update(data) : resolve(hash.digest('hex')));
    } catch (err) {
      reject(err);
    }
  });
}
