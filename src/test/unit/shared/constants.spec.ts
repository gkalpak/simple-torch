import {EMOJI, ENV, WIN} from '../../../app/shared/constants.js';


describe('shared/constants', () => {
  describe('EMOJI', () => {
    it('should contain emojis', () => {
      expect(Object.keys(EMOJI).length).toBeGreaterThan(0);
      expect(EMOJI.noEntrySign).toBe('🚫');
    });
  });

  describe('ENV', () => {
    it('should be `window.ENV`', () => {
      expect(ENV).toEqual({production: false, version: '1.33.7-foo'});
      expect(ENV).toBe(WIN.ENV!);
    });
  });

  describe('WIN', () => {
    it('should be `window`', () => {
      expect(WIN).toBe(window);
    });
  });
});
