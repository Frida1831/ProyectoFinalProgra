document.getElementById("login-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const password = document.getElementById("password").value.trim();
    const mensaje = document.getElementById("login-message");

    mensaje.textContent = "Iniciando sesión...";
    mensaje.style.color = "blue";

    try {
        const respuesta = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                correo,
                password
            })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = data.msg || "Credenciales incorrectas.";
            mensaje.style.color = "red";
            return;
        }

        // Guardar token en localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.user));

        mensaje.textContent = "Inicio de sesión exitoso. Redirigiendo...";
        mensaje.style.color = "green";

        // Redirigir según rol
        setTimeout(() => {
            if (data.user.rol === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }
        }, 1500);

    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "Error al conectar con el servidor.";
        mensaje.style.color = "red";
    }
});

