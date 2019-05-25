import {BaseCe} from '../../../../app/components/base.ce.js';
import {LoaderCe} from '../../../../app/components/shared/loader.ce.js';
import {setupCeContainer} from '../../test-utils.js';


describe('LoaderCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => LoaderCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(LoaderCe);

    expect(elem).toEqual(jasmine.any(LoaderCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should display a loader', async () => {
    const elem = await initCe(LoaderCe);
    const loader = elem.shadowRoot.querySelector<HTMLUnknownElement>('external-svg-ce')!;

    expect(loader).not.toBeNull();
    expect(loader.getAttribute('src')).toBe('/assets/images/loader.svg');
  });
});
