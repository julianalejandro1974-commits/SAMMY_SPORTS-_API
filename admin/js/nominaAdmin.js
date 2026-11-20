
// SAMMY SPORTS - COMPROBANTE DE NÓMINA

// Datos de ejemplo del comprobante
const empleados = [
    {
        id: "SS-042",
        nombre: "Juan Perez",
        cargo: "Confeccionista de Elite",
        productos: [
            { nombre: "Camiseta Titular Oficial 24/25", cantidad: 145, tarifa: 5.50 },
            { nombre: "Pantaloneta Entrenamiento Pro", cantidad: 210, tarifa: 3.20 },
            { nombre: "Chaqueta Presentacion Elite", cantidad: 35, tarifa: 12.00 }
        ],
        deducciones: [
            { nombre: "Adelanto Quincenal (05 Oct)", monto: 350 },
            { nombre: "Aporte Seguridad Social (Ejemplo)", monto: 151.16 }
        ]
    },
    {
        id: "SS-089",
        nombre: "Maria Garcia",
        cargo: "Costura de Camisetas",
        productos: [
            { nombre: "Costura de Camisetas", cantidad: 310, tarifa: 2.20 }
        ],
        deducciones: []
    },
    {
        id: "SS-102",
        nombre: "Carlos Lopez",
        cargo: "Operario de Ensamblaje",
        productos: [
            { nombre: "Ensamblaje", cantidad: 850, tarifa: 0.85 }
        ],
        deducciones: [
            { nombre: "Adelanto Inicial (Ejemplo)", monto: 50 }
        ]
    }
];

// Obtener el ID enviado desde Personal
const parametros = new URLSearchParams(window.location.search);
const id = parametros.get("id") || "SS-042";

const empleado = empleados.find(e => e.id === id);

// Formato de dinero
function dinero(valor) {
    return "$ " + valor.toFixed(2);
}

// Mostrar comprobante
function mostrarComprobante() {
    if (!empleado) {
        document.querySelector(".comprobante").textContent =
            "No se encontró el empleado seleccionado.";
        return;
    }

    // Datos del empleado
    document.getElementById("nombreEmpleado").textContent = empleado.nombre;
    document.getElementById("idEmpleado").textContent = empleado.id;
    document.getElementById("cargoEmpleado").textContent = empleado.cargo;

    // Ingresos por producción
    const tabla = document.getElementById("tablaIngresos");
    let totalIngresos = 0;

    empleado.productos.forEach(producto => {
        const subtotal = producto.cantidad * producto.tarifa;
        totalIngresos += subtotal;

        const fila = tabla.insertRow();

        fila.insertCell().textContent = producto.nombre;
        fila.insertCell().textContent = producto.cantidad;
        fila.insertCell().textContent = dinero(producto.tarifa);
        fila.insertCell().textContent = dinero(subtotal);
    });

    // Deducciones del ejemplo
    const deducciones = [...empleado.deducciones];

    // Adelantos nuevos registrados en Personal
    let adelantosGuardados = [];

    try {
        const datos = JSON.parse(localStorage.getItem("adelantosSammy"));
        if (Array.isArray(datos)) {
            adelantosGuardados = datos;
        }
    } catch (error) {
        adelantosGuardados = [];
    }

    adelantosGuardados
        .filter(a => a.empleadoId === empleado.id)
        .forEach(a => {
            deducciones.push({
                nombre: "Adelanto Registrado",
                monto: Number(a.monto) || 0
            });
        });

    // Mostrar deducciones
    const lista = document.getElementById("listaDeducciones");
    let totalDeducciones = 0;

    deducciones.forEach(deduccion => {
        totalDeducciones += deduccion.monto;

        const fila = document.createElement("div");
        fila.className = "deduccion-fila";

        const nombre = document.createElement("span");
        nombre.textContent = deduccion.nombre;

        const monto = document.createElement("strong");
        monto.className = "rojo";
        monto.textContent = "-" + dinero(deduccion.monto);

        fila.append(nombre, monto);
        lista.appendChild(fila);
    });

    if (deducciones.length === 0) {
        lista.textContent = "No hay deducciones registradas.";
    }

    // Calcular el neto a pagar
    const neto = totalIngresos - totalDeducciones;

    document.getElementById("totalBruto").textContent = dinero(totalIngresos);
    document.getElementById("resumenIngresos").textContent = dinero(totalIngresos);
    document.getElementById("resumenDeducciones").textContent =
        "-" + dinero(totalDeducciones);
    document.getElementById("netoPagar").textContent = dinero(neto);
}

// Imprimir o guardar como PDF
document.getElementById("imprimir").addEventListener("click", function () {
    window.print();
});

// Iniciar
mostrarComprobante();
