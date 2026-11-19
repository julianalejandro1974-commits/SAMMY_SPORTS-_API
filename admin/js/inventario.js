


// Datos de ejemplo del inventario
const inventario = [
    {
        codigo: "FAB-001",
        nombre: "Malla de Rendimiento - Azul",
        categoria: "Tela",
        cantidad: 450,
        unidad: "Yardas",
        costo: 4.50,
        proveedor: "Apex Textiles",
        estado: "Adecuado"
    },
    {
        codigo: "THR-042",
        nombre: "Hilo de Alta Resistencia - Blanco",
        categoria: "Hilo",
        cantidad: 12,
        unidad: "Bobinas",
        costo: 1.20,
        proveedor: "Global Threads Inc.",
        estado: "Crítico"
    },
    {
        codigo: "ZIP-105",
        nombre: 'Cremallera Impermeable 24" - Negra',
        categoria: "Herrajes",
        cantidad: 1200,
        unidad: "Unidades",
        costo: 0.85,
        proveedor: "SecureFasteners",
        estado: "Adecuado"
    }
];

// Elementos del HTML
const busqueda = document.getElementById("busqueda");
const estado = document.getElementById("estado");
const tabla = document.getElementById("tablaInventario");
const contador = document.getElementById("contador");
const paginacion = document.getElementById("paginacion");
const mensaje = document.getElementById("mensaje");

let paginaActual = 1;
const porPagina = 3;

// Buscar por nombre, código y estado
function obtenerFiltrados() {
    const texto = busqueda.value.toLowerCase().trim();

    return inventario.filter(item =>
        (item.nombre.toLowerCase().includes(texto) ||
         item.codigo.toLowerCase().includes(texto)) &&
        (estado.value === "todos" || item.estado === estado.value)
    );
}

// Mostrar inventario
function mostrarInventario() {
    const datos = obtenerFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(datos.length / porPagina));

    paginaActual = Math.min(paginaActual, totalPaginas);

    const inicio = (paginaActual - 1) * porPagina;
    const visibles = datos.slice(inicio, inicio + porPagina);

    tabla.innerHTML = visibles.map(item => `
        <tr>
            <td>${item.codigo}</td>
            <td>${item.nombre}</td>
            <td>${item.categoria}</td>
            <td>
                <span class="stock-numero ${item.estado === "Crítico" ? "stock-critico" : ""}">
                    ${item.cantidad.toLocaleString("en-US")}
                </span>
                <span class="stock-unidad ${item.estado === "Crítico" ? "stock-critico" : ""}">
                    ${item.unidad}
                </span>
            </td>
            <td>$${item.costo.toFixed(2)}</td>
            <td>${item.proveedor}</td>
            <td>
                <span class="estado ${item.estado === "Crítico" ? "critico" : "adecuado"}">
                    ${item.estado}
                </span>
            </td>
        </tr>
    `).join("") || '<tr><td colspan="7">No se encontraron insumos.</td></tr>';

    // Actualizar contador
    contador.textContent =
        `Mostrando ${datos.length ? inicio + 1 : 0} a ${Math.min(inicio + porPagina, datos.length)} de ${datos.length} entradas`;

    // Crear paginación
    paginacion.innerHTML = "";

    agregarBoton("‹", paginaActual - 1, paginaActual === 1);

    for (let n = 1; n <= totalPaginas; n++) {
        agregarBoton(n, n, false, n === paginaActual);
    }

    agregarBoton("›", paginaActual + 1, paginaActual === totalPaginas);
}

// Crear botones de paginación
function agregarBoton(texto, pagina, deshabilitado, activa = false) {
    const boton = document.createElement("button");

    boton.textContent = texto;
    boton.disabled = deshabilitado;

    if (activa) {
        boton.classList.add("activa");
    }

    boton.addEventListener("click", () => {
        paginaActual = pagina;
        mostrarInventario();
    });

    paginacion.appendChild(boton);
}

// Buscar mientras se escribe
busqueda.addEventListener("input", () => {
    paginaActual = 1;
    mostrarInventario();
});

// Filtrar por estado
estado.addEventListener("change", () => {
    paginaActual = 1;
    mostrarInventario();
});

// Funciones pendientes
document.getElementById("registrar").addEventListener("click", () => {
    mensaje.textContent = "El registro de insumos se desarrollará en la siguiente etapa.";
});

document.getElementById("exportar").addEventListener("click", () => {
    mensaje.textContent = "La exportación a PDF se implementará en la siguiente etapa.";
});

// Abrir menú en celulares
document.getElementById("abrirMenu").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("abierta");
});

// Enlaces sin destino
document.querySelectorAll(".sin-destino").forEach(enlace => {
    enlace.addEventListener("click", evento => evento.preventDefault());
});

// Cargar los registros
mostrarInventario();
