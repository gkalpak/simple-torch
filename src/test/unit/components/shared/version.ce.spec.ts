import {BaseCe} from '../../../../app/js/components/base.ce.js';
import {VersionCe} from '../../../../app/js/components/shared/version.ce.js';
import {getNormalizedTextContent, setupCeContainer} from '../../test-utils.js';


describe('VersionCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => VersionCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(VersionCe);

    expect(elem).toEqual(jasmine.any(VersionCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should display the current version', async () => {
    const elem = await initCe(VersionCe);
    expect(getNormalizedTextContent(elem)).toBe('v1.33.7-foo');
  });

  it('should contain a link to the corresponding commit SHA', async () => {
    const elem = await initCe(VersionCe);
    const link = elem.shadowRoot.querySelector('a')!;

    expect(link).not.toBeNull();
    expect(link.textContent!.trim()).toBe('v1.33.7-foo');
    expect(link.href).toBe('https://pro.vid.er/my/repo/commits/a1b2c3d4e5f');
    expect(link.title).toBe('SHA: a1b2c3d4e5');
  });
});
