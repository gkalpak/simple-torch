import {BaseCe} from '../../../../app/js/components/base.ce.js';
import {FlexSpacerCe} from '../../../../app/js/components/shared/flex-spacer.ce.js';
import {WIN} from '../../../../app/js/shared/constants.js';
import {getNormalizedTextContent, setupCeContainer} from '../../test-utils.js';


describe('FlexSpacerCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => FlexSpacerCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(FlexSpacerCe);

    expect(elem).toEqual(jasmine.any(FlexSpacerCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should have no content', async () => {
    const elem = await initCe(FlexSpacerCe);
    expect(getNormalizedTextContent(elem)).toBe('');
  });

  it('should be appropriately styled', async () => {
    const elem = await initCe(FlexSpacerCe);
    const style = WIN.getComputedStyle(elem);

    expect(style.flexBasis).toBe('0px');
    expect(style.flexGrow).toBe('1');
    expect(style.flexShrink).toBe('1');
  });
});
