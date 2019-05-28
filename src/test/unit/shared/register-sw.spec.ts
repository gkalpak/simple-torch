import {ENV, WIN} from '../../../app/shared/constants.js';
import {registerSw} from '../../../app/shared/register-sw.js';
import {Utils} from '../../../app/shared/utils.service.js';
import {macrotickWithMockedClock, microtick, mockProperty, reversePromise} from '../test-utils.js';


describe('registerSw()', () => {
  const utils = Utils.getInstance();
  const {setMockValue: setMockProduction} = mockProperty(ENV, 'production');
  const {setMockValue: setMockSwContainer, restoreOriginalValue: restoreOriginalSwContainer} =
    mockProperty(WIN.navigator, 'serviceWorker');
  let consoleErrorSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;
  let utilsOnLoadSpy: jasmine.Spy;

  beforeEach(() => {
    consoleErrorSpy = spyOn(console, 'error');
    consoleInfoSpy = spyOn(console, 'info');
    utilsOnLoadSpy = spyOn(utils, 'onLoad');
  });

  it('should return a promise', async () => {
    const promise = registerSw('foo.js', 42);

    expect(promise).toEqual(jasmine.any(Promise));
    await promise;
  });

  describe('(in dev mode)', () => {
    beforeEach(() => setMockProduction(false));

    it('should do nothing', async () => {
      setMockSwContainer(undefined!);
      expect(await registerSw('foo.js', 42)).toBe(false);

      restoreOriginalSwContainer();
      expect(await registerSw('foo.js', 42)).toBe(false);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(utilsOnLoadSpy).not.toHaveBeenCalled();
    });
  });

  describe('(in production mode)', () => {
    let mockSwContainer: MockServiceWorkerContainer;

    beforeEach(() => {
      mockSwContainer = new MockServiceWorkerContainer();
      setMockProduction(true);
      setMockSwContainer(mockSwContainer as unknown as ServiceWorkerContainer);

      jasmine.clock().install();
    });

    afterEach(jasmine.clock().uninstall);

    it('should do nothing, if `navigator.serviceWorker` is not defined', async () => {
      setMockSwContainer(undefined!);

      const registered = await registerSw('foo.js', 42);

      expect(registered).toBe(false);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(utilsOnLoadSpy).not.toHaveBeenCalled();
    });

    it('should register an `onload` callback', () => {
      registerSw('foo.js', 42);

      expect(consoleInfoSpy).toHaveBeenCalledWith('[ServiceWorker] Registering...');
      expect(utilsOnLoadSpy).toHaveBeenCalledWith(jasmine.any(Function));
    });

    describe('`onload` callback', () => {
      let callback: () => Promise<void>;
      let promise: Promise<boolean>;

      beforeEach(() => {
        promise = registerSw('foo.js', 42);
        callback = utilsOnLoadSpy.calls.mostRecent().args[0];
      });

      it('should register the ServiceWorker', () => {
        expect(mockSwContainer.register).not.toHaveBeenCalled();

        callback();
        expect(mockSwContainer.register).toHaveBeenCalledWith('foo.js');
      });

      it('should resolve once the ServiceWorker has been registered', async () => {
        const doneSpy = jasmine.createSpy('done');

        consoleInfoSpy.calls.reset();
        promise.then(doneSpy);
        callback();

        await macrotickWithMockedClock();
        await microtick();

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(doneSpy).not.toHaveBeenCalled();

        mockSwContainer.$registerDeferred.resolve();
        await macrotickWithMockedClock();
        await microtick();

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleInfoSpy).toHaveBeenCalledWith('[ServiceWorker] Registered successfully.');
        expect(doneSpy).toHaveBeenCalledWith(true);
      });

      it('should reject, if registering the ServiceWorker fails', async () => {
        const doneSpy = jasmine.createSpy('done');
        const testError = new Error('test');

        consoleInfoSpy.calls.reset();
        reversePromise(promise).then(doneSpy);
        callback();

        await macrotickWithMockedClock();
        await microtick();

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(doneSpy).not.toHaveBeenCalled();

        mockSwContainer.$registerDeferred.reject(testError);
        await macrotickWithMockedClock();
        await microtick();

        expect(consoleErrorSpy).toHaveBeenCalledWith('[ServiceWorker] Failed to register:', testError);
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(doneSpy).toHaveBeenCalledWith(testError);
      });

      it('should check for updates on the specified interval', async () => {
        callback();
        mockSwContainer.$registerDeferred.resolve();
        await promise;
        consoleInfoSpy.calls.reset();

        jasmine.clock().tick(41);
        await microtick();
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(mockSwContainer.$registration.update).not.toHaveBeenCalled();

        jasmine.clock().tick(1);
        await microtick();
        expect(consoleInfoSpy).toHaveBeenCalledWith('[ServiceWorker] Checking for updates...');
        expect(mockSwContainer.$registration.update).toHaveBeenCalledTimes(1);

        consoleInfoSpy.calls.reset();

        jasmine.clock().tick(42 * 2);
        await microtick();
        expect(consoleInfoSpy).toHaveBeenCalledWith('[ServiceWorker] Checking for updates...');
        expect(mockSwContainer.$registration.update).toHaveBeenCalledTimes(3);
      });

      it('should not check for updates, if registering the ServiceWorker fails', async () => {
        callback();
        mockSwContainer.$registerDeferred.reject('test');
        await reversePromise(promise);
        consoleInfoSpy.calls.reset();

        jasmine.clock().tick(42);
        await microtick();
        expect(consoleInfoSpy).not.toHaveBeenCalled();
        expect(mockSwContainer.$registration.update).not.toHaveBeenCalled();
      });
    });

    // Helpers
    class MockServiceWorkerContainer {
      public readonly $registration = {update: jasmine.createSpy('mockSwRegistration.update')};
      public $registerDeferred!: {resolve: () => void, reject: (err: any) => void};

      public readonly ready = Promise.resolve(this.$registration);
      public readonly register = jasmine.createSpy('mockSwContainer.register').and.callFake(() =>
        new Promise((resolve, reject) => this.$registerDeferred = {resolve, reject}));
    }
  });
});
