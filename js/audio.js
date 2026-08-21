/**
 * Web Audio API & Audio Asset Sound Effects Manager
 * Plays interactive sound effects using assets/sounds/Enter & Back.wav with Web Audio API / Audio fallback
 */
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastTickTime = 0;
    this.soundUrl = 'assets/sounds/Enter%20%26%20Back.wav';
    this.clickBuffer = null;
    this.loadingBuffer = false;
    this.audioElement = null;

    try {
      this.audioElement = new Audio(this.soundUrl);
      this.audioElement.preload = 'auto';
    } catch (e) {}
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Preload & decode audio file for zero-latency polyphonic playback
    if (this.ctx && !this.clickBuffer && !this.loadingBuffer) {
      this.loadingBuffer = true;
      fetch(this.soundUrl)
        .then(res => {
          if (!res.ok) throw new Error('Audio fetch status: ' + res.status);
          return res.arrayBuffer();
        })
        .then(data => {
          if (this.ctx) {
            return this.ctx.decodeAudioData(data);
          }
        })
        .then(decoded => {
          if (decoded) {
            this.clickBuffer = decoded;
          }
          this.loadingBuffer = false;
        })
        .catch(() => {
          this.loadingBuffer = false;
        });
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setMute(muteState) {
    this.muted = !!muteState;
  }

  /**
   * UI Interaction Click Sound (plays assets/sounds/Enter & Back.wav)
   */
  playClick() {
    if (this.muted) return;
    this.init();

    // 1. Prefer Web Audio API Buffer (instant, zero-latency, overlapping)
    if (this.ctx && this.clickBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = this.clickBuffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(0);
        return;
      } catch (e) {}
    }

    // 2. Fallback to HTMLAudioElement clone
    if (this.audioElement) {
      try {
        const clone = this.audioElement.cloneNode();
        clone.volume = 0.7;
        clone.play().catch(() => {});
        return;
      } catch (e) {}
    }

    // 3. Fallback to synthesized oscillator click
    if (this.ctx) {
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      } catch (e) {}
    }
  }

  /**
   * Mechanical sector tick sound when pointer bounces across a divider line
   * @param {number} pitchMultiplier - dynamic pitch based on wheel speed (0.8 - 1.5)
   */
  playTick(pitchMultiplier = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    // Rate limiter to prevent audio buffer spam at ultra high speeds
    const now = this.ctx.currentTime;
    if (now - this.lastTickTime < 0.025) return;
    this.lastTickTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Bandpass filter for a crisp mechanical "click/clack"
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 * pitchMultiplier, now);
      filter.Q.setValueAtTime(3.0, now);

      // Short pitch sweep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(120 * pitchMultiplier, now + 0.035);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Spin Start sound (subtle rising whoosh)
   */
  playSpinStart() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.35);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Winner celebratory fanfare arpeggio chords
   */
  playWinFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + index * 0.09;
        const duration = 0.6;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      });
    } catch (e) {}
  }

  playWin() {
    this.playWinFanfare();
  }
}

// Export singleton & aliases
window.soundManager = new SoundEffects();
window.soundEngine = window.soundManager;

