// Simulador del carrito usando LocalStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Contenedores
const cartItems = document.getElementById("cart-items");
const subtotalSpan = document.getElementById("subtotal");
const totalSpan = document.getElementById("total");

function renderCarrito() {
    cartItems.innerHTML = "";

    if (carrito.length === 0) {
        cartItems.innerHTML = `<p class="empty-cart">Tu carrito está vacío 🛒</p>`;
        subtotalSpan.textContent = "$0.00";
        totalSpan.textContent = "$40.00";
        return;
    }

    let subtotal = 0;

    carrito.forEach((item, index) => {
        subtotal += item.precio;

        const producto = document.createElement("div");
        producto.classList.add("cart-item");

        producto.innerHTML = `
            <div class="cart-item-info">
                <img src="${item.img}" class="cart-img">
                <div>
                    <h4>${item.nombre}</h4>
                    <p>$${item.precio}.00 MXN</p>
                </div>
            </div>
            <button class="remove-btn" data-index="${index}">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        cartItems.appendChild(producto);
    });
// ====== 4. AGREGAR AL CARRITO (LocalStorage) ======
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

// ====== 5. FILTROS ======
function aplicarFiltros() {
  // Empezamos con todos los productos
  let filtrados = [...productos];

  const cat = filtroCategoria.value;          // amigurumis / accesorios / decoracion / todos
  const min = parseInt(precioMin.value) || 0; // si está vacío, 0
  const max = parseInt(precioMax.value) || Infinity; // si está vacío, infinito
  const of = filtroOferta.value;             // todos / oferta

  filtrados = filtrados.filter((p) => {
    const okCat = cat === "todos" || p.categoria === cat;
    const okPrecio = p.precio >= min && p.precio <= max;
    const okOferta = of === "todos" || (of === "oferta" && p.oferta === true);
    return okCat && okPrecio && okOferta;
  });

  renderProductos(filtrados);
}

    subtotalSpan.textContent = `$${subtotal}.00`;
    totalSpan.textContent = `$${subtotal + 40}.00`;

    // Evento para eliminar producto
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.currentTarget.dataset.index;
            carrito.splice(index, 1);
            localStorage.setItem("carrito", JSON.stringify(carrito));
            renderCarrito();
        });
    });
}

// Ir al checkout
document.getElementById("checkout-btn").addEventListener("click", () => {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío 🛒");
        return;
    }
    location.href = "checkout.html";
});

// Render inicial
renderCarrito();
