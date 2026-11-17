// All released versions share these keys. Reading old data never clears the store.
(() => {
  "use strict";

  const prefix = "liquidlab.";
  const preferences = Object.freeze({
    wall: "lake",
    night: false,
    speed: 1,
    highlight: true,
    material: "liquid",
    sound: true,
    refraction: 82,
    depth: 72,
  });

  const isRecord = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(prefix + key));
      if (Array.isArray(fallback))
        return Array.isArray(value) ? value : fallback;
      if (isRecord(fallback)) return isRecord(value) ? value : fallback;
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
      return true;
    } catch {
      window.dispatchEvent(new Event("studio:storage-unavailable"));
      return false;
    }
  }

  function loadPreferences(wallpapers) {
    const saved = read("settings", {});
    const result = { ...preferences, ...saved };
    for (const key of ["night", "highlight", "sound"]) {
      if (typeof result[key] !== "boolean") result[key] = preferences[key];
    }
    if (!wallpapers.some((wallpaper) => wallpaper.id === result.wall))
      result.wall = preferences.wall;
    if (!["liquid", "frost"].includes(result.material))
      result.material = preferences.material;
    if (![0.65, 1, 1.7].includes(result.speed))
      result.speed = preferences.speed;
    for (const key of ["refraction", "depth"]) {
      const number = Number(result[key]);
      result[key] = Number.isFinite(number)
        ? Math.max(key === "depth" ? 5 : 0, Math.min(100, number))
        : preferences[key];
    }
    return result;
  }

  window.StudioStorage = Object.freeze({ read, write, loadPreferences });
})();
