/**
 * Web Audio API gentle luxury chime alert & tactile mobile vibration
 */

let audioCtx = null;

export const playTurnChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Harmonic chime chords (E5 -> G#5 -> B5)
    const notes = [
      { freq: 659.25, time: now },
      { freq: 830.61, time: now + 0.12 },
      { freq: 987.77, time: now + 0.25 },
    ];

    notes.forEach(({ freq, time }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.28, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + 1.3);
    });
  } catch (err) {
    console.warn('[SoundAlert] Web Audio playback prevented or unavailable:', err.message);
  }

  // Trigger tactile mobile vibration pattern if supported
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([250, 120, 250]);
    }
  } catch (err) {
    // Vibration ignored if unsupported
  }
};

export default playTurnChime;
