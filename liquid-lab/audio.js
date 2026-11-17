/* Local music transport. The audio graph does the looping, including in background tabs. */
(() => {
  "use strict";

  const clamp = (value, start, end) => Math.max(start, Math.min(end, value));
  const LOOP_RATE = 24000;
  const BEAT = 0.55;

  // Synthesize a circular phrase once. Wrapping note tails into its start avoids a seam.
  function renderPhrase(context, notes) {
    const frames = Math.round(notes.length * BEAT * LOOP_RATE);
    const buffer = context.createBuffer(2, frames, LOOP_RATE);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const twoPi = 2 * Math.PI;

    function addTone(at, frequency, duration, level, pan, overtone = 0) {
      const offset = Math.round(at * LOOP_RATE);
      const count = Math.round(duration * LOOP_RATE);
      const leftGain = Math.sqrt((1 - pan) / 2) * level;
      const rightGain = Math.sqrt((1 + pan) / 2) * level;
      for (let i = 0; i < count; i++) {
        const t = i / LOOP_RATE;
        const phase = twoPi * frequency * t;
        const attack = Math.min(1, t / 0.026);
        const release = Math.min(1, (duration - t) / 0.045);
        const envelope = attack * release * Math.exp((-4 * t) / duration);
        const sample =
          envelope * (Math.sin(phase) + overtone * Math.sin(phase * 3));
        const frame = (offset + i) % frames;
        left[frame] += leftGain * sample;
        right[frame] += rightGain * sample;
      }
    }

    notes.forEach((frequency, step) => {
      const at = step * BEAT;
      const pan = [-0.3, 0.1, 0.34, -0.06][step % 4];
      addTone(at, frequency, 1.38, 0.21, pan, 0.045);
      addTone(at + 0.16, frequency * 2, 0.82, 0.047, -pan);
      if (step % 4 === 0) {
        addTone(at, notes[0] / 2, 1.95, 0.17, 0);
        addTone(at + 0.29, frequency * 1.5, 1.3, 0.07, 0.37);
      }
    });
    return buffer;
  }

  window.createMusicPlayer = function createMusicPlayer(tracks, options = {}) {
    if (
      !Array.isArray(tracks) ||
      !tracks.length ||
      tracks.some(
        (track) =>
          !(track.duration > 0) ||
          !Array.isArray(track.notes) ||
          !track.notes.length ||
          track.notes.some((note) => !(Number.isFinite(note) && note > 0)),
      )
    ) {
      throw new TypeError(
        "Music tracks require a positive duration and note frequencies.",
      );
    }

    let index = 0;
    let volume = clamp(Number(options.volume ?? 0.55), 0, 1);
    let offset = 0;
    let anchor = null;
    let playing = false;
    let pendingPlay = null;
    let disposed = false;
    let requestId = 0;
    let context = null;
    let master = null;
    let source = null;
    let channel = null;
    let audioStart = 0;
    const buffers = new Map();
    const timestamp = () => performance.now() / 1000;

    function position() {
      const elapsed = playing && anchor !== null ? timestamp() - anchor : 0;
      return clamp(offset + elapsed, 0, tracks[index].duration);
    }

    function state() {
      return {
        index,
        playing,
        position: position(),
        duration: tracks[index].duration,
        volume,
      };
    }

    function notify(reason) {
      options.onChange?.(state(), reason);
    }

    function syncClock() {
      if (!source || !playing || disposed) return;
      // Anchor display time to the actual audio cursor after an OS audio interruption.
      offset = clamp(
        context.currentTime - audioStart,
        0,
        tracks[index].duration,
      );
      anchor = context.state === "running" ? timestamp() : null;
    }

    function ensureContext() {
      if (context) return context;
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error("当前浏览器无法播放合成音乐");
      context = new Audio();
      master = context.createGain();
      master.gain.value = volume;
      master.connect(context.destination);
      context.addEventListener("statechange", syncClock);
      return context;
    }

    // Fade the old channel independently so a seek or a new track can start immediately.
    function stopSource() {
      if (!source) return;
      const oldSource = source;
      const oldChannel = channel;
      source = null;
      channel = null;
      oldSource.onended = () => {
        oldSource.disconnect();
        oldChannel.disconnect();
      };
      const now = context.currentTime;
      oldChannel.gain.cancelScheduledValues(now);
      oldChannel.gain.setValueAtTime(oldChannel.gain.value, now);
      oldChannel.gain.linearRampToValueAtTime(0, now + 0.025);
      oldSource.stop(now + 0.027);
    }

    function startSource() {
      stopSource();
      const track = tracks[index];
      if (!buffers.has(index))
        buffers.set(index, renderPhrase(context, track.notes));
      const buffer = buffers.get(index);
      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      channel = context.createGain();
      channel.gain.value = 0;
      source.connect(channel);
      channel.connect(master);
      const now = context.currentTime;
      const currentSource = source;
      const initial = offset;
      audioStart = now - initial;
      channel.gain.setValueAtTime(0, now);
      channel.gain.linearRampToValueAtTime(1, now + 0.035);
      source.onended = () => {
        if (source !== currentSource || !playing || disposed) return;
        currentSource.disconnect();
        channel.disconnect();
        source = null;
        channel = null;
        select(index + 1);
      };
      source.start(now, initial % buffer.duration);
      source.stop(now + Math.max(0.01, track.duration - initial));
      anchor = context.state === "running" ? timestamp() : null;
    }

    function pause() {
      if (disposed) return;
      ++requestId;
      pendingPlay = null;
      if (!playing) return;
      offset = position();
      anchor = null;
      playing = false;
      stopSource();
      notify("pause");
    }

    function play() {
      if (disposed) return Promise.resolve(false);
      if (playing) return Promise.resolve(true);
      if (pendingPlay) return pendingPlay;
      const request = ++requestId;
      pendingPlay = (async () => {
        try {
          const audio = ensureContext();
          await audio.resume();
          if (request !== requestId || disposed) return false;
          if (offset >= tracks[index].duration) offset = 0;
          startSource();
          playing = true;
          notify("play");
          return true;
        } catch (error) {
          if (request === requestId && !disposed) {
            options.onError?.("音频暂时无法播放");
          }
          return false;
        }
      })().finally(() => {
        if (request === requestId) pendingPlay = null;
      });
      return pendingPlay;
    }

    function select(nextIndex) {
      if (disposed || !Number.isFinite(nextIndex)) return;
      const count = tracks.length;
      index = ((Math.trunc(nextIndex) % count) + count) % count;
      offset = 0;
      if (playing) startSource();
      notify("track");
    }

    function seek(seconds) {
      if (disposed || !Number.isFinite(seconds)) return;
      offset = clamp(seconds, 0, tracks[index].duration);
      if (playing) startSource();
      notify("seek");
    }

    function setVolume(nextVolume) {
      if (disposed || !Number.isFinite(nextVolume)) return;
      volume = clamp(nextVolume, 0, 1);
      if (master)
        master.gain.setTargetAtTime(volume, context.currentTime, 0.025);
      notify("volume");
    }

    async function chime() {
      if (disposed) return false;
      try {
        const audio = ensureContext();
        await audio.resume();
        if (disposed) return false;
        [523.25, 659.25, 783.99].forEach((frequency, step) => {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          const at = audio.currentTime + step * 0.16;
          oscillator.frequency.value = frequency;
          oscillator.connect(gain);
          gain.connect(master);
          gain.gain.setValueAtTime(0, at);
          gain.gain.linearRampToValueAtTime(0.18, at + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.001, at + 0.85);
          oscillator.start(at);
          oscillator.stop(at + 0.86);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        });
        return true;
      } catch {
        return false;
      }
    }

    function visibilityChanged() {
      if (document.hidden || !context || !playing) return;
      if (context.state === "suspended" || context.state === "interrupted") {
        context
          .resume()
          .then(syncClock)
          .catch(() => pause());
      } else syncClock();
    }
    document.addEventListener("visibilitychange", visibilityChanged);

    function dispose() {
      if (disposed) return;
      pause();
      disposed = true;
      document.removeEventListener("visibilitychange", visibilityChanged);
      if (context) {
        context.removeEventListener("statechange", syncClock);
        context.close().catch(() => {});
      }
      buffers.clear();
    }

    return {
      get state() {
        return state();
      },
      play,
      pause,
      select,
      seek,
      setVolume,
      chime,
      dispose,
      next: (direction = 1) => select(index + direction),
      toggle() {
        if (!playing && !pendingPlay) return play();
        pause();
        return Promise.resolve(false);
      },
    };
  };
})();
