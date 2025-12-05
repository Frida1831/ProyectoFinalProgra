// js/accesibilidad.js

// ===============================
// FUNCIONES AUXILIARES POR USUARIO
// ===============================

// Devuelve una clave de localStorage personalizada por usuario.
// Ejemplos:
//  - getAccessKey("theme") → "theme_5" si el usuario.id = 5
//  - getAccessKey("zoom")  → "zoom_5"
function getAccessKey(base) {
  const usuarioJSON = localStorage.getItem("usuario");
  if (!usuarioJSON) return base + "_guest";

  try {
    const usuario = JSON.parse(usuarioJSON);
    if (usuario && usuario.id) {
      return base + "_" + usuario.id;
    }
    return base + "_guest";
  } catch (err) {
    console.error("Error leyendo usuario para accesibilidad:", err);
    return base + "_guest";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Evitar duplicar si por algo se carga más de una vez
  if (document.querySelector(".access-widget")) return;

  const widget = document.createElement("div");
  widget.className = "access-widget";

  widget.innerHTML = `
    <button class="access-toggle" aria-label="Opciones de accesibilidad">
      <i class="fa-solid fa-universal-access"></i>
    </button>

    <div class="access-panel" aria-label="Panel de accesibilidad">
      <!-- Contraste -->
      <div class="access-section">
        <h4>Contraste</h4>
        <div class="access-row">
          <span>Modo oscuro</span>
          <label class="access-switch">
            <input type="checkbox" id="chkDarkMode">
            <span>Activar</span>
          </label>
        </div>
      </div>

      <!-- Tamaño de texto (zoom) -->
      <div class="access-section">
        <h4>Tamaño de texto</h4>
        <div class="access-row">
          <span>
            <i class="fa-solid fa-magnifying-glass"></i> Zoom
          </span>
          <div class="zoom-control">
            <button type="button" class="zoom-btn" data-dir="down">−</button>
            <span class="zoom-label" id="zoomLabel">100%</span>
            <button type="button" class="zoom-btn" data-dir="up">+</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  // Referencias
  const toggleBtn = widget.querySelector(".access-toggle");
  const panel = widget.querySelector(".access-panel");
  const chkDarkMode = widget.querySelector("#chkDarkMode");
  const zoomLabel = widget.querySelector("#zoomLabel");
  const zoomButtons = widget.querySelectorAll(".zoom-btn");

  // 1. Cargar preferencias guardadas (POR USUARIO)
  const savedTheme = localStorage.getItem(getAccessKey("theme")) || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    chkDarkMode.checked = true;
  }

  const ZOOM_MIN = 80;
  const ZOOM_MAX = 140;
  const ZOOM_STEP = 10;

  let currentZoom = parseInt(
    localStorage.getItem(getAccessKey("zoom")) || "100",
    10
  );
  if (isNaN(currentZoom)) currentZoom = 100;

  aplicarZoom(currentZoom);

  // 2. Funciones

  function aplicarZoom(valor) {
    if (valor < ZOOM_MIN) valor = ZOOM_MIN;
    if (valor > ZOOM_MAX) valor = ZOOM_MAX;

    currentZoom = valor;

    // ✨ Aquí escalamos TODA la página cambiando el font-size del html
    document.documentElement.style.fontSize = valor + "%";

    zoomLabel.textContent = valor + "%";
    localStorage.setItem(getAccessKey("zoom"), String(valor));
  }

  // 3. Eventos

  // Abrir/cerrar panel
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("show");
  });

  // Cerrar panel si se hace clic fuera
  document.addEventListener("click", (e) => {
    if (!widget.contains(e.target)) {
      panel.classList.remove("show");
    }
  });

  // Modo oscuro
  chkDarkMode.addEventListener("change", () => {
    if (chkDarkMode.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem(getAccessKey("theme"), "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem(getAccessKey("theme"), "light");
    }
  });

  // Zoom: botones - y +
  zoomButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.dir; // "down" o "up"
      if (dir === "down") {
        aplicarZoom(currentZoom - ZOOM_STEP);
      } else if (dir === "up") {
        aplicarZoom(currentZoom + ZOOM_STEP);
      }
    });
  });
});

