import {WIN} from '../../../app/shared/constants.js';
import {ISettings, Settings} from '../../../app/shared/settings.service.js';


describe('Settings', () => {
  describe('#muted', () => {
    beforeEach(() => spyOnProperty(WIN, 'localStorage', 'get').and.returnValue(new MockStorage()));

    it('should return the value stored in `localStorage.muted`', () => {
      TestSettings.storeValues({muted: true});
      const settings = new TestSettings();

      expect(settings.muted).toBe(true);
    });

    it('should use a fallback value if `localStorage.muted` is not set', () => {
      const settings = new TestSettings();
      expect(settings.muted).toBe(false);
    });

    it('should correctly return falsy values', () => {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      TestSettings.storeValues({muted: null as any});
      const settings = new TestSettings();

      expect(settings.muted).toBeNull();

      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      settings.muted = undefined as any;
      expect(settings.muted).toBeUndefined();
    });

    it('should store the value to `localStorage.muted`', () => {
      const settings = new TestSettings();
      expect(TestSettings.retrieveValues()).toEqual({});

      settings.muted = true;
      expect(settings.muted).toBe(true);
      expect(TestSettings.retrieveValues()).toEqual({muted: true});

      settings.muted = false;
      expect(settings.muted).toBe(false);
      expect(TestSettings.retrieveValues()).toEqual({muted: false});
    });
  });

  describe('.getInstance()', () => {
    it('should return a `Settings` instance', () => {
      expect(Settings.getInstance()).toEqual(jasmine.any(Settings));
    });

    it('should return the same instance on subsequent calls', () => {
      const instance1 = Settings.getInstance();
      const instance2 = Settings.getInstance();

      expect(instance2).toBe(instance1);
    });
  });

  // Helpers
  class MockStorage implements Storage {
    public get length(): never { return this.notImplemented(); }

    public clear(): never { return this.notImplemented(); }
    public getItem(): never { return this.notImplemented(); }
    public key(): never { return this.notImplemented(); }
    public removeItem(): never { return this.notImplemented(); }
    public setItem(): never { return this.notImplemented(); }

    protected notImplemented(): never {
      throw new Error('[MockStorage] Method not implemented.');
    }
  }

  class TestSettings extends Settings {
    constructor() { super(); }
    public static retrieveValues(): Partial<ISettings> { return super.retrieveValues(); }
    public static storeValues(values: Partial<ISettings>): void { super.storeValues(values); }
  }
});
