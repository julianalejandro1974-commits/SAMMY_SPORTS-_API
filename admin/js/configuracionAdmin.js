// SAMMY SPORTS - CONFIGURACIÓN

const formulario = document.getElementById("formConfiguracion");
const mensaje = document.getElementById("mensaje");
const fotoArchivo = document.getElementById("fotoArchivo");
const fotoVista = document.getElementById("fotoVista");

const campos = [
    "nombre", "telefono", "correo",
    "idioma", "moneda", "stock",
    "pedidos", "resumen", "nit",
    "representante", "direccion", "dosFactores"
];

const fotoPredeterminada = fotoVista.src;
let fotoGuardada = fotoPredeterminada;

// Leer los datos actuales del formulario
function obtenerDatos() {
    const datos = {};

    campos.forEach(id => {
        const elemento = document.getElementById(id);

        datos[id] = elemento.type === "checkbox"
            ? elemento.checked
            : elemento.value;
    });

    datos.foto = fotoGuardada;
    return datos;
}

// Mostrar datos en el formulario
function mostrarDatos(datos) {
    campos.forEach(id => {
        const elemento = document.getElementById(id);

        if (datos[id] !== undefined) {
            if (elemento.type === "checkbox") {
                elemento.checked = datos[id];
            } else {
                elemento.value = datos[id];
            }
        }
    });

    fotoGuardada = datos.foto || fotoPredeterminada;
    fotoVista.src = fotoGuardada;
}

// Cargar configuración guardada
function cargarConfiguracion() {
    try {
        const guardados = JSON.parse(localStorage.getItem("configuracionSammy"));

        if (guardados) {
            mostrarDatos(guardados);
        }
    } catch (error) {
        mensaje.textContent = "No se pudo cargar la configuración guardada.";
    }
}

// Vista previa de la foto
fotoArchivo.addEventListener("change", function () {
    const archivo = fotoArchivo.files[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
        mensaje.textContent = "Selecciona un archivo de imagen.";
        return;
    }

    if (archivo.size > 500000) {
        mensaje.textContent = "La imagen debe pesar menos de 500 KB.";
        return;
    }

    const lector = new FileReader();

    lector.onload = function () {
        fotoVista.src = lector.result;
    };

    lector.readAsDataURL(archivo);
});

// Guardar cambios
formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    const datos = obtenerDatos();
    datos.foto = fotoVista.src;

    try {
        localStorage.setItem("configuracionSammy", JSON.stringify(datos));
        fotoGuardada = datos.foto;

        mensaje.textContent = "Configuración guardada correctamente.";
        fotoArchivo.value = "";
    } catch (error) {
        mensaje.textContent = "No se pudieron guardar los cambios.";
    }
});

// Cancelar cambios
document.getElementById("cancelar").addEventListener("click", function () {
    const guardados = localStorage.getItem("configuracionSammy");

    if (guardados) {
        try {
            mostrarDatos(JSON.parse(guardados));
        } catch (error) {
            formulario.reset();
            fotoVista.src = fotoPredeterminada;
        }
    } else {
        formulario.reset();
        fotoVista.src = fotoPredeterminada;
        fotoGuardada = fotoPredeterminada;
    }

    document.getElementById("actual").value = "";
    document.getElementById("nueva").value = "";
    fotoArchivo.value = "";

    mensaje.textContent = "Cambios cancelados.";
});

// Menú en celulares
const abrirMenu = document.getElementById("abrirMenu");
const sidebar = document.getElementById("sidebar");

abrirMenu.onclick = function () {
    sidebar.classList.toggle("abierta");
};

document.addEventListener("click", function (e) {
    if (
        window.innerWidth <= 750 &&
        sidebar.classList.contains("abierta") &&
        !sidebar.contains(e.target) &&
        !abrirMenu.contains(e.target)
    ) {
        sidebar.classList.remove("abierta");
    }
});

// Inicializar
cargarConfiguracion();