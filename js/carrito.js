// Simulador del carrito usando LocalStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Contenedores
const cartItems = document.getElementById("cart-items");
const subtotalSpan = document.getElementById("subtotal");
const totalSpan = document.getElementById("total");

const COSTO_ENVIO = 40; // fijo por ahora

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

function renderCarrito() {
  cartItems.innerHTML = "";

  if (!carrito || carrito.length === 0) {
    cartItems.innerHTML = `<p class="empty-cart">Tu carrito está vacío 🛒</p>`;
    subtotalSpan.textContent = "$0.00";
    totalSpan.textContent = `$${COSTO_ENVIO.toFixed(2)}`;
    return;
  }

  let subtotal = 0;

  carrito.forEach((item, index) => {
    const cantidad = item.cantidad || 1;
    const precioNum = Number(item.precio) || 0;
    const subLinea = precioNum * cantidad;

    subtotal += subLinea;

    const producto = document.createElement("div");
    producto.classList.add("cart-item");

    producto.innerHTML = `
      <div class="cart-item-info">
        <img src="${item.img}" class="cart-img">
        <div>
          <h4>${item.nombre}</h4>
          <p>$${precioNum.toFixed(2)} MXN c/u</p>
          <p class="cart-qty">
            Cantidad:
            <button class="qty-btn" data-index="${index}" data-action="minus">-</button>
            <span class="qty-value">${cantidad}</span>
            <button class="qty-btn" data-index="${index}" data-action="plus">+</button>
          </p>
          <p class="cart-line-subtotal">
            Subtotal: <strong>$${subLinea.toFixed(2)} MXN</strong>
          </p>
        </div>
      </div>
      <button class="remove-btn" data-index="${index}">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    cartItems.appendChild(producto);
  });

  subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
  totalSpan.textContent = `$${(subtotal + COSTO_ENVIO).toFixed(2)}`;

  // Eventos para botones de cantidad
  document.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      const action = e.currentTarget.dataset.action;

      if (action === "plus") {
        carrito[idx].cantidad = (carrito[idx].cantidad || 1) + 1;
      } else if (action === "minus") {
        const nueva = (carrito[idx].cantidad || 1) - 1;
        if (nueva <= 0) {
          // si baja de 1, mejor preguntar si quiere eliminar
          if (typeof Swal !== "undefined") {
            Swal.fire({
              icon: "warning",
              title: "Eliminar producto",
              text: "La cantidad quedaría en 0. ¿Quieres eliminar este producto del carrito?",
              showCancelButton: true,
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar",
            }).then((result) => {
              if (result.isConfirmed) {
                carrito.splice(idx, 1);
                guardarCarrito();
                renderCarrito();
              }
            });
          } else {
            if (confirm("¿Eliminar este producto del carrito?")) {
              carrito.splice(idx, 1);
              guardarCarrito();
              renderCarrito();
            }
          }
          return;
        } else {
          carrito[idx].cantidad = nueva;
        }
      }

      guardarCarrito();
      renderCarrito();
    });
  });

  // Evento para eliminar producto
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.currentTarget.dataset.index;

      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Eliminar producto",
          text: "¿Seguro que quieres eliminar este producto del carrito?",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (result.isConfirmed) {
            carrito.splice(index, 1);
            guardarCarrito();
            renderCarrito();
          }
        });
      } else {
        if (confirm("¿Eliminar este producto?")) {
          carrito.splice(index, 1);
          guardarCarrito();
          renderCarrito();
        }
      }
    });
  });
}

// Ir al checkout
document.getElementById("checkout-btn").addEventListener("click", () => {
  if (!carrito || carrito.length === 0) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "info",
        title: "Carrito vacío",
        text: "Tu carrito está vacío 🛒",
      });
    } else {
      alert("Tu carrito está vacío 🛒");
    }
    return;
  }
  location.href = "checkout.html";
});

// Render inicial
renderCarrito();
