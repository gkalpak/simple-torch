import {BaseCe} from '../../../../app/js/components/base.ce.js';
import {LogoCe} from '../../../../app/js/components/shared/logo.ce.js';
import {WIN} from '../../../../app/js/shared/constants.js';
import {setupCeContainer} from '../../test-utils.js';


describe('LogoCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => LogoCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(LogoCe);

    expect(elem).toEqual(jasmine.any(LogoCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should be appropriately styled', async () => {
    const elem = await initCe(LogoCe);
    const style = WIN.getComputedStyle(elem);

    expect(style.cursor).toBe('pointer');
  });

  it('should display a simple torch', async () => {
    const elem = await initCe(LogoCe);
    const torch = elem.shadowRoot.querySelector<HTMLUnknownElement>('external-svg-ce')!;

    expect(torch).not.toBeNull();
    expect(torch.getAttribute('src')).toBe('assets/images/simple-torch.svg');
  });

  it('should toggle `.off` when clicking on the torch', async () => {
    const elem = await initCe(LogoCe);
    const torch = elem.shadowRoot.querySelector<HTMLUnknownElement>('external-svg-ce')!;

    expect(torch.classList.contains('off')).toBe(false);

    torch.click();
    expect(torch.classList.contains('off')).toBe(true);

    torch.click();
    expect(torch.classList.contains('off')).toBe(false);

    torch.click();
    expect(torch.classList.contains('off')).toBe(true);
  });
});
