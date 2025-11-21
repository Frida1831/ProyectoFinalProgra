document.getElementById("register-form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const pass = document.getElementById("password").value.trim();
    const pass2 = document.getElementById("password2").value.trim();
    const mensaje = document.getElementById("register-message");

    // Validación: contraseñas iguales
    if (pass !== pass2) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        mensaje.style.color = "red";
        return;
    }

    // Validación: contraseña mínima de 6 caracteres
    if (pass.length < 6) {
        mensaje.textContent = "La contraseña debe tener al menos 6 caracteres.";
        mensaje.style.color = "red";
        return;
    }

    // Validación: nombre
    if (nombre.length < 3) {
        mensaje.textContent = "El nombre es demasiado corto.";
        mensaje.style.color = "red";
        return;
    }

    mensaje.textContent = "Registrando usuario...";
    mensaje.style.color = "blue";

    try {
        const respuesta = await fetch("http://localhost:3000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: nombre,
                correo: correo,
                password: pass
            })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = data.msg || "Error al registrar.";
            mensaje.style.color = "red";
            return;
        }

        mensaje.textContent = "Cuenta creada con éxito. Redirigiendo...";
        mensaje.style.color = "green";

        // Redirigir a login después de 2 segundos
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "Error de conexión con el servidor.";
        mensaje.style.color = "red";
    }
});

