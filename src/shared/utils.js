/**
 * @param {Function} AbstractClass
 * @param {{constructor: Function}} instance
 */
export const assertNotAbstract = (AbstractClass, instance) => {
  if (instance.constructor === AbstractClass) {
    throw new Error(`Trying to instantiate abstract class '${AbstractClass.name}'.`);
  }
};

/**
 * @param {string} input
 */
export const pascalToKebabCase = input => input.
  replace(/^[A-Z]/, m => m.toLowerCase()).
  replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);

/**
 * @param {number} duration
 * @return {Promise<void>}
 */
export const sleep = duration => new Promise(resolve => setTimeout(resolve, duration));

/**
 * @param {number} interval
 * @param {number} attempts
 * @param {() => boolean} conditionFn
 * @return {Promise<boolean>}
 */
export const waitAndCheck = async (interval, attempts, conditionFn) => {
  if (conditionFn()) return true;
  if (attempts <= 0) return false;

  await sleep(interval);
  return waitAndCheck(interval, attempts - 1, conditionFn);
};
