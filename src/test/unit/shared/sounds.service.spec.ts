import {WIN} from '../../../app/js/shared/constants.js';
import {Sounds} from '../../../app/js/shared/sounds.service.js';


describe('Sounds', () => {
  describe('.getInstance()', () => {
    it('should return a `Sounds` instance', () => {
      expect(Sounds.getInstance()).toEqual(jasmine.any(Sounds));
    });

    it('should return the same instance on subsequent calls', () => {
      const instance1 = Sounds.getInstance();
      const instance2 = Sounds.getInstance();

      expect(instance2).toBe(instance1);
    });
  });

  describe('#getSound()', () => {
    // Helpers
    const srcFor = (path: string) => new URL(path, WIN.location.origin).href;

    it('should return an `HTMLAudioElement`', () => {
      const sounds = Sounds.getInstance();
      const sound = sounds.getSound('dummy/foo/bar');

      expect(sound).toEqual(jasmine.any(HTMLAudioElement));
      expect(sound.src).toBe(srcFor('dummy/foo/bar'));
    });

    it('should set the specified volume', () => {
      const sounds = Sounds.getInstance();
      const sound = sounds.getSound('dummy/foo/bar', 0.42);

      expect(sound.volume).toBe(0.42);
    });

    it('should set volume to 1 by default', () => {
      const sounds = Sounds.getInstance();
      const sound = sounds.getSound('dummy/foo/bar');

      expect(sound.volume).toBe(1);
    });

    it('should not create a new `HTMLAudioElement` if one already exists (for the same `src` and `volume`)', () => {
      const sounds = Sounds.getInstance();

      // Same source, same volume.
      const sound1 = sounds.getSound('dummy/foo/bar');
      const sound2 = sounds.getSound('dummy/foo/bar', 1);

      expect(sound1).toEqual(jasmine.objectContaining({src: srcFor('dummy/foo/bar'), volume: 1}));
      expect(sound2).toBe(sound1);

      // Same source, different volume.
      const sound3 = sounds.getSound('dummy/foo/bar', 0.42);

      expect(sound3).toEqual(jasmine.objectContaining({src: srcFor('dummy/foo/bar'), volume: 0.42}));
      expect(sound3).not.toBe(sound1);

      // Different source, same volume.
      const sound4 = sounds.getSound('dummy/baz/qux');
      const sound5 = sounds.getSound('dummy/baz/qux', 1);

      expect(sound4).toEqual(jasmine.objectContaining({src: srcFor('dummy/baz/qux'), volume: 1}));
      expect(sound5).toBe(sound4);
      expect(sound5).not.toBe(sound3);
      expect(sound5).not.toBe(sound1);

      // Different source, different volume.
      const sound6 = sounds.getSound('dummy/baz/qux', 0.42);

      expect(sound6).toEqual(jasmine.objectContaining({src: srcFor('dummy/baz/qux'), volume: 0.42}));
      expect(sound6).not.toBe(sound4);
      expect(sound6).not.toBe(sound3);
      expect(sound6).not.toBe(sound1);
    });
  });
});
