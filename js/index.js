// ===========================
// DESTACADOS EN LA PÁGINA PRINCIPAL
// ===========================

// contenedor donde se pintan las cards
const destacadosGrid = document.getElementById("destacadosGrid");

// cargar productos desde la API y elegir 1 por categoría
async function cargarDestacados() {
  // si por alguna razón no existe el div, no hacemos nada
  if (!destacadosGrid) {
    console.warn("No se encontró el contenedor #destacadosGrid");
    return;
  }

  try {
    const resp = await fetch("http://localhost:3000/api/productos");
    console.log("Respuesta destacados:", resp.status, resp.statusText);

    if (!resp.ok) {
      const texto = await resp.text();
      console.error("Error de la API de productos:", texto);
      throw new Error("No se pudieron cargar los productos");
    }

    const todos = await resp.json();
    console.log("Productos para destacados:", todos);

    // categorías que queremos destacar
    const categorias = ["amigurumis", "accesorios", "decoracion"];
    const destacados = [];

    categorias.forEach((cat) => {
      const deEstaCat = todos.filter((p) => p.categoria === cat);
      if (deEstaCat.length > 0) {
        // puedes cambiar la lógica: primero, random, etc.
        destacados.push(deEstaCat[0]);
      }
    });

    renderDestacados(destacados);
  } catch (err) {
    console.error("Error cargando destacados:", err);
    destacadosGrid.innerHTML =
      "<p>No se pudieron cargar las piezas destacadas.</p>";
  }
}

// pinta las cards en el home
function renderDestacados(lista) {
  destacadosGrid.innerHTML = "";

  if (!lista || lista.length === 0) {
    destacadosGrid.innerHTML =
      "<p>No hay productos para mostrar como destacados.</p>";
    return;
  }

  lista.forEach((p) => {
    const card = document.createElement("article");
    card.classList.add("product-card");

    let badgeTexto = "";
    if (p.categoria === "amigurumis") badgeTexto = "Amigurumi";
    if (p.categoria === "accesorios") badgeTexto = "Accesorio";
    if (p.categoria === "decoracion") badgeTexto = "Decoración";

    // calculamos piezas y disponibilidad aquí también
    let piezas = (p.stock === undefined || p.stock === null)
      ? 0
      : Number(p.stock);
    if (isNaN(piezas) || piezas < 0) piezas = 0;

    const dispo = piezas <= 0
      ? "Agotado"
      : (p.disponibilidad || "Disponible");

    card.innerHTML = `
      <div class="product-badge offer">${badgeTexto}</div>

      <button class="favorite-btn">
        <i class="fa-regular fa-heart"></i>
      </button>

      <div class="product-img">
        <img src="${p.imagen}" alt="${p.nombre}">
      </div>

      <h3>${p.nombre}</h3>

      <p class="product-description">
        ${p.descripcion}
      </p>

      <p class="product-price">$ ${Number(p.precio).toFixed(2)} MXN</p>

      <p class="product-availability">
        ${dispo} · ${piezas} piezas
      </p>

      <button class="btn-secondary"
              onclick="location.href='productos.html?categoria=${p.categoria}'">
        Ver más de esta categoría
      </button>
    `;

    destacadosGrid.appendChild(card);
  });
}



// cuando cargue la página principal
window.addEventListener("DOMContentLoaded", cargarDestacados);
