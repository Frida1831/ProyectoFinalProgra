// Obtener carrito desde LocalStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Elementos DOM
const itemsDiv = document.getElementById("checkout-items");
const subtotalSpan = document.getElementById("checkout-subtotal");
const impuestosSpan = document.getElementById("checkout-impuestos");
const envioSpan = document.getElementById("checkout-envio");
const descuentoSpan = document.getElementById("checkout-descuento");
const totalSpan = document.getElementById("checkout-total");
const mensaje = document.getElementById("checkout-message");

const selectPais = document.getElementById("pais");
const inputCupon = document.getElementById("cupon");
const metodoSelect = document.getElementById("metodo");

// Elementos de pago
const pagoTarjeta = document.getElementById("pago-tarjeta");
const pagoTransferencia = document.getElementById("pago-transferencia");
const pagoOxxo = document.getElementById("pago-oxxo");

// === 1. LÓGICA VISUAL DE MÉTODOS DE PAGO ===
metodoSelect.addEventListener("change", () => {
    const metodo = metodoSelect.value;
    
    // Ocultar todos primero
    pagoTarjeta.style.display = "none";
    pagoTransferencia.style.display = "none";
    pagoOxxo.style.display = "none";

    // Mostrar el seleccionado
    if (metodo === "tarjeta") pagoTarjeta.style.display = "block";
    if (metodo === "transferencia") pagoTransferencia.style.display = "block";
    if (metodo === "oxxo") pagoOxxo.style.display = "block";
});

// === 2. CÁLCULOS (IMPUESTOS, ENVIO, DESC) ===
function obtenerEnvioYImpuestos(subtotal, pais) {
    let envio = 40;
    let tasaImpuesto = 0.16; 

    if (pais === "us") {
        envio = 120;
        tasaImpuesto = 0.08;
    } else if (pais === "latam") {
        envio = 90;
        tasaImpuesto = 0.0;
    }
    // Si no selecciona país, defaults a MX
    
    return { envio, impuestos: subtotal * tasaImpuesto };
}

function obtenerDescuento(subtotal, cupon) {
    if (!cupon) return 0;
    const code = cupon.trim().toUpperCase();
    if (code === "CROCHET10") return subtotal * 0.1; 
    return 0;
}

// === 3. RENDERIZAR RESUMEN ===
function renderResumen() {
    itemsDiv.innerHTML = "";
    if (!carrito || carrito.length === 0) {
        itemsDiv.innerHTML = "<p>Carrito vacío 🛒</p>";
        // Resetear valores a 0...
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
        // Nota: Asegúrate de tener estilos CSS para .checkout-item
        div.innerHTML = `
            <div style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
                <img src="${item.img}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div>
                    <h4 style="margin:0; font-size:0.9rem;">${item.nombre}</h4>
                    <small>${cantidad} x $${precioNum.toFixed(2)}</small>
                </div>
                <div style="margin-left:auto; font-weight:bold;">$${subLinea.toFixed(2)}</div>
            </div>
        `;
        itemsDiv.appendChild(div);
    });

    const pais = selectPais.value || "mx";
    const cupon = inputCupon.value;

    const { envio, impuestos } = obtenerEnvioYImpuestos(subtotal, pais);
    const descuento = obtenerDescuento(subtotal, cupon);
    const total = subtotal + impuestos + envio - descuento;

    subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
    impuestosSpan.textContent = `$${impuestos.toFixed(2)}`;
    envioSpan.textContent = `$${envio.toFixed(2)}`;
    descuentoSpan.textContent = `-$${descuento.toFixed(2)}`;
    totalSpan.textContent = `$${total.toFixed(2)}`;
}

// Listeners para recalcular
selectPais.addEventListener("change", renderResumen);
inputCupon.addEventListener("input", renderResumen);

// Inicializar
renderResumen();


// === 4. PROCESAR COMPRA Y VALIDACIONES ===
document.getElementById("checkout-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Datos generales
    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const cp = document.getElementById("cp").value.trim();
    const pais = selectPais.value;
    const metodo = metodoSelect.value;
    const cupon = inputCupon.value.trim();

    // Validar carrito
    if (!carrito || carrito.length === 0) {
        return Swal.fire("Carrito vacío", "No hay productos para comprar", "warning");
    }

    // Validar sesión
    const token = localStorage.getItem("token");
    if (!token) {
        return Swal.fire({
            title: "Inicia sesión",
            text: "Necesitas una cuenta para comprar",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Ir a Login"
        }).then(r => { if(r.isConfirmed) window.location.href = "login.html"; });
    }

    // --- VALIDACIÓN ESPECÍFICA POR MÉTODO DE PAGO ---
    let detallesPagoExtra = {}; // Para simular envío al backend

    if (metodo === "") {
        return Swal.fire("Error", "Selecciona un método de pago", "error");
    }

    if (metodo === "tarjeta") {
        const num = document.getElementById("numTarjeta").value.trim();
        const nom = document.getElementById("nombreTarjeta").value.trim();
        const exp = document.getElementById("expTarjeta").value.trim();
        const cvv = document.getElementById("cvvTarjeta").value.trim();

        if (num.length < 13 || !nom || exp.length < 4 || cvv.length < 3) {
            return Swal.fire("Datos de tarjeta", "Por favor revisa los datos de tu tarjeta", "warning");
        }
        detallesPagoExtra = { tipo: 'tarjeta', terminacion: num.slice(-4) }; 
    } 
    
    else if (metodo === "transferencia") {
        const ref = document.getElementById("referenciaTransf").value.trim();
        if (!ref) {
            return Swal.fire("Referencia Faltante", "Escribe la referencia de tu transferencia bancaria", "warning");
        }
        detallesPagoExtra = { tipo: 'transferencia', referencia: ref };
    } 
    
    else if (metodo === "oxxo") {
        // Oxxo no requiere inputs extra del usuario en el form
        detallesPagoExtra = { tipo: 'oxxo', estatus: 'pendiente_pago_tienda' };
    }

    // Construir items
    const items = carrito.map((item) => ({
        productoId: item.id,
        cantidad: item.cantidad || 1,
    }));

    // UI Loading
    Swal.fire({
        title: "Procesando pedido...",
        text: "Estamos validando tu pago",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false
    });

    try {
        const resp = await fetch("http://localhost:3000/api/ordenes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
                nombre, correo, telefono, direccion, cp, pais,
                metodo, cupon, items,
                // Nota: Tu backend actual tal vez no guarde 'detallesPagoExtra', 
                // pero así es como se enviaría en una app real.
                detallesPago: detallesPagoExtra 
            }),
        });

        const data = await resp.json();

        if (!resp.ok) {
            throw new Error(data.msg || "Error al procesar");
        }

        // Éxito
        localStorage.removeItem("carrito");
        
        let mensajeExito = "Tu orden ha sido creada.";
        if (metodo === "oxxo") mensajeExito += " Te enviamos el código de barras a tu correo.";
        if (metodo === "transferencia") mensajeExito += " Validaremos tu transferencia en breve.";

        Swal.fire({
            icon: "success",
            title: "¡Gracias por tu compra!",
            text: mensajeExito,
            confirmButtonText: "Regresar"
        }).then(() => {
            window.location.href = "index.html"; // O perfil.html si lo tienes
        });

    } catch (err) {
        console.error(err);
        Swal.fire("Error", err.message, "error");
    }
});