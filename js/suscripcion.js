function inicializarSuscripcion() {
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            // ... (el resto de tu lógica de suscripción es correcta)
            e.preventDefault();
            const correo = document.getElementById('newsletter-email').value;

            // Mostrar alerta de carga
            // Necesitas que SweetAlert2 esté cargado antes de llamar a esta función
            Swal.fire({ title: 'Suscribiendo...', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

            try {
                const res = await fetch('http://localhost:3000/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo })
                });
                const data = await res.json();

                if (res.ok) {
                    Swal.fire('¡Gracias!', 'Te hemos enviado tu cupón por correo.', 'success');
                    newsletterForm.reset();
                } else {
                    Swal.fire('Atención', data.msg, 'warning');
                }
            } catch (error) {
                console.error("Error en suscripción:", error);
                Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
            }
        });
    }
}