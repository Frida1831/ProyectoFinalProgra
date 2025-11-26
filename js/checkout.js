// Obtener carrito desde LocalStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Elementos
const itemsDiv = document.getElementById("checkout-items");
const subtotalSpan = document.getElementById("checkout-subtotal");
const impuestosSpan = document.getElementById("checkout-impuestos");
const envioSpan = document.getElementById("checkout-envio");
const descuentoSpan = document.getElementById("checkout-descuento");
const totalSpan = document.getElementById("checkout-total");
const mensaje = document.getElementById("checkout-message");

const selectPais = document.getElementById("pais");
const inputCupon = document.getElementById("cupon");

// función para obtener envío e impuestos según país
function obtenerEnvioYImpuestos(subtotal, pais) {
  let envio = 40;
  let tasaImpuesto = 0.16; // 16% default

  if (pais === "mx") {
    envio = 40;
    tasaImpuesto = 0.16;
  } else if (pais === "us") {
    envio = 120;
    tasaImpuesto = 0.08;
  } else if (pais === "latam") {
    envio = 90;
    tasaImpuesto = 0.0;
  }

  const impuestos = subtotal * tasaImpuesto;
  return { envio, impuestos };
}

// función para obtener descuento según cupón
function obtenerDescuento(subtotal, cupon) {
  if (!cupon) return 0;

  const code = cupon.trim().toUpperCase();

  if (code === "CROCHET10") {
    return subtotal * 0.1; // 10% de descuento
  }

  // puedes agregar más cupones aquí
  return 0;
}

// Renderizar resumen
function renderResumen() {
  itemsDiv.innerHTML = "";

  if (!carrito || carrito.length === 0) {
    itemsDiv.innerHTML = "<p>Tu carrito está vacío 🛒</p>";
    subtotalSpan.textContent = "$0.00";
    impuestosSpan.textContent = "$0.00";
    envioSpan.textContent = "$0.00";
    descuentoSpan.textContent = "$0.00";
    totalSpan.textContent = "$0.00";
    return;
  }

  let subtotal = 0;

  carrito.forEach((item) => {
    const cantidad = item.cantidad || 1;
    const precioNum = Number(item.precio) || 0;
    const subLinea = precioNum * cantidad;
    subtotal += subLinea;

    const div = document.createElement("div");
    div.classList.add("checkout-item");

    div.innerHTML = `
      <div class="checkout-item-info">
          <img src="${item.img}" class="checkout-img">
          <div>
              <h4>${item.nombre}</h4>
              <p>${cantidad} x $${precioNum.toFixed(2)} MXN</p>
              <p><strong>Subtotal: $${subLinea.toFixed(2)} MXN</strong></p>
          </div>
      </div>
    `;

    itemsDiv.appendChild(div);
  });

  // país seleccionado
  const pais = selectPais.value || "mx";
  const cupon = inputCupon.value;

  const { envio, impuestos } = obtenerEnvioYImpuestos(subtotal, pais);
  const descuento = obtenerDescuento(subtotal, cupon);

  const total = subtotal + impuestos + envio - descuento;

  subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
  impuestosSpan.textContent = `$${impuestos.toFixed(2)}`;
  envioSpan.textContent = `$${envio.toFixed(2)}`;
  descuentoSpan.textContent = `- $${descuento.toFixed(2)}`;
  totalSpan.textContent = `$${total.toFixed(2)}`;
}

renderResumen();

// reagrupar totales cuando cambian país o cupón
selectPais.addEventListener("change", renderResumen);
inputCupon.addEventListener("input", renderResumen);

// Validar formulario
document
  .getElementById("checkout-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const cp = document.getElementById("cp").value.trim();
    const metodo = document.getElementById("metodo").value;
    const pais = selectPais.value;
    const cupon = inputCupon.value.trim();

    const token = localStorage.getItem("token");

    if (!carrito || carrito.length === 0) {
      mensaje.textContent = "Tu carrito está vacío.";
      mensaje.style.color = "red";
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "info",
          title: "Carrito vacío",
          text: "No hay productos para procesar la compra.",
        });
      }
      return;
    }

    if (!nombre || !correo || !direccion || !cp || !metodo || !pais || !telefono) {
      mensaje.textContent = "Por favor completa todos los campos.";
      mensaje.style.color = "red";
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Por favor completa todos los campos requeridos.",
        });
      }
      return;
    }

    if (!token) {
      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "info",
          title: "Inicia sesión",
          text: "Debes iniciar sesión para completar tu compra.",
          showCancelButton: true,
          confirmButtonText: "Ir a login",
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = "login.html";
          }
        });
      } else {
        if (
          confirm(
            "Debes iniciar sesión para completar tu compra. ¿Quieres ir a login?"
          )
        ) {
          window.location.href = "login.html";
        }
      }
      return;
    }

    // Construir items para el backend
    const items = carrito.map((item) => ({
      productoId: item.id,
      cantidad: item.cantidad || 1,
    }));

    mensaje.textContent = "Procesando tu compra...";
    mensaje.style.color = "green";

    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Procesando pago...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });
    }

    try {
      const resp = await fetch("http://localhost:3000/api/ordenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          nombre,
          correo,
          direccion,
          cp,
          pais,
          metodo,
          cupon,
          items,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        mensaje.textContent = data.msg || "No se pudo procesar la compra.";
        mensaje.style.color = "red";

        if (typeof Swal !== "undefined") {
          Swal.fire({
            icon: "error",
            title: "Error en la compra",
            text: data.msg || "No se pudo procesar la compra.",
          });
        }
        return;
      }

      // éxito
 localStorage.removeItem("carrito");

 mensaje.textContent = "¡Compra realizada con éxito! 🎉🧶";
 mensaje.style.color = "green";

 if (typeof Swal !== "undefined") {
   Swal.fire({
     icon: "success",
     title: "Compra finalizada",
     text: "La nota se envió a tu correo electrónico.",
   });
 }

      // Podrías redirigir al usuario a otra página:
      // setTimeout(() => {
      //   window.location.href = "index.html";
      // }, 2000);

    } catch (err) {
      console.error("Error al crear la orden:", err);
      mensaje.textContent = "Error al conectar con el servidor.";
      mensaje.style.color = "red";

      if (typeof Swal !== "undefined") {
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudo contactar el servidor.",
        });
      }
    }
  });

