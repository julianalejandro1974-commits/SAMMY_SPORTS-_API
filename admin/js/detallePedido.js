document.addEventListener("DOMContentLoaded", () => {
  const CLAVE_BORRADOR = "sammy_sports_pedido_borrador";
  const CLAVE_ORDENES = "sammy_sports_ordenes_activas";
  const URL_PEDIDOS = "Pedidos.html";

  const inputCliente = document.getElementById("inputCliente");
  const inputUniforme = document.getElementById("inputUniforme");
  const inputNotas = document.getElementById("inputNotas");
  const cuerpoIntegrantes = document.getElementById("cuerpoIntegrantes");
  const btnAgregarJugador = document.getElementById("btnAgregarJugador");
  const btnDuplicarFila = document.getElementById("btnDuplicarFila");
  const btnGuardarPedido = document.getElementById("btnGuardarPedido");
  const btnExportarPDF = document.getElementById("btnExportarPDF");
  const avisoEstado = document.getElementById("avisoEstado");
  const abrirMenuBtn = document.getElementById("abrirMenu");
  const sidebar = document.getElementById("sidebar");

  let jugadores = [
    { nombre: "Juan Pérez", numero: "10", camiseta: "M", pantalon: "M", posicion: "Jugador de Campo", observaciones: "-" },
    { nombre: "Carlos Gómez", numero: "1", camiseta: "L", pantalon: "L", posicion: "Arquero", observaciones: "Manga larga" }
  ];

  function mostrarAviso(msg) {
    if (!avisoEstado) return;
    avisoEstado.textContent = msg;
    avisoEstado.classList.remove("oculto");
  }

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
        <td><input type="text" data-idx="${index}" data-campo="nombre" value="${j.nombre}" placeholder="Nombre y apellido" /></td>
        <td><input type="text" data-idx="${index}" data-campo="numero" value="${j.numero}" placeholder="#" style="max-width:65px" /></td>
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
        <td><input type="text" data-idx="${index}" data-campo="observaciones" value="${j.observaciones}" placeholder="Observaciones" /></td>
        <td>
          <button type="button" class="btn-quitar" data-eliminar="${index}" title="Eliminar fila">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");

    actualizarConsolidado();
  }

  cuerpoIntegrantes.addEventListener("input", (e) => {
    const idx = Number(e.target.dataset.idx);
    const campo = e.target.dataset.campo;
    if (!Number.isNaN(idx) && campo && jugadores[idx]) {
      jugadores[idx][campo] = e.target.value;
      actualizarConsolidado();
    }
  });

  cuerpoIntegrantes.addEventListener("change", (e) => {
    const idx = Number(e.target.dataset.idx);
    const campo = e.target.dataset.campo;
    if (!Number.isNaN(idx) && campo && jugadores[idx]) {
      jugadores[idx][campo] = e.target.value;
      actualizarConsolidado();
    }
  });

  cuerpoIntegrantes.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-eliminar]");
    if (!btn) return;
    const idx = Number(btn.dataset.eliminar);
    jugadores.splice(idx, 1);
    renderizarJugadores();
  });

  btnAgregarJugador.addEventListener("click", () => {
    jugadores.push({
      nombre: "",
      numero: String(jugadores.length + 1),
      camiseta: "M",
      pantalon: "M",
      posicion: "Jugador de Campo",
      observaciones: "-"
    });
    renderizarJugadores();
  });

  btnDuplicarFila.addEventListener("click", () => {
    const ultima = jugadores[jugadores.length - 1] || {
      nombre: "",
      numero: "",
      camiseta: "M",
      pantalon: "M",
      posicion: "Jugador de Campo",
      observaciones: "-"
    };
    jugadores.push({ ...ultima, nombre: "" });
    renderizarJugadores();
  });

  btnGuardarPedido.addEventListener("click", () => {
    const cliente = inputCliente.value.trim() || "Cliente sin nombre";
    const uniforme = inputUniforme.value.trim() || "Uniforme Personalizado";
    const notas = inputNotas ? inputNotas.value.trim() : "";

    const ordenActiva = {
      id: "ORD-" + String(Math.floor(1000 + Math.random() * 9000)),
      cliente,
      uniforme,
      notas,
      cantidadIntegrantes: jugadores.length,
      jugadores,
      estado: "En Producción",
      fechaLimite: new Date(Date.now() + 7 * 86400000).toLocaleDateString("es-CO"),
      creadoEn: new Date().toISOString()
    };

    try {
      const actuales = JSON.parse(localStorage.getItem(CLAVE_ORDENES));
      const lista = Array.isArray(actuales) ? actuales : [];
      lista.unshift(ordenActiva);
      localStorage.setItem(CLAVE_ORDENES, JSON.stringify(lista));
      localStorage.removeItem(CLAVE_BORRADOR);
    } catch (err) {
      console.error("Error al guardar orden:", err);
    }

    mostrarAviso(`Pedido de "${cliente}" guardado y enviado a Órdenes de Producción Activas...`);
    setTimeout(() => {
      window.location.href = URL_PEDIDOS;
    }, 750);
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

  cargarBorradorInicial();
  renderizarJugadores();
});