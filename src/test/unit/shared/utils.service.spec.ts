import {WIN} from '../../../app/shared/constants.js';
import {Utils} from '../../../app/shared/utils.service.js';
import {macrotick, macrotickWithMockedClock, microtick, mockProperty, reversePromise} from '../test-utils.js';


describe('Utils', () => {
  const utils = Utils.getInstance();

  describe('.getInstance()', () => {
    it('should return a `Utils` instance', () => {
      expect(Utils.getInstance()).toEqual(jasmine.any(Utils));
    });

    it('should return the same instance on subsequent calls', () => {
      const instance1 = Utils.getInstance();
      const instance2 = Utils.getInstance();

      expect(instance2).toBe(instance1);
    });
  });

  describe('#onLoad()', () => {
    const {setMockValue: setMockReadyState} = mockProperty(WIN.document, 'readyState');
    let callbackSpy: jasmine.Spy;

    beforeEach(() => callbackSpy = jasmine.createSpy('callback'));

    it('should return a promise', async () => {
      setMockReadyState('complete');
      const promise = utils.onLoad(callbackSpy);

      expect(promise).toEqual(jasmine.any(Promise));
      await promise;
    });

    it('should run the callback asap (but still async), if document is already loaded', async () => {
      setMockReadyState('complete');

      utils.onLoad(callbackSpy);
      expect(callbackSpy).not.toHaveBeenCalled();

      await microtick();
      expect(callbackSpy).toHaveBeenCalledTimes(1);
    });

    it('should run the callback upon `window.onload`, if document is not already loaded', async () => {
      setMockReadyState('loading');

      utils.onLoad(callbackSpy);
      await microtick();
      expect(callbackSpy).not.toHaveBeenCalled();

      WIN.dispatchEvent(new Event('load'));
      await microtick();
      expect(callbackSpy).toHaveBeenCalledTimes(1);
    });

    it('should run once upon `window.onload` (in case there are multiple `onload` events fired)', async () => {
      setMockReadyState('loading');

      utils.onLoad(callbackSpy);

      WIN.dispatchEvent(new Event('load'));
      WIN.dispatchEvent(new Event('load'));
      await microtick();
      expect(callbackSpy).toHaveBeenCalledTimes(1);

      WIN.dispatchEvent(new Event('load'));
      WIN.dispatchEvent(new Event('load'));
      await microtick();
      expect(callbackSpy).toHaveBeenCalledTimes(1);
    });

    it('should resolve asap, if the callback is sync', async () => {
      const doneSpy = jasmine.createSpy('done');

      utils.onLoad(callbackSpy).then(doneSpy);
      expect(callbackSpy).not.toHaveBeenCalled();
      expect(doneSpy).not.toHaveBeenCalled();

      await macrotick();
      expect(callbackSpy).toHaveBeenCalledTimes(1);
      expect(doneSpy).toHaveBeenCalledTimes(1);
    });

    it('should resolve once the callback resolves, if it is async', async () => {
      const doneSpy = jasmine.createSpy('done');
      let callbackResolve!: () => void;
      callbackSpy.and.returnValue(new Promise(resolve => callbackResolve = resolve));

      utils.onLoad(callbackSpy).then(doneSpy);
      await macrotick();
      expect(doneSpy).not.toHaveBeenCalled();

      callbackResolve();
      await macrotick();
      expect(doneSpy).toHaveBeenCalledTimes(1);
    });

    it('should reject, if the callback throws', async () => {
      const expectedErr = new Error('test');
      callbackSpy.and.callFake(() => { throw expectedErr; });

      const actualErr = await reversePromise(utils.onLoad(callbackSpy));
      expect(actualErr).toBe(expectedErr);
    });

    it('should reject, if the callback rejects', async () => {
      const expectedErr = new Error('test');
      callbackSpy.and.callFake(() => Promise.reject(expectedErr));

      const actualErr = await reversePromise(utils.onLoad(callbackSpy));
      expect(actualErr).toBe(expectedErr);
    });
  });

  describe('#pascalToKebabCase()', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(utils.pascalToKebabCase('FooBar')).toBe('foo-bar');
      expect(utils.pascalToKebabCase('Foo1Bar')).toBe('foo1-bar');
      expect(utils.pascalToKebabCase('FooBar2')).toBe('foo-bar2');
      expect(utils.pascalToKebabCase('3FooBar')).toBe('3-foo-bar');

      expect(utils.pascalToKebabCase('fooBar')).toBe('foo-bar');
      expect(utils.pascalToKebabCase('Foobar')).toBe('foobar');
      expect(utils.pascalToKebabCase('123-456')).toBe('123-456');
    });

    it('should leave kebab-case unchanged', () => {
      expect(utils.pascalToKebabCase('foo-bar')).toBe('foo-bar');
      expect(utils.pascalToKebabCase('foo1-bar')).toBe('foo1-bar');
      expect(utils.pascalToKebabCase('foo-bar2')).toBe('foo-bar2');
      expect(utils.pascalToKebabCase('3-foo-bar')).toBe('3-foo-bar');
    });

    it('should leave empty strings unchanged', () => {
      expect(utils.pascalToKebabCase('')).toBe('');
    });
  });

  describe('#sleep()', () => {
    beforeEach(jasmine.clock().install);
    afterEach(jasmine.clock().uninstall);

    it('should return a promise', () => {
      expect(utils.sleep(0)).toEqual(jasmine.any(Promise));
    });

    it('should resolve after the specified duration (but not before)', async () => {
      const wakeUpSpy = jasmine.createSpy('wakeUp');
      utils.sleep(1000).then(wakeUpSpy);

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
      utils.sleep(0).then(wakeUpSpy);

      jasmine.clock().tick(0);
      expect(wakeUpSpy).not.toHaveBeenCalled();

      await microtick();
      expect(wakeUpSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#waitAndCheck()', () => {
    let checkSpy: jasmine.Spy;
    let doneSpy: jasmine.Spy;

    // Helpers
    beforeEach(() => {
      checkSpy = jasmine.createSpy('check');
      doneSpy = jasmine.createSpy('done');

      jasmine.clock().install();
    });

    afterEach(jasmine.clock().uninstall);

    it('should return a promise', () => {
      expect(utils.waitAndCheck(0, 0, checkSpy)).toEqual(jasmine.any(Promise));
    });

    it('should resolve asap, if the condition is already satisfied', async () => {
      checkSpy.and.returnValue(true);
      utils.waitAndCheck(1000, 10, checkSpy).then(doneSpy);

      await microtick();
      expect(doneSpy).toHaveBeenCalledWith(true);
    });

    it('should stop checking, if the condition is already satisfied', async () => {
      checkSpy.and.returnValue(true);
      utils.waitAndCheck(1000, 10, checkSpy).then(doneSpy);

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
      utils.waitAndCheck(1000, 10, checkSpy).then(doneSpy);

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
      utils.waitAndCheck(1000, 10, checkSpy).then(doneSpy);

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
      utils.waitAndCheck(1000, 10, checkSpy).then(doneSpy);

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
      utils.waitAndCheck(500, 3, checkSpy).then(doneSpy);

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
      utils.waitAndCheck(500, 3, checkSpy).then(doneSpy);

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
