const contactForm = document.querySelector(".contact-form");

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Obtener valores
        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const asunto = document.getElementById("asunto").value.trim();
        const mensaje = document.getElementById("mensaje").value.trim();

        // Validaciones básicas
        if (!nombre || !correo || !mensaje) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos incompletos',
                text: 'Por favor completa nombre, correo y mensaje.'
            });
            return;
        }

        // Mostrar alerta de carga
        Swal.fire({
            title: 'Enviando mensaje...',
            text: 'Por favor espera un momento.',
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false
        });

        try {
            // Enviar al Backend
            const resp = await fetch("http://localhost:3000/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, correo, asunto, mensaje })
            });

            const data = await resp.json();

            if (resp.ok) {
                // Éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Mensaje Enviado!',
                    text: 'Te hemos enviado una confirmación a tu correo.',
                    confirmButtonColor: '#7b3fe4'
                });
                contactForm.reset(); // Limpiar formulario
            } else {
                // Error del servidor
                throw new Error(data.msg || "Error al enviar");
            }

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Ocurrió un error',
                text: 'No pudimos enviar tu mensaje. Intenta más tarde.'
            });
        }
    });
}