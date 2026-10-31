/* SPDX-License-Identifier: AGPL-3.0-only */
// Sound presentation consumes Godot's frequency; it never computes the physics.
(() => {
  'use strict';
  let context, voices = [], master, generation = 0;
  let muted = false, volume = .25;
  const clamp = (x, low, high) => Math.min(high, Math.max(low, x));
  const notify = () => window.dispatchEvent(new CustomEvent('lab-audio-state'));

  function stop() {
    generation++;
    const now = context?.currentTime || 0;
    if (master) {
      const retiring = master;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0, now, .012);
      setTimeout(() => retiring.disconnect(), 80);
    }
    for (const oscillator of voices) {
      try { oscillator.stop(now + .05); } catch {}
    }
    voices = [];
    master = null;
    notify();
  }

  function profile(experiment, params, result) {
    if (experiment?.model !== 'sound') return null;
    const scenario = params?.scenario || experiment.modelParams?.scenario;
    if (!['ruler', 'pitch', 'amplitude', 'timbre', 'resonance', 'vacuum', 'bottleStrike', 'airColumn', 'telephone', 'insulation'].includes(scenario)) return null;
    const values = result?.values;
    if (!values) return { available: false, reason: '装置准备后可试听。' };
    const frequency = Number(values.frequency);
    const amplitude = Number(values.amplitude) * Number(values.relativeReceived ?? 1);
    if (values.medium === 'vacuum') return { available: false, reason: '真空不能传播声音。' };
    if (Number(values.sourceAmplitude ?? values.amplitude) <= 0) return { available: false, reason: '振幅为零，没有可试听的振动。' };
    if (amplitude <= 0) return { available: false, reason: '当前模型中，这条路径没有传到接收端的振动。' };
    if (!Number.isFinite(frequency) || frequency < 20 || frequency > 20000) {
      return { available: false, reason: '模型基频超出通常可听范围，请观察振动。' };
    }
    const harmonics = scenario === 'timbre'
      ? [1, Number(values.harmonic2) || 0, Number(values.harmonic3) || 0]
      : scenario === 'ruler' ? [1, .10, .03] : [1];
    return {
      available: true, frequency, harmonics,
      amplitude: clamp(amplitude / (scenario === 'ruler' ? 4 : 10), 0, 1),
      seconds: 1.4,
      reason: '轻声合成试听；声音按模型频率，画面可以慢放。'
    };
  }

  async function play(sound) {
    stop();
    if (!sound?.available || muted || volume === 0) return;
    const token = generation;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('当前浏览器不支持声音试听。');
    context ||= new Audio();
    await context.resume();
    if (token !== generation || muted) return;
    const now = context.currentTime;
    const duration = sound.seconds;
    master = context.createGain();
    master.connect(context.destination);
    const gainNode = master;
    const harmonics = sound.harmonics;
    const normalization = harmonics.reduce((sum, level) => sum + Math.abs(level), 0) || 1;
    // Even at full UI volume the summed peak stays <= 0.10, with soft edges.
    const peak = .10 * volume * sound.amplitude / normalization;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peak, now + .018);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(peak * .08, .00001), now + duration - .12);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    harmonics.forEach((level, index) => {
      if (!level || sound.frequency * (index + 1) >= context.sampleRate / 2) return;
      const oscillator = context.createOscillator();
      const partial = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = sound.frequency * (index + 1);
      partial.gain.value = level;
      oscillator.connect(partial).connect(gainNode);
      oscillator.start(now);
      oscillator.stop(now + duration + .01);
      oscillator.onended = () => {
        oscillator.disconnect(); partial.disconnect();
        if (token === generation) {
          voices = voices.filter(voice => voice !== oscillator);
          if (!voices.length) { gainNode.disconnect(); master = null; notify(); }
        }
      };
      voices.push(oscillator);
    });
    notify();
  }

  window.LabAudio = {
    profile, play, stop,
    setMuted(value) { muted = !!value; if (muted) stop(); notify(); },
    setVolume(value) { volume = clamp(Number(value) || 0, 0, 1); stop(); },
    get state() { return { muted, volume, playing: voices.length > 0 }; }
  };
  window.addEventListener('pagehide', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
