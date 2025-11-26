// === FAVORITOS (localStorage) ===
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

// Guardar en LS
function guardarFavoritos() {
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

// Saber si un id está en favoritos
function esFavorito(id) {
  id = Number(id);
  return favoritos.includes(id);
}

// Agregar / quitar
function toggleFavorito(id) {
  id = Number(id);

  if (esFavorito(id)) {
    favoritos = favoritos.filter((f) => f !== id);
  } else {
    favoritos.push(id);
  }

  guardarFavoritos();
  actualizarIconosFavoritos();
  actualizarContadorFavoritos();
}

// Pintar corazones de las tarjetas
function actualizarIconosFavoritos() {
  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    const id = Number(btn.dataset.id);
    const icon = btn.querySelector("i");

    if (!icon) return;

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

// Contador en el header
function actualizarContadorFavoritos() {
  const badge = document.getElementById("fav-count");
  if (!badge) return;

  const total = favoritos.length;

  if (total <= 0) {
    badge.textContent = "";
    badge.style.display = "none";
  } else {
    badge.textContent = total > 9 ? "9+" : String(total);
    badge.style.display = "flex";
  }
}

// === DELEGACIÓN DE CLICS ===
document.addEventListener("click", (e) => {
  // 1) Corazón de las tarjetas (.favorite-btn)
  const cardBtn = e.target.closest(".favorite-btn");
  if (cardBtn) {
    e.stopPropagation(); // para que no abra el modal de producto
    const id = cardBtn.dataset.id;
    if (id) {
      toggleFavorito(id);
    }
    return; // ya manejamos este click
  }

  // 2) Botón del header (#btn-favoritos)
  const headerBtn = e.target.closest("#btn-favoritos");
  if (headerBtn) {
    e.preventDefault();
    window.location.href = "favoritos.html";
  }
});

// Al cargar el DOM, pintamos iconos/contador con lo que haya en localStorage
document.addEventListener("DOMContentLoaded", () => {
  actualizarIconosFavoritos();
  actualizarContadorFavoritos();
});
