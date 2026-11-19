
// SAMMY SPORTS - GESTIÓN DE CATÁLOGO

// El catálogo inicia vacío si no hay productos guardados
let productos = [];

try {
    const guardados = JSON.parse(localStorage.getItem("catalogoSammy"));

    if (Array.isArray(guardados)) {
        productos = guardados;
    }
} catch (error) {
    productos = [];
}

// Elementos del HTML
const formulario = document.getElementById("formUniforme");
const tabla = document.getElementById("tablaCatalogo");
const buscador = document.getElementById("buscarCatalogo");
const filtro = document.getElementById("filtroEstado");
const contador = document.getElementById("contador");
const mensaje = document.getElementById("mensaje");
const imagenInput = document.getElementById("imagenUniforme");
const vistaPrevia = document.getElementById("vistaPrevia");

let editando = null;
let imagenActual = "";
let pagina = 1;
const porPagina = 3;

// Guardar los productos en el navegador
function guardarProductos() {
    try {
        localStorage.setItem("catalogoSammy", JSON.stringify(productos));
        return true;
    } catch (error) {
        mensaje.textContent = "No se pudieron guardar los cambios. Revisa el espacio disponible.";
        return false;
    }
}

// Mostrar vista previa de la imagen
imagenInput.addEventListener("change", function () {
    const archivo = this.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        mensaje.textContent = "Selecciona una imagen válida.";
        this.value = "";
        return;
    }

    const lector = new FileReader();

    lector.onload = function (evento) {
        imagenActual = evento.target.result;
        vistaPrevia.src = imagenActual;
        vistaPrevia.hidden = false;
    };

    lector.readAsDataURL(archivo);
});

// Buscar y filtrar productos
function obtenerProductos() {
    const texto = buscador.value.toLowerCase().trim();

    return productos.filter(producto => {
        const coincide =
            producto.nombre.toLowerCase().includes(texto) ||
            producto.categoria.toLowerCase().includes(texto);

        const coincideEstado =
            filtro.value === "todos" ||
            producto.estado === filtro.value;

        return coincide && coincideEstado;
    });
}

// Mostrar productos en la tabla
function mostrarProductos() {
    const filtrados = obtenerProductos();
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));

    pagina = Math.max(1, Math.min(pagina, totalPaginas));

    const inicio = (pagina - 1) * porPagina;
    const visibles = filtrados.slice(inicio, inicio + porPagina);

    tabla.innerHTML = "";

    visibles.forEach(producto => {
        const fila = tabla.insertRow();

        // Imagen
        const celdaImagen = fila.insertCell();
        const imagen = document.createElement("img");

        imagen.className = "producto-imagen";
        imagen.alt = producto.nombre;
        imagen.src = producto.imagen ||
            "https://placehold.co/100x100/e8efff/142238?text=Uniforme";

        celdaImagen.appendChild(imagen);

        // Nombre y categoría
        const detalles = fila.insertCell();

        const nombre = document.createElement("div");
        nombre.className = "producto-nombre";
        nombre.textContent = producto.nombre;

        const categoria = document.createElement("div");
        categoria.className = "producto-categoria";
        categoria.textContent = producto.categoria;

        detalles.append(nombre, categoria);

        // Precio
        const precio = fila.insertCell();
        precio.className = "producto-precio";
        precio.textContent = "$" + Number(producto.precio).toFixed(2);

        // Estado
        const celdaEstado = fila.insertCell();
        const estado = document.createElement("span");

        estado.className = "estado " +
            (producto.estado === "En Stock" ? "en-stock" : "sin-stock");

        estado.textContent = producto.estado;
        celdaEstado.appendChild(estado);

        // Botones de acciones
        const acciones = fila.insertCell();
        acciones.className = "acciones-tabla";

        const editar = document.createElement("button");
        editar.innerHTML = '<i class="bi bi-pencil-square"></i>';
        editar.title = "Editar";
        editar.setAttribute("aria-label", "Editar " + producto.nombre);
        editar.onclick = () => editarProducto(producto.id);

        const eliminar = document.createElement("button");
        eliminar.innerHTML = '<i class="bi bi-trash"></i>';
        eliminar.title = "Eliminar";
        eliminar.setAttribute("aria-label", "Eliminar " + producto.nombre);
        eliminar.onclick = () => eliminarProducto(producto.id);

        acciones.append(editar, eliminar);
    });

    // Mensaje cuando no existen productos
    if (visibles.length === 0) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();

        celda.colSpan = 5;
        celda.textContent = "No se encontraron uniformes.";
    }

    // Contador y paginación
    contador.textContent =
        `Mostrando ${filtrados.length ? inicio + 1 : 0} a ` +
        `${Math.min(inicio + porPagina, filtrados.length)} ` +
        `de ${filtrados.length} artículos`;

    document.getElementById("paginaActual").textContent = pagina;
    document.getElementById("anterior").disabled = pagina === 1;
    document.getElementById("siguiente").disabled = pagina === totalPaginas;
}

