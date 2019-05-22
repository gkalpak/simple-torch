import {ENV, WIN} from '../../../app/shared/constants.js';


describe('shared/constants', () => {
  describe('ENV', () => {
    it('should be `window.ENV`', () => {
      expect(ENV).toEqual({version: '1.33.7-foo'});
      expect(ENV).toBe(WIN.ENV!);
    });
  });

  describe('WIN', () => {
    it('should be `window`', () => {
      expect(WIN).toBe(window);
    });
  });
});
