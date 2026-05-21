/**
 * Anna OS — Igual que space-journey.js con THREE global (modo file://).
 */
(function () {
  "use strict";
  var THREE = window.THREE;
  if (!THREE) {
    console.warn("[Anna intro] THREE global ausente.");
    return;
  }

function createAnnaSpaceJourney(canvas, opts = {}) {
  const durationSec = Number(opts.durationSec) > 10 ? opts.durationSec : 24;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x020309, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040618, 0.008);
  scene.add(new THREE.HemisphereLight(0xa8bff5, 0x120814, 0.42));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.18));

  const camera = new THREE.PerspectiveCamera(56, 1, 0.12, 4000);

  /** Cohete + cámara: nariz → etapas → tobera → llamas + 4 aletas (popa +Z, vuelo hacia -Z). */
  const rocketGroup = new THREE.Group();
  scene.add(rocketGroup);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xc8d4e8,
    roughness: 0.32,
    metalness: 0.48,
    emissive: 0x0a1020,
    emissiveIntensity: 0.12,
  });
  const darkHullMat = new THREE.MeshStandardMaterial({
    color: 0x4a5668,
    roughness: 0.48,
    metalness: 0.62,
    emissive: 0x060812,
    emissiveIntensity: 0.06,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xb01028,
    roughness: 0.42,
    metalness: 0.22,
  });
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x2f3848,
    roughness: 0.38,
    metalness: 0.82,
    emissive: 0x0a121c,
    emissiveIntensity: 0.12,
  });

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.36, 2.05, 22), hullMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -2.82;

  const capsuleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.48, 0.48, 22),
    stripeMat
  );
  capsuleRing.rotation.x = Math.PI / 2;
  capsuleRing.position.z = -1.72;

  const upperStage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.56, 1.42, 22),
    hullMat
  );
  upperStage.rotation.x = Math.PI / 2;
  upperStage.position.z = -0.95;

  const stripeRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.56, 0.32, 22, 1, true),
    stripeMat
  );
  stripeRing.rotation.x = Math.PI / 2;
  stripeRing.position.z = -0.12;

  const coreStage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.72, 2.18, 22),
    hullMat
  );
  coreStage.rotation.x = Math.PI / 2;
  coreStage.position.z = 1.05;

  const boosterSkirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.78, 0.78, 22),
    darkHullMat
  );
  boosterSkirt.rotation.x = Math.PI / 2;
  boosterSkirt.position.z = 2.36;

  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.54, 0.34, 0.52, 22),
    nozzleMat
  );
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 2.84;

  const nozzleHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.2, 0.58, 16),
    new THREE.MeshBasicMaterial({ color: 0x030408 })
  );
  nozzleHole.rotation.x = Math.PI / 2;
  nozzleHole.position.z = 2.86;

  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xff6324,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const flameMidMat = new THREE.MeshBasicMaterial({
    color: 0xffc878,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const flameCoreMat = new THREE.MeshBasicMaterial({
    color: 0xfff8e8,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
  });

  const flameOuter = new THREE.Mesh(
    new THREE.ConeGeometry(0.72, 2.05, 18, 1, true),
    flameOuterMat
  );
  flameOuter.rotation.x = Math.PI / 2;
  flameOuter.position.z = 3.58;

  const flameMid = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.42, 16, 1, true),
    flameMidMat
  );
  flameMid.rotation.x = Math.PI / 2;
  flameMid.position.z = 3.28;

  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 1.02, 12, 1, true),
    flameCoreMat
  );
  flameCore.rotation.x = Math.PI / 2;
  flameCore.position.z = 3.05;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 18, 18),
    new THREE.MeshBasicMaterial({
      color: 0xff8538,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    })
  );
  glow.position.z = 2.76;

  function fin(dx, dy, rotZ, rotX) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.14, 0.98),
      stripeMat
    );
    mesh.position.set(dx * 0.79, dy * 0.79, 1.88);
    mesh.rotation.z = rotZ;
    mesh.rotation.x = rotX;
    return mesh;
  }
  const finW = fin(-1, 0, -0.58, 0.09);
  const finE = fin(1, 0, 0.58, 0.09);
  const finN = fin(0, 1, 0, -0.62);
  const finS = fin(0, -1, 0, 0.62);

  rocketGroup.add(
    nose,
    capsuleRing,
    upperStage,
    stripeRing,
    coreStage,
    boosterSkirt,
    nozzle,
    nozzleHole,
    flameOuter,
    flameMid,
    flameCore,
    glow,
    finW,
    finE,
    finN,
    finS
  );

  camera.position.set(0.26, 0.44, 0.72);
  camera.fov = 56;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0.06, -26);
  rocketGroup.add(camera);

  const hullLight = new THREE.PointLight(0xff9644, 1.85, 14, 1.85);
  hullLight.position.copy(glow.position);
  rocketGroup.add(hullLight);
  const cockpitLight = new THREE.PointLight(0xa8dcff, 1.05, 10, 1.55);
  cockpitLight.position.set(0.06, 0.14, -1.35);
  rocketGroup.add(cockpitLight);

  /** Curva tipo “misión orbital” pasando objetos cercanos */
  const pathPoints = [
    new THREE.Vector3(0, 0, 120),
    new THREE.Vector3(38, -16, -10),
    new THREE.Vector3(-42, -8, -130),
    new THREE.Vector3(28, 22, -280),
    new THREE.Vector3(-35, -12, -520),
    new THREE.Vector3(18, 8, -780),
    new THREE.Vector3(-8, -4, -1050),
    new THREE.Vector3(0, 0, -1360),
  ];
  const path = new THREE.CatmullRomCurve3(pathPoints, false, "chordal", 0.35);

  function makeStars(count, radius, jitter, color, sizePx) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius + (Math.random() - 0.5) * jitter;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: sizePx,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  const galaxy = makeStars(12000, 480, 190, 0xd8eaff, 0.55);
  const nebulaWarm = makeStars(3200, 320, 120, 0xff8ad0, 0.85);
  const nebulaCool = makeStars(2800, 360, 140, 0x6af0ff, 0.75);
  scene.add(galaxy, nebulaWarm, nebulaCool);

  function canvasNoiseTexture(primary, secondary, bands) {
    const cnv = document.createElement("canvas");
    cnv.width = 128;
    cnv.height = 128;
    const cx = cnv.getContext("2d");
    const g = cx.createLinearGradient(0, 0, 128, 128);
    g.addColorStop(0, primary);
    g.addColorStop(1, secondary);
    cx.fillStyle = g;
    cx.fillRect(0, 0, 128, 128);
    cx.globalAlpha = 0.28;
    for (let i = 0; i < bands; i++) {
      cx.fillStyle = i % 2 ? "#ffffff" : "#000000";
      cx.fillRect(0, Math.random() * 120, 128, Math.random() * 12 + 2);
    }
    const tex = new THREE.CanvasTexture(cnv);
    if (THREE.SRGBColorSpace !== undefined) {
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding !== undefined) {
      tex.encoding = THREE.sRGBEncoding;
    }
    return tex;
  }

  function spawnPlanet(sceneRef, cx, cz, radius, hueName) {
    const palettes = {
      mercury: ["#9a8370", "#5c4a41"],
      venus: ["#eeca9a", "#c89250"],
      earth: ["#1e5b8f", "#2f8f6b"],
      mars: ["#c75a41", "#7a3827"],
      jupiter: ["#c89870", "#5a4830"],
    };
    const [a, b] = palettes[hueName] || ["#aab5c9", "#6f7a93"];
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 28, 28),
      new THREE.MeshStandardMaterial({
        map: canvasNoiseTexture(a, b, 26),
        roughness: 0.98,
        metalness: 0.05,
      })
    );
    mesh.position.set(cx, (Math.random() - 0.5) * 18, cz);
    sceneRef.add(mesh);
    return mesh;
  }

  const planets = [];
  planets.push(spawnPlanet(scene, -65, -40, 5.2, "mercury"));
  planets.push(spawnPlanet(scene, 88, -95, 7.8, "venus"));
  planets.push(spawnPlanet(scene, -42, -195, 9.8, "earth"));
  planets.push(spawnPlanet(scene, 105, -360, 5.9, "mars"));

  /** Júpiter más grande algo apartado en la trayectoria */
  const ju = spawnPlanet(scene, -120, -680, 18, "jupiter");
  planets.push(ju);

  planets.forEach((p, i) => {
    const speed = (0.015 + i * 0.006) * (i % 2 ? 1 : -1);
    p.userData.__spin = speed;
  });

  /** Agujero negro — esfera oscura + disco de partículas en espiral */
  const bhAnchor = path.getPointAt(0.71);
  const bhCore = new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  bhCore.position.copy(bhAnchor);
  bhCore.position.x += -22;
  bhCore.position.y += 14;
  scene.add(bhCore);

  function makeAccretionDisc() {
    const n = 600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const base = bhCore.position;
    const inner = 14;
    const outer = 36;
    for (let i = 0; i < n; i++) {
      const t = Math.random();
      const r = inner + t * (outer - inner);
      const a = Math.random() * Math.PI * 2 + t * 4.8;
      const tilt = (Math.random() - 0.5) * 1.65;
      const x = base.x + r * Math.cos(a);
      const y = base.y + (Math.sin(tilt) * r) * 0.22 + (Math.random() - 0.5) * 1.9;
      const z = base.z + r * Math.sin(a);
      pos[i * 3] = x - base.x;
      pos[i * 3 + 1] = y - base.y;
      pos[i * 3 + 2] = z - base.z;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff6a56,
      size: 0.55,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pts = new THREE.Points(geo, mat);
    pts.position.copy(base);
    return { pts };
  }

  const { pts: bhDisc } = makeAccretionDisc();
  scene.add(bhDisc);

  const bgColor = new THREE.Color(0x020309);
  const hyperspaceWhite = new THREE.Color(0xf7faff);

  let running = false;
  /** @type {number | null} */
  let rafId = null;
  let elapsed = 0;

  /** @type {{ progress: number }} */
  let state = { progress: 0 };

  /** Scratch */
  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const lookPt = new THREE.Vector3();

  function fitSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }

  /** @typedef {{ progress: number, elapsedMs: number }} JourneyFrame */
  /** @type {((frame: JourneyFrame) => void) | undefined} */
  let onBeforeFrameCb;
  /** @type {((frame: JourneyFrame) => void) | undefined} */
  let onAfterFrameCb;
  /** @type {(() => void) | undefined} */
  let onCompleteCb;

  function tick(now) {
    const last = tick.__prev == null ? now - 1000 / 60 : tick.__prev;
    tick.__prev = now;
    const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));

    elapsed += dt;
    const rawU = elapsed / durationSec;
    state.progress = THREE.MathUtils.clamp(rawU, 0, 1);

    if (onBeforeFrameCb) {
      onBeforeFrameCb({ progress: state.progress, elapsedMs: elapsed * 1000 });
    }

    /** Hiperespacio final — rampa suave + barrido FOV + llamas que crecen */
    const warpIn = THREE.MathUtils.smoothstep(state.progress, 0.82, 1);
    const hyp = warpIn * warpIn;

    scene.background = bgColor.clone().lerp(hyperspaceWhite, hyp * 0.94);
    const fogDense = THREE.MathUtils.lerp(0.008, 0.038, hyp);
    if (scene.fog && scene.fog.isFogExp2) {
      scene.fog.color.copy(scene.background);
      scene.fog.density = fogDense;
    }
    galaxy.rotation.y += 0.0028 * dt * (1 + hyp * 4);

    planets.forEach((p) => {
      p.rotation.y += p.userData.__spin || 0.01;
      p.rotation.x += (p.userData.__spin || 0.01) * 0.12;
    });

    /** Disco en rotación rápida cerca del agujero */
    bhDisc.rotation.y += dt * (2.08 + hyp * 4);

    /** Posición y orientación sobre la curva */
    path.getPointAt(state.progress, pos);
    path.getTangentAt(state.progress, tan).normalize();

    rocketGroup.position.copy(pos);
    lookPt.copy(pos).add(tan);
    rocketGroup.lookAt(lookPt.x, lookPt.y, lookPt.z);
    rocketGroup.rotateZ(Math.sin(elapsed * 17) * 0.062 * warpIn);

    camera.fov = THREE.MathUtils.lerp(56, 82, warpIn * warpIn);
    camera.updateProjectionMatrix();

    hullLight.intensity = THREE.MathUtils.lerp(1.85, 4.2, hyp);
    const flBoost = 1 + hyp * 2.85;
    flameOuter.scale.setScalar(flBoost * (1 + Math.sin(elapsed * 31) * 0.06 * hyp));
    flameMid.scale.setScalar(flBoost * 1.08);
    flameCore.scale.setScalar(flBoost * 1.15);
    glow.scale.setScalar(1 + hyp * 1.35);

    renderer.render(scene, camera);

    if (onAfterFrameCb) {
      onAfterFrameCb({ progress: state.progress, elapsedMs: elapsed * 1000 });
    }

    if (state.progress >= 1) {
      stop();
      if (onCompleteCb) onCompleteCb();
      return;
    }
    rafId = window.requestAnimationFrame(tick);
  }

  function start(callbacks = {}) {
    if (running) return;
    onBeforeFrameCb = callbacks.onBeforeFrame;
    onAfterFrameCb = callbacks.onAfterFrame;
    onCompleteCb = callbacks.onComplete;
    running = true;
    elapsed = 0;
    state.progress = 0;
    tick.__prev = null;
    camera.fov = 56;
    camera.updateProjectionMatrix();
    hullLight.intensity = 1.85;
    flameOuter.scale.setScalar(1);
    flameMid.scale.setScalar(1);
    flameCore.scale.setScalar(1);
    glow.scale.setScalar(1);
    fitSize();
    rafId = window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId != null) window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  /** @returns {THREE.WebGLRenderer} */
  function getRenderer() {
    return renderer;
  }

  function dispose() {
    stop();
    const seenMat = new Set();
    scene.traverse(function (obj) {
      const o = /** @type {THREE.Mesh | THREE.Line | THREE.Points} */ (
        /** @type {unknown} */ (obj)
      );
      if (o.geometry) o.geometry.dispose?.();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      mats.forEach(function (mm) {
        if (!mm || seenMat.has(mm)) return;
        seenMat.add(mm);
        if (/** @type {THREE.MeshStandardMaterial} */ (mm).map) {
          /** @type {THREE.MeshStandardMaterial} */ (mm).map.dispose?.();
        }
        mm.dispose?.();
      });
    });
    renderer.dispose?.();
  }

  const onResize = function () {
    if (!running) return;
    fitSize();
  };
  window.addEventListener("resize", onResize, { passive: true });

  return {
    start,
    stop,
    dispose,
    fitSize,
    getProgress() {
      return state.progress;
    },
    scene,
    rocketGroup,
    getRenderer,
    __removeListeners() {
      window.removeEventListener("resize", onResize);
    },
  };
}
  window.createAnnaSpaceJourney = createAnnaSpaceJourney;
})();
