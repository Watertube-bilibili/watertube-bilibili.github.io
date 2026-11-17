/* A glass surface owns one texture and one invalidation queue. Idle surfaces submit no frames. */
(() => {
  "use strict";
  const MAX_LENSES = 16;
  const FRAGMENT = `precision highp float;
uniform sampler2D backdrop;
uniform vec2 viewport, sourceSize, lightPosition;
uniform vec4 boxes[16], radii[4];
uniform int lensCount;
uniform float strength, thickness, highlights, isLiquid, tint, focus, scene, shade, impulse, phase;
float distanceToLens(vec2 p, vec2 halfSize, float radius) {
  vec2 corner = abs(p) - halfSize + radius;
  return min(max(corner.x, corner.y), 0.) + length(max(corner, 0.)) - radius;
}
vec3 sampleScene(vec2 point) {
  vec2 uv = (point / viewport - .5) / (1. - focus * .055);
  float aspect = (viewport.x / viewport.y) / (sourceSize.x / sourceSize.y);
  uv *= vec2(min(1.,aspect), min(1.,1./aspect));
  uv += .5;
  vec3 pixel = texture2D(backdrop, clamp(vec2(uv.x,1.-uv.y), .001, .999)).rgb;
  if(tint > .5 && tint < 1.5) pixel = pixel.bgr * vec3(.72,1.,1.13);
  if(tint > 1.5) pixel = vec3(pixel.r*.95+pixel.b*.3,pixel.g*.72+pixel.r*.12,pixel.b*.95+pixel.r*.3);
  return pixel * (1.-shade*(.45+.55*(1.-smoothstep(0.,.55,point.y/viewport.y))));
}
vec3 diffuseScene(vec2 p,float radius) {
  return .25 * (sampleScene(p+vec2(radius,.3*radius)) + sampleScene(p-vec2(radius,.3*radius)) +
                sampleScene(p+vec2(-.3*radius,radius)) + sampleScene(p-vec2(-.3*radius,radius)));
}
void main() {
  vec2 p=vec2(gl_FragCoord.x,viewport.y-gl_FragCoord.y);
  vec3 color=sampleScene(p);
  if(scene>.5) color=mix(color,diffuseScene(p,8.*focus),focus*.8)*(1.-focus*.47);
  for(int i=0;i<16;i++){
    if(i>=lensCount)break;
    vec4 rect=boxes[i];
    vec2 q=p-rect.xy, halfSize=rect.zw*.5;
    float radius=radii[i/4][i-(i/4)*4];
    // Fast bounds rejection avoids sampling or computing normals for neighboring controls.
    if(abs(q.x)>halfSize.x+4. || abs(q.y)>halfSize.y+4.)continue;
    radius=min(radius,min(halfSize.x,halfSize.y));
    float d=distanceToLens(q,halfSize,radius);
    if(d>=0.)continue;
    vec2 edge=abs(q)-halfSize+radius;
    vec2 n=max(edge,0.);
    n=length(n)>.01 ? normalize(n)*sign(q) : (edge.x>edge.y?vec2(sign(q.x),0.):vec2(0.,sign(q.y)));
    float depth=min(12.+thickness*34.,min(halfSize.x,halfSize.y)*.9);
    float rim=pow(1.-smoothstep(0.,max(1.,depth),-d),1.55);
    float ripple=impulse*sin(phase*17.-length(q)*.055)*rim;
    vec2 offset=(-n*rim*(10.+thickness*54.)-q*(.025+thickness*.065)*(1.-rim))*strength*isLiquid;
    offset+=vec2(n.y,-n.x)*ripple*4.*isLiquid;
    vec3 refracted;
    refracted.r=sampleScene(p+offset*1.045).r;
    refracted.g=sampleScene(p+offset).g;
    refracted.b=sampleScene(p+offset*.955).b;
    if(isLiquid<.5)refracted=mix(diffuseScene(p,11.),vec3(.80,.81,.78),.14);
    vec2 light=normalize(lightPosition-rect.xy+vec2(.01));
    float lit=dot(n,light);
    float edgeLight=exp(d/1.25), inside=exp(-pow((-d-3.2)/2.3,2.));
    vec3 glass=mix(refracted,vec3(.92,.93,.91),.026+.02*scene)*(1.-scene*focus*.25);
    glass+=vec3(.94,.97,1.)*(edgeLight*(.16+pow(max(0.,lit),5.)*.79*highlights)+inside*rim*.15)*isLiquid;
    glass+=vec3(1.,.84,.67)*pow(max(-lit,0.),8.)*exp(d/2.)*.16*isLiquid;
    glass-=rim*.065*isLiquid;
    color=mix(color,glass,smoothstep(0.,1.,-d));
  }
  gl_FragColor=vec4(color,1.);
}`;
  const VERTEX =
    "attribute vec2 point; void main(){gl_Position=vec4(point,0.,1.);}";
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  class OpticalProgram {
    constructor(gl) {
      this.gl = gl;
      this.program = gl.createProgram();
      for (const [type, source] of [
        [gl.VERTEX_SHADER, VERTEX],
        [gl.FRAGMENT_SHADER, FRAGMENT],
      ]) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw Error(gl.getShaderInfoLog(shader));
        gl.attachShader(this.program, shader);
        gl.deleteShader(shader);
      }
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
        throw Error(gl.getProgramInfoLog(this.program));
      gl.useProgram(this.program);
      this.uniforms = {};
      for (const name of [
        "viewport",
        "sourceSize",
        "lightPosition",
        "boxes",
        "radii",
        "lensCount",
        "strength",
        "thickness",
        "highlights",
        "isLiquid",
        "tint",
        "focus",
        "scene",
        "shade",
        "impulse",
        "phase",
      ]) {
        this.uniforms[name] = gl.getUniformLocation(
          this.program,
          ["boxes", "radii"].includes(name) ? name + "[0]" : name,
        );
      }
      this.boxes = new Float32Array(MAX_LENSES * 4);
      this.radii = new Float32Array(MAX_LENSES);
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      const position = gl.getAttribLocation(this.program, "point");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    }
    upload(source) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
    }
    draw(canvas, source, rects, dpr, state, ripple, time) {
      const gl = this.gl,
        u = this.uniforms,
        count = Math.min(rects.length, MAX_LENSES);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.viewport, canvas.width, canvas.height);
      gl.uniform2f(
        u.sourceSize,
        source.naturalWidth || source.width,
        source.naturalHeight || source.height,
      );
      for (let i = 0; i < count; i++) {
        const { x, y, w, h, r } = rects[i];
        this.boxes.set([x * dpr, y * dpr, w * dpr, h * dpr], i * 4);
        this.radii[i] = r * dpr;
      }
      gl.uniform4fv(u.boxes, this.boxes);
      gl.uniform4fv(u.radii, this.radii);
      gl.uniform1i(u.lensCount, count);
      gl.uniform2f(u.lightPosition, state.light[0] * dpr, state.light[1] * dpr);
      gl.uniform1f(u.strength, state.strength * dpr);
      gl.uniform1f(u.thickness, state.depth);
      gl.uniform1f(u.highlights, state.highlight);
      gl.uniform1f(u.isLiquid, state.liquid);
      for (const name of ["focus", "scene", "tint", "shade"])
        gl.uniform1f(u[name], state[name]);
      gl.uniform1f(u.impulse, ripple);
      gl.uniform1f(u.phase, time / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    destroy() {
      this.gl.deleteTexture(this.texture);
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteProgram(this.program);
    }
  }

  // Local 2D fallback clips a magnified backdrop into each lens. Site interactions work without WebGL.
  function drawCompatible(ctx, canvas, source, rects, dpr, state) {
    const w = canvas.width,
      h = canvas.height;
    const cover = Math.max(
      w / (source.naturalWidth || source.width),
      h / (source.naturalHeight || source.height),
    );
    const sw = (source.naturalWidth || source.width) * cover,
      sh = (source.naturalHeight || source.height) * cover;
    const paint = () =>
      ctx.drawImage(source, (w - sw) / 2, (h - sh) / 2, sw, sh);
    ctx.clearRect(0, 0, w, h);
    ctx.filter =
      state.tint === 1
        ? "hue-rotate(90deg)"
        : state.tint === 2
          ? "hue-rotate(285deg)"
          : "none";
    paint();
    ctx.fillStyle =
      "rgba(10,14,17," + (state.focus * 0.42 + state.shade * 0.4) + ")";
    ctx.fillRect(0, 0, w, h);
    for (const r of rects) {
      const x = r.x * dpr,
        y = r.y * dpr;
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect)
        ctx.roundRect(
          x - (r.w * dpr) / 2,
          y - (r.h * dpr) / 2,
          r.w * dpr,
          r.h * dpr,
          Math.max(0, Math.min(r.r, r.w / 2, r.h / 2) * dpr),
        );
      else
        ctx.rect(
          x - (r.w * dpr) / 2,
          y - (r.h * dpr) / 2,
          r.w * dpr,
          r.h * dpr,
        );
      ctx.clip();
      const zoom = 1 + 0.16 * state.strength * state.liquid;
      ctx.translate(x, y);
      ctx.scale(zoom, zoom);
      ctx.translate(-x, -y);
      if (!state.liquid) ctx.filter = "blur(6px)";
      paint();
      ctx.restore();
    }
  }

  class OpticalSurface {
    constructor(canvas, source, measure, initial) {
      this.canvas = canvas;
      this.measure = measure;
      this.state = Object.assign(
        {
          strength: 0.82,
          depth: 0.72,
          highlight: 1,
          liquid: 1,
          tint: 0,
          light: [40, 75],
          scene: 0,
          focus: 0,
          shade: 0,
        },
        initial,
      );
      this.frame = 0;
      this.velocity = 0;
      this.ripple = 0;
      this.last = 0;
      this.alive = true;
      this.events = new AbortController();
      this.source = null;
      const options = {
        alpha: false,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      };
      try {
        const gl = canvas.getContext("webgl", options);
        if (gl) this.gpu = new OpticalProgram(gl);
        if (!this.gpu) this.ctx = canvas.getContext("2d");
      } catch (error) {
        console.warn("Optical surface compatibility mode", error.message);
        // A canvas that acquired WebGL cannot subsequently acquire 2D; keep its layout as an anchor.
        const replacement = document.createElement("canvas");
        replacement.className = canvas.className;
        replacement.setAttribute("aria-hidden", "true");
        Object.assign(replacement.style, {
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: getComputedStyle(canvas).zIndex,
        });
        canvas.after(replacement);
        canvas.style.visibility = "hidden";
        canvas._fallbackCanvas = replacement;
        this.compatibleCanvas = replacement;
        this.ctx = replacement.getContext("2d");
      }
      if (!this.gpu && canvas.id === "optics") {
        const label = document.getElementById("rendererLabel");
        if (label) label.textContent = "2D";
      }
      const listen = { signal: this.events.signal };
      window.addEventListener("resize", () => this.invalidate(), listen);
      document.addEventListener(
        "visibilitychange",
        () => this.invalidate(),
        listen,
      );
      canvas.addEventListener(
        "webglcontextlost",
        (event) => {
          event.preventDefault();
          this.lost = true;
          canvas.style.opacity = "0";
        },
        listen,
      );
      canvas.addEventListener(
        "webglcontextrestored",
        () => {
          this.gpu = new OpticalProgram(canvas.getContext("webgl"));
          this.lost = false;
          this.refresh();
        },
        listen,
      );
      if (typeof ResizeObserver !== "undefined") {
        this.resize = new ResizeObserver(() => this.invalidate());
        this.resize.observe(canvas);
      }
      if (canvas.id === "labCanvas" && canvas.parentElement) {
        this.geometry = new MutationObserver(() => this.invalidate());
        const lens = canvas.parentElement.querySelector("#labLens");
        if (lens)
          this.geometry.observe(lens, {
            attributes: true,
            attributeFilter: ["style"],
          });
      }
      this.setSource(source);
    }
    setSource(source) {
      this.loading?.abort();
      this.loading = new AbortController();
      this.source = source;
      const ready = () => {
        if (this.alive && this.source === source) this.refresh();
      };
      if (source instanceof HTMLCanvasElement || source.complete) ready();
      else
        source.addEventListener("load", ready, {
          once: true,
          signal: this.loading.signal,
        });
    }
    refresh() {
      if (
        !this.source ||
        !(this.source.naturalWidth || this.source.width) ||
        this.lost
      )
        return;
      if (this.gpu) this.gpu.upload(this.source);
      else if (!this.ctx) {
        this.canvas.style.background =
          'center / cover url("' +
          (this.source.src || this.source.toDataURL?.() || "") +
          '")';
      }
      this.ready = true;
      this.invalidate();
    }
    update(changes) {
      Object.assign(this.state, changes);
      this.invalidate();
    }
    impulse(amount = 1) {
      this.velocity = clamp(this.velocity + amount * 13, -35, 35);
      this.invalidate();
    }
    invalidate() {
      if (
        this.alive &&
        this.ready &&
        !this.frame &&
        !document.hidden &&
        !this.lost
      ) {
        this.frame = requestAnimationFrame((time) => this.draw(time));
      }
    }
    draw(time) {
      this.frame = 0;
      if (!this.alive || !this.ready || document.hidden || this.lost) return;
      const bounds = this.canvas.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1) return;
      const dt = clamp((time - this.last) / 1000, 0.001, 0.028);
      this.last = time;
      this.velocity += (-190 * this.ripple - 17 * this.velocity) * dt;
      this.ripple += this.velocity * dt;
      const moving =
        Math.abs(this.ripple) > 0.012 || Math.abs(this.velocity) > 0.12;
      if (!moving) {
        this.velocity = 0;
        this.ripple = 0;
      }
      const dpr = clamp(window.devicePixelRatio || 1, 1, 1.5);
      const width = Math.round(bounds.width * dpr),
        height = Math.round(bounds.height * dpr);
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      const lenses = this.measure(bounds);
      if (this.gpu)
        this.gpu.draw(
          this.canvas,
          this.source,
          lenses,
          dpr,
          this.state,
          this.ripple,
          time,
        );
      else if (this.ctx) {
        const output = this.compatibleCanvas || this.canvas;
        if (output.width !== width || output.height !== height) {
          output.width = width;
          output.height = height;
        }
        if (this.compatibleCanvas)
          output.style.opacity = this.canvas.style.opacity || "1";
        drawCompatible(this.ctx, output, this.source, lenses, dpr, this.state);
      }
      if (this.canvas.id === "optics") this.canvas.style.opacity = "1";
      if (moving) this.invalidate();
    }
    destroy() {
      this.alive = false;
      this.events.abort();
      this.loading?.abort();
      this.resize?.disconnect();
      this.geometry?.disconnect();
      cancelAnimationFrame(this.frame);
      this.compatibleCanvas?.remove();
      this.gpu?.destroy();
      this.gpu?.gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  }

  window.createOptics = (canvas, source, measure, initial) =>
    new OpticalSurface(canvas, source, measure, initial);
  const canvas = document.getElementById("optics");
  const screen = document.getElementById("screen");
  const wallpaper = document.getElementById("wallpaperBase") || new Image();
  if (!wallpaper.getAttribute("src"))
    wallpaper.src = "assets/wallpaper-lake.jpg";
  const home = document.getElementById("homeScreen");
  const homeLenses = Array.from(
    document.querySelectorAll(".home-screen .optical-glass,.desktop-grid"),
  );
  const renderer = (window.glassRenderer = createOptics(
    canvas,
    wallpaper,
    (bounds) =>
      homeLenses.map((element) => {
        const rect = element.getBoundingClientRect();
        const radius =
          ((parseFloat(getComputedStyle(element).borderRadius) || 20) *
            bounds.width) /
          354;
        return {
          x: rect.left - bounds.left + rect.width / 2,
          y: rect.top - bounds.top + rect.height / 2,
          w: rect.width,
          h: rect.height,
          r: Math.min(radius, rect.height / 2),
        };
      }),
  ));
  // DOM transforms can move glass without changing layout, so the owner signals geometry changes.
  if (home) {
    new MutationObserver(() => renderer.invalidate()).observe(home, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    let transitionFrame = 0;
    const moving = new Set();
    function followHome() {
      renderer.invalidate();
      transitionFrame = moving.size ? requestAnimationFrame(followHome) : 0;
    }
    home.addEventListener("transitionrun", (event) => {
      if (event.target !== home || event.propertyName !== "transform") return;
      moving.add(event.propertyName);
      if (!transitionFrame) followHome();
    });
    const finish = (event) => {
      if (event.target !== home) return;
      moving.delete(event.propertyName);
      renderer.invalidate();
    };
    home.addEventListener("transitionend", finish);
    home.addEventListener("transitioncancel", finish);
  }
  let selectedURL = wallpaper.getAttribute("src"),
    selection = 0;
  window.setWallpaperSource = (url) => {
    if (selectedURL === url) return Promise.resolve();
    selectedURL = url;
    const current = ++selection,
      image = new Image();
    return new Promise((resolve) => {
      image.onload = () => {
        if (current === selection) renderer.setSource(image);
        resolve();
      };
      image.onerror = () => {
        if (current === selection) selectedURL = "";
        resolve();
      };
      image.src = url;
    });
  };
  screen.addEventListener("pointermove", (event) => {
    if (
      screen.classList.contains("has-app") ||
      screen.classList.contains("control-open") ||
      !renderer.state.highlight
    )
      return;
    const rect = canvas.getBoundingClientRect();
    renderer.update({
      light: [event.clientX - rect.left, event.clientY - rect.top],
    });
  });
  screen.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".optical-glass,.desktop-tile"))
      renderer.impulse(0.48);
  });
})();
