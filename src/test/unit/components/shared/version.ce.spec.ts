import {BaseCe} from '../../../../app/components/base.ce.js';
import {VersionCe} from '../../../../app/components/shared/version.ce.js';
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
});
