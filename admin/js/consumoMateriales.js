// SAMMY SPORTS - CONSUMO DE MATERIALES

const $ = id => document.getElementById(id);
const dinero = n => "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const numero = n => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const hoy = () => new Date().toISOString().slice(0, 10);

// Mismas claves que usan Inventario y Registro de Insumos
const CLAVE_INSUMOS = "sammy_sports_insumos";
const CLAVE_CONSUMO = "consumoMaterialesSammy";

// Insumos de ejemplo (los mismos que muestra Inventario si no hay guardados)
const INSUMOS_BASE = [
    { id: "base-1", sku: "FAB-001", nombre: "Malla de Rendimiento - Azul", categoria: "Tela", proveedor: "Apex Textiles", stock: 450, unidad: "Yardas", costo: 4.5, alertaMinima: 50, estado: "Adecuado" },
    { id: "base-2", sku: "THR-042", nombre: "Hilo de Alta Resistencia - Blanco", categoria: "Hilo", proveedor: "Global Threads Inc.", stock: 12, unidad: "Bobinas", costo: 1.2, alertaMinima: 50, estado: "Crítico" },
    { id: "base-3", sku: "ZIP-105", nombre: 'Cremallera Impermeable 24" - Negra', categoria: "Herrajes", proveedor: "SecureFasteners", stock: 1200, unidad: "Unidades", costo: 0.85, alertaMinima: null, estado: "Adecuado" }
];

let insumos = [];
let consumos = [];
let pedidos = [];

const mensaje = $("mensaje");
let temporizador;

function avisar(texto) {
    mensaje.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (mensaje.textContent = ""), 4000);
}

function el(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
}

// ===== Lectura y escritura en localStorage =====
function leerLista(clave) {
    try {
        const datos = JSON.parse(localStorage.getItem(clave));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        return [];
    }
}

function cargarDatos() {
    const guardados = leerLista(CLAVE_INSUMOS);
    insumos = guardados.length ? guardados : INSUMOS_BASE.map(i => ({ ...i }));
    consumos = leerLista(CLAVE_CONSUMO);
}

// Un insumo queda "Crítico" si su stock baja del nivel mínimo de alerta
function estadoDe(insumo) {
    const alerta = insumo.alertaMinima;
    if (alerta !== null && alerta !== undefined && alerta !== "" && Number(insumo.stock) < Number(alerta)) {
        return "Crítico";
    }
    return "Adecuado";
}

function guardarTodo() {
    try {
        localStorage.setItem(CLAVE_INSUMOS, JSON.stringify(insumos));
        localStorage.setItem(CLAVE_CONSUMO, JSON.stringify(consumos));
        return true;
    } catch (error) {
        avisar("No se pudieron guardar los cambios. Revisa el espacio disponible.");
        return false;
    }
}

// ===== Selectores =====
function llenarMateriales() {
    const sel = $("material");
    const actual = sel.value;
    sel.innerHTML = "";

    insumos.forEach(i => {
        const op = el("option", "", `${i.nombre} (${numero(i.stock)} ${i.unidad})`);
        op.value = i.sku;
        sel.appendChild(op);
    });

    if (actual && insumos.some(i => i.sku === actual)) sel.value = actual;
    actualizarInfo();
}

function actualizarInfo() {
    const insumo = insumos.find(i => i.sku === $("material").value);
    $("unidadTxt").textContent = insumo ? "(" + insumo.unidad + ")" : "";
    $("infoStock").textContent = insumo
        ? "Disponible: " + numero(insumo.stock) + " " + insumo.unidad
        : "No hay materiales en el inventario.";
}

async function llenarPedidos() {
    try {
        pedidos = window.PedidosAPI ? await window.PedidosAPI.listar() : [];
    } catch (error) {
        pedidos = [];
    }

    pedidos.filter(p => p.estado !== "entregado").forEach(p => {
        const op = el("option", "", `${p.id} · ${p.cliente}`);
        op.value = p.id;
        $("pedido").appendChild(op);
    });
}

// ===== Tabla y resúmenes =====
function mostrar() {
    const fecha = $("fechaVer").value;
    const delDia = consumos.filter(c => c.fecha === fecha);
    const cuerpo = $("tablaConsumo");
    cuerpo.innerHTML = "";

    if (delDia.length === 0) {
        const celda = cuerpo.insertRow().insertCell();
        celda.colSpan = 6;
        celda.className = "con-vacio";
        celda.textContent = "No hay consumo registrado en esta fecha.";
    }

    delDia.forEach(c => {
        const fila = cuerpo.insertRow();
        fila.insertCell().textContent = c.hora;

        const material = fila.insertCell();
        material.appendChild(el("strong", "", c.nombre));
        if (c.nota) material.appendChild(el("small", "", c.nota));

        fila.insertCell().textContent = c.pedidoId || "General";

        const cantidad = fila.insertCell();
        cantidad.className = "con-der";
        cantidad.textContent = numero(c.cantidad) + " " + c.unidad;

        const costo = fila.insertCell();
        costo.className = "con-der";
        costo.textContent = dinero(c.costoTotal);

        const acciones = fila.insertCell();
        acciones.className = "con-der";
        const borrar = el("button", "con-borrar");
        borrar.type = "button";
        borrar.innerHTML = '<i class="bi bi-trash"></i>';
        borrar.title = "Eliminar y devolver al inventario";
        borrar.setAttribute("aria-label", "Eliminar consumo de " + c.nombre);
        borrar.onclick = () => eliminar(c.id);
        acciones.appendChild(borrar);
    });

    // Indicadores
    const porMaterial = {};
    delDia.forEach(c => {
        const m = porMaterial[c.sku] || (porMaterial[c.sku] = { nombre: c.nombre, unidad: c.unidad, cantidad: 0, costo: 0 });
        m.cantidad += c.cantidad;
        m.costo += c.costoTotal;
    });

    $("kRegistros").textContent = delDia.length;
    $("kMateriales").textContent = Object.keys(porMaterial).length;
    $("kCosto").textContent = dinero(delDia.reduce((s, c) => s + c.costoTotal, 0));

    const lista = $("listaResumen");
    lista.innerHTML = "";

    if (!Object.keys(porMaterial).length) {
        lista.appendChild(el("li", "con-vacio", "Sin consumo en esta fecha."));
    }

    Object.values(porMaterial).forEach(m => {
        const li = el("li");
        const izquierda = el("div");
        izquierda.append(el("strong", "", m.nombre), el("small", "", numero(m.cantidad) + " " + m.unidad));
        li.append(izquierda, el("strong", "", dinero(m.costo)));
        lista.appendChild(li);
    });
}

