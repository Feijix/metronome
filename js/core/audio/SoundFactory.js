import { DigitalSynthesizer }    from './synthesizers/DigitalSynthesizer.js';
import { MechanicalSynthesizer } from './synthesizers/MechanicalSynthesizer.js';
import { DrumstickSynthesizer }  from './synthesizers/DrumstickSynthesizer.js';
import { VibrateSynthesizer }    from './synthesizers/VibrateSynthesizer.js';

export class SoundFactory {
  static createSynthesizer(soundType, audioContext) {
    switch (soundType) {
      case 'digital':    return new DigitalSynthesizer(audioContext);
      case 'mechanical': return new MechanicalSynthesizer(audioContext);
      case 'drumstick':  return new DrumstickSynthesizer(audioContext);
      case 'vibrate':    return new VibrateSynthesizer(audioContext);
      default:
        console.warn(`Unknown sound type: ${soundType}, falling back to mechanical`);
        return new MechanicalSynthesizer(audioContext);
    }
  }
}
