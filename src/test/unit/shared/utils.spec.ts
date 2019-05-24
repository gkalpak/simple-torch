import {pascalToKebabCase, sleep, waitAndCheck} from '../../../app/shared/utils.js';
import {macrotick, microtick} from '../test-utils.js';

describe('shared/utils', () => {
  describe('pascalToKebabCase()', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(pascalToKebabCase('FooBar')).toBe('foo-bar');
      expect(pascalToKebabCase('Foo1Bar')).toBe('foo1-bar');
      expect(pascalToKebabCase('FooBar2')).toBe('foo-bar2');
      expect(pascalToKebabCase('3FooBar')).toBe('3-foo-bar');

      expect(pascalToKebabCase('fooBar')).toBe('foo-bar');
      expect(pascalToKebabCase('Foobar')).toBe('foobar');
      expect(pascalToKebabCase('123-456')).toBe('123-456');
    });

    it('should leave kebab-case unchanged', () => {
      expect(pascalToKebabCase('foo-bar')).toBe('foo-bar');
      expect(pascalToKebabCase('foo1-bar')).toBe('foo1-bar');
      expect(pascalToKebabCase('foo-bar2')).toBe('foo-bar2');
      expect(pascalToKebabCase('3-foo-bar')).toBe('3-foo-bar');
    });

    it('should leave empty strings unchanged', () => {
      expect(pascalToKebabCase('')).toBe('');
    });
  });

  describe('sleep()', () => {
    beforeEach(jasmine.clock().install);
    afterEach(jasmine.clock().uninstall);

    it('should return a promise', () => {
      expect(sleep(0)).toEqual(jasmine.any(Promise));
    });

    it('should resolve after the specified duration (but not before)', async () => {
      const wakeUpSpy = jasmine.createSpy('wakeUp');
      sleep(1000).then(wakeUpSpy);

      jasmine.clock().tick(999);
      await microtick();
      expect(wakeUpSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      expect(wakeUpSpy).not.toHaveBeenCalled();

      await microtick();
      expect(wakeUpSpy).toHaveBeenCalledTimes(1);
    });

    it('should resolve asynchronously, even if duration is 0ms', async () => {
      const wakeUpSpy = jasmine.createSpy('wakeUp');
      sleep(0).then(wakeUpSpy);

      jasmine.clock().tick(0);
      expect(wakeUpSpy).not.toHaveBeenCalled();

      await microtick();
      expect(wakeUpSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('waitAndCheck()', () => {
    let checkSpy: jasmine.Spy;
    let doneSpy: jasmine.Spy;

    // Helpers
    const macrotickWithMockedClock = async () => {
      const macrotickPromise = macrotick();
      jasmine.clock().tick(0);
      await macrotickPromise;
    };

    beforeEach(() => {
      checkSpy = jasmine.createSpy('check');
      doneSpy = jasmine.createSpy('done');
      jasmine.clock().install();
    });

    afterEach(jasmine.clock().uninstall);

    it('should return a promise', () => {
      expect(waitAndCheck(0, 0, checkSpy)).toEqual(jasmine.any(Promise));
    });

    it('should resolve asap, if the condition is already satisfied', async () => {
      checkSpy.and.returnValue(true);
      waitAndCheck(1000, 10, checkSpy).then(doneSpy);

      await microtick();
      expect(doneSpy).toHaveBeenCalledWith(true);
    });

    it('should stop checking, if the condition is already satisfied', async () => {
      checkSpy.and.returnValue(true);
      waitAndCheck(1000, 10, checkSpy).then(doneSpy);

      expect(checkSpy).toHaveBeenCalledTimes(1);

      checkSpy.calls.reset();

      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();
      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();
      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();

      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('should wait for the specified duration between checks', async () => {
      waitAndCheck(1000, 10, checkSpy).then(doneSpy);

      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(999);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(2);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(999);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(2);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(3);
      expect(doneSpy).not.toHaveBeenCalled();
    });

    it('should resolve as soon as the condition is satisfied', async () => {
      waitAndCheck(1000, 10, checkSpy).then(doneSpy);

      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(1);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(2);
      expect(doneSpy).not.toHaveBeenCalled();

      checkSpy.and.returnValue(true);

      jasmine.clock().tick(999);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(2);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(1);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(3);
      expect(doneSpy).toHaveBeenCalledWith(true);
    });

    it('should stop checking as soon as the condition is satisfied', async () => {
      waitAndCheck(1000, 10, checkSpy).then(doneSpy);

      jasmine.clock().tick(1000);
      await microtick();
      expect(checkSpy).toHaveBeenCalledTimes(2);

      checkSpy.and.returnValue(true);

      jasmine.clock().tick(1000);
      await microtick();
      expect(checkSpy).toHaveBeenCalledTimes(3);

      checkSpy.calls.reset();

      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();
      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();
      jasmine.clock().tick(1000);
      await macrotickWithMockedClock();

      expect(checkSpy).not.toHaveBeenCalled();
    });

    it('should resolve with `false` after the specified attempts', async () => {
      waitAndCheck(500, 3, checkSpy).then(doneSpy);

      jasmine.clock().tick(500);
      await macrotickWithMockedClock();
      jasmine.clock().tick(500);
      await macrotickWithMockedClock();

      expect(checkSpy).toHaveBeenCalledTimes(3);
      expect(doneSpy).not.toHaveBeenCalled();

      jasmine.clock().tick(500);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(4);
      expect(doneSpy).toHaveBeenCalledWith(false);
    });

    it('should resolve with `true`, if the condition is satisfied on the last attempt', async () => {
      waitAndCheck(500, 3, checkSpy).then(doneSpy);

      jasmine.clock().tick(500);
      await macrotickWithMockedClock();
      jasmine.clock().tick(500);
      await macrotickWithMockedClock();

      checkSpy.and.returnValue(true);

      jasmine.clock().tick(500);
      await macrotickWithMockedClock();
      expect(checkSpy).toHaveBeenCalledTimes(4);
      expect(doneSpy).toHaveBeenCalledWith(true);
    });
  });
});
