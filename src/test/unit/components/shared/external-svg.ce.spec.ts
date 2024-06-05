import {BaseCe, IInitializedCe} from '../../../../app/components/base.ce.js';
import {ExternalSvgCe} from '../../../../app/components/shared/external-svg.ce.js';
import {WIN} from '../../../../app/shared/constants.js';
import {getNormalizedTextContent, macrotick, macrotickWithMockedClock, setupCeContainer} from '../../test-utils.js';


describe('ExternalSvgCe', () => {
  const initCe = setupCeContainer();
  let fetchSpy: jasmine.Spy;

  beforeAll(() => TestExternalSvgCe.register());

  beforeEach(() => {
    TestExternalSvgCe.resetCache();

    fetchSpy = spyOn(WIN, 'fetch').and.callFake((url: string) =>
      Promise.resolve(new Response(`<svg><text>&lt;svg&gt;${url}&lt;/svg&gt;</text></svg>`)));
  });

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(TestExternalSvgCe, {src: '/foo'});

    expect(elem).toEqual(jasmine.any(ExternalSvgCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should throw, if `src` is missing or empty', async () => {
    const onErrorSpy = spyOn(TestExternalSvgCe.prototype, 'onError');
    const err = new Error(
        `Error initializing custom element '<${TestExternalSvgCe.tagName}>': Missing or empty 'src' attribute.`);

    await initCe(TestExternalSvgCe);
    expect(onErrorSpy).toHaveBeenCalledWith(err);

    onErrorSpy.calls.reset();

    await initCe(TestExternalSvgCe, {src: ''});
    expect(onErrorSpy).toHaveBeenCalledWith(err);
  });

  it('should load and display the specified SVG', async () => {
    const elem = await initCe(TestExternalSvgCe, {src: '/foo/bar'});
    expect(fetchSpy).toHaveBeenCalledWith('/foo/bar');

    await macrotick();  // Wait for `src` fetching to complete.
    expect(getNormalizedTextContent(elem)).toBe('<svg>/foo/bar</svg>');
  });

  it('should not load the same SVG twice', async () => {
    const elem1 = await initCe(TestExternalSvgCe, {src: '/foo/bar'});
    await macrotick();  // Wait for `src` fetching to complete.

    expect(fetchSpy).toHaveBeenCalledWith('/foo/bar');
    expect(getNormalizedTextContent(elem1)).toBe('<svg>/foo/bar</svg>');

    fetchSpy.calls.reset();
    const elem2 = await initCe(TestExternalSvgCe, {src: '/foo/bar'});
    await macrotick();  // Wait for `src` fetching to complete.

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getNormalizedTextContent(elem2)).toBe('<svg>/foo/bar</svg>');

    fetchSpy.calls.reset();
    const elem3 = await initCe(TestExternalSvgCe, {src: '/baz/qux'});
    await macrotick();  // Wait for `src` fetching to complete.

    expect(fetchSpy).toHaveBeenCalledWith('/baz/qux');
    expect(getNormalizedTextContent(elem3)).toBe('<svg>/baz/qux</svg>');
  });

  it('should forward classes from the host element to the displayed SVG', async () => {
    const elem = await initCe(TestExternalSvgCe, {class: 'foo bar', src: '/baz/qux'});
    await macrotick();  // Wait for `src` fetching to complete.

    const svg = elem.shadowRoot.querySelector('svg')!;

    expect(svg).not.toBeNull();
    expect(svg.classList.value).toBe('foo bar');

    elem.classList.remove('bar');
    expect(svg.classList.value).toBe('foo');

    elem.classList.add('baz');
    expect(svg.classList.value).toBe('foo baz');
  });

  describe('(loader)', () => {
    let fetchResolve: (body: string) => void;

    beforeEach(() => {
      fetchSpy.and.callFake((_url: string) => new Promise(resolve =>
        fetchResolve = (body: string) => resolve({text: () => body})));

      jasmine.clock().install();
    });

    afterEach(jasmine.clock().uninstall);

    it('should show a loader, if loading the SVG takes some time', async () => {
      const elem = new TestExternalSvgCe() as IInitializedCe<TestExternalSvgCe>;
      initCe(elem, {src: '/foo/bar'});

      await macrotickWithMockedClock();
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();

      jasmine.clock().tick(499);
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();

      jasmine.clock().tick(1);
      expect(elem.shadowRoot.querySelector('loader-ce')).not.toBeNull();
    });

    it('should not show a loader, if loading the SVG takes little time', async () => {
      const elem = new TestExternalSvgCe() as IInitializedCe<TestExternalSvgCe>;
      initCe(elem, {src: '/foo/bar'});

      await macrotickWithMockedClock();
      jasmine.clock().tick(499);
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();

      fetchResolve('BAZ QUX');
      await macrotickWithMockedClock();
      jasmine.clock().tick(500);
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();
    });

    it('should remove the loader, once the SVG is loaded', async () => {
      const elem = new TestExternalSvgCe() as IInitializedCe<TestExternalSvgCe>;
      initCe(elem, {src: '/foo/bar'});

      await macrotickWithMockedClock();
      jasmine.clock().tick(500);
      expect(elem.shadowRoot.querySelector('loader-ce')).not.toBeNull();

      fetchResolve('BAZ QUX');
      await macrotickWithMockedClock();
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();
    });

    it('should not show a loader, if the `no-loader` attribute is set', async () => {
      const elem = new TestExternalSvgCe() as IInitializedCe<TestExternalSvgCe>;
      initCe(elem, {'no-loader': '', src: '/foo/bar'});

      await macrotickWithMockedClock();
      jasmine.clock().tick(500);
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();

      fetchResolve('BAZ QUX');
      await macrotickWithMockedClock();
      jasmine.clock().tick(500);
      expect(elem.shadowRoot.querySelector('loader-ce')).toBeNull();
    });
  });

  // Helpers
  class TestExternalSvgCe extends ExternalSvgCe {
    public static resetCache(): void {
      this.cache.clear();
    }

    public override onError(...args: Parameters<BaseCe['onError']>) {
      return super.onError(...args);
    }
  }
});
