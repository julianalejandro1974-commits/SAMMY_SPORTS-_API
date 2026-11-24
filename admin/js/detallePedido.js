document.addEventListener("DOMContentLoaded", async () => {
  const API = window.PedidosAPI; // definido en js/pedidosApi.js (se carga antes)
  const CLAVE_BORRADOR = "sammy_sports_pedido_borrador";
  const URL_PEDIDOS = "Pedidos.html";

  const inputCliente = document.getElementById("inputCliente");
  const inputUniforme = document.getElementById("inputUniforme");
  const inputNotas = document.getElementById("inputNotas");
  const inputTotal = document.getElementById("inputTotal");
  const inputAbono = document.getElementById("inputAbono");
  const saldoPendiente = document.getElementById("saldoPendiente");
  const estadoPagoTexto = document.getElementById("estadoPagoTexto");
  const tituloPlanilla = document.getElementById("tituloPlanilla");
  const cuerpoIntegrantes = document.getElementById("cuerpoIntegrantes");
  const btnAgregarJugador = document.getElementById("btnAgregarJugador");
  const btnDuplicarFila = document.getElementById("btnDuplicarFila");
  const btnGuardarPedido = document.getElementById("btnGuardarPedido");
  const btnExportarPDF = document.getElementById("btnExportarPDF");
  const avisoEstado = document.getElementById("avisoEstado");
  const abrirMenuBtn = document.getElementById("abrirMenu");
  const sidebar = document.getElementById("sidebar");

  if (!API) {
    console.error("Falta cargar js/pedidosApi.js antes de detallePedido.js");
    return;
  }

  // Si la URL trae ?id=ORD-1234 la planilla edita ese pedido; si no, crea uno nuevo
  const idEditar = new URLSearchParams(window.location.search).get("id");
  let ordenEditando = null;

  const esc = t => String(t ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dinero = n => "$" + Number(n || 0).toLocaleString("en-US");
  const num = v => Math.max(Number(v) || 0, 0);

  const jugadorVacio = () => ({
    nombre: "", numero: "", camiseta: "M", pantalon: "M", posicion: "Jugador de Campo", observaciones: "-"
  });

  let jugadores = [
    { nombre: "Juan Pérez", numero: "10", camiseta: "M", pantalon: "M", posicion: "Jugador de Campo", observaciones: "-" },
    { nombre: "Carlos Gómez", numero: "1", camiseta: "L", pantalon: "L", posicion: "Arquero", observaciones: "Manga larga" }
  ];

  function mostrarAviso(msg, esError = false) {
    if (!avisoEstado) return;
    avisoEstado.textContent = msg;
    avisoEstado.classList.toggle("error", esError);
    avisoEstado.classList.remove("oculto");
  }

  // ===== Carga inicial =====
  function cargarBorradorInicial() {
    try {
      const borrador = JSON.parse(localStorage.getItem(CLAVE_BORRADOR));
      if (!borrador) return;

      if (borrador.cliente && inputCliente) inputCliente.value = borrador.cliente;
      if (borrador.uniforme && inputUniforme) inputUniforme.value = borrador.uniforme;
      if (borrador.notas && inputNotas) inputNotas.value = borrador.notas;
      if (Array.isArray(borrador.jugadores) && borrador.jugadores.length > 0) {
        jugadores = borrador.jugadores;
      }
    } catch (err) {
      console.error("Error al cargar borrador:", err);
    }
  }

  async function cargarPedidoParaEditar() {
    try {
      ordenEditando = await API.obtener(idEditar);
    } catch (err) {
      console.error(err);
    }

    if (!ordenEditando) {
      mostrarAviso(`No se encontró el pedido ${idEditar}. Se abrió una planilla nueva.`, true);
      cargarBorradorInicial();
      return;
    }

    inputCliente.value = ordenEditando.cliente || "";
    inputUniforme.value = ordenEditando.uniforme || "";
    inputNotas.value = ordenEditando.notas || "";
    inputTotal.value = ordenEditando.total || "";
    inputAbono.value = ordenEditando.abonado || "";
    jugadores = Array.isArray(ordenEditando.jugadores) && ordenEditando.jugadores.length
      ? ordenEditando.jugadores.map(j => ({ ...j }))
      : [jugadorVacio()];

    if (tituloPlanilla) tituloPlanilla.textContent = `Editar Pedido ${ordenEditando.id}`;

    if (!ordenEditando.jugadores?.length) {
      mostrarAviso("Este pedido no tiene planilla de integrantes registrada. Si no agregas nombres, se conservará la cantidad original.");
    }
  }

  // ===== Pago =====
  function actualizarPago() {
    const total = num(inputTotal.value);
    const abonado = num(inputAbono.value);
    const estado = API.derivarPago(total, abonado);
    saldoPendiente.textContent = dinero(Math.max(total - abonado, 0));
    estadoPagoTexto.textContent = API.ESTADOS_PAGO[estado];
    estadoPagoTexto.className = `badge-pago ${estado}`;
  }

  inputTotal.addEventListener("input", actualizarPago);
  inputAbono.addEventListener("input", actualizarPago);

  // ===== Consolidado de tallas =====
  function actualizarConsolidado() {
    const tallasCam = { S: 0, M: 0, L: 0, XL: 0 };
    const tallasPan = { S: 0, M: 0, L: 0, XL: 0 };
    let arqueros = 0;

    jugadores.forEach(j => {
      if (tallasCam[j.camiseta] !== undefined) tallasCam[j.camiseta]++;
      if (tallasPan[j.pantalon] !== undefined) tallasPan[j.pantalon]++;
      if (j.posicion === "Arquero") arqueros++;
    });

    ["S", "M", "L", "XL"].forEach(t => {
      document.getElementById(`cam-${t}`).textContent = tallasCam[t];
      document.getElementById(`pan-${t}`).textContent = tallasPan[t];
    });

    document.getElementById("totalCamisetas").textContent = jugadores.length;
    document.getElementById("totalPantalones").textContent = jugadores.length;
    document.getElementById("totalArqueros").textContent = arqueros;
  }

  function renderizarJugadores() {
    cuerpoIntegrantes.innerHTML = jugadores.map((j, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><input type="text" data-idx="${index}" data-campo="nombre" value="${esc(j.nombre)}" placeholder="Nombre y apellido" /></td>
        <td><input type="text" data-idx="${index}" data-campo="numero" value="${esc(j.numero)}" placeholder="#" style="max-width:65px" /></td>
        <td>
          <select data-idx="${index}" data-campo="camiseta">
            ${["S", "M", "L", "XL"].map(t => `<option value="${t}" ${j.camiseta === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </td>
        <td>
          <select data-idx="${index}" data-campo="pantalon">
            ${["S", "M", "L", "XL"].map(t => `<option value="${t}" ${j.pantalon === t ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </td>
        <td>
          <select data-idx="${index}" data-campo="posicion">
            <option value="Jugador de Campo" ${j.posicion === "Jugador de Campo" ? "selected" : ""}>Jugador de Campo</option>
            <option value="Arquero" ${j.posicion === "Arquero" ? "selected" : ""}>Arquero</option>
          </select>
        </td>
        <td><input type="text" data-idx="${index}" data-campo="observaciones" value="${esc(j.observaciones)}" placeholder="Observaciones" /></td>
        <td>
          <button type="button" class="btn-quitar" data-eliminar="${index}" title="Eliminar fila">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");

    actualizarConsolidado();
  }

  function guardarCampo(e) {
    const idx = Number(e.target.dataset.idx);
    const campo = e.target.dataset.campo;
    if (!Number.isNaN(idx) && campo && jugadores[idx]) {
      jugadores[idx][campo] = e.target.value;
      actualizarConsolidado();
    }
  }
  cuerpoIntegrantes.addEventListener("input", guardarCampo);
  cuerpoIntegrantes.addEventListener("change", guardarCampo);

  cuerpoIntegrantes.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-eliminar]");
    if (!btn) return;
    jugadores.splice(Number(btn.dataset.eliminar), 1);
    renderizarJugadores();
  });

  btnAgregarJugador.addEventListener("click", () => {
    jugadores.push({ ...jugadorVacio(), numero: String(jugadores.length + 1) });
    renderizarJugadores();
  });

  btnDuplicarFila.addEventListener("click", () => {
    const ultima = jugadores[jugadores.length - 1] || jugadorVacio();
    jugadores.push({ ...ultima, nombre: "" });
    renderizarJugadores();
  });

  // ===== Guardar (CREATE o UPDATE según haya ?id=) =====
  btnGuardarPedido.addEventListener("click", async () => {
    const total = num(inputTotal.value);
    const abonado = num(inputAbono.value);

    if (abonado > total) {
      mostrarAviso("El abonado no puede superar el total a pagar.", true);
      inputAbono.focus();
      return;
    }

    const cliente = inputCliente.value.trim() || "Cliente sin nombre";

    // Pedido antiguo sin planilla y sin nombres nuevos: no pisar la cantidad original
    const sinPlanilla = ordenEditando
      && !ordenEditando.jugadores?.length
      && jugadores.every(j => !String(j.nombre).trim());

    const datos = {
      cliente,
      uniforme: inputUniforme.value.trim() || "Uniforme Personalizado",
      notas: inputNotas.value.trim(),
      cantidadIntegrantes: sinPlanilla ? ordenEditando.cantidadIntegrantes : jugadores.length,
      jugadores: sinPlanilla ? [] : jugadores,
      total,
      abonado
    };

    btnGuardarPedido.disabled = true;
    try {
      if (ordenEditando) {
        await API.actualizar(ordenEditando.id, datos);
        mostrarAviso(`Pedido ${ordenEditando.id} actualizado...`);
      } else {
        await API.crear(datos);
        localStorage.removeItem(CLAVE_BORRADOR);
        mostrarAviso(`Pedido de "${cliente}" guardado y enviado a Órdenes de Producción Activas...`);
      }
      setTimeout(() => { window.location.href = URL_PEDIDOS; }, 750);
    } catch (err) {
      console.error("Error al guardar pedido:", err);
      mostrarAviso("No se pudo guardar el pedido. Intenta de nuevo.", true);
      btnGuardarPedido.disabled = false;
    }
  });

  btnExportarPDF.addEventListener("click", () => {
    window.print();
  });

  if (abrirMenuBtn && sidebar) {
    abrirMenuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("abierta");
    });
  }

  document.querySelectorAll(".sin-destino").forEach(a => {
    a.addEventListener("click", e => e.preventDefault());
  });

  // ===== Arranque =====
  if (idEditar) await cargarPedidoParaEditar();
  else cargarBorradorInicial();

  renderizarJugadores();
  actualizarPago();
});