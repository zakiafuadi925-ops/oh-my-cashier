// Web Audio API Sound Generator for POS & Kitchen alerts (zero external dependencies)
export const playSound = (type: 'beep' | 'chime_order' | 'chime_ready' | 'void') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (type === 'beep') {
      // Short barcode scanner beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'chime_order') {
      // Two-tone bell for new incoming kitchen order (Ding-Dong)
      const now = ctx.currentTime;
      [
        { freq: 880, delay: 0, duration: 0.25 }, // A5
        { freq: 1174.66, delay: 0.18, duration: 0.4 }, // D6
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);
        gain.gain.setValueAtTime(0.15, now + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration);
      });
    } else if (type === 'chime_ready') {
      // Harmonious triple chime for order ready (Dapur selesai masak)
      const now = ctx.currentTime;
      [
        { freq: 523.25, delay: 0, duration: 0.2 }, // C5
        { freq: 659.25, delay: 0.12, duration: 0.2 }, // E5
        { freq: 783.99, delay: 0.24, duration: 0.35 }, // G5
        { freq: 1046.5, delay: 0.36, duration: 0.45 }, // C6
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);
        gain.gain.setValueAtTime(0.18, now + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.duration);
      });
    } else if (type === 'void') {
      // Low tone error alert
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // AudioContext blocked or not supported - silently ignore
  }
};
