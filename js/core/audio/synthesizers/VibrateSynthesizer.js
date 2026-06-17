// No audio output. Haptic feedback is handled by MetronomeScheduler
// with increased durations when soundType === 'vibrate'.
export class VibrateSynthesizer {
  constructor(audioContext) {
    this.context = audioContext;
  }

  playAccent() {}
  playQuarter() {}
  playSubdivision() {}
}
