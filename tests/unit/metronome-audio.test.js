import { TestFramework, Assert } from '../lib/test-framework.js';
import { MetronomeAudio } from '../../js/core/MetronomeAudio.js';
import { AUDIO_CONSTANTS, DEFAULT_SOUND } from '../../js/config/constants.js';

export function registerMetronomeAudioTests(test) {
  test.describe('MetronomeAudio', () => {
    let audio;

    test.it('initializes without AudioContext', () => {
      audio = new MetronomeAudio();
      Assert.isNull(audio.audioContext);
      Assert.isFalse(audio.isInitialized);
    });

    test.it('init creates AudioContext', () => {
      audio = new MetronomeAudio();
      audio.init();

      Assert.isNotNull(audio.audioContext);
      Assert.isTrue(audio.isInitialized);
    });

    test.it('init is idempotent', () => {
      audio = new MetronomeAudio();
      audio.init();
      const firstContext = audio.audioContext;

      audio.init();
      Assert.equal(audio.audioContext, firstContext);
    });

    test.it('setSoundType updates sound type and ignores unknown ones', () => {
      audio = new MetronomeAudio();
      audio.setSoundType('digital');
      Assert.equal(audio.soundType, 'digital');
      audio.setSoundType('rimshot'); // removed synth: ignored
      Assert.equal(audio.soundType, 'digital');
    });

    test.it('setSoundType creates a sample player after init', () => {
      audio = new MetronomeAudio();
      audio.init();
      audio.setSoundType('cowbell');
      Assert.equal(audio.soundType, 'cowbell');
      Assert.isTrue(audio.players.has('cowbell'));
    });

    test.it('default sound type is the configured default', () => {
      audio = new MetronomeAudio();
      Assert.equal(audio.soundType, DEFAULT_SOUND);
    });

    test.it('playClick is a silent no-op until the sample is decoded', () => {
      audio = new MetronomeAudio();
      audio.init();
      Assert.isTrue(audio.players.has(audio.soundType));
      Assert.equal(audio.playClick('downbeat', audio.currentTime + 0.1), undefined);
    });

    test.it('currentTime returns 0 when not initialized', () => {
      audio = new MetronomeAudio();
      Assert.equal(audio.currentTime, 0);
    });

    test.it('currentTime returns AudioContext time when initialized', () => {
      audio = new MetronomeAudio();
      audio.init();

      // AudioContext.currentTime starts at 0 or greater
      Assert.isTrue(audio.currentTime >= 0);
      Assert.isTrue(typeof audio.currentTime === 'number');
    });

    test.it('playClick does nothing when not initialized', () => {
      audio = new MetronomeAudio();
      // Should not throw
      audio.playClick('downbeat');
      Assert.isTrue(true);
    });

    test.it('cleanup clears AudioContext', () => {
      audio = new MetronomeAudio();
      audio.init();

      Assert.isNotNull(audio.audioContext);

      audio.cleanup();

      Assert.isNull(audio.audioContext);
      Assert.isFalse(audio.isInitialized);
    });

    test.it('cleanup is safe when not initialized', () => {
      audio = new MetronomeAudio();
      // Should not throw
      audio.cleanup();
      Assert.isTrue(true);
    });
  });
}
