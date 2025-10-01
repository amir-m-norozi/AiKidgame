// Sound Manager for the chocolate packing game
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private isMuted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    this.initializeAudio();
    this.loadSounds();
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported, falling back to HTML5 audio');
    }
  }

  private loadSounds() {
    // Create simple sound effects using Web Audio API
    this.createBeepSound('success', 800, 0.2, 'sine');
    this.createBeepSound('error', 300, 0.3, 'sawtooth');
    this.createBeepSound('click', 600, 0.1, 'square');
    this.createBeepSound('drop', 500, 0.15, 'triangle');
    this.createBeepSound('color', 1000, 0.25, 'sine');
    this.createBeepSound('complete', 1200, 0.4, 'sine');
  }

  private createBeepSound(name: string, frequency: number, duration: number, type: OscillatorType) {
    // Create a simple beep sound using Web Audio API
    const playSound = () => {
      if (!this.audioContext || this.isMuted) return;

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    };

    this.sounds[name] = {
      play: playSound,
      pause: () => {},
      currentTime: 0,
      duration: duration,
      volume: 1
    } as any;
  }

  // Play sound effects
  playSuccess() {
    this.playSound('success');
  }

  playError() {
    this.playSound('error');
  }

  playClick() {
    this.playSound('click');
  }

  playDrop() {
    this.playSound('drop');
  }

  playColor() {
    this.playSound('color');
  }

  playComplete() {
    this.playSound('complete');
    // Play a little melody for completion
    setTimeout(() => this.playSound('success'), 200);
    setTimeout(() => this.playSound('color'), 400);
    setTimeout(() => this.playSound('complete'), 600);
  }

  private playSound(soundName: string) {
    if (this.sounds[soundName] && !this.isMuted) {
      try {
        this.sounds[soundName].play();
      } catch (error) {
        console.warn(`Could not play sound: ${soundName}`, error);
      }
    }
  }

  // Volume control
  setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
  }

  getVolume(): number {
    return this.volume;
  }

  // Mute control
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  isSoundMuted(): boolean {
    return this.isMuted;
  }

  // Background music simulation (simple loop)
  startBackgroundMusic() {
    // This would be implemented with actual music files
    console.log('🎵 Background music started');
  }

  stopBackgroundMusic() {
    console.log('🔇 Background music stopped');
  }

  // Voice feedback for children
  playVoiceFeedback(message: string) {
    // This would use text-to-speech or pre-recorded voice files
    if ('speechSynthesis' in window && !this.isMuted) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'fa-IR'; // Persian language
      utterance.rate = 0.8; // Slower for children
      utterance.pitch = 1.2; // Higher pitch for child-friendly voice
      utterance.volume = this.volume;
      
      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn('Speech synthesis failed:', error);
      }
    }
  }

  // Create ambient sounds
  playAmbientSound(type: 'celebration' | 'magic' | 'sparkle') {
    switch (type) {
      case 'celebration':
        this.playComplete();
        break;
      case 'magic':
        this.playSound('color');
        break;
      case 'sparkle':
        this.playSound('success');
        break;
    }
  }

  // Cleanup
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Create a singleton instance
const soundManager = new SoundManager();

export default soundManager;

// Helper functions for common sound effects
export const playSuccessSound = () => soundManager.playSuccess();
export const playErrorSound = () => soundManager.playError();
export const playClickSound = () => soundManager.playClick();
export const playDropSound = () => soundManager.playDrop();
export const playColorSound = () => soundManager.playColor();
export const playCompleteSound = () => soundManager.playComplete();
export const playVoiceMessage = (message: string) => soundManager.playVoiceFeedback(message);
export const playAmbientAudio = (type: 'celebration' | 'magic' | 'sparkle') => soundManager.playAmbientSound(type);