// js/favoritosPage.js
// Mostrar solo productos favoritos en favoritos.html

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favGrid");
  const empty = document.getElementById("favEmpty");

  if (!grid || !empty) return;

  // Asegurarnos de tener la lista cargada
  if (typeof cargarFavoritos === "function") {
    cargarFavoritos();
  }

  if (!favoritos || favoritos.length === 0) {
    empty.style.display = "block";
    return;
  }

  try {
    const resp = await fetch("http://localhost:3000/api/productos");
    if (!resp.ok) throw new Error("No se pudieron cargar los productos");

    const productos = await resp.json();

    const favProducts = productos.filter((p) =>
      favoritos.includes(Number(p.id))
    );

    if (!favProducts.length) {
      empty.style.display = "block";
      return;
    }

    grid.innerHTML = "";
    favProducts.forEach((p) => {
      const card = document.createElement("article");
      card.classList.add("product-card");

      const dispo = p.disponibilidad || "Disponible";
      const precio = Number(p.precio || 0).toFixed(2);

      card.innerHTML = `
        <button class="favorite-btn" data-id="${p.id}">
          <i class="fa-solid fa-heart"></i>
        </button>

        <div class="product-img">
          <img src="${p.imagen}" alt="${p.nombre}">
        </div>

        <h3>${p.nombre}</h3>
        <p class="product-description">${p.descripcion || ""}</p>
        <p class="product-price">$ ${precio} MXN</p>
        <p class="product-availability">${dispo}</p>
      `;

      grid.appendChild(card);
    });

    if (typeof actualizarIconosFavoritos === "function") {
      actualizarIconosFavoritos();
    }
  } catch (err) {
    console.error("Error al cargar favoritos:", err);
    empty.style.display = "block";
  }
});