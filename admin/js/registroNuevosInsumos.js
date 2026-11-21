document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formInsumo");
  const skuInput = document.getElementById("sku");
  const nombreInput = document.getElementById("nombre");
  const categoriaInput = document.getElementById("categoria");
  const proveedorInput = document.getElementById("proveedor");
  const stockInput = document.getElementById("stock");
  const unidadInput = document.getElementById("unidad");
  const costoInput = document.getElementById("costo");
  const alertaInput = document.getElementById("alerta");
  const btnLimpiar = document.getElementById("btnLimpiar");
  const mensajeEstado = document.getElementById("mensajeEstado");
  const tablaInsumos = document.getElementById("tablaInsumos");
  const contadorInsumos = document.getElementById("contadorInsumos");
  const resumenTabla = document.getElementById("resumenTabla");
  const abrirMenuBtn = document.getElementById("abrirMenu");
  const sidebar = document.getElementById("sidebar");

  const STORAGE_KEY = "sammy_sports_insumos";
  const URL_INVENTARIO = "Inventario.html";
  const RETRASO_REDIRECCION_MS = 850;

  const INSUMOS_BASE = [
    {
      id: "base-1",
      sku: "FAB-001",
      nombre: "Malla de Rendimiento - Azul",
      categoria: "Tela",
      proveedor: "Apex Textiles",
      stock: 450,
      unidad: "Yardas",
      costo: 4.5,
      alertaMinima: 50,
      estado: "Adecuado"
    },
    {
      id: "base-2",
      sku: "THR-042",
      nombre: "Hilo de Alta Resistencia - Blanco",
      categoria: "Hilo",
      proveedor: "Global Threads Inc.",
      stock: 12,
      unidad: "Bobinas",
      costo: 1.2,
      alertaMinima: 50,
      estado: "Crítico"
    },
    {
      id: "base-3",
      sku: "ZIP-105",
      nombre: 'Cremallera Impermeable 24" - Negra',
      categoria: "Herrajes",
      proveedor: "SecureFasteners",
      stock: 1200,
      unidad: "Unidades",
      costo: 0.85,
      alertaMinima: 50,
      estado: "Adecuado"
    }
  ];

  let timeoutMensaje = null;
  let timeoutRedireccion = null;

  function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto ?? "");
    return div.innerHTML;
  }

  function obtenerInsumos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INSUMOS_BASE));
        return [...INSUMOS_BASE];
      }
      const datos = JSON.parse(raw);
      return Array.isArray(datos) ? datos : [...INSUMOS_BASE];
    } catch (error) {
      console.error("Error al leer insumos de localStorage:", error);
      return [...INSUMOS_BASE];
    }
  }

  function guardarInsumos(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function generarSiguienteSKU() {
    const insumos = obtenerInsumos();
    const numero = String(insumos.length + 1).padStart(3, "0");
    if (skuInput) {
      skuInput.value = `INS-${numero}`;
    }
  }

  function mostrarMensaje(texto, tipo, autoOcultar = true) {
    if (!mensajeEstado) return;
    clearTimeout(timeoutMensaje);
    mensajeEstado.textContent = texto;
    mensajeEstado.className = `toast ${tipo}`;

    if (autoOcultar) {
      timeoutMensaje = setTimeout(() => {
        mensajeEstado.classList.add("oculto");
      }, 4500);
    }
  }

  function limpiarErroresVisuales() {
    document.querySelectorAll(".input-error").forEach((el) => {
      el.classList.remove("input-error");
    });
  }

  function validarFormulario() {
    limpiarErroresVisuales();
    let esValido = true;

    const camposObligatorios = [nombreInput, categoriaInput, stockInput, costoInput];
    camposObligatorios.forEach((campo) => {
      if (!campo || !campo.value.trim()) {
        if (campo) campo.classList.add("input-error");
        esValido = false;
      }
    });

    if (!esValido) {
      mostrarMensaje("Por favor completa todos los campos obligatorios.", "error");
      return false;
    }

    const stock = Number(stockInput.value);
    const costo = Number(costoInput.value);
    const alerta = alertaInput && alertaInput.value.trim() !== "" ? Number(alertaInput.value) : null;

    if (Number.isNaN(stock) || stock < 0) {
      stockInput.classList.add("input-error");
      mostrarMensaje("El stock inicial debe ser un número igual o mayor a 0.", "error");
      return false;
    }

    if (Number.isNaN(costo) || costo < 0) {
      costoInput.classList.add("input-error");
      mostrarMensaje("El costo unitario debe ser un número igual o mayor a 0.", "error");
      return false;
    }

    if (alerta !== null && (Number.isNaN(alerta) || alerta < 0)) {
      alertaInput.classList.add("input-error");
      mostrarMensaje("El nivel mínimo de alerta debe ser un número igual o mayor a 0.", "error");
      return false;
    }

    return true;
  }

  function esEstadoCritico(item) {
    const stockNum = Number(item.stock ?? item.cantidad ?? 0);
    const alertaNum =
      item.alertaMinima !== null && item.alertaMinima !== undefined
        ? Number(item.alertaMinima)
        : null;

    return (
      item.estado === "Crítico" ||
      (alertaNum !== null && !Number.isNaN(alertaNum) && stockNum < alertaNum)
    );
  }

  function renderizarTabla() {
    if (!tablaInsumos) return;
    const insumos = obtenerInsumos();

    if (contadorInsumos) {
      contadorInsumos.textContent = insumos.length;
    }

    if (resumenTabla) {
      resumenTabla.textContent = `Mostrando ${insumos.length ? 1 : 0} a ${insumos.length} de ${insumos.length} entradas`;
    }

    if (insumos.length === 0) {
      tablaInsumos.innerHTML = `
        <tr>
          <td colspan="8" class="empty-row">Aún no hay insumos registrados.</td>
        </tr>`;
      return;
    }

    tablaInsumos.innerHTML = insumos
      .map((item, index) => {
        const critico = esEstadoCritico(item);
        const stockNum = Number(item.stock ?? item.cantidad ?? 0);
        const claseStock = critico ? "stock-critico" : "";
        const claseEstado = critico ? "critico" : "adecuado";
        const textoEstado = critico ? "Crítico" : "Adecuado";

        return `
          <tr>
            <td>${escaparHTML(item.sku || item.codigo || "")}</td>
            <td>${escaparHTML(item.nombre)}</td>
            <td>${escaparHTML(item.categoria)}</td>
            <td>${escaparHTML(item.proveedor || "Por asignar")}</td>
            <td>
              <span class="stock-numero ${claseStock}">${stockNum.toLocaleString("en-US")}</span>
              <span class="stock-unidad ${claseStock}">${escaparHTML(item.unidad)}</span>
            </td>
            <td>$${Number(item.costo).toFixed(2)}</td>
            <td>
              <span class="estado ${claseEstado}">${textoEstado}</span>
            </td>
            <td>
              <button type="button" class="btn-delete" data-index="${index}">Eliminar</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function redirigirAInventario() {
    clearTimeout(timeoutRedireccion);
    timeoutRedireccion = setTimeout(() => {
      window.location.href = URL_INVENTARIO;
    }, RETRASO_REDIRECCION_MS);
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!validarFormulario()) return;

      const stock = parseFloat(stockInput.value);
      const costo = parseFloat(costoInput.value);
      const alertaMinima =
        alertaInput && alertaInput.value.trim() !== "" ? parseFloat(alertaInput.value) : null;
      const proveedor =
        proveedorInput && proveedorInput.value.trim() !== ""
          ? proveedorInput.value.trim()
          : "Por asignar";

      const nuevoInsumo = {
        id: Date.now(),
        sku: skuInput ? skuInput.value : "",
        nombre: nombreInput.value.trim(),
        categoria: categoriaInput.value,
        proveedor,
        stock,
        unidad: unidadInput ? unidadInput.value : "Unidades",
        costo,
        alertaMinima,
        estado: alertaMinima !== null && stock < alertaMinima ? "Crítico" : "Adecuado",
        fechaRegistro: new Date().toISOString()
      };

      const insumos = obtenerInsumos();
      insumos.push(nuevoInsumo);
      guardarInsumos(insumos);

      renderizarTabla();
      generarSiguienteSKU();

      if (alertaMinima !== null && stock < alertaMinima) {
        mostrarMensaje(
          `Insumo "${nuevoInsumo.nombre}" guardado con stock bajo (${stock} < ${alertaMinima}). Redirigiendo a Inventario...`,
          "alerta",
          false
        );
      } else {
        mostrarMensaje(
          `Insumo "${nuevoInsumo.nombre}" registrado correctamente. Redirigiendo a Inventario...`,
          "exito",
          false
        );
      }

      form.reset();
      if (stockInput) stockInput.value = 0;
      redirigirAInventario();
    });
  }

  if (tablaInsumos) {
    tablaInsumos.addEventListener("click", (e) => {
      const boton = e.target.closest(".btn-delete");
      if (!boton) return;

      const index = Number(boton.dataset.index);
      const insumos = obtenerInsumos();
      if (index < 0 || index >= insumos.length) return;

      const eliminado = insumos[index];
      insumos.splice(index, 1);
      guardarInsumos(insumos);
      renderizarTabla();
      generarSiguienteSKU();

      if (eliminado) {
        mostrarMensaje(`Insumo "${eliminado.nombre}" eliminado.`, "exito");
      }
    });
  }

  if (btnLimpiar && form) {
    btnLimpiar.addEventListener("click", () => {
      clearTimeout(timeoutRedireccion);
      form.reset();
      if (stockInput) stockInput.value = 0;
      limpiarErroresVisuales();
      generarSiguienteSKU();
      if (mensajeEstado) mensajeEstado.classList.add("oculto");
    });
  }

  if (abrirMenuBtn && sidebar) {
    abrirMenuBtn.addEventListener("click", () => {
      const estaAbierta = sidebar.classList.toggle("abierta");
      abrirMenuBtn.setAttribute("aria-expanded", String(estaAbierta));
    });

    sidebar.querySelectorAll("a").forEach((enlace) => {
      enlace.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove("abierta");
          abrirMenuBtn.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("click", (evento) => {
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains("abierta") &&
        !sidebar.contains(evento.target) &&
        !abrirMenuBtn.contains(evento.target)
      ) {
        sidebar.classList.remove("abierta");
        abrirMenuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".sin-destino").forEach((enlace) => {
    enlace.addEventListener("click", (evento) => evento.preventDefault());
  });

  generarSiguienteSKU();
  renderizarTabla();
});