// Obtener carrito desde LocalStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Elementos
const itemsDiv = document.getElementById("checkout-items");
const subtotalSpan = document.getElementById("checkout-subtotal");
const totalSpan = document.getElementById("checkout-total");
const mensaje = document.getElementById("checkout-message");

// Renderizar resumen
function renderResumen() {

    itemsDiv.innerHTML = "";

    if (carrito.length === 0) {
        itemsDiv.innerHTML = "<p>Tu carrito está vacío 🛒</p>";
        subtotalSpan.textContent = "$0.00";
        totalSpan.textContent = "$0.00";
        return;
    }

    let subtotal = 0;

    carrito.forEach(item => {
        subtotal += item.precio;

        const div = document.createElement("div");
        div.classList.add("checkout-item");

        div.innerHTML = `
            <div class="checkout-item-info">
                <img src="${item.img}" class="checkout-img">
                <div>
                    <h4>${item.nombre}</h4>
                    <p>$${item.precio}.00 MXN</p>
                </div>
            </div>
        `;

        itemsDiv.appendChild(div);
    });

    subtotalSpan.textContent = `$${subtotal}.00`;
    totalSpan.textContent = `$${subtotal + 40}.00`;
}

renderResumen();

// Validar formulario
document.getElementById("checkout-form").addEventListener("submit", function(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const cp = document.getElementById("cp").value.trim();
    const metodo = document.getElementById("metodo").value;

    if (carrito.length === 0) {
        mensaje.textContent = "Tu carrito está vacío.";
        mensaje.style.color = "red";
        return;
    }

    if (!nombre || !correo || !direccion || !cp || !metodo) {
        mensaje.textContent = "Por favor completa todos los campos.";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "Procesando tu compra...";
    mensaje.style.color = "green";

    setTimeout(() => {
        mensaje.textContent = "¡Compra realizada con éxito! 🎉🧶";
        mensaje.style.color = "green";

        // Vaciar carrito
        localStorage.removeItem("carrito");
    }, 1500);
});
