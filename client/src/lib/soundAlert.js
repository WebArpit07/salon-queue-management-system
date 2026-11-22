/**
 * Web Audio API gentle luxury chime alert & tactile mobile vibration
 * Includes robust protection against autoplay blocking & suspended context policies.
 */

let audioCtx = null;

export const playTurnChime = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      // resume() returns a promise that rejects if autoplay policy blocks it
      audioCtx.resume().catch(() => {
        // Autoplay policy prevented playback until explicit user interaction
      });
    }

    // Only synthesize sound if the context is available
    if (audioCtx.state !== 'closed') {
      const now = audioCtx.currentTime;

      // Harmonic chime chords (E5 -> G#5 -> B5)
      const notes = [
        { freq: 659.25, time: now },
        { freq: 830.61, time: now + 0.12 },
        { freq: 987.77, time: now + 0.25 },
      ];

      notes.forEach(({ freq, time }) => {
        try {
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
        } catch {
          // Individual oscillator synthesis caught safely
        }
      });
    }
  } catch (err) {
    console.warn('[SoundAlert] Web Audio playback prevented or unavailable:', err?.message || err);
  }

  // Trigger tactile mobile vibration pattern if supported
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([250, 120, 250]);
    }
  } catch {
    // Vibration ignored if unsupported
  }
};

export default playTurnChime;
