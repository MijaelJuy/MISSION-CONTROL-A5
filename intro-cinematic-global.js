/**
 * Anna OS — Intro (bundle sin ES modules): zoom GSAP → Three global (`space-journey-global.js`).
 *
 * Se carga solo en file:// vía intro-bootstrap.js. HTTP(S) usa intro-cinematic.js como módulo.
 */
/// <reference lib="dom" />

/** El snippet inline debe definir un no-op antes; aquí preservamos ese valor hasta bootstrap(). */
window.__AnnaIntroDrainKickMaybe =
  typeof window.__AnnaIntroDrainKickMaybe === "function"
    ? window.__AnnaIntroDrainKickMaybe
    : function () {};

const LOVE_LINES = [
  "Iniciando secuencia de acoplamiento a la galaxia de Anna...",
  'La gravedad de un agujero negro no es nada comparada con la fuerza con la que me atraes.',
  "Órbita estable. Sistemas de soporte vital al 100%... igual que mi amor por ti.",
  "Acelerando a velocidad de escape en 3, 2, 1...",
];

const GATE_PROGRESS = [0.06, 0.3, 0.53, 0.75];

/**
 * Centro del zoom sobre `intro-room-pixel-art.png` (~1024×687): centro del monitor principal (VS Code).
 */
const MONITOR_TRANSFORM_ORIGIN = "48.5% 31%";

/** @returns {Promise<typeof gsap>} */
function waitForGsap() {
  const maxAttempts = 250;
  return new Promise(function (resolve, reject) {
    let n = 0;
    function tryGsap() {
      const G = typeof window !== "undefined" ? window.gsap : undefined;
      if (G) resolve(G);
      else if (++n > maxAttempts) reject(new Error("GSAP no disponible."));
      else window.setTimeout(tryGsap, 22);
    }
    tryGsap();
  });
}

function finishAnnaIntro(gsapLib, journey, /** @type {HTMLElement} */ root) {
  if (journey) {
    try {
      journey.stop?.();
    } catch (_e) {}
    try {
      journey.__removeListeners?.();
    } catch (_e1) {}
    try {
      journey.dispose?.();
    } catch (_e2) {}
  }
  try {
    gsapLib.killTweensOf(root.querySelectorAll("*"));
    gsapLib.killTweensOf(root);
  } catch (_e3) {}
  root.remove();
  window.__AnnaIntroDrainKickMaybe = function () {};
  document.documentElement.classList.remove("anna-intro--active");
  document.body.style.overflow = "";
  window.dispatchEvent(new CustomEvent("anna-intro-complete", { bubbles: true }));
}

function syncLoveOverlays(gsInner, overlayEls, linePlayed, progress) {
  GATE_PROGRESS.forEach(function (gate, i) {
    if (linePlayed[i] || progress < gate || !overlayEls[i]) return;
    linePlayed[i] = true;
    const el = overlayEls[i];
    gsInner
      .timeline()
      .fromTo(
        el,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 1.05, ease: "power2.out" }
      )
      .to(el, {
        delay: 2.95,
        autoAlpha: 0,
        y: -8,
        duration: 1.15,
        ease: "power2.inOut",
      });
  });
}

