import {BaseCe} from '../../../../app/js/components/base.ce.js';
import {HeaderCe} from '../../../../app/js/components/layout/header.ce.js';
import {ISettings, Settings} from '../../../../app/js/shared/settings.service.js';
import {getNormalizedTextContent, setupCeContainer} from '../../test-utils.js';


describe('HeaderCe', () => {
  const initCe = setupCeContainer();

  beforeAll(() => HeaderCe.register());

  it('should extend `BaseCe`', async () => {
    const elem = await initCe(HeaderCe);

    expect(elem).toEqual(jasmine.any(HeaderCe));
    expect(elem).toEqual(jasmine.any(BaseCe));
  });

  it('should display the app name and version', async () => {
    const elem = await initCe(HeaderCe);
    const version = elem.shadowRoot.querySelector('version-ce')!;

    expect(getNormalizedTextContent(elem)).toContain('Simple Torch');
    expect(version).not.toBeNull();
  });

  it('should display the logo', async () => {
    const elem = await initCe(HeaderCe);
    const logo = elem.shadowRoot.querySelector('logo-ce')!;

    expect(logo).not.toBeNull();
  });

  it('should display a speaker volume control', async () => {
    const elem = await initCe(HeaderCe);
    const speaker = elem.shadowRoot.querySelector('external-svg-ce.speaker')!;

    expect(speaker).not.toBeNull();
    expect(speaker.getAttribute('src')).toBe('assets/images/speaker.svg');
  });

  describe('logo', () => {
    it('should be appropriately styled', async () => {
      const elem = await initCe(HeaderCe);
      const logo = elem.shadowRoot.querySelector('logo-ce')!;
      const {width, height} = logo.getBoundingClientRect();

      expect(width).toBe(25);
      expect(height).toBe(25);
    });
  });

  describe('speaker volume control', () => {
    let mockSettings: ISettings;

    // Helpers
    const initAndGetSpeaker = () => initCe(HeaderCe).
      then(elem => elem.shadowRoot.querySelector('external-svg-ce.speaker') as HTMLElement);

    beforeEach(() => {
      mockSettings = {muted: false, torchDeviceId: ''};
      spyOn(Settings, 'getInstance').and.returnValue(mockSettings);
    });

    it('should be appropriately styled', async () => {
      const speaker = await initAndGetSpeaker();
      const {width, height} = speaker.getBoundingClientRect();

      expect(width).toBe(25);
      expect(height).toBe(25);
    });

    it('should initially have the `.muted` class, iff `settings.muted` is true', async () => {
      const speaker1 = await initAndGetSpeaker();
      expect(speaker1.classList.contains('muted')).toBe(false);

      mockSettings.muted = true;

      const speaker2 = await initAndGetSpeaker();
      expect(speaker2.classList.contains('muted')).toBe(true);
    });

    it('should toggle `settings.muted` (and its `.muted` class) upon click', async () => {
      const speaker = await initAndGetSpeaker();

      expect(speaker.classList.contains('muted')).toBe(false);
      expect(mockSettings.muted).toBe(false);

      speaker.click();
      expect(speaker.classList.contains('muted')).toBe(true);
      expect(mockSettings.muted).toBe(true);

      speaker.click();
      expect(speaker.classList.contains('muted')).toBe(false);
      expect(mockSettings.muted).toBe(false);
    });
  });
});
