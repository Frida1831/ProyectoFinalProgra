// js/favoritos.js

// ===============================
// FAVORITOS (localStorage)
// ===============================

const FAVORITOS_KEY = "favoritos";
let favoritos = [];

// Cargar favoritos desde localStorage
function cargarFavoritos() {
  try {
    const raw = localStorage.getItem(FAVORITOS_KEY);
    if (!raw) {
      favoritos = [];
      return;
    }
    const arr = JSON.parse(raw);
    favoritos = Array.isArray(arr) ? arr.map((id) => Number(id)) : [];
  } catch (err) {
    console.error("Error al leer favoritos:", err);
    favoritos = [];
  }
}

// Guardar favoritos en localStorage
function guardarFavoritos() {
  localStorage.setItem(FAVORITOS_KEY, JSON.stringify(favoritos));
}

// Saber si un id está en favoritos
function esFavorito(id) {
  const num = Number(id);
  return favoritos.includes(num);
}

// Actualizar contador del header
function actualizarContadorFavoritos() {
  const badge = document.getElementById("fav-count");
  if (!badge) return;

  const total = favoritos.length;
  if (total > 0) {
    badge.textContent = total;
    badge.style.display = "inline-block";
  } else {
    badge.textContent = "";
    badge.style.display = "none";
  }
}

// Pintar corazones de las tarjetas (.favorite-btn)
function actualizarIconosFavoritos() {
  const botones = document.querySelectorAll(".favorite-btn");
  botones.forEach((btn) => {
    const id = Number(btn.dataset.id);
    const icon = btn.querySelector("i");
    if (!icon || !id) return;

    if (esFavorito(id)) {
      btn.classList.add("active");
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    } else {
      btn.classList.remove("active");
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
    }
  });
}

// Agregar / quitar favorito (solo si está logueado)
function toggleFavorito(id) {
  const usuarioJSON = localStorage.getItem("usuario");
  if (!usuarioJSON) {
    alert("Debes iniciar sesión para guardar productos en favoritos 💜");
    window.location.href = "login.html";
    return;
  }

  const numId = Number(id);
  if (!numId) return;

  if (esFavorito(numId)) {
    favoritos = favoritos.filter((f) => f !== numId);
  } else {
    favoritos.push(numId);
  }

  guardarFavoritos();
  actualizarContadorFavoritos();
  actualizarIconosFavoritos();
}

// ===============================
// INICIALIZACIÓN GLOBAL
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Cargar desde LS
  cargarFavoritos();
  actualizarContadorFavoritos();
  actualizarIconosFavoritos();

  // 2. Delegación de eventos global
  document.body.addEventListener("click", (e) => {
    // a) Botón de corazón en tarjetas
    const favBtn = e.target.closest(".favorite-btn");
    if (favBtn) {
      e.preventDefault();
      const id = favBtn.dataset.id;
      if (id) toggleFavorito(id);
      return;
    }

    // b) Botón del header (#btn-favoritos)
    const headerBtn = e.target.closest("#btn-favoritos");
    if (headerBtn) {
      e.preventDefault();
      const usuarioJSON = localStorage.getItem("usuario");
      if (!usuarioJSON) {
        alert("Debes iniciar sesión para ver tus favoritos 💜");
        window.location.href = "login.html";
      } else {
        window.location.href = "favoritos.html";
      }
    }
  });
});
