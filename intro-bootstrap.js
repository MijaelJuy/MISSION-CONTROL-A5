/**
 * Anna OS — Carga la intro según el protocolo:
 * - http/https → `intro-cinematic.js` como ES module (Three vía import map).
 * - file:// → Three UMD + `space-journey-global.js` + `intro-cinematic-global.js` (Chrome bloquea módulos en disco).
 */
(function () {
  "use strict";

  function injectModuleIntro() {
    var s = document.createElement("script");
    s.type = "module";
    s.src = "intro-cinematic.js";
    document.head.appendChild(s);
  }

  function appendScript(src, onload, onerror) {
    var el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.onload = onload;
    el.onerror =
      onerror ||
      function () {
        console.error("[Anna intro] No se pudo cargar:", src);
      };
    document.head.appendChild(el);
  }

  var proto = typeof location !== "undefined" ? location.protocol : "";
  if (proto !== "file:") {
    injectModuleIntro();
    return;
  }

  /** UMD compatible con `space-journey-global.js` (Three ≥ r152 tiene APIs usadas aquí). */
  var THREE_CDN =
    "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js";

  appendScript(THREE_CDN, function () {
    appendScript("space-journey-global.js", function () {
      appendScript("intro-cinematic-global.js");
    });
  });
})();
