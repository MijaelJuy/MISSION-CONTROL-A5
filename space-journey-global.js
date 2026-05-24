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

  const camera = new THREE.PerspectiveCamera(54, 1, 0.12, 4000);

  /** Cohete mejorado: cuerpo alto, SRB gemelos, sonda punta-cabina y anillos. +Z es popa. */
  const srbFlameMeshes = [];
  const rocketGroup = new THREE.Group();
  scene.add(rocketGroup);

  const seg = 30;

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xbfd2ec,
    roughness: 0.28,
    metalness: 0.52,
    emissive: 0x0a1628,
    emissiveIntensity: 0.1,
  });
  const darkHullMat = new THREE.MeshStandardMaterial({
    color: 0x3d4858,
    roughness: 0.44,
    metalness: 0.58,
    emissive: 0x060812,
    emissiveIntensity: 0.05,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xa80e26,
    roughness: 0.38,
    metalness: 0.26,
  });
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x293244,
    roughness: 0.34,
    metalness: 0.84,
    emissive: 0x081018,
    emissiveIntensity: 0.14,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x173c72,
    metalness: 0.76,
    roughness: 0.18,
    transparent: true,
    opacity: 0.68,
    emissive: 0x082450,
    emissiveIntensity: 0.62,
    side: THREE.DoubleSide,
  });
  const probeMat = new THREE.MeshStandardMaterial({
    color: 0xd0dcf0,
    metalness: 0.74,
    roughness: 0.22,
    emissive: 0x080c14,
    emissiveIntensity: 0.06,
  });

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.33, 1.98, seg), hullMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -2.68;

  const dockingProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.62, 12), probeMat);
  dockingProbe.rotation.x = Math.PI / 2;
  dockingProbe.position.z = -3.92;

  const probeBall = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), probeMat);
  probeBall.position.z = -4.26;

  const capsuleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.455, 0.46, seg),
    stripeMat
  );
  capsuleRing.rotation.x = Math.PI / 2;
  capsuleRing.position.z = -1.58;

  const upperStage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.455, 0.535, 1.48, seg),
    hullMat
  );
  upperStage.rotation.x = Math.PI / 2;
  upperStage.position.z = -0.76;

  const cockpitDome = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.3,
      seg,
      Math.max(14, Math.floor(seg * 0.55)),
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.46
    ),
    glassMat
  );
  cockpitDome.rotation.x = -Math.PI / 2;
  cockpitDome.position.set(0.2, 0.44, -0.94);

  const stripeRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.535, 0.535, 0.3, seg, 1, true),
    stripeMat
  );
  stripeRing.rotation.x = Math.PI / 2;
  stripeRing.position.z = 0.02;

  const coreStage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.535, 0.695, 2.35, seg),
    hullMat
  );
  coreStage.rotation.x = Math.PI / 2;
  coreStage.position.z = 1.2;

  const sepRingGeo = new THREE.TorusGeometry(0.597, 0.032, 8, Math.max(seg, 36));

  const sepRingA = new THREE.Mesh(sepRingGeo, nozzleMat);
  sepRingA.position.z = 0.18;

  const sepRingB = new THREE.Mesh(sepRingGeo.clone(), nozzleMat);
  sepRingB.position.z = 1.92;

  const boosterSkirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.695, 0.752, 0.82, seg),
    darkHullMat
  );
  boosterSkirt.rotation.x = Math.PI / 2;
  boosterSkirt.position.z = 2.52;

  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.32, 0.55, seg),
    nozzleMat
  );
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 3.02;

  const nozzleHole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.18, 0.62, 16),
    new THREE.MeshBasicMaterial({ color: 0x020408 })
  );
  nozzleHole.rotation.x = Math.PI / 2;
  nozzleHole.position.z = 3.04;

  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xff5a1c,
    transparent: true,
    opacity: 0.5,
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
    new THREE.ConeGeometry(0.74, 2.15, 22, 1, true),
    flameOuterMat
  );
  flameOuter.rotation.x = Math.PI / 2;
  flameOuter.position.z = 3.72;

  const flameMid = new THREE.Mesh(
    new THREE.ConeGeometry(0.44, 1.48, 18, 1, true),
    flameMidMat
  );
  flameMid.rotation.x = Math.PI / 2;
  flameMid.position.z = 3.42;

  const flameCore = new THREE.Mesh(
    new THREE.ConeGeometry(0.21, 1.05, 14, 1, true),
    flameCoreMat
  );
  flameCore.rotation.x = Math.PI / 2;
  flameCore.position.z = 3.18;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 22, 20),
    new THREE.MeshBasicMaterial({
      color: 0xff7a30,
      transparent: true,
      opacity: 0.84,
      depthWrite: false,
    })
  );
  glow.position.z = 2.88;

  function fin(dx, dy, rotZ, rotX) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.12, 1.05),
      stripeMat
    );
    mesh.position.set(dx * 0.82, dy * 0.82, 1.96);
    mesh.rotation.z = rotZ;
    mesh.rotation.x = rotX;
    return mesh;
  }
  const finW = fin(-1, 0, -0.56, 0.1);
  const finE = fin(1, 0, 0.56, 0.1);
  const finN = fin(0, 1, 0, -0.6);
  const finS = fin(0, -1, 0, 0.6);

  function attachSRB(sideSign) {
    const root = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.265, 1.68, 4, Math.max(14, Math.floor(seg * 0.65))),
      darkHullMat
    );
    body.rotation.x = Math.PI / 2;
    body.position.z = 0.82;
    const srbNose = new THREE.Mesh(new THREE.ConeGeometry(0.265, 0.58, 16), hullMat);
    srbNose.rotation.x = -Math.PI / 2;
    srbNose.position.z = -0.36;
    const srbBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.29, 0.29, 0.22, 14, 1, true),
      stripeMat
    );
    srbBand.rotation.x = Math.PI / 2;
    srbBand.position.z = 0.22;
    const srbBell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.18, 0.34, 14),
      nozzleMat
    );
    srbBell.rotation.x = Math.PI / 2;
    srbBell.position.z = 2.04;
    const sFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.92, 14, 1, true),
      flameOuterMat
    );
    sFlame.rotation.x = Math.PI / 2;
    sFlame.position.z = 2.58;
    srbFlameMeshes.push(sFlame);
    root.add(body, srbNose, srbBand, srbBell, sFlame);
    root.position.set(sideSign * 1.02, -0.04, -0.06);
    root.rotation.z = sideSign * 0.2;
    rocketGroup.add(root);
  }
  attachSRB(-1);
  attachSRB(1);

  const strutGeo = new THREE.BoxGeometry(0.38, 0.09, 0.13);
  const strutL = new THREE.Mesh(strutGeo, hullMat);
  strutL.position.set(-0.5, 0.16, 0.42);
  strutL.rotation.z = 0.38;
  const strutR = new THREE.Mesh(strutGeo.clone(), hullMat);
  strutR.position.set(0.5, 0.16, 0.42);
  strutR.rotation.z = -0.38;

  rocketGroup.add(
    nose,
    dockingProbe,
    probeBall,
    capsuleRing,
    upperStage,
    cockpitDome,
    stripeRing,
    coreStage,
    sepRingA,
    sepRingB,
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
    finS,
    strutL,
    strutR
  );

  camera.position.set(0.34, 0.48, 0.76);
  camera.fov = 54;
  camera.updateProjectionMatrix();
  camera.lookAt(0.02, 0.08, -24);
  rocketGroup.add(camera);

  const hullLight = new THREE.PointLight(0xff9644, 1.9, 14, 1.85);
  hullLight.position.copy(glow.position);
  rocketGroup.add(hullLight);
  const cockpitLight = new THREE.PointLight(0xa8dcff, 1.15, 10, 1.55);
  cockpitLight.position.set(0.1, 0.36, -1.12);
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
      new THREE.SphereGeometry(radius, 40, 40),
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

    camera.fov = THREE.MathUtils.lerp(54, 82, warpIn * warpIn);
    camera.updateProjectionMatrix();

    hullLight.intensity = THREE.MathUtils.lerp(1.9, 4.35, hyp);
    const flBoost = 1 + hyp * 2.85;
    flameOuter.scale.setScalar(flBoost * (1 + Math.sin(elapsed * 31) * 0.06 * hyp));
    flameMid.scale.setScalar(flBoost * 1.08);
    flameCore.scale.setScalar(flBoost * 1.15);
    glow.scale.setScalar(1 + hyp * 1.35);
    srbFlameMeshes.forEach(function (sm) {
      sm.scale.setScalar(
        flBoost * 0.88 * (1 + Math.sin(elapsed * 33) * 0.05 * hyp)
      );
    });

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
    camera.fov = 54;
    camera.updateProjectionMatrix();
    hullLight.intensity = 1.9;
    flameOuter.scale.setScalar(1);
    flameMid.scale.setScalar(1);
    flameCore.scale.setScalar(1);
    glow.scale.setScalar(1);
    srbFlameMeshes.forEach(function (sm) {
      sm.scale.setScalar(1);
    });
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
