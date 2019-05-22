import {BaseCe, IInitializedCe} from '../../../app/components/base.ce.js';
import {WIN} from '../../../app/shared/constants.js';
import {microtick, normalizeWhitespace} from '../test-utils.js';


describe('BaseCe', () => {
  beforeAll(() => {
    TestBaseCe.register();
    FancyDivCe.register();
  });

  it('should extend `HTMLElement`', () => {
    const elem = new TestBaseCe();

    expect(elem).toEqual(jasmine.any(BaseCe));
    expect(elem).toEqual(jasmine.any(HTMLElement));
  });

  describe('.tagName', () => {
    it('should be derived from the class name', () => {
      expect(BaseCe.tagName).toBe('base-ce');
      expect(TestBaseCe.tagName).toBe('test-base-ce');
      expect(FancyDivCe.tagName).toBe('fancy-div-ce');
    });
  });

  describe('.template', () => {
    it('should have a default value', () => {
      expect(TestBaseCe._template).toBe('&lt;base-ce&gt;Not implemented yet.&lt;/base-ce&gt;');
    });

    it('should support being overwritten per class', () => {
      expect(FancyDivCe._template).toBe('<div>Fancy</div>');
    });
  });

  describe('.style', () => {
    it('should have a default value', () => {
      expect(TestBaseCe._style).toBe('');
    });

    it('should support being overwritten per class', () => {
      expect(FancyDivCe._style).toBe('div { color: orange; }');
    });
  });

  describe('#clazz', () => {
    it('should reference each instance\'s constructor', () => {
      expect(new TestBaseCe()._clazz).toBe(TestBaseCe);
      expect(new FancyDivCe()._clazz).toBe(FancyDivCe);
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
      ceWhenDefinedSpy.and.returnValues(Promise.resolve('foo'), Promise.resolve('bar'));

      expect(await TestBaseCe.register() as unknown).toBe('foo');
      expect(await FancyDivCe.register() as unknown).toBe('bar');
    });
  });

  describe('#connectedCallback()', () => {
    let testElem: TestBaseCe;
    let initializeSpy: jasmine.Spy;
    let onErrorSpy: jasmine.Spy;

    beforeEach(() => {
      testElem = new TestBaseCe();
      initializeSpy = spyOn(testElem, 'initialize').and.
        returnValue(Promise.resolve(testElem as IInitializedCe<TestBaseCe>));
      onErrorSpy = spyOn(testElem, 'onError');
    });

    it('should call `initialize()`', () => {
      testElem.connectedCallback();
      expect(initializeSpy).toHaveBeenCalledWith();
    });

    it('should call `onError()` (with an appropriate message), if `initialize()` fails', async () => {
      initializeSpy.and.returnValue(Promise.reject(new Error('foo')));

      testElem.connectedCallback();
      await microtick();

      expect(onErrorSpy).toHaveBeenCalledWith(new Error('Error initializing custom element \'<test-base-ce>\': foo'));
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
      expect(attachShadowCalls[0].object).toBe(initTestBaseElem);
      expect(attachShadowCalls[1].object).toBe(initFancyDivElem);

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

  // Helpers
  class TestBaseCe extends BaseCe {
    public static get _template() { return this.template; }
    public static get _style() { return this.style; }
    public get _clazz() { return this.clazz; }

    public initialize(...args: Parameters<BaseCe['initialize']>) {
      return super.initialize(...args);
    }

    public onError(...args: Parameters<BaseCe['onError']>) {
      return super.onError(...args);
    }
  }

  class FancyDivCe extends TestBaseCe {
    public static readonly template = '<div>Fancy</div>';
    public static readonly style = 'div { color: orange; }';
  }
});
