import { TestFramework, Assert } from '../lib/test-framework.js';
import { MetronomeAudio } from '../../js/core/MetronomeAudio.js';
import { AUDIO_CONSTANTS } from '../../js/config/constants.js';

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

    test.it('setSoundType updates sound type', () => {
      audio = new MetronomeAudio();

      audio.setSoundType('digital');
      Assert.equal(audio.soundType, 'digital');

      audio.setSoundType('rimshot');
      Assert.equal(audio.soundType, 'rimshot');
    });

    test.it('setSoundType updates synthesizer after init', () => {
      audio = new MetronomeAudio();
      audio.init();

      audio.setSoundType('kick');

      Assert.isNotNull(audio.currentSynthesizer);
      Assert.equal(audio.soundType, 'kick');
    });

    test.it('default sound type is clave', () => {
      audio = new MetronomeAudio();
      Assert.equal(audio.soundType, 'clave');
    });

    test.it('synthesizer is created on init', () => {
      audio = new MetronomeAudio();
      audio.init();

      Assert.isNotNull(audio.currentSynthesizer);
      Assert.isDefined(audio.currentSynthesizer.playAccent);
      Assert.isDefined(audio.currentSynthesizer.playQuarter);
      Assert.isDefined(audio.currentSynthesizer.playSubdivision);
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
