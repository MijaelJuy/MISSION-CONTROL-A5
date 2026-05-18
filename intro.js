/**
 * Anna OS — Intro cinemática GSAP + programador.gif / cohete.gif
 * Overlay fijo sobre el escritorio; al terminar se elimina sin tocar Anna OS debajo.
 */
(function () {
  "use strict";

  const CLIMAX_TEXT =
    "El amor que siento por ti es tan infinito como el espacio...\n\n" +
    "Misión Anna-05: LISTA PARA EL DESPEGUE.";

  const STAR_FAST = 8.6;

  /** @param {*} gsapLib @param {HTMLElement} container */
  function createStarField(gsapLib, container) {
    const tweens = [];
    const ih = Math.max(window.innerHeight || 560, 400);
    const n = Math.min(160, Math.floor(window.innerWidth / 8) + 75);

    for (let i = 0; i < n; i++) {
      const dot = document.createElement("span");
      dot.className = "anna-intro__star";
      const sz = 1 + Math.random() * 2.4;
      dot.style.width = sz + "px";
      dot.style.height = sz + "px";
      dot.style.opacity = String(0.38 + Math.random() * 0.62);
      dot.style.left = Math.random() * 100 + "%";
      dot.style.top = "-" + Math.random() * ih * 0.5 + "px";
      container.appendChild(dot);

      const tw = gsapLib.fromTo(
        dot,
        {
          y: function () {
            return gsapLib.utils.random(-ih * 0.95, -8);
          },
        },
        {
          y: function () {
            return ih + gsapLib.utils.random(24, 200);
          },
          duration: function () {
            return gsapLib.utils.random(0.35, 1.35);
          },
          repeat: -1,
          repeatRefresh: true,
          ease: "none",
          delay: Math.random() * 1.8,
        }
      );
      tweens.push(tw);
    }

    const knob = { s: 1 };

    return {
      setSpeed(mult) {
        const m = Math.max(0.12, mult);
        tweens.forEach(function (tw) {
          tw.timeScale(m);
        });
      },
      slowdownTo(mult, duration) {
        knob.s = tweens.length ? tweens[0].timeScale() : STAR_FAST;
        return gsapLib.to(knob, {
          s: mult,
          duration: duration,
          ease: "power3.out",
          onUpdate: function () {
            tweens.forEach(function (tw) {
              tw.timeScale(knob.s);
            });
          },
        });
      },
      kill() {
        tweens.forEach(function (tw) {
          tw.kill();
        });
        tweens.length = 0;
        container.innerHTML = "";
      },
    };
  }

  /** @param {*} gsapLib @param {HTMLElement} el @param {string} full */
  function runTypewriter(gsapLib, el, full, done) {
    el.textContent = "";
    let i = 0;
    function tick() {
      if (i >= full.length) {
        if (done) done();
        return;
      }
      el.textContent += full.charAt(i++);
      gsapLib.delayedCall(0.028, tick);
    }
    tick();
  }

  /** @param {*} gsapLib @param {HTMLElement} root @param {*} starsCtl */
  function finishIntro(gsapLib, root, starsCtl) {
    if (starsCtl) starsCtl.kill();
    gsapLib.killTweensOf(root.querySelectorAll("*"));
    gsapLib.killTweensOf(root);
    root.remove();
    document.documentElement.classList.remove("anna-intro--active");
    document.body.style.overflow = "";
    window.dispatchEvent(
      new CustomEvent("anna-intro-complete", { bubbles: true })
    );
  }

  /** @param {*} gsapLib @param {HTMLElement} root */
  function runIntro(gsapLib, root) {
    const flash = root.querySelector("#anna-intro-flash");
    const phase1 = root.querySelector("#anna-intro-phase1");
    const phase2 = root.querySelector("#anna-intro-phase2");
    const devImg = root.querySelector("#anna-intro-dev-img");
    const cta = root.querySelector("#anna-intro-cta");
    const starsLayer = root.querySelector("#anna-intro-stars");
    const mount = root.querySelector("#anna-intro-rocket-mount");
    const shaker = root.querySelector("#anna-intro-rocket-shake");
    const msg = root.querySelector("#anna-intro-msg");

    if (
      !flash ||
      !phase1 ||
      !phase2 ||
      !devImg ||
      !cta ||
      !starsLayer ||
      !mount ||
      !shaker ||
      !msg
    ) {
      root.remove();
      document.documentElement.classList.remove("anna-intro--active");
      document.body.style.overflow = "";
      return;
    }

    gsapLib.set(devImg, { transformOrigin: "50% 50%", willChange: "transform,opacity" });

    document.documentElement.classList.add("anna-intro--active");
    document.body.style.overflow = "hidden";
    gsapLib.set(root, { userSelect: "none", cursor: "pointer" });

    let ignited = false;
    /** @type {ReturnType<typeof createStarField> | null} */
    let starsCtl = null;

    const rocketDur = 2.78;
    const stepShake = 0.065;

    function ignite() {
      if (ignited) return;
      ignited = true;
      root.style.cursor = "default";
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointerdown", onPointer);

      cta.classList.remove("anna-intro__cta--blink");

      const master = gsapLib.timeline();

      master.to(cta, { opacity: 0, duration: 0.22, ease: "power2.inOut" });

      master.to(devImg, {
        scale: 5.85,
        opacity: 0,
        duration: 1.06,
        ease: "power4.in",
      });

      master.to(flash, { opacity: 1, duration: 0.06, ease: "none" });
      master.to(flash, {
        opacity: 0,
        duration: 0.14,
        ease: "power2.out",
        onComplete: function () {
          gsapLib.set(flash, { clearProps: "opacity" });
        },
      });

      master.set(phase1, { autoAlpha: 0 });

      master.call(function prepSpaceLayer() {
        root.classList.add("anna-intro--spacebg");
        phase2.style.visibility = "visible";
        phase2.setAttribute("aria-hidden", "false");
      });

      master.fromTo(
        phase2,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.42, ease: "power2.out" }
      );

      master.call(
        function startWarp() {
          phase2.classList.add("is-stars-visible");
          starsCtl = createStarField(gsapLib, starsLayer);
          starsCtl.setSpeed(STAR_FAST);
        },
        [],
        "-=0.25"
      );

      gsapLib.set(mount, {
        left: "5%",
        bottom: "8%",
        top: "auto",
        right: "auto",
      });
      gsapLib.set(shaker, { x: 0, y: 0, rotation: 0, clearProps: "transform" });

      /** Vuelo + vibración paralelos; el shake sólo existe dentro de esta sublínea de tiempo del master. */
      const flightTimeline = gsapLib.timeline();

      flightTimeline.to(
        shaker,
        {
          x: function () {
            return gsapLib.utils.random(-6.5, 6.5);
          },
          y: function () {
            return gsapLib.utils.random(-5, 5);
          },
          rotation: function () {
            return gsapLib.utils.random(-2.8, 2.8);
          },
          duration: stepShake,
          repeat: -1,
          repeatRefresh: true,
          ease: "none",
        },
        0
      );

      flightTimeline.to(
        mount,
        {
          left: "50%",
          top: "50%",
          bottom: "auto",
          xPercent: -50,
          yPercent: -50,
          duration: rocketDur,
          ease: "power2.inOut",
          force3D: true,
          onComplete: function () {
            gsapLib.killTweensOf(shaker);
            gsapLib.set(shaker, { clearProps: "transform" });

            if (starsCtl) {
              starsCtl.slowdownTo(0.72, 1.92);
            }

            gsapLib.set(msg, { visibility: "visible" });
            gsapLib.to(msg, {
              autoAlpha: 1,
              duration: 0.55,
              ease: "power2.out",
              onComplete: function () {
                runTypewriter(gsapLib, msg, CLIMAX_TEXT, function afterTyping() {
                  gsapLib.delayedCall(3.5, function slowExit() {
                    gsapLib.to(root, {
                      autoAlpha: 0,
                      duration: 2.35,
                      ease: "power1.inOut",
                      onComplete: function () {
                        finishIntro(gsapLib, root, starsCtl);
                      },
                    });
                  });
                });
              },
            });
          },
        },
        0
      );

      master.add(flightTimeline, "<+=0.05");
    }

    function onKeyDown(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        ignite();
      }
    }

    function onPointer() {
      ignite();
    }

    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("pointerdown", onPointer);

    queueMicrotask(function () {
      try {
        root.focus({ preventScroll: true });
      } catch (_) {}
    });
  }

  function boot() {
    const root = document.getElementById("anna-intro");
    const GS = window.gsap;

    if (!root) return;
    if (typeof GS === "undefined") {
      root.remove();
      document.documentElement.classList.remove("anna-intro--active");
      document.body.style.overflow = "";
      return;
    }

    runIntro(GS, root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
