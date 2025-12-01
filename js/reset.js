// js/reset.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener el token de la URL (ej: reset.html?token=abc12345)
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Si no hay token, es un acceso inválido
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Enlace inválido o incompleto. Por favor solicita uno nuevo.',
            confirmButtonText: 'Ir al inicio'
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }

    // 2. Manejar el envío del formulario
    const form = document.getElementById("reset-form");
    
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password2").value;

        // Validaciones básicas
        if (password.length < 6) {
            Swal.fire("Contraseña corta", "La contraseña debe tener al menos 6 caracteres.", "warning");
            return;
        }

        if (password !== passwordConfirm) {
            Swal.fire("No coinciden", "Las contraseñas no son iguales.", "warning");
            return;
        }

        // Mostrar carga
        Swal.fire({
            title: 'Actualizando...',
            didOpen: () => Swal.showLoading()
        });

        try {
            // 3. Enviar al Backend
            const resp = await fetch("http://localhost:3000/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    token: token, 
                    password: password, 
                    password2: passwordConfirm 
                })
            });

            const data = await resp.json();

            if (resp.ok) {
                // Éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Contraseña Actualizada!',
                    text: 'Ahora puedes iniciar sesión con tu nueva contraseña.',
                    timer: 3000,
                    showConfirmButton: true
                }).then(() => {
                    window.location.href = "login.html";
                });
            } else {
                // Error (Token vencido o usado)
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.msg || 'No se pudo actualizar la contraseña.'
                });
            }

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor.'
            });
        }
    });
});