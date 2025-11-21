// ===========================
// 1. LISTA DE PRODUCTOS (desde el backend)
// ===========================
let productos = []; // Se llenará con fetch a la API

// ===========================
// 2. REFERENCIAS AL DOM
// ===========================
const grid = document.getElementById("productosGrid");
const filtroCategoria = document.getElementById("filtroCategoria");
const precioMin = document.getElementById("precioMin");
const precioMax = document.getElementById("precioMax");
const filtroOferta = document.getElementById("filtroOferta");
const btnFiltrar = document.getElementById("btnFiltrar");

// === MODAL ===
const modal = document.getElementById("productModal");
const modalImg = document.getElementById("modalImg");
const modalNombre = document.getElementById("modalNombre");
const modalCategoria = document.getElementById("modalCategoria");
const modalDescripcion = document.getElementById("modalDescripcion");
const modalPrecio = document.getElementById("modalPrecio");
const modalDisponibilidad = document.getElementById("modalDisponibilidad");
const closeModalBtn = document.getElementById("closeModal");

// ===========================
// Helpers para stock / disponibilidad
// ===========================
function obtenerPiezas(producto) {
  let piezas =
    producto.stock === undefined || producto.stock === null
      ? 0
      : Number(producto.stock);

  if (isNaN(piezas) || piezas < 0) piezas = 0;
  return piezas;
}

function obtenerDisponibilidad(producto) {
  const piezas = obtenerPiezas(producto);
  if (piezas <= 0) {
    return "Agotado";
  }
  return producto.disponibilidad || "Disponible";
}

// ===========================
// 3. CARGAR PRODUCTOS DESDE EL BACKEND
// ===========================
async function cargarProductos() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/productos");
    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los productos");
    }

    productos = await respuesta.json();
    console.log("Productos desde la API:", productos);

    // Leer categoría desde la URL (por ejemplo ?categoria=amigurumis)
    const params = new URLSearchParams(window.location.search);
    const catURL = params.get("categoria"); // puede ser null

    if (catURL && catURL !== "todos") {
      filtroCategoria.value = catURL;
      aplicarFiltros();
    } else {
      renderProductos(productos);
    }
  } catch (error) {
    console.error("Error al cargar productos:", error);
    grid.innerHTML =
      "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
  }
}

// ===========================
// 4. MOSTRAR PRODUCTOS EN LA PÁGINA
// ===========================
function renderProductos(lista) {
  grid.innerHTML = "";

  if (!lista || lista.length === 0) {
    grid.innerHTML = "<p>No se encontraron productos con esos filtros.</p>";
    return;
  }

  lista.forEach((p) => {
    const card = document.createElement("article");
    card.classList.add("product-card");

    // Texto bonito para la categoría
    let badgeTexto = "";
    if (p.categoria === "amigurumis") badgeTexto = "Amigurumi";
    if (p.categoria === "accesorios") badgeTexto = "Accesorio";
    if (p.categoria === "decoracion") badgeTexto = "Decoración";

    const dispo = obtenerDisponibilidad(p);
    const piezas = obtenerPiezas(p);

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

      <button class="btn-secondary add-cart-btn"
              data-id="${p.id}">
        Agregar al carrito
      </button>
    `;

    grid.appendChild(card);

    // --- abrir modal al hacer clic/Enter en la card ---
    card.tabIndex = 0;
    const abrir = () => abrirModal(p);

    card.addEventListener("click", abrir);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") abrir();
    });
  });

  // botones "Agregar al carrito"
  document.querySelectorAll(".add-cart-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // para que no abra el modal al dar clic en el botón
      const id = parseInt(e.currentTarget.dataset.id);
      agregarAlCarrito(id);
    });
  });
}

// ===========================
// 4.1 MODAL: ABRIR / CERRAR
// ===========================
function abrirModal(producto) {
  const dispo = obtenerDisponibilidad(producto);
  const piezas = obtenerPiezas(producto);

  modalImg.src = producto.imagen;
  modalImg.alt = producto.nombre;
  modalNombre.textContent = producto.nombre;
  modalCategoria.textContent = "Categoría: " + producto.categoria;
  modalDescripcion.textContent = producto.descripcion;
  modalPrecio.textContent = `$ ${Number(producto.precio).toFixed(2)} MXN`;
  modalDisponibilidad.textContent = `${dispo} · ${piezas} piezas`;

  modal.classList.add("show");
}

function cerrarModal() {
  modal.classList.remove("show");
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", cerrarModal);
}

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      cerrarModal();
    }
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarModal();
  }
});

// ===========================
// 5. AGREGAR AL CARRITO (LocalStorage)
// ===========================
function agregarAlCarrito(idProducto) {
  const token = localStorage.getItem("token");

  if (!token) {
    const irALogin = confirm(
      "Debes iniciar sesión para agregar productos al carrito. ¿Quieres ir a la página de login?"
    );
    if (irALogin) {
      window.location.href = "login.html";
    }
    return;
  }

  const prod = productos.find((p) => p.id === idProducto);
  if (!prod) return;

  const piezas = obtenerPiezas(prod);
  if (piezas <= 0) {
    alert("Este producto está agotado 🥲");
    return;
  }

  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  carrito.push({
    nombre: prod.nombre,
    precio: Number(prod.precio),
    img: prod.imagen,
  });

  localStorage.setItem("carrito", JSON.stringify(carrito));

  alert("Producto agregado al carrito 🧺");
}

// ===========================
// 6. FILTROS
// ===========================
function aplicarFiltros() {
  if (productos.length === 0) return;

  let filtrados = [...productos];

  const cat = filtroCategoria.value;
  const min = parseFloat(precioMin.value) || 0;
  const max = parseFloat(precioMax.value) || Infinity;
  const of = filtroOferta.value; // de momento no se usa

  filtrados = filtrados.filter((p) => {
    const precioNum = Number(p.precio) || 0;

    const okCat = cat === "todos" || p.categoria === cat;
    const okPrecio = precioNum >= min && precioNum <= max;

    const okOferta = true; // placeholder

    return okCat && okPrecio && okOferta;
  });

  renderProductos(filtrados);
}

// ===========================
// 7. EVENTOS Y CARGA INICIAL
// ===========================
btnFiltrar.addEventListener("click", aplicarFiltros);
window.addEventListener("DOMContentLoaded", cargarProductos);
