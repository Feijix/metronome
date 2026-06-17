import { ClaveSynthesizer } from './synthesizers/ClaveSynthesizer.js';
import { DigitalSynthesizer } from './synthesizers/DigitalSynthesizer.js';
import { RimshotSynthesizer } from './synthesizers/RimshotSynthesizer.js';
import { AgogoSynthesizer } from './synthesizers/AgogoSynthesizer.js';
import { HiHatSynthesizer } from './synthesizers/HiHatSynthesizer.js';
import { KickSynthesizer } from './synthesizers/KickSynthesizer.js';
import { CowbellSynthesizer } from './synthesizers/CowbellSynthesizer.js';

/**
 * Factory class for creating audio synthesizers based on sound type
 * Returns synthesizer instances that implement playAccent(), playQuarter(), and playSubdivision()
 */
export class SoundFactory {
  /**
   * Creates and returns a synthesizer for the specified sound type
   * @param {string} soundType - The type of sound ('clave', 'digital', 'rimshot', etc.)
   * @param {AudioContext} audioContext - Web Audio API context
   * @returns {Object} Synthesizer instance with playAccent, playQuarter, playSubdivision methods
   */
  static createSynthesizer(soundType, audioContext) {
    switch (soundType) {
      case 'clave':
        return new ClaveSynthesizer(audioContext);
      case 'digital':
        return new DigitalSynthesizer(audioContext);
      case 'rimshot':
        return new RimshotSynthesizer(audioContext);
      case 'agogo':
        return new AgogoSynthesizer(audioContext);
      case 'hihat':
        return new HiHatSynthesizer(audioContext);
      case 'kick':
        return new KickSynthesizer(audioContext);
      case 'cowbell':
        return new CowbellSynthesizer(audioContext);
      default:
        // Fallback to clave if invalid sound type
        console.warn(`Unknown sound type: ${soundType}, falling back to clave`);
        return new ClaveSynthesizer(audioContext);
    }
  }
}
