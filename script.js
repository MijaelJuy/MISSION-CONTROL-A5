/**
 * Anna OS — lógica principal (Vanilla JS)
 * - Reloj
 * - Gestión de ventanas (abrir / cerrar / arrastre / z-index)
 * - Reproductor: objeto Audio (JS) → nuestra_cancion.mp3
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
   * @param {boolean} visible
   */
  function setWindowVisible(windowEl, visible) {
    if (!windowEl) return;

    if (visible) {
      windowEl.classList.add("is-open");
      windowEl.style.display = "block";
      windowEl.hidden = false;
      windowEl.setAttribute("aria-hidden", "false");
      bringToFront(windowEl);
    } else {
      windowEl.classList.remove("is-open");
      windowEl.style.display = "none";
      windowEl.hidden = true;
      windowEl.setAttribute("aria-hidden", "true");
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
      const rect = windowEl.getBoundingClientRect();
      windowEl.style.left = rect.left + "px";
      windowEl.style.top = rect.top + "px";
      windowEl.classList.add("is-positioned");
    }

    function onPointerDown(e) {
      if (e.target.closest(".window__close")) return;

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
      const rect = windowEl.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      nextLeft = Math.min(Math.max(nextLeft, margin), vw - w - margin);
      nextTop = Math.min(Math.max(nextTop, margin), vh - h - margin);

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
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = windowEl.getBoundingClientRect();
        let left = getNumericStyle(windowEl, "left");
        let top = getNumericStyle(windowEl, "top");
        left = Math.min(Math.max(left, margin), vw - rect.width - margin);
        top = Math.min(Math.max(top, margin), vh - rect.height - margin);
        windowEl.style.left = left + "px";
        windowEl.style.top = top + "px";
      },
      { passive: true }
    );
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

  const PLAYER_TRACK_SRC = "nuestra_cancion.mp3";

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
              metaEl.textContent = "Añade nuestra_cancion.mp3 junto a index.html";
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

  /** Instancia ApexCharts (una sola) */
  let annaLoveChart = null;

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
        annaLoveChart.resize();
      });
      return;
    }

    const candleColors = getLoveCandleColorsFromTheme();

    const options = {
      series: [
        {
          name: "AMOR ($ANNA)",
          data: buildLoveCandleSeriesData(),
        },
      ],
      chart: {
        type: "candlestick",
        height: 300,
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
      initAnnaTrackerChart();
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
    wireAllDrags();
    initMusicPlayer();
    initTrash();
    initAnnaBuyButton();
    wireStartButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
