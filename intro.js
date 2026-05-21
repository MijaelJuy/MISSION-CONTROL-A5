/**
 * Fallback para navegadores sin soporte ES modules (<script nomodule>).
 * La intro completa está en intro-cinematic.js (+ space-journey.js + Three desde el import map).
 * En GitHub Pages abre siempre desde HTTPS para que carguen los módulos y CDN.
 */
(function () {
  "use strict";

  document.documentElement.classList.remove("anna-intro--active");
  document.body.style.overflow = "";

  var root = document.getElementById("anna-intro");
  if (root) {
    root.remove();
  }

  window.dispatchEvent(
    new CustomEvent("anna-intro-complete", { bubbles: true })
  );
})();
