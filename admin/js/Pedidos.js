document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const API = window.PedidosAPI; // definido en js/pedidosApi.js (debe cargarse antes)

  const CLAVE_BORRADOR = 'sammy_sports_pedido_borrador';
  const URL_DETALLE_PEDIDO = 'detallePedido.html';

  if (!API) {
    console.error('Falta cargar js/pedidosApi.js antes de Pedidos.js');
    return;
  }
  const { ESTADOS, ESTADOS_PAGO, derivarPago, saldoDe } = API;

  // ===== Menú hamburguesa (celular y tablet) =====
  const boton = $('#abrirMenu');
  const sidebar = $('#sidebar');
  if (boton && sidebar) {
    const cambiar = abrir => {
      sidebar.classList.toggle('ped-abierto', abrir);
      document.body.classList.toggle('ped-menu-abierto', abrir);
      boton.setAttribute('aria-expanded', abrir);
    };
    boton.setAttribute('aria-expanded', 'false');
    boton.addEventListener('click', e => {
      e.stopPropagation();
      cambiar(!sidebar.classList.contains('ped-abierto'));
    });
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target)) cambiar(false);
    });
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => cambiar(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cambiar(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 991) cambiar(false); });
  }

  // ===== Utilidades de presentación =====
  const dinero = n => '$' + Number(n || 0).toLocaleString('en-US');
  const iniciales = n => String(n || '').split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SA';
  const num = v => Number(v) || 0;
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function formatearFecha(iso) {
    if (!iso) return 'Por definir';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ===== Mensajes =====
  const mensaje = $('#mensaje');
  let temporizador;
  function avisar(texto) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (mensaje.textContent = ''), 3000);
  }

  // ===== Estado en memoria (copia de lo que devuelve la API) =====
  let pedidos = [];

  async function recargar() {
    try {
      pedidos = await API.listar();
    } catch (err) {
      console.error(err);
      avisar('No se pudieron cargar los pedidos');
      pedidos = [];
    }
    pintarPedidos();
  }

  const cotizaciones = [
    { id: 'QT-4420', fecha: 'Oct 24', desc: 'Downtown Athletics - 50x Polos', monto: 1450, estado: 'borrador', rango: 'semana' },
    { id: 'QT-4419', fecha: 'Oct 22', desc: 'Westside Tennis - Redes de Cancha y Equipo', monto: 3200, estado: 'enviado', rango: 'semana' },
    { id: 'QT-4415', fecha: 'Oct 18', desc: 'Peak Performance Gym - Uniformes de Personal', monto: 890, estado: 'aceptado', rango: 'pasada' }
  ];

  // ===== Tabla (READ) =====
  function filaPedido(p) {
    const saldo = saldoDe(p);
    const celdaSaldo = p.total <= 0
      ? `—<small>Sin total definido</small>`
      : saldo > 0
        ? `${dinero(saldo)}<small class="debe">de ${dinero(p.total)}</small>`
        : `$0<small class="pagado">Pagado</small>`;

    const opcionesEstado = Object.entries(ESTADOS)
      .map(([k, v]) => `<option value="${k}" ${k === p.estado ? 'selected' : ''}>${v}</option>`)
      .join('');

    return `
      <tr>
        <td><span class="ped-id">${esc(p.id)}</span></td>
        <td><div class="ped-cliente">${esc(p.cliente)}</div><small>${esc(p.uniforme)} (x${esc(p.cantidadIntegrantes)})</small></td>
        <td>${esc(formatearFecha(p.fechaLimite))}</td>
        <td><span class="ped-quien"><i>${esc(iniciales(p.confeccionista))}</i>${esc(p.confeccionista)}</span></td>
        <td>
          <select class="ped-sel-estado ped-e-${p.estado}" data-id="${esc(p.id)}" aria-label="Estado del pedido ${esc(p.id)}">
            ${opcionesEstado}
          </select>
        </td>
        <td><span class="ped-pago ped-p-${p.estadoPago}">${ESTADOS_PAGO[p.estadoPago]}</span></td>
        <td class="ped-saldo">${celdaSaldo}</td>
        <td class="ped-acciones">
          <a class="ped-icono" href="${URL_DETALLE_PEDIDO}?id=${encodeURIComponent(p.id)}" title="Ver / editar planilla" aria-label="Ver o editar planilla de ${esc(p.id)}"><i class="bi bi-card-list"></i></a>
          <button type="button" class="ped-icono" data-accion="editar" data-id="${esc(p.id)}" title="Editar estado y pago" aria-label="Editar ${esc(p.id)}"><i class="bi bi-pencil-square"></i></button>
          <button type="button" class="ped-icono ped-icono-peligro" data-accion="eliminar" data-id="${esc(p.id)}" title="Eliminar" aria-label="Eliminar ${esc(p.id)}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
  }

  function pintarPedidos() {
    $('#tablaPedidos').innerHTML = pedidos.length
      ? pedidos.map(filaPedido).join('')
      : '<tr><td colspan="8" class="ped-vacio">No hay pedidos. Crea uno con "Nuevo Pedido".</td></tr>';

    const conSaldo = pedidos.filter(p => saldoDe(p) > 0);
    const suma = conSaldo.reduce((acc, p) => acc + saldoDe(p), 0);
    const alertaTexto = $('#pedAlertaTexto');
    if (alertaTexto) {
      alertaTexto.textContent = conSaldo.length
        ? `${conSaldo.length} pedido${conSaldo.length === 1 ? '' : 's'} con saldo pendiente. Total por cobrar: ${dinero(suma)}.`
        : 'No hay saldos pendientes.';
    }
  }

  // ===== Cambio rápido de estado (UPDATE) =====
  $('#tablaPedidos')?.addEventListener('change', async e => {
    const sel = e.target.closest('.ped-sel-estado');
    if (!sel) return;
    const id = sel.dataset.id;
    try {
      const orden = await API.actualizar(id, { estado: sel.value });
      if (!orden) throw new Error('Pedido no encontrado');
      avisar(`${id}: estado cambiado a "${ESTADOS[orden.estado]}"`);
    } catch (err) {
      console.error(err);
      avisar('No se pudo cambiar el estado');
    }
    await recargar();
  });

  // ===== Editar / Eliminar =====
  $('#tablaPedidos')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.accion === 'editar') abrirEdicion(id);
    if (btn.dataset.accion === 'eliminar') eliminarPedido(id);
  });

  async function eliminarPedido(id) {
    const orden = pedidos.find(p => p.id === id);
    if (!orden) return;
    const saldoTxt = saldoDe(orden) > 0 ? `\nOJO: tiene un saldo pendiente de ${dinero(saldoDe(orden))}.` : '';
    if (!confirm(`¿Eliminar el pedido ${orden.id} de ${orden.cliente}?${saldoTxt}\nEsta acción no se puede deshacer.`)) return;
    try {
      await API.eliminar(id);
      avisar(`Pedido ${id} eliminado`);
    } catch (err) {
      console.error(err);
      avisar('No se pudo eliminar el pedido');
    }
    await recargar();
  }

  // ===== Modal de edición (UPDATE completo) =====
  const dlg = $('#dlgPedido');
  const f = {
    id: $('#edId'), cliente: $('#edCliente'), fecha: $('#edFecha'), conf: $('#edConf'),
    estado: $('#edEstado'), total: $('#edTotal'), abonado: $('#edAbonado'),
    pago: $('#edPago'), saldo: $('#edSaldo'), error: $('#edError'), lista: $('#listaConf')
  };
  let editandoId = null;

  if (dlg) {
    f.estado.innerHTML = Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
    f.pago.innerHTML = Object.entries(ESTADOS_PAGO).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  }

  function refrescarSaldoModal() {
    f.saldo.textContent = dinero(Math.max(num(f.total.value) - num(f.abonado.value), 0));
  }

  function abrirEdicion(id) {
    const o = pedidos.find(p => p.id === id);
    if (!o || !dlg) return;
    editandoId = id;
    f.id.textContent = o.id;
    f.cliente.value = o.cliente;
    f.fecha.value = o.fechaLimite;
    f.conf.value = o.confeccionista === 'Sin asignar' ? '' : o.confeccionista;
    f.estado.value = o.estado;
    f.total.value = o.total;
    f.abonado.value = o.abonado;
    f.pago.value = o.estadoPago;
    f.error.hidden = true;

    const conocidos = [...new Set(pedidos.map(p => p.confeccionista).filter(c => c && c !== 'Sin asignar'))];
    f.lista.innerHTML = conocidos.map(c => `<option value="${esc(c)}"></option>`).join('');

    refrescarSaldoModal();
    dlg.showModal();
    f.cliente.focus();
  }

  // Total o abonado cambian -> el estado de pago se recalcula
  [f.total, f.abonado].forEach(inp => inp?.addEventListener('input', () => {
    f.pago.value = derivarPago(num(f.total.value), num(f.abonado.value));
    refrescarSaldoModal();
  }));

  // Estado de pago cambia -> se ajusta el abonado
  f.pago?.addEventListener('change', () => {
    if (f.pago.value === 'pagado') f.abonado.value = num(f.total.value);
    if (f.pago.value === 'pendiente') f.abonado.value = 0;
    refrescarSaldoModal();
  });

  $('#edCancelar')?.addEventListener('click', () => dlg.close());
  dlg?.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  function errorModal(txt) {
    f.error.textContent = txt;
    f.error.hidden = false;
  }

  $('#formEditar')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!pedidos.some(p => p.id === editandoId)) return dlg.close();

    const cliente = f.cliente.value.trim();
    const total = num(f.total.value);
    const abonado = num(f.abonado.value);

    if (!cliente) return errorModal('Escribe el nombre del cliente.');
    if (total < 0 || abonado < 0) return errorModal('Los montos no pueden ser negativos.');
    if (abonado > total) return errorModal('El abonado no puede superar el total a pagar.');
    if (f.pago.value === 'pagado' && total <= 0) return errorModal('Define un total mayor a 0 para marcar el pedido como pagado.');
    if (f.pago.value === 'abonado' && !(abonado > 0 && abonado < total)) {
      return errorModal('Para "Abonado" indica un monto mayor a 0 y menor al total.');
    }

    try {
      await API.actualizar(editandoId, {
        cliente,
        fechaLimite: f.fecha.value,
        confeccionista: f.conf.value.trim() || 'Sin asignar',
        estado: f.estado.value,
        total,
        abonado
      });
      avisar(`Pedido ${editandoId} actualizado`);
      dlg.close();
      await recargar();
    } catch (err) {
      console.error(err);
      errorModal('No se pudo guardar. Intenta de nuevo.');
    }
  });

  // ===== Cotizaciones =====
  let rango = 'semana';
  function pintarCotizaciones() {
    const lista = cotizaciones.filter(c => rango === 'todas' || c.rango === rango);
    $('#listaCotizaciones').innerHTML = lista.length
      ? lista.map(c => `
        <li class="ped-cot">
          <div class="ped-cot-top"><b>${c.id}</b><span>${c.fecha}</span></div>
          <p>${c.desc}</p>
          <div class="ped-cot-pie">
            <strong>${dinero(c.monto)}.00</strong>
            <span class="ped-etiqueta ped-t-${c.estado}">${c.estado.toUpperCase()}</span>
          </div>
        </li>`).join('')
      : '<li class="ped-vacio">No hay cotizaciones en este periodo.</li>';
  }

  document.querySelectorAll('.ped-chip').forEach(chip =>
    chip.addEventListener('click', () => {
      document.querySelectorAll('.ped-chip').forEach(c => c.classList.remove('activo'));
      chip.classList.add('activo');
      rango = chip.dataset.rango;
      pintarCotizaciones();
    }));

  // ===== Botones del encabezado =====
  $('#exportar')?.addEventListener('click', () => {
    const cab = ['ID Pedido', 'Cliente', 'Detalle', 'Fecha Límite', 'Confeccionista', 'Estado', 'Estado de Pago', 'Total', 'Abonado', 'Saldo'];
    const filas = pedidos.map(p => [
      p.id, p.cliente, `${p.uniforme} (x${p.cantidadIntegrantes})`, p.fechaLimite, p.confeccionista,
      ESTADOS[p.estado], ESTADOS_PAGO[p.estadoPago], p.total, p.abonado, saldoDe(p)
    ]);
    const csv = [cab, ...filas]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'pedidos.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    avisar('CSV exportado');
  });

  // CREATE: "+ Nuevo Pedido" va limpio a la planilla de detalle
  // (el borrador de la creación rápida es solo un dato temporal de navegador, no va a la BD)
  $('#registrar')?.addEventListener('click', () => {
    localStorage.removeItem(CLAVE_BORRADOR);
    window.location.href = URL_DETALLE_PEDIDO;
  });

  $('#pedRecordar')?.addEventListener('click', () => avisar('Recordatorios de saldo enviados'));
  $('#pedFiltro')?.addEventListener('click', () => avisar('Filtros próximamente'));
  $('#pedBorrador')?.addEventListener('click', () => {
    const cliente = $('#pedCliente')?.value.trim() || '';
    const uniforme = $('#pedProducto')?.value?.trim() || '';
    const notas = $('#pedNotas')?.value?.trim() || '';
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ cliente, uniforme, notas }));
    avisar('Borrador guardado');
  });

  // Formulario "Creación Rápida" -> pasa datos a detallePedido.html
  $('#formPedido')?.addEventListener('submit', e => {
    e.preventDefault();
    const clienteInput = $('#pedCliente');
    const productoInput = $('#pedProducto');
    const notasInput = $('#pedNotas');
    const errorEl = $('#pedError');

    if (!clienteInput || !clienteInput.value.trim()) {
      if (errorEl) errorEl.hidden = false;
      clienteInput?.focus();
      return;
    }
    if (errorEl) errorEl.hidden = true;

    const borrador = {
      cliente: clienteInput.value.trim(),
      uniforme: productoInput ? productoInput.value.trim() : 'Kit de Fútbol - Completamente Personalizado',
      notas: notasInput ? notasInput.value.trim() : ''
    };

    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    avisar(`Inicializando pedido para ${borrador.cliente}...`);
    window.location.href = URL_DETALLE_PEDIDO;
  });

  recargar();
  pintarCotizaciones();
});