import { TestFramework, Assert } from '../lib/test-framework.js';
import { SoundFactory } from '../../js/core/audio/SoundFactory.js';
import { ClaveSynthesizer } from '../../js/core/audio/synthesizers/ClaveSynthesizer.js';
import { DigitalSynthesizer } from '../../js/core/audio/synthesizers/DigitalSynthesizer.js';
import { RimshotSynthesizer } from '../../js/core/audio/synthesizers/RimshotSynthesizer.js';
import { AgogoSynthesizer } from '../../js/core/audio/synthesizers/AgogoSynthesizer.js';
import { HiHatSynthesizer } from '../../js/core/audio/synthesizers/HiHatSynthesizer.js';
import { KickSynthesizer } from '../../js/core/audio/synthesizers/KickSynthesizer.js';
import { CowbellSynthesizer } from '../../js/core/audio/synthesizers/CowbellSynthesizer.js';
import { SOUND_TYPES } from '../../js/config/constants.js';

export function registerAudioSynthesisTests(test) {
  test.describe('Audio Synthesis', () => {
    let audioContext;

    // Mock AudioContext for testing
    const createMockAudioContext = () => {
      return {
        currentTime: 0,
        destination: {},
        sampleRate: 44100,
        createOscillator: () => ({
          type: 'sine',
          frequency: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            linearRampToValueAtTime: () => {}
          },
          connect: function() { return this; },
          start: () => {},
          stop: () => {}
        }),
        createGain: () => ({
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
            linearRampToValueAtTime: () => {}
          },
          connect: function() { return this; }
        }),
        createBiquadFilter: () => ({
          type: 'highpass',
          frequency: {
            setValueAtTime: () => {}
          },
          Q: {
            setValueAtTime: () => {}
          },
          connect: function() { return this; }
        }),
        createBuffer: (channels, length, sampleRate) => ({
          getChannelData: (channel) => new Float32Array(length)
        }),
        createBufferSource: () => ({
          buffer: null,
          connect: function() { return this; },
          start: () => {},
          stop: () => {}
        })
      };
    };

    test.it('SoundFactory creates correct synthesizer for each sound type', () => {
      audioContext = createMockAudioContext();

      const clave = SoundFactory.createSynthesizer('clave', audioContext);
      Assert.isTrue(clave instanceof ClaveSynthesizer);

      const digital = SoundFactory.createSynthesizer('digital', audioContext);
      Assert.isTrue(digital instanceof DigitalSynthesizer);

      const rimshot = SoundFactory.createSynthesizer('rimshot', audioContext);
      Assert.isTrue(rimshot instanceof RimshotSynthesizer);

      const agogo = SoundFactory.createSynthesizer('agogo', audioContext);
      Assert.isTrue(agogo instanceof AgogoSynthesizer);

      const hihat = SoundFactory.createSynthesizer('hihat', audioContext);
      Assert.isTrue(hihat instanceof HiHatSynthesizer);

      const kick = SoundFactory.createSynthesizer('kick', audioContext);
      Assert.isTrue(kick instanceof KickSynthesizer);

      const cowbell = SoundFactory.createSynthesizer('cowbell', audioContext);
      Assert.isTrue(cowbell instanceof CowbellSynthesizer);
    });

    test.it('SoundFactory falls back to ClaveSynthesizer for invalid type', () => {
      audioContext = createMockAudioContext();

      const fallback = SoundFactory.createSynthesizer('invalid', audioContext);
      Assert.isTrue(fallback instanceof ClaveSynthesizer);
    });

    test.it('All synthesizers have required methods', () => {
      audioContext = createMockAudioContext();

      SOUND_TYPES.forEach(soundType => {
        const synth = SoundFactory.createSynthesizer(soundType, audioContext);

        Assert.isDefined(synth.playAccent);
        Assert.isTrue(typeof synth.playAccent === 'function');

        Assert.isDefined(synth.playQuarter);
        Assert.isTrue(typeof synth.playQuarter === 'function');

        Assert.isDefined(synth.playSubdivision);
        Assert.isTrue(typeof synth.playSubdivision === 'function');
      });
    });

    test.it('ClaveSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new ClaveSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('DigitalSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new DigitalSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('RimshotSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new RimshotSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('AgogoSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new AgogoSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('HiHatSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new HiHatSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('KickSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new KickSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('CowbellSynthesizer can be instantiated', () => {
      audioContext = createMockAudioContext();
      const synth = new CowbellSynthesizer(audioContext);

      Assert.isDefined(synth.context);
      Assert.equal(synth.context, audioContext);
    });

    test.it('Synthesizer methods can be called without errors', () => {
      audioContext = createMockAudioContext();

      SOUND_TYPES.forEach(soundType => {
        const synth = SoundFactory.createSynthesizer(soundType, audioContext);

        // These should not throw errors
        synth.playAccent(0);
        synth.playQuarter(0);
        synth.playSubdivision(0);
      });

      // If we get here, no errors were thrown
      Assert.isTrue(true);
    });
  });
}
