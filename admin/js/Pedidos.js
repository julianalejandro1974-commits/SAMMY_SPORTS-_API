document.addEventListener('DOMContentLoaded', () => {
  const $ = s => document.querySelector(s);
  const dinero = n => '$' + n.toLocaleString('en-US');
  const iniciales = n => n.split(' ').map(p => p[0]).join('').slice(0, 2);

  const pedidos = [
    { id: 'ORD-8901', cliente: 'Metro FC', detalle: 'Kits de Local (x24)', fecha: 'Oct 15, 2026', conf: 'M. Johnson', estado: 'confeccion', saldo: 1200 },
    { id: 'ORD-8902', cliente: 'City High Track', detalle: 'Calentamientos (x40)', fecha: 'Oct 18, 2026', conf: 'S. Lee', estado: 'listo', saldo: 450 },
    { id: 'ORD-8895', cliente: 'Valley Volleyball', detalle: 'Camisetas (x15)', fecha: 'Oct 10, 2026', conf: 'M. Johnson', estado: 'entregado', saldo: 0 }
  ];
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
        <td><span class="ped-estado ped-e-${p.estado}">${etiquetasEstado[p.estado]}</span></td>
        <td class="ped-saldo">${p.saldo > 0
          ? `${dinero(p.saldo)}<small class="debe">Pendiente</small>`
          : `$0<small class="pagado">Pagado</small>`}</td>
      </tr>`).join('');

    const pendientes = pedidos.filter(p => p.saldo > 0).length;
    $('#pedAlertaTexto').textContent =
      `${pendientes} pedidos tienen saldos pendientes pasada la marca de 50% de completado.`;
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
  $('#exportar').addEventListener('click', () => {
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

  $('#registrar').addEventListener('click', () => {
    $('#pedRapido').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#pedCliente').focus({ preventScroll: true });
  });

  $('#pedRecordar').addEventListener('click', () => avisar('Recordatorios de saldo enviados'));
  $('#pedFiltro').addEventListener('click', () => avisar('Filtros próximamente'));
  $('#pedBorrador').addEventListener('click', () => avisar('Borrador guardado'));

  $('#formPedido').addEventListener('submit', e => {
    e.preventDefault();
    const cliente = $('#pedCliente');
    if (!cliente.value.trim()) {
      $('#pedError').hidden = false;
      cliente.focus();
      return;
    }
    $('#pedError').hidden = true;
    const num = Math.max(...pedidos.map(p => +p.id.slice(4))) + 1;
    pedidos.unshift({
      id: 'ORD-' + num, cliente: cliente.value.trim(), detalle: $('#pedProducto').value,
      fecha: 'Por definir', conf: 'Sin asignar', estado: 'confeccion', saldo: 0
    });
    pintarPedidos();
    e.target.reset();
    avisar('Pedido ORD-' + num + ' inicializado');
  });

  pintarPedidos();
  pintarCotizaciones();
});