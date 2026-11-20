
// SAMMY SPORTS - PERSONAL Y NÓMINA

// Empleados de ejemplo tomados del prototipo
const empleados = [
    {
        id: "SS-042",
        nombre: "Juan Perez",
        operacion: "Corte de Tela",
        tarifa: 1.50,
        unidades: 450,
        adelantoInicial: 100
    },
    {
        id: "SS-089",
        nombre: "Maria Garcia",
        operacion: "Costura (Camisetas)",
        tarifa: 2.20,
        unidades: 310,
        adelantoInicial: 0
    },
    {
        id: "SS-102",
        nombre: "Carlos Lopez",
        operacion: "Ensamblaje",
        tarifa: 0.85,
        unidades: 850,
        adelantoInicial: 50
    }
];

// Cargar adelantos guardados
let adelantos = [];

try {
    const datos = JSON.parse(localStorage.getItem("adelantosSammy"));
    if (Array.isArray(datos)) {
        adelantos = datos;
    }
} catch (error) {
    adelantos = [];
}

let pagina = 1;
const porPagina = 3;

const tabla = document.getElementById("tablaPersonal");
const buscar = document.getElementById("buscar");
const trabajador = document.getElementById("trabajador");
const monto = document.getElementById("monto");
const mensaje = document.getElementById("mensaje");

// Formato de dinero
function dinero(valor) {
    return "$" + valor.toFixed(2);
}

// Calcular adelantos de un empleado
function calcularAdelantos(empleado) {
    const adicionales = adelantos
        .filter(a => a.empleadoId === empleado.id)
        .reduce((total, a) => total + a.monto, 0);

    return empleado.adelantoInicial + adicionales;
}

// Llenar selector de trabajadores
function cargarTrabajadores() {
    trabajador.innerHTML = "";

    empleados.forEach(empleado => {
        const opcion = document.createElement("option");
        opcion.value = empleado.id;
        opcion.textContent = empleado.nombre;
        trabajador.appendChild(opcion);
    });
}

// Actualizar las tarjetas superiores
function actualizarResumen() {
    document.getElementById("totalPersonal").textContent = empleados.length;

    const total = empleados.reduce((suma, empleado) => {
        return suma + calcularAdelantos(empleado);
    }, 0);

    document.getElementById("totalAdelantos").textContent = dinero(total);

    document.getElementById("cantidadAdelantos").textContent =
        adelantos.length + " adelantos nuevos registrados";
}

// Mostrar tabla
function mostrarEmpleados() {
    const texto = buscar.value.toLowerCase();

    const filtrados = empleados.filter(empleado =>
        empleado.nombre.toLowerCase().includes(texto) ||
        empleado.id.toLowerCase().includes(texto) ||
        empleado.operacion.toLowerCase().includes(texto)
    );

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
    pagina = Math.min(pagina, totalPaginas);

    const inicio = (pagina - 1) * porPagina;
    const visibles = filtrados.slice(inicio, inicio + porPagina);

    tabla.innerHTML = "";

    visibles.forEach(empleado => {
        const bruto = empleado.tarifa * empleado.unidades;
        const adelanto = calcularAdelantos(empleado);

        const fila = tabla.insertRow();

        // Nombre e identificación
        const nombre = fila.insertCell();
        nombre.className = "empleado";
        nombre.textContent = empleado.nombre;

        const id = document.createElement("small");
        id.textContent = "ID: " + empleado.id;
        nombre.appendChild(id);

        // Operación
        const operacion = fila.insertCell();
        const etiqueta = document.createElement("span");
        etiqueta.className = "operacion";
        etiqueta.textContent = empleado.operacion;
        operacion.appendChild(etiqueta);

        // Tarifa y unidades
        fila.insertCell().textContent = dinero(empleado.tarifa);
        fila.insertCell().textContent = empleado.unidades;

        // Adelantos
        const celdaAdelanto = fila.insertCell();
        celdaAdelanto.className = "negativo";
        celdaAdelanto.textContent =
            adelanto > 0 ? "-" + dinero(adelanto) : dinero(0);

        // Total bruto
        const total = fila.insertCell();
        total.className = "total";
        total.textContent = dinero(bruto);

        // Botón del comprobante
        const acciones = fila.insertCell();
        const boton = document.createElement("button");
        boton.className = "btn-recibo";
        boton.innerHTML = '<i class="bi bi-receipt"></i>';
        boton.title = "Ver comprobante";
        boton.setAttribute("aria-label", "Ver comprobante de " + empleado.nombre);

        boton.onclick = () => {
            location.href = "nominaAdmin.html?id=" +
                encodeURIComponent(empleado.id);
        };

        acciones.appendChild(boton);
    });

    if (visibles.length === 0) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 7;
        celda.textContent = "No se encontraron empleados.";
    }

    document.getElementById("contador").textContent =
        "Mostrando " + visibles.length +
        " de " + filtrados.length + " empleados";

    document.getElementById("paginaActual").textContent = pagina;
    document.getElementById("anterior").disabled = pagina === 1;
    document.getElementById("siguiente").disabled = pagina === totalPaginas;
}

// Registrar un adelanto
document.getElementById("formAdelanto").addEventListener("submit", function (e) {
    e.preventDefault();

    const cantidad = Number(monto.value);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
        mensaje.textContent = "Ingresa un monto válido.";
        return;
    }

    adelantos.push({
        empleadoId: trabajador.value,
        monto: cantidad,
        fecha: new Date().toISOString()
    });

    try {
        localStorage.setItem("adelantosSammy", JSON.stringify(adelantos));
    } catch (error) {
        adelantos.pop();
        mensaje.textContent = "No fue posible guardar el adelanto.";
        return;
    }

    monto.value = "";
    actualizarResumen();
    mostrarEmpleados();

    mensaje.textContent = "Adelanto registrado correctamente.";
});

// Buscar empleados
buscar.addEventListener("input", function () {
    pagina = 1;
    mostrarEmpleados();
});

// Paginación
document.getElementById("anterior").onclick = function () {
    if (pagina > 1) {
        pagina--;
        mostrarEmpleados();
    }
};

document.getElementById("siguiente").onclick = function () {
    pagina++;
    mostrarEmpleados();
};

// Exportar datos a CSV
document.getElementById("exportar").onclick = function () {
    const filas = [
        ["ID", "Empleado", "Operacion", "Tarifa", "Unidades", "Adelantos", "Total Bruto"],

        ...empleados.map(e => [
            e.id,
            e.nombre,
            e.operacion,
            e.tarifa,
            e.unidades,
            calcularAdelantos(e),
            e.tarifa * e.unidades
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
    enlace.download = "personal_sammy_sports.csv";
    enlace.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Ejecutar nómina: abrir comprobante del empleado seleccionado
document.getElementById("ejecutar").onclick = function () {
    location.href = "nominaAdmin.html?id=" +
        encodeURIComponent(trabajador.value);
};

// PDF por lote: pendiente de la siguiente etapa
document.getElementById("descargarLote").onclick = function () {
    mensaje.textContent =
        "La descarga de PDF por lote se implementará con los comprobantes.";
};

// Cargar datos iniciales
cargarTrabajadores();
actualizarResumen();
mostrarEmpleados();