// Registrar o actualizar uniforme
formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const categoria = document.getElementById("categoria").value;
    const precio = Number(document.getElementById("precio").value);
    const descripcion = document.getElementById("descripcion").value.trim();
    const estado = document.getElementById("disponibilidad").value;

    if (!nombre || !categoria || !Number.isFinite(precio) || precio <= 0) {
        mensaje.textContent = "Completa correctamente los campos.";
        return;
    }

    const producto = {
        id: editando === null ? Date.now() : editando,
        nombre,
        categoria,
        precio,
        descripcion,
        estado,
        imagen: imagenActual
    };

    // Copia de seguridad antes de modificar
    const anteriores = [...productos];

    if (editando === null) {
        productos.push(producto);
    } else {
        const indice = productos.findIndex(p => p.id === editando);

        if (indice !== -1) {
            productos[indice] = producto;
        }
    }

    // Guardar cambios
    if (!guardarProductos()) {
        productos = anteriores;
        return;
    }

    // Limpiar los filtros
    buscador.value = "";
    filtro.value = "todos";

    // Mostrar la última página
    pagina = Math.ceil(productos.length / porPagina);

    limpiarFormulario();
    mostrarProductos();

    mensaje.textContent = "El uniforme fue guardado correctamente.";
});

// Editar uniforme
function editarProducto(id) {
    const producto = productos.find(p => p.id === id);

    if (!producto) return;

    document.getElementById("nombre").value = producto.nombre;
    document.getElementById("categoria").value = producto.categoria;
    document.getElementById("precio").value = producto.precio;
    document.getElementById("descripcion").value = producto.descripcion;
    document.getElementById("disponibilidad").value = producto.estado;

    imagenActual = producto.imagen;

    if (imagenActual) {
        vistaPrevia.src = imagenActual;
        vistaPrevia.hidden = false;
    } else {
        vistaPrevia.hidden = true;
        vistaPrevia.removeAttribute("src");
    }

    editando = id;

    document.getElementById("guardar").textContent = "Actualizar Uniforme";

    formulario.scrollIntoView({ behavior: "smooth" });
}

// Eliminar uniforme
function eliminarProducto(id) {
    if (!confirm("¿Deseas eliminar este uniforme?")) return;

    const anteriores = [...productos];

    productos = productos.filter(p => p.id !== id);

    if (!guardarProductos()) {
        productos = anteriores;
        return;
    }

    if (editando === id) {
        limpiarFormulario();
    }

    mostrarProductos();
    mensaje.textContent = "Uniforme eliminado correctamente.";
}

// Limpiar formulario
function limpiarFormulario() {
    formulario.reset();

    editando = null;
    imagenActual = "";
    imagenInput.value = "";

    vistaPrevia.hidden = true;
    vistaPrevia.removeAttribute("src");

    document.getElementById("guardar").textContent = "Guardar Uniforme";
}

formulario.addEventListener("reset", function () {
    editando = null;
    imagenActual = "";
    imagenInput.value = "";

    vistaPrevia.hidden = true;
    vistaPrevia.removeAttribute("src");

    document.getElementById("guardar").textContent = "Guardar Uniforme";
});

// Buscar uniformes
buscador.addEventListener("input", function () {
    pagina = 1;
    mostrarProductos();
});

// Filtrar por estado
filtro.addEventListener("change", function () {
    pagina = 1;
    mostrarProductos();
});

// Página anterior
document.getElementById("anterior").onclick = function () {
    if (pagina > 1) {
        pagina--;
        mostrarProductos();
    }
};

// Página siguiente
document.getElementById("siguiente").onclick = function () {
    const total = Math.ceil(obtenerProductos().length / porPagina);

    if (pagina < total) {
        pagina++;
        mostrarProductos();
    }
};

// Exportar catálogo a CSV
document.getElementById("exportar").onclick = function () {
    const filas = [
        ["Nombre", "Categoría", "Precio", "Estado", "Descripción"],

        ...productos.map(p => [
            p.nombre,
            p.categoria,
            p.precio,
            p.estado,
            p.descripcion
        ])
    ];

    const csv = filas.map(fila =>
        fila.map(valor =>
            '"' + String(valor).replace(/"/g, '""') + '"'
        ).join(",")
    ).join("\r\n");

    const archivo = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "catalogo_sammy_sports.csv";

    enlace.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Menú en celulares
document.getElementById("abrirMenu").onclick = function () {
    document.getElementById("sidebar").classList.toggle("abierta");
};

// Evitar enlaces vacíos
document.querySelectorAll(".sin-destino").forEach(enlace => {
    enlace.addEventListener("click", function (evento) {
        evento.preventDefault();
    });
});

// Mostrar catálogo al abrir la página
mostrarProductos();
