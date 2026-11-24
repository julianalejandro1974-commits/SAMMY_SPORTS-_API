// SAMMY SPORTS - CIERRE DE CAJA

const $ = id => document.getElementById(id);
const dinero = n => "$" + Number(n).toLocaleString("en-US");
const CLAVE_CIERRES = "cierresCajaSammy";

// Datos de ejemplo (en una API vendrían del servidor)
const ventas = 3150000;
const abonos = 1100000;
const numAbonos = 14;

let medios = [
    { nombre: "Efectivo", nota: "(Base Caja)", registrado: 1250000, fisico: 1250000, fijo: true },
    { nombre: "Nequi", registrado: 1200000, fisico: 1200000 },
    { nombre: "Daviplata", registrado: 800000, fisico: 600000 },
    { nombre: "Bancolombia", registrado: 1000000, fisico: 1000000 }
];

let gastos = [
    { hora: "14:30", concepto: "Reparación máquina fileteadora", categoria: "Mantenimiento", monto: 150000, soporte: "" },
    { hora: "10:15", concepto: "Compra almuerzos taller", categoria: "Otros", monto: 45000, soporte: "" }
];

let cerrado = false;
const mensaje = $("mensaje");
let temporizador;

function avisar(texto) {
    mensaje.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (mensaje.textContent = ""), 4000);
}

// Crear elementos sin usar innerHTML con datos del usuario
function el(etiqueta, clase, texto) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
}

function botonBorrar(etiqueta, accion) {
    const b = el("button", "caj-borrar");
    b.type = "button";
    b.innerHTML = '<i class="bi bi-trash"></i>';
    b.title = "Eliminar";
    b.setAttribute("aria-label", etiqueta);
    b.onclick = accion;
    return b;
}

const totalIngresos = () => medios.reduce((s, m) => s + m.registrado, 0);
const totalGastos = () => gastos.reduce((s, g) => s + g.monto, 0);
const efectivo = () => medios.find(m => m.fijo);

// Cálculos y textos de resumen
function actualizarResumen() {
    const ingresos = totalIngresos();
    const salidas = totalGastos();

    $("totalBruto").textContent = dinero(ingresos);
    $("ventas").textContent = dinero(ventas);
    $("abonos").textContent = dinero(abonos);
    $("numAbonos").textContent = numAbonos + " transacciones";

    $("balIngresos").textContent = dinero(ingresos);
    $("balGastos").textContent = "-" + dinero(salidas);
    $("balSaldo").textContent = dinero(ingresos - salidas);

    actualizarArqueo();
}