// ===== Registrar =====
$("material").addEventListener("change", actualizarInfo);

$("formConsumo").addEventListener("submit", e => {
    e.preventDefault();
    const error = $("errorConsumo");
    const insumo = insumos.find(i => i.sku === $("material").value);
    const cantidad = Number($("cantidad").value);
    const fecha = $("fecha").value;

    const fallar = texto => {
        error.textContent = texto;
        error.hidden = false;
    };

    if (!insumo) return fallar("Selecciona un material.");
    if (!fecha) return fallar("Selecciona la fecha.");
    if (!Number.isFinite(cantidad) || cantidad <= 0) return fallar("Ingresa una cantidad mayor a 0.");
    if (cantidad > Number(insumo.stock)) {
        return fallar("No hay suficiente stock: disponible " + numero(insumo.stock) + " " + insumo.unidad + ".");
    }

    error.hidden = true;

    const copiaInsumos = insumos.map(i => ({ ...i }));
    const copiaConsumos = [...consumos];

    insumo.stock = Math.round((Number(insumo.stock) - cantidad) * 100) / 100;
    insumo.estado = estadoDe(insumo);

    const pedidoId = $("pedido").value;

    consumos.unshift({
        id: "CON-" + Date.now(),
        fecha,
        hora: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }),
        pedidoId,
        sku: insumo.sku,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        cantidad,
        costoUnitario: Number(insumo.costo) || 0,
        costoTotal: cantidad * (Number(insumo.costo) || 0),
        nota: $("nota").value.trim()
    });

    if (!guardarTodo()) {
        insumos = copiaInsumos;
        consumos = copiaConsumos;
        return;
    }

    $("cantidad").value = "";
    $("nota").value = "";
    $("fechaVer").value = fecha;

    llenarMateriales();
    mostrar();

    avisar(insumo.estado === "Crítico"
        ? "Consumo registrado. Atención: " + insumo.nombre + " quedó en nivel crítico."
        : "Consumo registrado y descontado del inventario.");
});

// ===== Eliminar (devuelve el stock) =====
function eliminar(id) {
    const registro = consumos.find(c => c.id === id);
    if (!registro) return;
    if (!confirm("¿Eliminar este consumo? Se devolverán " + numero(registro.cantidad) + " " + registro.unidad + " al inventario.")) return;

    const copiaInsumos = insumos.map(i => ({ ...i }));
    const copiaConsumos = [...consumos];

    const insumo = insumos.find(i => i.sku === registro.sku);
    if (insumo) {
        insumo.stock = Math.round((Number(insumo.stock) + registro.cantidad) * 100) / 100;
        insumo.estado = estadoDe(insumo);
    }

    consumos = consumos.filter(c => c.id !== id);

    if (!guardarTodo()) {
        insumos = copiaInsumos;
        consumos = copiaConsumos;
        return;
    }

    llenarMateriales();
    mostrar();
    avisar("Consumo eliminado y stock devuelto.");
}

$("fechaVer").addEventListener("change", mostrar);

// ===== Exportar CSV =====
$("exportar").addEventListener("click", () => {
    const filas = [
        ["Fecha", "Hora", "Material", "Pedido", "Cantidad", "Unidad", "Costo Unitario", "Costo Total", "Nota"],
        ...consumos.map(c => [c.fecha, c.hora, c.nombre, c.pedidoId || "General", c.cantidad, c.unidad, c.costoUnitario, c.costoTotal, c.nota])
    ];

    const csv = filas.map(f => f.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "consumo_materiales_sammy_sports.csv";
    enlace.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ===== Menú en celulares =====
const abrirMenu = $("abrirMenu");
const sidebar = $("sidebar");

abrirMenu.onclick = () => sidebar.classList.toggle("abierta");

document.addEventListener("click", e => {
    if (
        window.innerWidth <= 750 &&
        sidebar.classList.contains("abierta") &&
        !sidebar.contains(e.target) &&
        !abrirMenu.contains(e.target)
    ) {
        sidebar.classList.remove("abierta");
    }
});

// ===== Inicio =====
$("fecha").value = hoy();
$("fechaVer").value = hoy();
cargarDatos();
llenarMateriales();
mostrar();
llenarPedidos();