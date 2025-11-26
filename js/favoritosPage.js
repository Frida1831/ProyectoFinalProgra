// Cargar y mostrar solo productos favoritos
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("favGrid");
  const empty = document.getElementById("favEmpty");

  if (!favoritos || favoritos.length === 0) {
    empty.style.display = "block";
    return;
  }

  try {
    const resp = await fetch("http://localhost:3000/api/productos");
    if (!resp.ok) throw new Error("No se pudieron cargar los productos");

    const productos = await resp.json();
    const favProducts = productos.filter(p => favoritos.includes(p.id));

    if (favProducts.length === 0) {
      empty.style.display = "block";
      return;
    }

    grid.innerHTML = "";

    favProducts.forEach((p) => {
      const card = document.createElement("article");
      card.classList.add("product-card");

      card.innerHTML = `
        <div class="product-badge offer">
          ${p.categoria === "amigurumis" ? "Amigurumi" :
            p.categoria === "accesorios" ? "Accesorio" :
            p.categoria === "decoracion" ? "Decoración" : ""}
        </div>

        <button class="favorite-btn active" data-id="${p.id}">
          <i class="fa-solid fa-heart"></i>
        </button>

        <div class="product-img">
          <img src="${p.imagen}" alt="${p.nombre}">
        </div>

        <h3>${p.nombre}</h3>
        <p class="product-description">${p.descripcion}</p>
        <p class="product-price">$ ${Number(p.precio).toFixed(2)} MXN</p>
      `;

      grid.appendChild(card);
    });

    actualizarIconosFavoritos();

  } catch (err) {
    console.error("Error al cargar favoritos:", err);
    empty.style.display = "block";
  }
});

