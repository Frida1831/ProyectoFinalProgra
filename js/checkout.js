// js/checkout.js

// 1. Obtener carrito desde LocalStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// 2. Elementos DOM (Referencias)
const itemsDiv = document.getElementById("checkout-items");
const subtotalSpan = document.getElementById("checkout-subtotal");
const impuestosSpan = document.getElementById("checkout-impuestos");
const envioSpan = document.getElementById("checkout-envio");
const descuentoSpan = document.getElementById("checkout-descuento");
const totalSpan = document.getElementById("checkout-total");
const mensaje = document.getElementById("checkout-message");

const selectPais = document.getElementById("pais");
const inputCupon = document.getElementById("cupon"); // El input del cupón en el resumen
const metodoSelect = document.getElementById("metodo");

// Elementos de métodos de pago
const pagoTarjeta = document.getElementById("pago-tarjeta");
const pagoTransferencia = document.getElementById("pago-transferencia");
const pagoOxxo = document.getElementById("pago-oxxo");

// === 3. LÓGICA DE VISUALIZACIÓN DE MÉTODOS DE PAGO ===
metodoSelect.addEventListener("change", () => {
    const metodo = metodoSelect.value;
    
    // Ocultar todos
    pagoTarjeta.style.display = "none";
    pagoTransferencia.style.display = "none";
    pagoOxxo.style.display = "none";

    // Mostrar el seleccionado
    if (metodo === "tarjeta") pagoTarjeta.style.display = "block";
    if (metodo === "transferencia") pagoTransferencia.style.display = "block";
    if (metodo === "oxxo") pagoOxxo.style.display = "block";
});

// === 4. CÁLCULOS (LÓGICA DE NEGOCIO) ===

function obtenerEnvioYImpuestos(subtotal, pais) {
    let envio = 40; // Default México
    let tasaImpuesto = 0.16; // 16% IVA

    if (pais === "us") {
        envio = 120;
        tasaImpuesto = 0.08;
    } else if (pais === "latam") {
        envio = 90;
        tasaImpuesto = 0.0;
    }
    // Si pais es "" o "mx", se queda con los defaults
    
    return { envio, impuestos: subtotal * tasaImpuesto };
}

function obtenerDescuento(subtotal, cupon) {
    if (!cupon) return 0;
    
    const code = cupon.trim().toUpperCase();

    // CUPONES VÁLIDOS
    if (code === "CROCHET10") {
        return subtotal * 0.10; // 10% de descuento
    }
    if (code === "BIENVENIDO15") { // Ejemplo de otro cupón
        return subtotal * 0.15;
    }

    return 0; // Cupón no válido
}

// === 5. RENDERIZAR RESUMEN (ACTUALIZA TOTALES) ===
function renderResumen() {
    itemsDiv.innerHTML = "";

    // Si no hay carrito
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

    // Listar productos
    carrito.forEach((item) => {
        const cantidad = item.cantidad || 1;
        const precioNum = Number(item.precio) || 0;
        const subLinea = precioNum * cantidad;
        subtotal += subLinea;

        const div = document.createElement("div");
        div.classList.add("checkout-item");
        // Estilo inline para asegurar que se vea bien sin tocar CSS
        div.innerHTML = `
            <div style="display:flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
                <div style="display:flex; gap:10px;">
                    <img src="${item.img}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">
                    <div>
                        <strong>${item.nombre}</strong><br>
                        <span style="color:#666;">${cantidad} x $${precioNum.toFixed(2)}</span>
                    </div>
                </div>
                <div style="font-weight:600;">$${subLinea.toFixed(2)}</div>
            </div>
        `;
        itemsDiv.appendChild(div);
    });

    // Obtener valores actuales de los inputs
    const pais = selectPais.value || "mx";
    const cuponTexto = inputCupon.value; // Lo que el usuario escribió

    // Calcular montos
    const { envio, impuestos } = obtenerEnvioYImpuestos(subtotal, pais);
    const descuento = obtenerDescuento(subtotal, cuponTexto);

    const total = subtotal + impuestos + envio - descuento;

    // Actualizar HTML
    subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
    impuestosSpan.textContent = `$${impuestos.toFixed(2)}`;
    envioSpan.textContent = `$${envio.toFixed(2)}`;
    
    // Mostrar descuento (en verde si aplica)
    descuentoSpan.textContent = `-$${descuento.toFixed(2)}`;
    if(descuento > 0) {
        descuentoSpan.style.color = "#27ae60"; 
        descuentoSpan.style.fontWeight = "bold";
    } else {
        descuentoSpan.style.color = "inherit";
        descuentoSpan.style.fontWeight = "normal";
    }

    totalSpan.textContent = `$${total.toFixed(2)}`;
}

