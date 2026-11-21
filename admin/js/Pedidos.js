document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);

  const CLAVE_BORRADOR = 'sammy_sports_pedido_borrador';
  const CLAVE_ORDENES = 'sammy_sports_ordenes_activas';
  const URL_DETALLE_PEDIDO = 'detallePedido.html';

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
    // Cerrar al tocar fuera del menú, al elegir una opción o con Escape
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target)) cambiar(false);
    });
    sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', () => cambiar(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cambiar(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 991) cambiar(false); });
  }

  const dinero = n => '$' + Number(n || 0).toLocaleString('en-US');
  const iniciales = n => String(n || '').split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SA';

  const pedidosBase = [
    { id: 'ORD-8901', cliente: 'Metro FC', detalle: 'Kits de Local (x24)', fecha: 'Oct 15, 2026', conf: 'M. Johnson', estado: 'confeccion', saldo: 1200 },
    { id: 'ORD-8902', cliente: 'City High Track', detalle: 'Calentamientos (x40)', fecha: 'Oct 18, 2026', conf: 'S. Lee', estado: 'listo', saldo: 450 },
    { id: 'ORD-8895', cliente: 'Valley Volleyball', detalle: 'Camisetas (x15)', fecha: 'Oct 10, 2026', conf: 'M. Johnson', estado: 'entregado', saldo: 0 }
  ];

  function obtenerOrdenesGuardadas() {
    try {
      const raw = JSON.parse(localStorage.getItem(CLAVE_ORDENES));
      if (!Array.isArray(raw)) return [];

      return raw.map(orden => ({
        id: orden.id || 'ORD-9000',
        cliente: orden.cliente || 'Cliente sin nombre',
        detalle: `${orden.uniforme || 'Uniforme Personalizado'} (${orden.cantidadIntegrantes ?? (orden.jugadores?.length || 0)}x)`,
        fecha: orden.fechaLimite || 'Por definir',
        conf: orden.confeccionista || 'Sin asignar',
        estado: 'confeccion',
        saldo: Number(orden.saldo ?? 0)
      }));
    } catch (err) {
      console.error('Error al leer órdenes activas de localStorage:', err);
      return [];
    }
  }

  const pedidos = [...obtenerOrdenesGuardadas(), ...pedidosBase];

  const cotizaciones = [
    { id: 'QT-4420', fecha: 'Oct 24', desc: 'Downtown Athletics - 50x Polos', monto: 1450, estado: 'borrador', rango: 'semana' },
    { id: 'QT-4419', fecha: 'Oct 22', desc: 'Westside Tennis - Redes de Cancha y Equipo', monto: 3200, estado: 'enviado', rango: 'semana' },
    { id: 'QT-4415', fecha: 'Oct 18', desc: 'Peak Performance Gym - Uniformes de Personal', monto: 890, estado: 'aceptado', rango: 'pasada' }
  ];

  const etiquetasEstado = {
    confeccion: 'En Confección',
    listo: 'Listo',
    entregado: 'Entregado'
  };

  // Usa el <p id="mensaje"> que ya existe en la página
  const mensaje = $('#mensaje');
  let temporizador;
  function avisar(texto) {
    if (!mensaje) return;
    mensaje.textContent = texto;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (mensaje.textContent = ''), 3000);
  }

  function pintarPedidos() {
    $('#tablaPedidos').innerHTML = pedidos.map(p => `
      <tr>
        <td><span class="ped-id">${p.id}</span></td>
        <td><div class="ped-cliente">${p.cliente}</div><small>${p.detalle}</small></td>
        <td>${p.fecha}</td>
        <td><span class="ped-quien"><i>${iniciales(p.conf)}</i>${p.conf}</span></td>
        <td><span class="ped-estado ped-e-${p.estado}">${etiquetasEstado[p.estado] || 'En Confección'}</span></td>
        <td class="ped-saldo">${p.saldo > 0
          ? `${dinero(p.saldo)}<small class="debe">Pendiente</small>`
          : `$0<small class="pagado">Pagado</small>`}</td>
      </tr>`).join('');

    const pendientes = pedidos.filter(p => p.saldo > 0).length;
    const alertaTexto = $('#pedAlertaTexto');
    if (alertaTexto) {
      alertaTexto.textContent =
        `${pendientes} pedidos tienen saldos pendientes pasada la marca de 50% de completado.`;
    }
  }

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

  // Botones del encabezado (mismos ids que usa inventario.html)
  $('#exportar')?.addEventListener('click', () => {
    const cab = ['ID Pedido', 'Cliente', 'Detalle', 'Fecha Límite', 'Confeccionista', 'Estado', 'Saldo'];
    const filas = pedidos.map(p => [p.id, p.cliente, p.detalle, p.fecha, p.conf, etiquetasEstado[p.estado], p.saldo]);
    const csv = [cab, ...filas]
      .map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'pedidos.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    avisar('CSV exportado');
  });

  // Botón azul "+ Nuevo Pedido": va limpio a la planilla de detalle
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

  // Formulario "Creación Rápida: Pedido Personalizado" -> pasa datos a detallePedido.html
  $('#formPedido')?.addEventListener('submit', e => {
    e.preventDefault();
    const clienteInput = $('#pedCliente');
    const productoInput = $('#pedProducto');
    const notasInput = $('#pedNotas');

    if (!clienteInput || !clienteInput.value.trim()) {
      const errorEl = $('#pedError');
      if (errorEl) errorEl.hidden = false;
      clienteInput?.focus();
      return;
    }

    const errorEl = $('#pedError');
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

  pintarPedidos();
  pintarCotizaciones();
});