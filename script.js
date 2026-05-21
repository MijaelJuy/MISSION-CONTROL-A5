/**
 * Anna OS — lógica principal (Vanilla JS)
 * - Reloj
 * - Gestión de ventanas (abrir / cerrar / arrastre / z-index)
 * - Reproductor: objeto Audio (JS) → Juanes - Es Por Ti.mp3
 * - $ANNA Tracker (ApexCharts Love Candles + confeti)
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuración
  // ---------------------------------------------------------------------------

  /** Mismo contenido inicial que en index (#notepad-content) si la nota está vacía al abrir */
  const DEFAULT_NOTE_CONTENT = [
    "5 meses contigo, y cada día mi mundo (y este escritorio) se ve más bonito.",
    "",
    "",
    "Aquí hay un log rápido de todo lo que me encanta de ti:",
    "",
    "",
    "Tu acento y esas palabras de México que poco a poco se me están pegando.",
    "",
    "",
    "Cómo se te iluminan los ojos (o la voz) cuando me cuentas algo que te emociona.",
    "",
    "",
    "Que haces que la distancia desde Perú se sienta como si estuvieras aquí a mi lado, en la misma habitación.",
    "",
    "",
    "Tu paciencia infinita cuando me pongo en modo 'nerd' a programar.",
    "",
    "",
    "Tu sentido del humor, que siempre logra sacarme de cualquier bug mental.",
    "",
    "",
    "Tu sonrisa, que es literalmente el mejor render de todo mi día.",
    "",
    "",
    "Eres el mejor 'commit' que he hecho en mi vida.",
    "",
    "",
    "Te amo, Anna.",
  ].join("\n");

  const TRASH_BTN_LABEL_EMPTY = "Papelera vacía";

  const Z_INDEX = {
    base: 500,
    /** Por debajo de la barra de tareas (style.css --z-taskbar: 1000) */
    max: 999,
  };

  let zStack = Z_INDEX.base;

  /** ApexCharts Tracker (una sola instancia). */
  let annaLoveChart = null;

  /** Última altura aplicada al gráfico (evita bucles updateOptions ↔ layout). */
  let lastLoveChartPixelHeight = -1;

  function loveChartSafeHeightCeiling() {
    return Math.min(720, Math.max(260, Math.floor(window.innerHeight * 0.7)));
  }

  /**
   * Evita alturas absurdas (bucle flex + Apex) que “rompen” el eje Y o alargan el canvas.
   * @param {number} raw
   */
  function clampLoveChartHeight(raw) {
    const cap = loveChartSafeHeightCeiling();
    let h = Math.round(Number(raw));
    if (!Number.isFinite(h) || h < 80 || h > 3600) {
      h = 360;
    }
    return Math.min(cap, Math.max(240, h));
  }

  /** Ajusta altura del candlestick al hueco real del contenedor (con tope duro). */
  function reflowLoveCandlesChart() {
    const el = document.getElementById("love-chart-container");
    if (!annaLoveChart || !el) return;
    const h = clampLoveChartHeight(el.getBoundingClientRect().height || el.clientHeight);
    if (lastLoveChartPixelHeight >= 0 && Math.abs(h - lastLoveChartPixelHeight) < 5) {
      return;
    }
    lastLoveChartPixelHeight = h;
    try {
      annaLoveChart.updateOptions({ chart: { height: h } }, false, true);
    } catch (_e) {
      try {
        annaLoveChart.resize();
      } catch (_e2) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Reloj
  // ---------------------------------------------------------------------------

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function updateClock(el) {
    const now = new Date();
    el.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(
      now.getSeconds()
    )}`;
  }

  function initTaskbarClock() {
    const clockEl = document.getElementById("taskbar-clock");
    if (!clockEl) return;
    updateClock(clockEl);
    setInterval(function () {
      updateClock(clockEl);
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Capas (z-index): la ventana interactuada pasa al frente
  // ---------------------------------------------------------------------------

  /**
   * @param {HTMLElement} windowEl
   */
  function bringToFront(windowEl) {
    if (!windowEl || !windowEl.classList.contains("is-open")) return;
    zStack = Math.min(zStack + 1, Z_INDEX.max);
    windowEl.style.zIndex = String(zStack);
  }

/**
 * @param {HTMLElement} windowEl
 */
function pinWindowFromRect(windowEl) {
  if (!windowEl) return;
  const rect = windowEl.getBoundingClientRect();
  windowEl.style.left = `${Math.round(rect.left)}px`;
  windowEl.style.top = `${Math.round(rect.top)}px`;
  windowEl.style.width = `${Math.round(rect.width)}px`;
  windowEl.style.height = `${Math.round(rect.height)}px`;
  windowEl.style.maxHeight = "none";
  windowEl.style.transform = "none";
}

/**
 * @param {HTMLElement} windowEl
 * @param {boolean} visible
 */
function setWindowVisible(windowEl, visible) {
  if (!windowEl) return;

  if (visible) {
    windowEl.classList.add("is-open");
    windowEl.style.removeProperty("display");
    windowEl.hidden = false;
    windowEl.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(function () {
      if (!windowEl.classList.contains("is-positioned")) {
        pinWindowFromRect(windowEl);
        windowEl.classList.add("is-positioned");
      }
      bringToFront(windowEl);
    });
  } else {
    windowEl.classList.remove("is-open");
    windowEl.hidden = true;
    windowEl.setAttribute("aria-hidden", "true");
    windowEl.style.removeProperty("display");
  }
}

  // ---------------------------------------------------------------------------
  // Arrastre (cada ventana registrada es independiente)
  // ---------------------------------------------------------------------------

  function getNumericStyle(el, prop) {
    const v = window.getComputedStyle(el)[prop];
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * @param {Object} opts
   * @param {HTMLElement} opts.windowEl
   * @param {HTMLElement} opts.handleEl
   */
  function registerWindowDrag(opts) {
    const windowEl = opts.windowEl;
    const handleEl = opts.handleEl;
    if (!windowEl || !handleEl) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    function ensureExplicitPosition() {
      if (windowEl.classList.contains("is-positioned")) return;
      pinWindowFromRect(windowEl);
      windowEl.classList.add("is-positioned");
    }

    function onPointerDown(e) {
      if (e.target.closest(".window__close")) return;
      if (e.target.closest(".window__resize-handle")) return;

      dragging = true;
      ensureExplicitPosition();
      handleEl.classList.add("window__titlebar--dragging");
      windowEl.classList.add("is-dragging");

      startX = e.clientX;
      startY = e.clientY;
      origLeft = getNumericStyle(windowEl, "left");
      origTop = getNumericStyle(windowEl, "top");

      handleEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let nextLeft = origLeft + dx;
      let nextTop = origTop + dy;

      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const taskbar =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--taskbar-height"
          )
        ) || 44;
      const rect = windowEl.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      nextLeft = Math.min(Math.max(nextLeft, margin), vw - w - margin);
      nextTop = Math.min(
        Math.max(nextTop, margin),
        vh - taskbar - h - margin
      );

      windowEl.style.left = nextLeft + "px";
      windowEl.style.top = nextTop + "px";
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      handleEl.classList.remove("window__titlebar--dragging");
      windowEl.classList.remove("is-dragging");

      try {
        handleEl.releasePointerCapture(e.pointerId);
      } catch (_err) {}
    }

    handleEl.addEventListener("pointerdown", onPointerDown);
    handleEl.addEventListener("pointermove", onPointerMove);
    handleEl.addEventListener("pointerup", onPointerUp);
    handleEl.addEventListener("pointercancel", onPointerUp);

    window.addEventListener(
      "resize",
      function () {
        if (!windowEl.classList.contains("is-positioned")) return;
        const margin = 8;
        const taskbar =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--taskbar-height"
            )
          ) || 44;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let width = getNumericStyle(windowEl, "width");
        let height = getNumericStyle(windowEl, "height");
        if (!width || !height) {
          const rr = windowEl.getBoundingClientRect();
          width = rr.width;
          height = rr.height;
        }

        let left = getNumericStyle(windowEl, "left");
        let top = getNumericStyle(windowEl, "top");
        left = Math.min(Math.max(left, margin), vw - width - margin);
        top = Math.min(
          Math.max(top, margin),
          vh - taskbar - height - margin
        );
        windowEl.style.left = left + "px";
        windowEl.style.top = top + "px";
      },
      { passive: true }
    );
  }

  /** @param {HTMLElement} windowEl */
  function attachWindowResizeHandles(windowEl) {
    if (!windowEl || windowEl.querySelector(".window__resize-grips")) return;
    const wrap = document.createElement("div");
    wrap.className = "window__resize-grips";
    wrap.setAttribute("aria-hidden", "true");

    const edges = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
    edges.forEach(function (edge) {
      const span = document.createElement("span");
      span.className = "window__resize-handle window__resize-handle--" + edge;
      span.dataset.resize = edge;
      span.setAttribute("role", "presentation");
      wrap.appendChild(span);
    });

    windowEl.appendChild(wrap);
    registerWindowResize(windowEl);
  }

  /**
   * Redimensionar ventana arrastrando bordes / esquinas.
   * @param {HTMLElement} windowEl
   */
  function registerWindowResize(windowEl) {
    const grips = windowEl.querySelector(".window__resize-grips");
    if (!grips) return;

    const taskbarPad = function () {
      return (
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--taskbar-height"
          )
        ) || 44
      );
    };

    const readMinMax = function () {
      const minW =
        parseFloat(windowEl.getAttribute("data-min-width") || "") ||
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--window-min-width"
          )
        ) ||
        260;
      const minH = parseFloat(windowEl.getAttribute("data-min-height") || "") || 120;
      const maxW = parseFloat(windowEl.getAttribute("data-max-width") || "") || Infinity;
      const maxHVal = windowEl.getAttribute("data-max-height");
      const maxH = maxHVal ? parseFloat(maxHVal) || Infinity : Infinity;
      return { minW, minH, maxW, maxH };
    };

    let resizing = false;
    let edgeActive = "";
    let startX = 0;
    let startY = 0;
    let L0 = 0;
    let T0 = 0;
    let W0 = 0;
    let H0 = 0;
    let pendingChart = false;

    function scheduleTrackerChartReflow() {
      if (windowEl.id !== "window-tracker") return;
      if (pendingChart) return;
      pendingChart = true;
      window.requestAnimationFrame(function () {
        pendingChart = false;
        reflowLoveCandlesChart();
      });
    }

    function onPointerDown(e) {
      const t = e.target;
      if (!(t instanceof Element) || !t.classList.contains("window__resize-handle")) {
        return;
      }
      if (e.button !== 0) return;
      e.preventDefault();
      resizing = true;
      edgeActive = t.dataset.resize || "";
      if (!edgeActive) return;

      if (!windowEl.classList.contains("is-positioned")) {
        pinWindowFromRect(windowEl);
        windowEl.classList.add("is-positioned");
      }

      windowEl.classList.add("is-resizing");
      bringToFront(windowEl);

      startX = e.clientX;
      startY = e.clientY;
      L0 = getNumericStyle(windowEl, "left");
      T0 = getNumericStyle(windowEl, "top");
      const r = windowEl.getBoundingClientRect();
      W0 = r.width;
      H0 = r.height;

      try {
        grips.setPointerCapture(e.pointerId);
      } catch (_err) {}
    }

    function onPointerMove(e) {
      if (!resizing) return;
      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tb = taskbarPad();
      const { minW, minH, maxW, maxH } = readMinMax();

      const absMaxW = Math.min(maxW, vw - margin * 2);
      const absMaxH = Math.min(maxH, vh - tb - margin * 2);

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let L = L0;
      let T = T0;
      let W = W0;
      let H = H0;

      if (edgeActive.includes("e")) {
        W = W0 + dx;
      }
      if (edgeActive.includes("s")) {
        H = H0 + dy;
      }
      if (edgeActive.includes("w")) {
        const newW = W0 - dx;
        if (newW >= minW) {
          const shift = W0 - newW;
          W = newW;
          L = L0 + shift;
        }
      }
      if (edgeActive.includes("n")) {
        const newH = H0 - dy;
        if (newH >= minH) {
          const shift = H0 - newH;
          H = newH;
          T = T0 + shift;
        }
      }

      W = Math.min(Math.max(W, minW), absMaxW);
      H = Math.min(Math.max(H, minH), absMaxH);

      if (L + W > vw - margin) {
        L = vw - margin - W;
      }
      if (L < margin) L = margin;

      if (T + H > vh - tb - margin) {
        T = vh - tb - margin - H;
      }
      if (T < margin) T = margin;

      windowEl.style.left = `${Math.round(L)}px`;
      windowEl.style.top = `${Math.round(T)}px`;
      windowEl.style.width = `${Math.round(W)}px`;
      windowEl.style.height = `${Math.round(H)}px`;
      windowEl.style.maxHeight = "none";

      scheduleTrackerChartReflow();
    }

    function onPointerUp(e) {
      if (!resizing) return;
      resizing = false;
      edgeActive = "";
      windowEl.classList.remove("is-resizing");
      try {
        grips.releasePointerCapture(e.pointerId);
      } catch (_err) {}
      scheduleTrackerChartReflow();
    }

    grips.addEventListener("pointerdown", onPointerDown);
    grips.addEventListener("pointermove", onPointerMove);
    grips.addEventListener("pointerup", onPointerUp);
    grips.addEventListener("pointercancel", onPointerUp);
  }

  // ---------------------------------------------------------------------------
  // Bloc de notas
  // ---------------------------------------------------------------------------

  function onOpenNotepad() {
    const ta = document.getElementById("notepad-content");
    if (ta && !ta.value.trim()) {
      ta.value = DEFAULT_NOTE_CONTENT;
    }
  }

  // ---------------------------------------------------------------------------
  // Reproductor de música (archivo local vía Audio API; sin <audio> en el HTML)
  // ---------------------------------------------------------------------------

  /** Nombre del archivo en la carpeta del proyecto (debe coincidir con el MP3 real). */
  const PLAYER_TRACK_FILE = "Juanes - Es Por Ti.mp3";
  const PLAYER_TRACK_SRC = encodeURI(PLAYER_TRACK_FILE);

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function initMusicPlayer() {
    const audio = new Audio(PLAYER_TRACK_SRC);
    audio.preload = "metadata";

    const toggle = document.getElementById("player-toggle");
    const fill = document.getElementById("player-progress-fill");
    const metaEl = document.getElementById("player-meta");
    const wrap = document.getElementById("player-progress-wrap");
    const iconEl = toggle && toggle.querySelector(".player__play-icon");

    if (!toggle || !fill || !wrap) return;

    function setPlayingUI(playing) {
      toggle.setAttribute("aria-pressed", playing ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        playing ? "Pausar" : "Reproducir"
      );
      if (iconEl) {
        iconEl.textContent = playing ? "❚❚" : "▶";
      }
    }

    function updateProgressAria(pct) {
      wrap.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function syncProgress() {
      const d = audio.duration;
      const t = audio.currentTime;
      if (Number.isFinite(d) && d > 0) {
        const pct = (t / d) * 100;
        fill.style.width = `${pct}%`;
        updateProgressAria(pct);
        if (metaEl) {
          metaEl.textContent = `${formatTime(t)} / ${formatTime(d)}`;
        }
      } else {
        fill.style.width = "0%";
        updateProgressAria(0);
        if (metaEl) metaEl.textContent = "";
      }
    }

    toggle.addEventListener("click", function () {
      if (audio.error) return;
      if (audio.paused) {
        const p = audio.play();
        if (p && typeof p.catch === "function") {
          p.catch(function () {
            if (metaEl) {
              metaEl.textContent =
                "Coloca «" + PLAYER_TRACK_FILE + "» junto a index.html";
            }
          });
        }
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () {
      setPlayingUI(true);
    });
    audio.addEventListener("pause", function () {
      setPlayingUI(false);
    });
    audio.addEventListener("ended", function () {
      setPlayingUI(false);
      syncProgress();
    });
    audio.addEventListener("timeupdate", syncProgress);
    audio.addEventListener("loadedmetadata", function () {
      syncProgress();
      if (metaEl && !audio.error) {
        metaEl.textContent = `${formatTime(0)} / ${formatTime(audio.duration)}`;
      }
    });
    audio.addEventListener("error", function () {
      if (metaEl) {
        metaEl.textContent = "Coloca el archivo MP3 en la carpeta del proyecto";
      }
    });

    function seekFromClientX(clientX) {
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const rect = wrap.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      audio.currentTime = (x / rect.width) * d;
      syncProgress();
    }

    wrap.addEventListener("click", function (e) {
      seekFromClientX(e.clientX);
    });

    wrap.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      const delta = e.key === "ArrowLeft" ? -5 : 5;
      audio.currentTime = Math.min(Math.max(audio.currentTime + delta, 0), d);
      syncProgress();
    });

    setPlayingUI(false);
    syncProgress();
  }

  // ---------------------------------------------------------------------------
  // Papelera
  // ---------------------------------------------------------------------------

  function initTrash() {
    const list = document.getElementById("trash-list");
    const btn = document.getElementById("trash-empty-btn");
    if (!list || !btn) return;

    const ANIM_MS = 620;

    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      const items = list.querySelectorAll("[data-trash-item]");
      if (items.length === 0) return;

      btn.disabled = true;
      list.classList.add("is-emptying");

      window.setTimeout(function () {
        list.innerHTML = "";
        list.classList.remove("is-emptying");
        btn.textContent = TRASH_BTN_LABEL_EMPTY;
      }, ANIM_MS);
    });
  }

  // ---------------------------------------------------------------------------
  // $ANNA Tracker — Love Candles (ApexCharts) + confeti
  // ---------------------------------------------------------------------------
  //
  // Datos reales: 5 velas mensuales (OHLC). Edita x (ISO), dayTag y story.

  /**
   * Cinco meses de relación — estructura por vela: fecha ISO + Open, High, Low, Close.
   * Mes 3: cuerpo alcista con mecha baja larga (soporte en 120) + tooltip “Gran Corrección Hanger”.
   */
  const LOVE_CANDLE_ROWS = [
    {
      x: "2025-12-15T12:00:00",
      dayTag: "Mes 1",
      o: 100,
      h: 150,
      l: 90,
      c: 140,
      story:
        "Mes 1: El despliegue a producción. Cuando empezamos a hablar y me di cuenta que la mejor conexión no era la de internet, sino contigo hasta México. ❤️",
    },
    {
      x: "2026-01-15T12:00:00",
      dayTag: "Mes 2",
      o: 140,
      h: 180,
      l: 130,
      c: 170,
      story:
        "Mes 2: Acortando el ping. Esas desveladas en llamada y nuestras primeras citas virtuales. El índice de 'Extrañitis' empezó a cotizar al alza. 📈",
    },
    {
      x: "2026-02-15T12:00:00",
      dayTag: "Mes 3",
      o: 170,
      h: 190,
      l: 120,
      c: 180,
      story:
        "Mes 3: La 'Gran Corrección Hanger'. Pequeña caída del mercado porque tenías hambre y no decidíamos qué pedir de cenar a la distancia. Igual te amo enojadita. 🌮😡❤️",
    },
    {
      x: "2026-03-15T12:00:00",
      dayTag: "Mes 4",
      o: 180,
      h: 250,
      l: 170,
      c: 240,
      story:
        "Mes 4: Rompiendo resistencias. Cuando jugamos juntos y confirmamos que hacemos el mejor dúo. Mi nivel de dopamina rompió todos los gráficos. 🎮✨",
    },
    {
      x: "2026-05-15T12:00:00",
      dayTag: "Mes 5",
      o: 240,
      h: 350,
      l: 230,
      c: 340,
      story:
        "Mes 5: ¡A LA LUNA! 🚀 Hoy cumplimos 5 meses. Eres mi notificación favorita y mi proyecto de vida. ¡A invertir por todos los meses que vienen! 🌕❤️",
    },
  ];



  /** Lee --anna-candle-bull / --anna-candle-bear desde style.css (única fuente de verdad cromática). */
  function getLoveCandleColorsFromTheme() {
    const cs = getComputedStyle(document.documentElement);
    return {
      bull: (cs.getPropertyValue("--anna-candle-bull").trim() || "#a8dfc4"),
      bear: (cs.getPropertyValue("--anna-candle-bear").trim() || "#f2bdd4"),
    };
  }

  function buildLoveCandleSeriesData() {
    return LOVE_CANDLE_ROWS.map(function (row) {
      return {
        x: new Date(row.x).getTime(),
        y: [row.o, row.h, row.l, row.c],
      };
    });
  }

  /** Altura efectiva del contenedor Apex (con tope; evita “altura infinita”). */
  function readLoveChartPixelHeight() {
    const el = document.getElementById("love-chart-container");
    if (!el) return clampLoveChartHeight(380);
    const r = el.getBoundingClientRect().height || el.clientHeight;
    return clampLoveChartHeight(r || 380);
  }

  /**
   * Primera apertura: render. Siguientes: resize por si el layout cambió.
   */
  function initAnnaTrackerChart() {
    if (typeof ApexCharts === "undefined") {
      return;
    }
    const el = document.getElementById("love-chart-container");
    if (!el) return;

    if (annaLoveChart) {
      window.requestAnimationFrame(function () {
        lastLoveChartPixelHeight = -1;
        reflowLoveCandlesChart();
      });
      return;
    }

    const candleColors = getLoveCandleColorsFromTheme();

    const chartH = readLoveChartPixelHeight();

    const options = {
      series: [
        {
          name: "AMOR ($ANNA)",
          data: buildLoveCandleSeriesData(),
        },
      ],
      chart: {
        type: "candlestick",
        height: chartH,
        width: "100%",
        background: "transparent",
        toolbar: {
          show: true,
          tools: { download: false },
        },
        zoom: { enabled: true },
        fontFamily: '"VT323", "Consolas", monospace',
        foreColor: "#4a3a5c",
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 700,
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: { colors: "#7a6588", fontSize: "14px" },
        },
        axisBorder: { color: "#dcc8ec" },
        axisTicks: { color: "#dcc8ec" },
      },
      yaxis: {
        tooltip: { enabled: true },
        labels: {
          style: { colors: "#7a6588", fontSize: "15px" },
          formatter: function (val) {
            return val.toFixed(0);
          },
        },
      },
      grid: {
        borderColor: "#e8dcf5",
        strokeDashArray: 4,
      },
      plotOptions: {
        candlestick: {
          colors: {
            upward: candleColors.bull,
            downward: candleColors.bear,
          },
        },
      },
      tooltip: {
        theme: "light",
        custom: function (opts) {
          const w = opts.w || {};
          const g = w.globals || {};
          const idx =
            typeof opts.dataPointIndex === "number"
              ? opts.dataPointIndex
              : typeof g.dataPointIndex === "number"
                ? g.dataPointIndex
                : 0;
          const row = LOVE_CANDLE_ROWS[idx];
          if (!row) return "";
          const d = new Date(row.x);
          const dateStr = d.toLocaleDateString("es", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            '<div class="anna-love-tooltip">' +
            '<span class="anna-love-tooltip__date">' +
            row.dayTag +
            " · " +
            dateStr +
            "</span>" +
            '<span class="anna-love-tooltip__ohlc">Apertura ' +
            row.o +
            " · Máx " +
            row.h +
            " · Mín " +
            row.l +
            " · Cierre " +
            row.c +
            "</span>" +
            "<span>" +
            row.story +
            "</span>" +
            "</div>"
          );
        },
      },
    };

    annaLoveChart = new ApexCharts(el, options);
    annaLoveChart.render();

    lastLoveChartPixelHeight = -1;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(reflowLoveCandlesChart);
    });
  }

  /**
   * Confeti romántico (capa fija, por encima del escritorio, debajo de la barra de tareas).
   */
  function launchLoveConfetti() {
    const root = document.createElement("div");
    root.className = "confetti-root is-active";
    root.setAttribute("aria-hidden", "true");

    const pastel = [
      "#ffb7d5",
      "#b8f2e6",
      "#ffd4c4",
      "#d4c4ff",
      "#fff8fc",
      "#9fe0b3",
      "#f5a9c8",
    ];

    const n = 72;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw";
      p.style.backgroundColor = pastel[Math.floor(Math.random() * pastel.length)];
      p.style.animationDuration = 1.9 + Math.random() * 1.4 + "s";
      p.style.animationDelay = Math.random() * 0.25 + "s";
      p.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      root.appendChild(p);
    }

    document.body.appendChild(root);
    window.setTimeout(function () {
      root.remove();
    }, 3200);
  }

  function initAnnaBuyButton() {
    const btn = document.getElementById("anna-buy-love-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      launchLoveConfetti();
    });
  }

  function onOpenTracker() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(initAnnaTrackerChart);
    });
  }

  // ---------------------------------------------------------------------------
  // Iconos del escritorio y ventanas
  // ---------------------------------------------------------------------------

  /**
   * Mapa data-app → id de ventana y hook al abrir
   * @type {Record<string, { windowId: string, onOpen?: () => void }>}
   */
  const APP_WINDOWS = {
    notepad: { windowId: "window-notepad", onOpen: onOpenNotepad },
    player: { windowId: "window-player" },
    trash: { windowId: "window-trash" },
    tracker: { windowId: "window-tracker", onOpen: onOpenTracker },
  };

  function wireDesktopIcons() {
    const icons = document.querySelectorAll(".desktop-icon[data-app]");
    icons.forEach(function (icon) {
      const app = icon.getAttribute("data-app");
      const cfg = app && APP_WINDOWS[app];
      if (!cfg) return;

      function open() {
        const win = document.getElementById(cfg.windowId);
        if (!win) return;
        setWindowVisible(win, true);
        if (typeof cfg.onOpen === "function") cfg.onOpen();
      }

      icon.addEventListener("dblclick", function (e) {
        e.preventDefault();
        open();
      });

      icon.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function wireCloseButtons() {
    const pairs = [
      ["notepad-close", "window-notepad"],
      ["player-close", "window-player"],
      ["trash-close", "window-trash"],
      ["tracker-close", "window-tracker"],
    ];
    pairs.forEach(function (pair) {
      const btn = document.getElementById(pair[0]);
      const winId = pair[1];
      if (!btn) return;
      btn.addEventListener("click", function () {
        const win = document.getElementById(winId);
        setWindowVisible(win, false);
      });
    });
  }

  /** Clic en cualquier parte de la ventana (no solo título) la trae al frente */
  function wireWindowFocusOnMouseDown() {
    document.querySelectorAll(".window.window--draggable").forEach(function (win) {
      win.addEventListener(
        "mousedown",
        function () {
          bringToFront(win);
        },
        true
      );
    });
  }

  function wireWindowResizeRails() {
    document.querySelectorAll(".window.window--draggable").forEach(function (win) {
      attachWindowResizeHandles(win);
    });
  }

  function wireAllDrags() {
    const setups = [
      ["window-notepad", "notepad-titlebar"],
      ["window-player", "player-titlebar"],
      ["window-trash", "trash-titlebar"],
      ["window-tracker", "tracker-titlebar"],
    ];
    setups.forEach(function (pair) {
      const windowEl = document.getElementById(pair[0]);
      const handle = document.getElementById(pair[1]);
      registerWindowDrag({ windowEl: windowEl, handleEl: handle });
    });
  }

  function wireStartButton() {
    const startBtn = document.getElementById("btn-start");
    if (!startBtn) return;
    startBtn.addEventListener("click", function () {
      startBtn.classList.toggle("is-pressed");
      window.setTimeout(function () {
        startBtn.classList.remove("is-pressed");
      }, 150);
    });
  }

  // ---------------------------------------------------------------------------
  // Inicialización
  // ---------------------------------------------------------------------------

  function init() {
    initTaskbarClock();
    wireDesktopIcons();
    wireCloseButtons();
    wireWindowFocusOnMouseDown();
    wireWindowResizeRails();
    wireAllDrags();
    initMusicPlayer();
    initTrash();
    initAnnaBuyButton();
    wireStartButton();

    window.addEventListener(
      "resize",
      function () {
        window.requestAnimationFrame(reflowLoveCandlesChart);
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
