import {BaseCe} from '../../../../app/components/base.ce.js';
import {ContentCe} from '../../../../app/components/layout/content.ce.js';
import {setupCeContainer} from '../../test-utils.js';


describe('ContentCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => ContentCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(ContentCe);

    expect(elem).toEqual(jasmine.any(ContentCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should display a torch', async () => {
    const elem = await initCe(ContentCe);
    expect(elem.shadowRoot.innerHTML).toContain('<torch-ce></torch-ce>');
  });
});
