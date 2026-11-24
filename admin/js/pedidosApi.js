/* =====================================================================
   pedidosApi.js — Capa de datos de pedidos
   ---------------------------------------------------------------------
   Es el ÚNICO archivo que sabe DÓNDE se guardan los pedidos.
   Hoy usa localStorage. Para conectar la base de datos, solo reemplaza
   el cuerpo de las 5 funciones marcadas con "BD:" (listar, obtener,
   crear, actualizar, eliminar) por llamadas fetch a tu backend.
   Pedidos.js y detallePedido.js no se tocan.

   Notas para la base de datos:
   - "saldo" NO se guarda: siempre es total - abonado (saldoDe).
   - "estadoPago" tampoco es fuente de verdad: se deriva de total/abonado.
   - El id (ORD-xxxx) debe generarlo el servidor, no el navegador.
   ===================================================================== */
(function (global) {
  'use strict';

  const CLAVE_ORDENES = 'sammy_sports_ordenes_activas';
  const CLAVE_SEMILLA = 'sammy_sports_ordenes_semilla_v1';

  const ESTADOS = {
    activo: 'Activo',
    confeccion: 'En Confección',
    listo: 'Listo',
    entregado: 'Entregado'
  };
  const ESTADOS_PAGO = {
    pendiente: 'Pendiente',
    abonado: 'Abonado',
    pagado: 'Pagado'
  };

  const num = v => Number(v) || 0;

  // ===== Reglas de negocio (se quedan igual con cualquier base de datos) =====
  function aISO(d) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  // Acepta ISO (yyyy-mm-dd) y el formato antiguo dd/mm/yyyy
  function normalizarFecha(v) {
    const s = String(v || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return '';
  }

  function derivarPago(total, abonado) {
    if (total > 0 && abonado >= total) return 'pagado';
    if (abonado > 0) return 'abonado';
    return 'pendiente';
  }

  const saldoDe = o => Math.max(num(o.total) - num(o.abonado), 0);

  function normalizarEstado(v) {
    const e = String(v || '').toLowerCase();
    if (ESTADOS[e]) return e;
    if (e.includes('confec')) return 'confeccion';
    return 'activo'; // cubre el antiguo "En Producción"
  }

  // Deja toda orden con la misma forma, venga de donde venga
  function normalizar(o) {
    const total = Math.max(num(o.total), 0);
    const abonado = Math.max(num(o.abonado), 0);
    return {
      ...o,
      id: o.id || 'ORD-9000',
      cliente: o.cliente || 'Cliente sin nombre',
      uniforme: o.uniforme || 'Uniforme Personalizado',
      notas: o.notas || '',
      cantidadIntegrantes: o.cantidadIntegrantes ?? (o.jugadores?.length || 0),
      confeccionista: o.confeccionista || 'Sin asignar',
      fechaLimite: normalizarFecha(o.fechaLimite),
      estado: normalizarEstado(o.estado),
      total,
      abonado,
      estadoPago: derivarPago(total, abonado)
    };
  }

  // ===== Almacenamiento local (esto es lo que se reemplaza por la BD) =====
  function leerTodo() {
    try {
      const raw = JSON.parse(localStorage.getItem(CLAVE_ORDENES));
      return Array.isArray(raw) ? raw.map(normalizar) : [];
    } catch (err) {
      console.error('Error al leer pedidos:', err);
      return [];
    }
  }

  function escribirTodo(lista) {
    localStorage.setItem(CLAVE_ORDENES, JSON.stringify(lista)); // lanza error si falla
  }

  // Pedidos de ejemplo: se copian una sola vez para poder editarlos y borrarlos.
  // Con base de datos real, esto desaparece (los datos vienen del servidor).
  const pedidosBase = [
    { id: 'ORD-8901', cliente: 'Metro FC', uniforme: 'Kits de Local', cantidadIntegrantes: 24, fechaLimite: '2026-10-15', confeccionista: 'M. Johnson', estado: 'confeccion', total: 2400, abonado: 1200 },
    { id: 'ORD-8902', cliente: 'City High Track', uniforme: 'Calentamientos', cantidadIntegrantes: 40, fechaLimite: '2026-10-18', confeccionista: 'S. Lee', estado: 'listo', total: 900, abonado: 450 },
    { id: 'ORD-8895', cliente: 'Valley Volleyball', uniforme: 'Camisetas', cantidadIntegrantes: 15, fechaLimite: '2026-10-10', confeccionista: 'M. Johnson', estado: 'entregado', total: 600, abonado: 600 }
  ];

  (function sembrar() {
    try {
      if (localStorage.getItem(CLAVE_SEMILLA)) return;
      const actuales = leerTodo();
      const ids = new Set(actuales.map(o => o.id));
      const nuevos = pedidosBase.filter(b => !ids.has(b.id)).map(normalizar);
      escribirTodo([...actuales, ...nuevos]);
      localStorage.setItem(CLAVE_SEMILLA, '1');
    } catch (err) {
      console.error('Error al sembrar pedidos base:', err);
    }
  })();

  // ===== API pública (todas devuelven promesas, como un fetch) =====

  // BD: GET /api/pedidos
  async function listar() {
    return leerTodo();
  }

  // BD: GET /api/pedidos/:id   (devuelve null si no existe)
  async function obtener(id) {
    return leerTodo().find(o => o.id === id) || null;
  }

  // BD: POST /api/pedidos   (el servidor genera el id y devuelve el pedido creado)
  async function crear(datos) {
    const lista = leerTodo();
    const ids = new Set(lista.map(o => o.id));
    let id;
    do { id = 'ORD-' + Math.floor(1000 + Math.random() * 9000); } while (ids.has(id));

    const orden = normalizar({
      estado: 'activo',
      confeccionista: 'Sin asignar',
      fechaLimite: aISO(new Date(Date.now() + 7 * 86400000)),
      ...datos,
      id,
      creadoEn: new Date().toISOString()
    });
    lista.unshift(orden);
    escribirTodo(lista);
    return orden;
  }

  // BD: PATCH /api/pedidos/:id   (devuelve el pedido actualizado o null)
  async function actualizar(id, cambios) {
    const lista = leerTodo();
    const i = lista.findIndex(o => o.id === id);
    if (i === -1) return null;
    lista[i] = normalizar({ ...lista[i], ...cambios, id });
    escribirTodo(lista);
    return lista[i];
  }

  // BD: DELETE /api/pedidos/:id   (devuelve true si existía)
  async function eliminar(id) {
    const lista = leerTodo();
    const resto = lista.filter(o => o.id !== id);
    if (resto.length === lista.length) return false;
    escribirTodo(resto);
    return true;
  }

  global.PedidosAPI = {
    ESTADOS, ESTADOS_PAGO,
    derivarPago, saldoDe,
    listar, obtener, crear, actualizar, eliminar
  };
})(window);