// === 6. LISTENERS PARA RECALCULAR AL INSTANTE ===
// Cada vez que cambie el país o se escriba en el cupón, actualizamos
selectPais.addEventListener("change", renderResumen);
inputCupon.addEventListener("input", renderResumen); 

// Carga inicial
renderResumen();


// === 7. PROCESAR COMPRA (ENVÍO AL BACKEND) ===
document.getElementById("checkout-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Recolectar datos
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const cp = document.getElementById("cp").value.trim();
    const pais = selectPais.value;
    const metodo = metodoSelect.value;
    const cupon = inputCupon.value.trim(); // Cupón final

    // Validar Carrito
    if (!carrito || carrito.length === 0) {
        return Swal.fire("Carrito vacío", "No tienes productos para comprar.", "warning");
    }

    // Validar Sesión
    const token = localStorage.getItem("token");
    if (!token) {
        return Swal.fire({
            title: "Inicia sesión",
            text: "Necesitas una cuenta para completar la compra.",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Ir a Login"
        }).then(r => { if(r.isConfirmed) window.location.href = "login.html"; });
    }

    // Validaciones de Pago Específicas
    let detallesPagoExtra = {};

    if (metodo === "tarjeta") {
        const num = document.getElementById("numTarjeta").value.trim();
        const nom = document.getElementById("nombreTarjeta").value.trim();
        const exp = document.getElementById("expTarjeta").value.trim();
        const cvv = document.getElementById("cvvTarjeta").value.trim();

        if (num.length < 13 || !nom || exp.length < 4 || cvv.length < 3) {
            return Swal.fire("Error en Tarjeta", "Por favor revisa los datos de tu tarjeta.", "warning");
        }
        detallesPagoExtra = { tipo: 'tarjeta', terminacion: num.slice(-4) };
    } 
    else if (metodo === "transferencia") {
        const ref = document.getElementById("referenciaTransf").value.trim();
        if (!ref) return Swal.fire("Falta Referencia", "Escribe la referencia de tu pago.", "warning");
        detallesPagoExtra = { tipo: 'transferencia', referencia: ref };
    } 
    else if (metodo === "oxxo") {
        detallesPagoExtra = { tipo: 'oxxo', estatus: 'pendiente' };
    } else {
        return Swal.fire("Método de pago", "Selecciona un método de pago válido.", "warning");
    }

    // Preparar Items para API
    const items = carrito.map(item => ({
        productoId: item.id,
        cantidad: item.cantidad || 1
    }));

    // Loading
    Swal.fire({
        title: "Procesando compra...",
        text: "Por favor espera un momento",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
    });

    try {
        const resp = await fetch("http://localhost:3000/api/ordenes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token,
            },
            body: JSON.stringify({
                nombre, correo, telefono, direccion, cp, pais,
                metodo, cupon, items,
                detallesPago: detallesPagoExtra
            }),
        });

        const data = await resp.json();

        if (!resp.ok) {
            throw new Error(data.msg || "Error al procesar la orden");
        }

        // Éxito Total
        localStorage.removeItem("carrito");
        
        let msgExito = "Tu compra ha sido confirmada.";
        if(metodo === "oxxo") msgExito += " Te enviamos el código de OXXO por correo.";

        Swal.fire({
            icon: "success",
            title: "¡Compra Exitosa! 🎉",
            text: `La nota se envió a tu correo electrónico (${correo}).`,
            confirmButtonText: "Volver a la tienda"
        }).then(() => {
            window.location.href = "index.html";
        });

    } catch (err) {
        console.error("Error Checkout:", err);
        Swal.fire("Error", err.message, "error");
    }
});