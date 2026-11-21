// Datos base del inventario (respaldo si localStorage está vacío)
const inventarioInicial = [
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

const CLAVE_INSUMOS = "sammy_sports_insumos";
const URL_REGISTRO = "registrosNuevosInsumos.html";

function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto ?? "");
    return div.innerHTML;
}

function obtenerInsumosRegistrados() {
    try {
        const guardados = JSON.parse(localStorage.getItem(CLAVE_INSUMOS));
        if (!Array.isArray(guardados)) return [];

        return guardados.map((item, idx) => {
            const cantidad = Number(item.stock ?? item.cantidad ?? 0);
            const alerta = item.alertaMinima !== null && item.alertaMinima !== undefined
                ? Number(item.alertaMinima)
                : null;

            const esCritico =
                item.estado === "Crítico" ||
                (alerta !== null && !Number.isNaN(alerta) && cantidad < alerta);

            return {
                codigo: item.sku || item.codigo || `INS-${String(idx + 1).padStart(3, "0")}`,
                nombre: item.nombre || "Insumo sin nombre",
                categoria: item.categoria || "General",
                cantidad: Number.isNaN(cantidad) ? 0 : cantidad,
                unidad: item.unidad || "Unidades",
                costo: Number(item.costo ?? 0),
                proveedor: item.proveedor || "Por asignar",
                estado: esCritico ? "Crítico" : "Adecuado"
            };
        });
    } catch (error) {
        console.error("Error al leer insumos desde localStorage:", error);
        return [];
    }
}

const guardados = obtenerInsumosRegistrados();
const inventario = guardados.length > 0 ? guardados : inventarioInicial;

// Elementos del HTML
const busqueda = document.getElementById("busqueda");
const estado = document.getElementById("estado");
const tabla = document.getElementById("tablaInventario");
const contador = document.getElementById("contador");
const paginacion = document.getElementById("paginacion");
const mensaje = document.getElementById("mensaje");
const abrirMenuBtn = document.getElementById("abrirMenu");
const sidebar = document.getElementById("sidebar");

let paginaActual = 1;
const porPagina = 3;

function obtenerFiltrados() {
    const texto = busqueda.value.toLowerCase().trim();

    return inventario.filter(item =>
        (item.nombre.toLowerCase().includes(texto) ||
         item.codigo.toLowerCase().includes(texto)) &&
        (estado.value === "todos" || item.estado === estado.value)
    );
}

function mostrarInventario() {
    const datos = obtenerFiltrados();
    const totalPaginas = Math.max(1, Math.ceil(datos.length / porPagina));

    paginaActual = Math.min(paginaActual, totalPaginas);

    const inicio = (paginaActual - 1) * porPagina;
    const visibles = datos.slice(inicio, inicio + porPagina);

    tabla.innerHTML = visibles.map(item => `
        <tr>
            <td>${escaparHTML(item.codigo)}</td>
            <td>${escaparHTML(item.nombre)}</td>
            <td>${escaparHTML(item.categoria)}</td>
            <td>
                <span class="stock-numero ${item.estado === "Crítico" ? "stock-critico" : ""}">
                    ${Number(item.cantidad).toLocaleString("en-US")}
                </span>
                <span class="stock-unidad ${item.estado === "Crítico" ? "stock-critico" : ""}">
                    ${escaparHTML(item.unidad)}
                </span>
            </td>
            <td>$${Number(item.costo).toFixed(2)}</td>
            <td>${escaparHTML(item.proveedor)}</td>
            <td>
                <span class="estado ${item.estado === "Crítico" ? "critico" : "adecuado"}">
                    ${escaparHTML(item.estado)}
                </span>
            </td>
        </tr>
    `).join("") || '<tr><td colspan="7">No se encontraron insumos.</td></tr>';

    contador.textContent =
        `Mostrando ${datos.length ? inicio + 1 : 0} a ${Math.min(inicio + porPagina, datos.length)} de ${datos.length} entradas`;

    paginacion.innerHTML = "";

    agregarBoton("‹", paginaActual - 1, paginaActual === 1);

    for (let n = 1; n <= totalPaginas; n++) {
        agregarBoton(n, n, false, n === paginaActual);
    }

    agregarBoton("›", paginaActual + 1, paginaActual === totalPaginas);
}

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

busqueda.addEventListener("input", () => {
    paginaActual = 1;
    mostrarInventario();
});

estado.addEventListener("change", () => {
    paginaActual = 1;
    mostrarInventario();
});

document.getElementById("registrar").addEventListener("click", () => {
    window.location.href = URL_REGISTRO;
});

document.getElementById("exportar").addEventListener("click", () => {
    mensaje.textContent = "La exportación a PDF se implementará en la siguiente etapa.";
});

if (abrirMenuBtn && sidebar) {
    abrirMenuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("abierta");
    });

    sidebar.querySelectorAll("a").forEach(enlace => {
        enlace.addEventListener("click", () => {
            if (window.innerWidth <= 750) {
                sidebar.classList.remove("abierta");
            }
        });
    });

    document.addEventListener("click", evento => {
        if (
            window.innerWidth <= 750 &&
            sidebar.classList.contains("abierta") &&
            !sidebar.contains(evento.target) &&
            !abrirMenuBtn.contains(evento.target)
        ) {
            sidebar.classList.remove("abierta");
        }
    });
}

document.querySelectorAll(".sin-destino").forEach(enlace => {
    enlace.addEventListener("click", evento => evento.preventDefault());
});

mostrarInventario();