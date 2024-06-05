import {BaseCe, IInitializedCe} from '../../../app/components/base.ce.js';
import {WIN} from '../../../app/shared/constants.js';
import {Utils} from '../../../app/shared/utils.service.js';
import {microtick, normalizeWhitespace} from '../test-utils.js';


describe('BaseCe', () => {
  beforeAll(() => Promise.all([
    TestBaseCe.register(),
    FancyDivCe.register(),
  ]));

  it('should extend `HTMLElement`', () => {
    const elem = new TestBaseCe();

    expect(elem).toEqual(jasmine.any(BaseCe));
    expect(elem).toEqual(jasmine.any(HTMLElement));
  });

  describe('.tagName', () => {
    let pascalToKebabCaseSpy: jasmine.Spy;

    beforeEach(() => pascalToKebabCaseSpy = spyOn(Utils.getInstance(), 'pascalToKebabCase').and.callThrough());

    it('should be derived from the class name', () => {
      expect(BaseCe.tagName).toBe('base-ce');
      expect(pascalToKebabCaseSpy).toHaveBeenCalledWith(BaseCe.name);

      expect(TestBaseCe.tagName).toBe('test-base-ce');
      expect(pascalToKebabCaseSpy).toHaveBeenCalledWith(TestBaseCe.name);

      expect(FancyDivCe.tagName).toBe('fancy-div-ce');
      expect(pascalToKebabCaseSpy).toHaveBeenCalledWith(FancyDivCe.name);
    });
  });

  describe('.template', () => {
    it('should have a default value', () => {
      expect(TestBaseCe.template).toBe('&lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;');
    });

    it('should support being overwritten per class', () => {
      expect(FancyDivCe.template).toBe('<div>Fancy</div>');
    });
  });

  describe('.style', () => {
    it('should have a default value', () => {
      expect(TestBaseCe.style).toBe('');
    });

    it('should support being overwritten per class', () => {
      expect(FancyDivCe.style).toBe('div { color: orange; }');
    });
  });

  describe('#clazz', () => {
    it('should reference each instance\'s constructor', () => {
      expect(new TestBaseCe().clazz).toBe(TestBaseCe);
      expect(new FancyDivCe().clazz).toBe(FancyDivCe);
    });
  });

  describe('.register()', () => {
    let ceDefineSpy: jasmine.Spy;
    let ceWhenDefinedSpy: jasmine.Spy;

    beforeEach(() => {
      ceDefineSpy = spyOn(WIN.customElements, 'define');
      ceWhenDefinedSpy = spyOn(WIN.customElements, 'whenDefined');
    });

    it('should register the custom element', () => {
      TestBaseCe.register();
      expect(ceDefineSpy).toHaveBeenCalledWith('test-base-ce', TestBaseCe);

      FancyDivCe.register();
      expect(ceDefineSpy).toHaveBeenCalledWith('fancy-div-ce', FancyDivCe);
    });

    it('should return a promise that resolves when the element is defined', async () => {
      expect(ceWhenDefinedSpy).not.toHaveBeenCalled();

      await TestBaseCe.register();
      expect(ceWhenDefinedSpy).toHaveBeenCalledWith(TestBaseCe.tagName);

      await FancyDivCe.register();
      expect(ceWhenDefinedSpy).toHaveBeenCalledWith(FancyDivCe.tagName);
    });
  });

  describe('#connectedCallback()', () => {
    let testElem: TestBaseCe;
    let initializeSpy: jasmine.Spy;
    let onErrorSpy: jasmine.Spy;

    beforeEach(() => {
      testElem = new TestBaseCe();
      initializeSpy = spyOn(testElem, 'initialize').and.resolveTo(testElem as IInitializedCe<TestBaseCe>);
      onErrorSpy = spyOn(testElem, 'onError');
    });

    it('should call `initialize()`', () => {
      testElem.connectedCallback();
      expect(initializeSpy).toHaveBeenCalledWith();
    });

    it('should call `onError()` (with an appropriate message), if `initialize()` fails', async () => {
      initializeSpy.and.rejectWith(new Error('foo'));

      testElem.connectedCallback();
      await microtick();

      expect(onErrorSpy).toHaveBeenCalledWith(new Error('Error initializing custom element \'<test-base-ce>\': foo'));
    });
  });

  describe('#disconnectedCallback()', () => {
    let testElem: TestBaseCe;
    let cleanUpLog: number[];
    let consoleErrorSpy: jasmine.Spy;
    let onErrorSpy: jasmine.Spy;
    let cleanUpSpies: readonly [jasmine.Spy, jasmine.Spy, jasmine.Spy];

    beforeEach(() => {
      testElem = new TestBaseCe();
      cleanUpLog = [];

      onErrorSpy = spyOn(testElem, 'onError');
      consoleErrorSpy = spyOn(console, 'error');
      cleanUpSpies = [
        jasmine.createSpy('cleanUp1').and.callFake(() => cleanUpLog.push(1)),
        jasmine.createSpy('cleanUp2').and.callFake(() => cleanUpLog.push(2)),
        jasmine.createSpy('cleanUp3').and.callFake(() => cleanUpLog.push(3)),
      ];

      testElem.cleanUpFns.push(...cleanUpSpies);
    });

    it('should mark the element as `cleaned up`, so it cannot be re-used', async () => {
      expect(() => testElem.connectedCallback()).not.toThrow();
      expect(() => testElem.connectedCallback()).not.toThrow();

      testElem.disconnectedCallback();

      expect(() => testElem.connectedCallback()).toThrowError(
          'Trying to re-use already disposed custom element \'<test-base-ce>\'. ' +
          'Once \'<test-base-ce>\' elements are removed from the DOM, they cannot be re-inserted.');
    });

    it('should call the clean-up functions in reverse order', () => {
      testElem.disconnectedCallback();
      expect(cleanUpLog).toEqual([3, 2, 1]);
    });

    it('should empty the list clean-up functions', () => {
      expect(testElem.cleanUpFns.length).toBeGreaterThan(0);

      testElem.disconnectedCallback();
      expect(testElem.cleanUpFns.length).toBe(0);
    });

    it('should call dynamically added clean-up functions', () => {
      cleanUpSpies[1].and.callFake(() => {
        cleanUpLog.push(2);
        testElem.cleanUpFns.push(() => cleanUpLog.push(4));
      });

      testElem.disconnectedCallback();

      expect(cleanUpLog).toEqual([3, 2, 4, 1]);
      expect(testElem.cleanUpFns.length).toBe(0);
    });

    it('should call all clean-up functions, even if some fail', () => {
      cleanUpSpies[1].and.throwError('`cleanUp2()` failed');
      testElem.disconnectedCallback();

      expect(cleanUpLog).toEqual([3, 1]);
      expect(testElem.cleanUpFns.length).toBe(0);
    });

    it('should log appropriate error message, but not call `onError()`', () => {
      cleanUpSpies[1].and.throwError('`cleanUp2()` failed');
      testElem.disconnectedCallback();

      expect(onErrorSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
          new Error('Error cleaning up custom element \'<test-base-ce>\': `cleanUp2()` failed'));
    });
  });

  describe('#initialize()', () => {
    it('should return the element instance (even if already initialized)', async () => {
      const testBaseElem = new TestBaseCe();
      const fancyDivElem = new FancyDivCe();

      expect(await testBaseElem.initialize()).toBe(testBaseElem as IInitializedCe<TestBaseCe>);
      expect(await fancyDivElem.initialize()).toBe(fancyDivElem as IInitializedCe<FancyDivCe>);

      expect(await testBaseElem.initialize()).toBe(testBaseElem as IInitializedCe<TestBaseCe>);
      expect(await fancyDivElem.initialize()).toBe(fancyDivElem as IInitializedCe<FancyDivCe>);
    });

    it('should initialize the element\'s ShadowDOM with its template, styles and default styles', async () => {
      const testBaseElem = new TestBaseCe();
      const fancyDivElem = new FancyDivCe();

      expect(testBaseElem.shadowRoot).toBeNull();
      expect(fancyDivElem.shadowRoot).toBeNull();

      const initTestBaseElem = await testBaseElem.initialize();
      const initFancyDivElem = await fancyDivElem.initialize();

      expect(initTestBaseElem.shadowRoot).not.toBeNull();
      expect(initFancyDivElem.shadowRoot).not.toBeNull();

      expect(normalizeWhitespace(initTestBaseElem.shadowRoot.innerHTML)).toBe(normalizeWhitespace(`
        <style>
          :host {
            all: initial;
            color: inherit;
            contain: content;
            display: block;
            font-family: inherit;
          }
        </style>
        &lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;
      `));
      expect(normalizeWhitespace(initFancyDivElem.shadowRoot.innerHTML)).toBe(normalizeWhitespace(`
        <style>
          :host {
            all: initial;
            color: inherit;
            contain: content;
            display: block;
            font-family: inherit;
          }
          div { color: orange; }
        </style>
        <div>Fancy</div>
      `));
    });

    it('should do nothing, if already initialized', async () => {
      const attachShadowSpy = spyOn(TestBaseCe.prototype, 'attachShadow').and.callThrough();

      const initTestBaseElem = await new TestBaseCe().initialize();
      const initFancyDivElem = await new FancyDivCe().initialize();
      const attachShadowCalls = attachShadowSpy.calls.all();

      expect(attachShadowCalls.length).toBe(2);
      expect(attachShadowCalls[0]!.object).toBe(initTestBaseElem);
      expect(attachShadowCalls[1]!.object).toBe(initFancyDivElem);

      attachShadowSpy.calls.reset();
      initTestBaseElem.shadowRoot.innerHTML = 'FOO';
      initFancyDivElem.shadowRoot.innerHTML = 'BAR';

      await initTestBaseElem.initialize();
      await initFancyDivElem.initialize();

      expect(attachShadowSpy).not.toHaveBeenCalled();
      expect(initTestBaseElem.shadowRoot.innerHTML).toBe('FOO');
      expect(initFancyDivElem.shadowRoot.innerHTML).toBe('BAR');
    });
  });

  describe('#onError()', () => {
    let testElem: TestBaseCe;
    let consoleErrorSpy: jasmine.Spy;
    let windowAlertSpy: jasmine.Spy;

    beforeEach(() => {
      testElem = new TestBaseCe();
      consoleErrorSpy = spyOn(console, 'error');
      windowAlertSpy = spyOn(WIN, 'alert');
    });

    it('should log the error', () => {
      const err = new Error('foo');
      testElem.onError(err);

      expect(consoleErrorSpy).toHaveBeenCalledWith(err);
    });

    it('should alert about the error', () => {
      const err = new Error('foo');
      testElem.onError(err);

      expect(windowAlertSpy).toHaveBeenCalledWith('ERROR: foo');
    });
  });

  // Helpers
  class TestBaseCe extends BaseCe {
    declare public static readonly template: typeof BaseCe.template;
    declare public static readonly style: typeof BaseCe.style;
    declare public readonly clazz: BaseCe['clazz'];
    declare public readonly cleanUpFns: BaseCe['cleanUpFns'];

    public override initialize(...args: Parameters<BaseCe['initialize']>) {
      return super.initialize(...args);
    }

    public override onError(...args: Parameters<BaseCe['onError']>) {
      return super.onError(...args);
    }
  }

  class FancyDivCe extends TestBaseCe {
    public static override readonly template = '<div>Fancy</div>';
    public static override readonly style = 'div { color: orange; }';
  }
});
