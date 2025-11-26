// Leer productos desde LocalStorage
let productos = JSON.parse(localStorage.getItem("productos")) || [];

// DOM
const list = document.getElementById("product-list");
const form = document.getElementById("product-form");

// Renderizar lista de productos
function renderProductos() {
    list.innerHTML = "";

    productos.forEach((prod, index) => {
        list.innerHTML += `
            <tr>
                <td><img src="${prod.img}" class="admin-img"></td>
                <td>${prod.nombre}</td>
                <td>$${prod.precio}.00</td>
                <td>${prod.categoria}</td>
                <td>
                    <button class="delete-btn" data-index="${index}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const index = e.currentTarget.dataset.index;

    Swal.fire({
      icon: "warning",
      title: "Eliminar producto",
      text: "¿Seguro que quieres eliminar este producto?",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        productos.splice(index, 1);
        localStorage.setItem("productos", JSON.stringify(productos));
        renderProductos();

        Swal.fire({
          icon: "success",
          title: "Eliminado",
          text: "El producto fue eliminado.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  });
});


}

// Guardar nuevo producto
form.addEventListener("submit", e => {
    e.preventDefault();

    const nuevo = {
        nombre: document.getElementById("nombre").value.trim(),
        precio: parseInt(document.getElementById("precio").value),
        categoria: document.getElementById("categoria").value,
        img: document.getElementById("img").value.trim()
    };

    productos.push(nuevo);
    localStorage.setItem("productos", JSON.stringify(productos));

    form.reset();
    renderProductos();
});

// Render inicial
renderProductos();
