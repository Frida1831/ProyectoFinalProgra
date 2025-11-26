// js/busqueda.js

function abrirCajitaBusqueda() {
  const box = document.getElementById("nav-search-box");
  const input = document.getElementById("search-input");

  if (!box || !input) return;

  box.classList.toggle("show");

  if (box.classList.contains("show")) {
    // pequeño delay para que pueda enfocar
    setTimeout(() => input.focus(), 50);
  }
}

function ejecutarBusqueda() {
  const input = document.getElementById("search-input");
  if (!input) return;

  const q = input.value.trim();
  if (!q) return;

  // Mandar a productos con el parámetro ?buscar=
  const url = `productos.html?buscar=${encodeURIComponent(q)}`;
  window.location.href = url;
}

// Delegación de eventos (sirve aunque el header se cargue después con fetch)
document.addEventListener("click", (e) => {
  const toggle = e.target.closest("#search-toggle");
  if (toggle) {
    e.preventDefault();
    abrirCajitaBusqueda();
    return;
  }

  const btnBuscar = e.target.closest("#search-btn");
  if (btnBuscar) {
    e.preventDefault();
    ejecutarBusqueda();
    return;
  }

  // Cerrar si haces clic fuera del cuadro
  const box = document.getElementById("nav-search-box");
  if (box && box.classList.contains("show")) {
    if (!box.contains(e.target) && !e.target.closest("#search-toggle")) {
      box.classList.remove("show");
    }
  }
});

// Enter dentro del input
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const active = document.activeElement;
    if (active && active.id === "search-input") {
      e.preventDefault();
      ejecutarBusqueda();
    }
  }
});
