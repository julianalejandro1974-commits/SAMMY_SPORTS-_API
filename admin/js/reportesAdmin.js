// SAMMY SPORTS - REPORTES Y FINANZAS

const $ = id => document.getElementById(id);
const dinero = n => "$" + Number(n).toLocaleString("en-US");

// Datos de ejemplo (en miles de pesos para la gráfica)
const resumen = { ingresos: 842500, ganancias: 125000, gastos: 64200 };

const meses = [
    { mes: "Ene", ingresos: 60, gastos: 32 },
    { mes: "Feb", ingresos: 65, gastos: 37 },
    { mes: "Mar", ingresos: 54, gastos: 31 },
    { mes: "Abr", ingresos: 65, gastos: 35 },
    { mes: "May", ingresos: 65, gastos: 35 },
    { mes: "Jun", ingresos: 75, gastos: 25 }
];

const otrosGastos = [
    { icono: "bi-truck", titulo: "Cargos por Logística Urgente", detalle: "Pedidos Rápidos T3", monto: 12450 },
    { icono: "bi-tools", titulo: "Reparaciones de Almacén", detalle: "Mantenimiento de Instalaciones", monto: 8200 },
    { icono: "bi-megaphone", titulo: "Marketing Ad-hoc", detalle: "Patrocinios Locales", monto: 4500 },
    { icono: "bi-window", titulo: "Licencias de Software", detalle: "Herramientas de Diseño y Admin", monto: 3150 }
];

const documentos = [
    { nombre: "Resumen_Financiero_T2.pdf", tipo: "pdf" },
    { nombre: "Ventas_Mensuales_Junio.csv", tipo: "csv" },
    { nombre: "Reporte_Auditoria_2023.pdf", tipo: "pdf" },
    { nombre: "Desglose_Gastos_YTD.csv", tipo: "csv" }
];

const mensaje = $("mensaje");
let temporizador;

function avisar(texto) {
    mensaje.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (mensaje.textContent = ""), 3500);
}

// Indicadores
function mostrarIndicadores() {
    $("kpiIngresos").textContent = dinero(resumen.ingresos);
    $("kpiGanancias").textContent = dinero(resumen.ganancias);
    $("kpiGastos").textContent = dinero(resumen.gastos);
}

// Gráfica de barras apiladas (máximo 100k)
function mostrarGrafica() {
    const grafica = $("grafica");
    const maximo = 100;
    grafica.innerHTML = "";

    [0, 25, 50, 75, 100].forEach(valor => {
        const eje = document.createElement("span");
        eje.className = "rep-eje";
        eje.style.bottom = `calc(28px + (100% - 28px) * ${valor / maximo})`;
        eje.textContent = valor === 0 ? "0" : valor + "k";
        grafica.appendChild(eje);
    });

    meses.forEach(m => {
        const barra = document.createElement("div");
        barra.className = "rep-barra";
        barra.title = `${m.mes}: ingresos $${m.ingresos}k, gastos $${m.gastos}k`;

        const gastos = document.createElement("div");
        gastos.className = "rep-barra-gastos";
        gastos.style.height = (m.gastos / maximo) * 100 + "%";

        const ingresos = document.createElement("div");
        ingresos.className = "rep-barra-ingresos";
        ingresos.style.height = (m.ingresos / maximo) * 100 + "%";

        const etiqueta = document.createElement("span");
        etiqueta.className = "rep-mes";
        etiqueta.textContent = m.mes;

        barra.append(gastos, ingresos, etiqueta);
        grafica.appendChild(barra);
    });
}

// Lista de otros gastos
function mostrarGastos() {
    $("listaGastos").innerHTML = "";

    otrosGastos.forEach(g => {
        const li = document.createElement("li");
        li.className = "rep-gasto";

        const icono = document.createElement("span");
        icono.className = "rep-gasto-icono";
        icono.innerHTML = `<i class="bi ${g.icono}"></i>`;

        const texto = document.createElement("div");
        const titulo = document.createElement("b");
        titulo.textContent = g.titulo;
        const detalle = document.createElement("small");
        detalle.textContent = g.detalle;
        texto.append(titulo, detalle);

        const monto = document.createElement("strong");
        monto.textContent = dinero(g.monto);

        li.append(icono, texto, monto);
        $("listaGastos").appendChild(li);
    });
}

// Reportes generados
function mostrarDocumentos() {
    const cuerpo = $("listaReportes");
    cuerpo.innerHTML = "";

    documentos.forEach(d => {
        const fila = cuerpo.insertRow();

        const celda = fila.insertCell();
        const doc = document.createElement("span");
        doc.className = "rep-doc";
        doc.innerHTML = d.tipo === "pdf"
            ? '<i class="bi bi-file-earmark-pdf-fill"></i>'
            : '<i class="bi bi-file-earmark-spreadsheet-fill"></i>';
        doc.append(d.nombre);
        celda.appendChild(doc);

        const accion = fila.insertCell();
        accion.className = "rep-der";
        const boton = document.createElement("button");
        boton.className = "rep-descargar";
        boton.innerHTML = '<i class="bi bi-download"></i>';
        boton.setAttribute("aria-label", "Descargar " + d.nombre);
        boton.onclick = () => avisar("Descarga de " + d.nombre + " próximamente.");
        accion.appendChild(boton);
    });
}

// Exportar resumen a CSV
$("exportar").onclick = function () {
    const filas = [
        ["Mes", "Ingresos (miles)", "Gastos (miles)"],
        ...meses.map(m => [m.mes, m.ingresos, m.gastos])
    ];

    const csv = filas.map(f =>
        f.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")
    ).join("\r\n");

    const archivo = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "reporte_sammy_sports.csv";
    enlace.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    avisar("CSV exportado correctamente.");
};

$("imprimir").onclick = () => window.print();
$("cierreCaja").onclick = () => (location.href = "cierreCaja.html");
$("verGastos").onclick = e => {
    e.preventDefault();
    avisar("El listado completo de gastos se implementará en la siguiente etapa.");
};

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

mostrarIndicadores();
mostrarGrafica();
mostrarGastos();
mostrarDocumentos();