// Estado del arqueo: efectivo contado vs efectivo registrado
function actualizarArqueo() {
    const caja = $("estadoArqueo");
    const texto = $("efectivoContado").value.trim();
    caja.innerHTML = "";

    if (texto === "") {
        caja.className = "caj-estado caj-neutro";
        caja.append(el("i", "bi bi-info-circle"), el("div", "", "Ingresa el efectivo contado para validar la caja."));
        return { cuadra: false, vacio: true, diferencia: 0, otras: 0 };
    }

    const diferencia = Number(texto) - efectivo().registrado;
    const otras = medios.filter(m => !m.fijo && m.fisico !== m.registrado).length;
    const cuadra = diferencia === 0 && otras === 0;

    const detalle = el("div");
    const titulo = el("strong", "", cuadra ? "Caja Cuadrada" : "Caja con diferencias");
    detalle.appendChild(titulo);

    if (cuadra) {
        detalle.append("No hay diferencia reportada.");
    } else {
        const partes = [];
        if (diferencia !== 0) {
            partes.push((diferencia > 0 ? "Sobran " : "Faltan ") + dinero(Math.abs(diferencia)) + " en efectivo.");
        }
        if (otras > 0) {
            partes.push(otras + (otras === 1 ? " medio de pago no coincide" : " medios de pago no coinciden") + " con lo registrado.");
        }
        detalle.append(partes.join(" "));
    }

    caja.className = "caj-estado " + (cuadra ? "caj-ok" : "caj-mal");
    caja.append(el("i", "bi " + (cuadra ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill")), detalle);

    return { cuadra, vacio: false, diferencia, otras };
}

// Tabla de medios de pago
function mostrarMedios() {
    const cuerpo = $("tablaMedios");
    cuerpo.innerHTML = "";

    medios.forEach((m, i) => {
        const fila = cuerpo.insertRow();

        const celdaNombre = fila.insertCell();
        const bloque = el("div", "caj-medio");
        const nombre = el("div", "", m.nombre);
        if (m.nota) nombre.appendChild(el("small", "", m.nota));
        bloque.append(el("span", "caj-icono", m.nombre[0]), nombre);
        celdaNombre.appendChild(bloque);

        const registrado = fila.insertCell();
        registrado.className = "caj-der";
        registrado.textContent = dinero(m.registrado);

        const celdaFisico = fila.insertCell();
        celdaFisico.className = "caj-der";
        const campo = el("input", "caj-fisico");
        campo.type = "number";
        campo.min = "0";
        campo.setAttribute("aria-label", "Monto físico de " + m.nombre);
        campo.value = m.fisico;
        campo.disabled = cerrado;

        if (m.fijo) {
            // El efectivo físico se captura en el panel de Arqueo
            campo.readOnly = true;
            campo.value = $("efectivoContado").value;
        } else {
            if (m.fisico !== m.registrado) campo.classList.add("caj-dif");
            campo.oninput = () => {
                m.fisico = Number(campo.value) || 0;
                campo.classList.toggle("caj-dif", m.fisico !== m.registrado);
                actualizarArqueo();
            };
        }
        celdaFisico.appendChild(campo);

        const acciones = fila.insertCell();
        acciones.className = "caj-der";
        if (!m.fijo && !cerrado) {
            acciones.appendChild(botonBorrar("Eliminar " + m.nombre, () => {
                medios.splice(i, 1);
                mostrarMedios();
                actualizarResumen();
            }));
        }
    });
}

// Tabla de gastos
function mostrarGastos() {
    const cuerpo = $("tablaGastos");
    cuerpo.innerHTML = "";

    if (gastos.length === 0) {
        const celda = cuerpo.insertRow().insertCell();
        celda.colSpan = 5;
        celda.className = "caj-vacio";
        celda.textContent = "Aún no hay gastos registrados hoy.";
        return;
    }

    gastos.forEach((g, i) => {
        const fila = cuerpo.insertRow();
        fila.insertCell().textContent = g.hora;

        const concepto = fila.insertCell();
        concepto.appendChild(el("strong", "", g.concepto));
        if (g.soporte) concepto.appendChild(el("small", "", " · " + g.soporte));

        const categoria = fila.insertCell();
        categoria.appendChild(el("span", "caj-etiqueta", g.categoria));

        const monto = fila.insertCell();
        monto.className = "caj-der caj-neg";
        monto.textContent = "-" + dinero(g.monto);

        const acciones = fila.insertCell();
        acciones.className = "caj-der";
        if (!cerrado) {
            acciones.appendChild(botonBorrar("Eliminar gasto " + g.concepto, () => {
                gastos.splice(i, 1);
                mostrarGastos();
                actualizarResumen();
            }));
        }
    });
}

// Agregar medio de pago
$("formMedio").addEventListener("submit", e => {
    e.preventDefault();
    const monto = Number($("montoMedio").value);

    if (!Number.isFinite(monto) || monto <= 0) {
        avisar("Ingresa un monto válido para el medio de pago.");
        return;
    }

    const nombre = $("medio").value;

    if (nombre === "Efectivo") {
        efectivo().registrado += monto;
        $("efectivoContado").value = "";
    } else {
        const existente = medios.find(m => m.nombre === nombre);
        if (existente) {
            existente.registrado += monto;
            existente.fisico += monto;
        } else {
            medios.push({ nombre, registrado: monto, fisico: monto });
        }
    }

    $("montoMedio").value = "";
    mostrarMedios();
    actualizarResumen();
    avisar("Medio de pago agregado.");
});

// Soporte del gasto (solo se guarda el nombre del archivo)
$("soporte").addEventListener("change", function () {
    const archivo = this.files[0];
    const etiqueta = $("etiquetaSoporte");
    etiqueta.classList.toggle("caj-adjunto", Boolean(archivo));
    etiqueta.querySelector("span").textContent = archivo ? archivo.name : "Soporte";
});

// Agregar gasto
$("formGasto").addEventListener("submit", e => {
    e.preventDefault();
    const error = $("errorGasto");
    const concepto = $("concepto").value.trim();
    const monto = Number($("montoGasto").value);

    if (!concepto || !Number.isFinite(monto) || monto <= 0) {
        error.textContent = "Escribe el concepto y un monto mayor a 0.";
        error.hidden = false;
        return;
    }

    error.hidden = true;

    gastos.unshift({
        hora: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }),
        concepto,
        categoria: $("categoria").value,
        monto,
        soporte: $("soporte").files[0] ? $("soporte").files[0].name : ""
    });

    $("formGasto").reset();
    $("etiquetaSoporte").classList.remove("caj-adjunto");
    $("etiquetaSoporte").querySelector("span").textContent = "Soporte";

    mostrarGastos();
    actualizarResumen();
    avisar("Gasto registrado.");
});

// Efectivo contado
$("efectivoContado").addEventListener("input", () => {
    mostrarMedios();
    actualizarArqueo();
});

// Finalizar y cerrar el día
$("finalizar").addEventListener("click", () => {
    if (cerrado) return;

    const arqueo = actualizarArqueo();
    const observaciones = $("observaciones").value.trim();

    if (arqueo.vacio) {
        avisar("Ingresa el efectivo físico contado antes de cerrar.");
        $("efectivoContado").focus();
        return;
    }

    if (!arqueo.cuadra && !observaciones) {
        avisar("Hay diferencias: explícalas en las observaciones para poder cerrar.");
        $("observaciones").focus();
        return;
    }

    const texto = arqueo.cuadra
        ? "¿Finalizar y cerrar el día? Esta acción no se puede deshacer."
        : "La caja tiene diferencias. ¿Finalizar y cerrar el día de todos modos?";

    if (!confirm(texto)) return;

    const cierre = {
        fecha: $("fecha").value,
        ingresos: totalIngresos(),
        gastos: totalGastos(),
        saldoEsperado: totalIngresos() - totalGastos(),
        efectivoContado: Number($("efectivoContado").value),
        cuadrada: arqueo.cuadra,
        observaciones,
        medios,
        listaGastos: gastos,
        cerradoEn: new Date().toISOString()
    };

    try {
        const previos = JSON.parse(localStorage.getItem(CLAVE_CIERRES));
        const lista = Array.isArray(previos) ? previos : [];
        lista.unshift(cierre);
        localStorage.setItem(CLAVE_CIERRES, JSON.stringify(lista));
    } catch (error) {
        avisar("No se pudo guardar el cierre.");
        return;
    }

    cerrado = true;
    document.querySelectorAll("#formMedio input, #formMedio select, #formMedio button, #formGasto input, #formGasto select, #formGasto button, #efectivoContado, #observaciones, #fecha")
        .forEach(campo => (campo.disabled = true));
    $("finalizar").disabled = true;

    mostrarMedios();
    mostrarGastos();
    avisar("Día cerrado correctamente. Volviendo a Reportes...");
    setTimeout(() => (location.href = "reportesAdmin.html"), 1500);
});

// Menú en celulares
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
// Resumen de materiales consumidos en la fecha del cierre
function mostrarMateriales() {
    let lista = [];
    try {
        const datos = JSON.parse(localStorage.getItem("consumoMaterialesSammy"));
        if (Array.isArray(datos)) lista = datos;
    } catch (error) { }

    const delDia = lista.filter(c => c.fecha === $("fecha").value);
    const costo = delDia.reduce((s, c) => s + c.costoTotal, 0);

    $("matResumen").textContent = delDia.length
        ? delDia.length + (delDia.length === 1 ? " registro" : " registros") + " · costo estimado " + dinero(costo)
        : "Sin consumo registrado en esta fecha.";
}

$("fecha").addEventListener("change", mostrarMateriales);
// Inicio
$("fecha").value = new Date().toISOString().slice(0, 10);
$("efectivoContado").value = efectivo().registrado;
mostrarMedios();
mostrarGastos();
actualizarResumen();