async function bootstrap() {
  const root = document.getElementById("anna-intro");
  const canvas = document.getElementById("anna-intro-three-canvas");
  const hypersplash = /** @type {HTMLElement | null} */ (
    root && root.querySelector("#anna-intro-hypersplash")
  );

  if (!root || !(canvas instanceof HTMLCanvasElement)) {
    if (root) root.remove();
    document.documentElement.classList.remove("anna-intro--active");
    document.body.style.overflow = "";
    window.__AnnaIntroDrainKickMaybe = function () {};
    return;
  }

  document.documentElement.classList.add("anna-intro--active");
  document.body.style.overflow = "hidden";
  root.tabIndex = 0;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.style.cursor = "pointer";
  root.setAttribute(
    "aria-label",
    "Introducción. Pulsa cualquier tecla o el área táctil para iniciar."
  );

  /** @type {null | { start?: Function; stop?: Function; dispose?: Function; fitSize?: Function; __removeListeners?: Function }} */
  let journey = null;

  /** @type {undefined | Function} */
  let createJourneyFn;

  /** @type {typeof gsap | undefined} */
  let gsapLib;

  const primePromise = (async function prime() {
    try {
      gsapLib = await waitForGsap();
    } catch (_) {
      gsapLib = undefined;
      return;
    }
    if (typeof window.createAnnaSpaceJourney === "function") {
      createJourneyFn = window.createAnnaSpaceJourney;
    } else {
      console.warn(
        "[Anna intro] window.createAnnaSpaceJourney ausente (¿Three + space-journey-global?). Modo degradado."
      );
      createJourneyFn = undefined;
    }
    if (!gsapLib) return;

    try {
      if (createJourneyFn) {
        try {
          journey = createJourneyFn(canvas, { durationSec: 24 });
        } catch (e2) {
          console.warn("[Anna intro] createAnnaSpaceJourney falló:", e2);
          journey = null;
        }
      }

      gsapLib.set(canvas, {
        opacity: 0,
        force3D: true,
        willChange: "opacity",
      });
      if (hypersplash)
        gsapLib.set(hypersplash, { visibility: "hidden", opacity: 0 });

      const overlayHost = /** @type {HTMLElement | null} */ (
        root.querySelector("[data-intro-overlays]")
      );
      LOVE_LINES.forEach(function (text) {
        const row = document.createElement("p");
        row.className = "anna-intro__love-overlay-line";
        row.textContent = text;
        row.setAttribute("aria-hidden", "true");
        overlayHost?.appendChild(row);
      });

      const overlays = Array.from(root.querySelectorAll(".anna-intro__love-overlay-line"));
      overlays.forEach(function (el) {
        gsapLib.set(el, { autoAlpha: 0 });
      });
    } catch (e3) {
      console.warn("[Anna intro] Prep GSAP / overlays:", e3);
    }
  })();

  let sequenceStarted = false;
  /** Evita dos ignite() concurrentes antes de fijar sequenceStarted. */
  let igniteBusy = false;

  function drainKickQueue() {
    const pending = (window.__annaIntroKickCount | 0) > 0;
    window.__annaIntroKickCount = 0;
    if (!pending || sequenceStarted || igniteBusy) return;

    igniteBusy = true;
    void ignite().catch(function (err) {
      console.error("[Anna intro]", err);
      finishFallback();
    }).finally(function () {
      igniteBusy = false;
    });
  }

  window.__AnnaIntroDrainKickMaybe = drainKickQueue;

  function finishFallback() {
    try {
      root.remove();
    } catch (_e) {}
    window.__AnnaIntroDrainKickMaybe = function () {};
    document.documentElement.classList.remove("anna-intro--active");
    document.body.style.overflow = "";
    window.dispatchEvent(new CustomEvent("anna-intro-complete", { bubbles: true }));
  }

  function runExitHypersplash(gsInner) {
    if (!hypersplash) {
      if (gsapLib)
        finishAnnaIntro(gsInner, journey, root);
      else finishFallback();
      return;
    }

    gsInner.killTweensOf(hypersplash);
    gsInner.killTweensOf(canvas);
    gsInner.set(hypersplash, {
      visibility: "visible",
      opacity: 0,
      scale: 0.035,
      transformOrigin: "50% 50%",
    });

    gsInner
      .timeline()
      .to(hypersplash, {
        opacity: 1,
        scale: 7,
        duration: 0.48,
        ease: "power3.out",
      })
      .to(
        hypersplash,
        {
          scale: 54,
          duration: 2.75,
          ease: "power4.in",
        },
        "-=0.06"
      )
      .to(
        canvas,
        {
          opacity: 0,
          duration: 1.28,
          ease: "power3.inOut",
          filter: "brightness(2.1) saturate(1.35)",
        },
        "-=2.42"
      )
      .to(
        hypersplash,
        {
          opacity: 0,
          duration: 1,
          ease: "power2.inOut",
          scale: 64,
        },
        "-=0.92"
      )
      .call(function () {
        finishAnnaIntro(gsInner, journey, root);
      });
  }

  async function ignite() {
    await primePromise;

    /** @type {typeof gsap | undefined} */
    const GS = gsapLib;
    if (!GS) {
      finishFallback();
      return;
    }

    if (sequenceStarted) return;
    sequenceStarted = true;

    const overlayEls = Array.from(
      root.querySelectorAll(".anna-intro__love-overlay-line")
    );
    /** @type {boolean[]} */
    let linePlayed = overlayEls.map(() => false);

    const pixelLayer = /** @type {HTMLElement | null} */ (
      root.querySelector("#anna-intro-pixel-layer")
    );
    const cta = /** @type {HTMLElement | null} */ (root.querySelector("#anna-intro-cta"));

    if (pixelLayer) {
      GS.set(pixelLayer, {
        transformOrigin: MONITOR_TRANSFORM_ORIGIN,
        force3D: true,
        willChange: "transform,opacity",
      });
    }

    journey?.fitSize?.();

    if (cta) cta.classList.remove("anna-intro__cta--blink");

    const zoomTl = GS.timeline();
    if (cta) zoomTl.to(cta, { opacity: 0, duration: 0.24, ease: "power2.inOut" });
    if (pixelLayer) {
      zoomTl.to(
        pixelLayer,
        {
          scale: 12,
          opacity: 0,
          duration: 2,
          ease: "power4.in",
        },
        cta ? 0.04 : 0
      );
    }
    zoomTl.to(canvas, { opacity: 1, duration: 0.55, ease: "power2.out" }, "-=0.9");

    zoomTl.add(function startFlight() {
      if (journey) {
        journey.start({
          onAfterFrame: function (frame) {
            syncLoveOverlays(GS, overlayEls, linePlayed, frame.progress);
          },
          onComplete: function () {
            runExitHypersplash(GS);
          },
        });
        return;
      }

      linePlayed = overlayEls.map(() => false);
      const drv = { t: 0 };
      GS.timeline()
        .to(drv, {
          t: 1,
          duration: 22,
          ease: "none",
          onUpdate: function () {
            syncLoveOverlays(GS, overlayEls, linePlayed, drv.t);
          },
        })
        .add(function () {
          runExitHypersplash(GS);
        });
    }, "-=0.35");
  }

  void primePromise.finally(function () {
    drainKickQueue();
  });

  queueMicrotask(function () {
    try {
      root.focus({ preventScroll: true });
    } catch (_) {}
  });

  console.info("[Anna intro] Lista (modo script global file://).");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
