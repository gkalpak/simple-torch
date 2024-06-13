import {BaseCe} from '../../../../app/js/components/base.ce.js';
import {FooterCe} from '../../../../app/js/components/layout/footer.ce.js';
import {getNormalizedTextContent, setupCeContainer} from '../../test-utils.js';


describe('FooterCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => FooterCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(FooterCe);

    expect(elem).toEqual(jasmine.any(FooterCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should display a copyright notice', async () => {
    const elem = await initCe(FooterCe);
    expect(getNormalizedTextContent(elem)).toBe('Copyright © 2019 @gkalpak. All rights reserved.');
  });

  it('should contain a link to gkalpak\'s GitHub profile', async () => {
    const elem = await initCe(FooterCe);
    const link = elem.shadowRoot.querySelector('a')!;

    expect(link).not.toBeNull();
    expect(link.textContent).toBe('@gkalpak');
    expect(link.href).toBe('https://github.com/gkalpak');
  });
});
