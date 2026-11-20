/* Tu cotización | Sammy Sports
 *
 *  - Lee los productos que catalogo.js guardó en localStorage y los dibuja.
 *  - Talla (S, M, L, XL), botones − / + (mín. 1, máx. 99) y × para quitar;
 *    todo se guarda al instante, así que sobrevive a recargas.
 *  - Sin artículos: estado vacío y envío desactivado.
 *  - Validación del formulario (ids: n, w, nt, terms).
 *  - Al enviar, abre WhatsApp con la cotización armada.
 */
document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_NUMERO = '573133457612'; // mismo número que usa catalogo.html
  const STORAGE_KEY = 'sammy_cotizacion'; // misma clave que usa catalogo.js
  const TALLAS = ['S', 'M', 'L', 'XL'];
  const TALLA_DEFECTO = 'M';
  const CANTIDAD_MIN = 1;
  const CANTIDAD_MAX = 99;

  const lista = document.getElementById('lista-cotizacion');
  const vacia = document.getElementById('cotizacion-vacia');
  const form = document.getElementById('form-cotizacion');
  const btnEnviar = document.getElementById('btn-enviar');
  const inNombre = document.getElementById('n');
  const inWhatsapp = document.getElementById('w');
  const inNotas = document.getElementById('nt');
  if (!lista || !form) return;

  const limitar = (n) => Math.min(CANTIDAD_MAX, Math.max(CANTIDAD_MIN, n));

  /* ---------- Estado (localStorage) ---------- */

  function cargar() {
    try {
      const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(datos)) return [];
      return datos
        .filter((a) => a && typeof a.id === 'string' && typeof a.nombre === 'string')
        .map((a) => ({
          id: a.id,
          nombre: a.nombre,
          detalle: String(a.detalle || ''),
          imagen: String(a.imagen || ''),
          talla: TALLAS.includes(a.talla) ? a.talla : TALLA_DEFECTO,
          cantidad: limitar(parseInt(a.cantidad, 10) || CANTIDAD_MIN),
        }));
    } catch (_) {
      return [];
    }
  }

  let articulos = cargar();

  function guardar() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articulos));
    } catch (_) { /* sin almacenamiento: la página sigue funcionando en memoria */ }
  }

  /* ---------- Dibujo (DOM, sin innerHTML con datos guardados) ---------- */

  function el(tag, props = {}, hijos = []) {
    const nodo = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'text') nodo.textContent = v;
      else nodo.setAttribute(k, v);
    });
    hijos.forEach((h) => nodo.append(h));
    return nodo;
  }

  function crearTarjeta(a) {
    const select = el(
      'select',
      { class: 'form-select w-auto', 'aria-label': 'Talla' },
      TALLAS.map((t) => {
        const op = el('option', { value: t, text: `Talla ${t}` });
        if (t === a.talla) op.selected = true;
        return op;
      })
    );

    const qty = el('div', { class: 'qty' }, [
      el('button', { type: 'button', 'data-qty': '-1', 'aria-label': 'Disminuir', text: '−' }),
      el('span', { class: 'qty-val', text: String(a.cantidad) }),
      el('button', { type: 'button', 'data-qty': '1', 'aria-label': 'Aumentar', text: '+' }),
    ]);

    const img = el('img', { alt: a.nombre });
    if (a.imagen) img.src = a.imagen;

    return el('div', { class: 'cart-item d-flex gap-3', 'data-id': a.id }, [
      el('div', { class: 'cart-img' }, [img]),
      el('div', { class: 'flex-grow-1' }, [
        el('div', { class: 'd-flex justify-content-between' }, [
          el('h3', { class: 'h6 fw-bold mb-1', text: a.nombre }),
          el('button', {
            type: 'button',
            class: 'btn-remove',
            'data-remove': '',
            'aria-label': `Eliminar ${a.nombre}`,
            text: '×',
          }),
        ]),
        el('p', { class: 'small text-secondary mb-3', text: a.detalle }),
        el('div', { class: 'd-flex flex-wrap align-items-center gap-3' }, [select, qty]),
      ]),
    ]);
  }

  function actualizarVisibilidad() {
    const hay = articulos.length > 0;
    lista.classList.toggle('d-none', !hay);
    if (vacia) vacia.classList.toggle('d-none', hay);
    if (btnEnviar) btnEnviar.disabled = !hay;
  }

  function dibujar() {
    lista.replaceChildren(...articulos.map(crearTarjeta));
    actualizarVisibilidad();
  }

  /* ---------- Interacciones ---------- */

  const buscar = (nodo) => {
    const item = nodo.closest('.cart-item');
    return item ? { item, articulo: articulos.find((a) => a.id === item.dataset.id) } : {};
  };

  // Captura en el contenedor: nuestro manejador va primero y evita que otro
  // script (p. ej. sammy.js) procese el mismo clic y duplique el cambio.
  lista.addEventListener(
    'click',
    (e) => {
      const btnQty = e.target.closest('[data-qty]');
      const btnQuitar = e.target.closest('[data-remove]');
      if (!btnQty && !btnQuitar) return;
      e.stopPropagation();

      const { item, articulo } = buscar(e.target);
      if (!articulo) return;

      if (btnQuitar) {
        articulos = articulos.filter((a) => a !== articulo);
        item.remove();
        actualizarVisibilidad();
      } else {
        articulo.cantidad = limitar(articulo.cantidad + parseInt(btnQty.dataset.qty, 10));
        item.querySelector('.qty-val').textContent = String(articulo.cantidad);
      }
      guardar();
    },
    true
  );

  lista.addEventListener('change', (e) => {
    if (!e.target.matches('select')) return;
    const { articulo } = buscar(e.target);
    if (!articulo || !TALLAS.includes(e.target.value)) return;
    articulo.talla = e.target.value;
    guardar();
  });

  /* ---------- Formulario ---------- */

  // Celular colombiano: 10 dígitos que empiezan por 3, con o sin prefijo 57
  const digitosWhatsapp = () => inWhatsapp.value.replace(/\D/g, '');
  const celularValido = () => /^(57)?3\d{9}$/.test(digitosWhatsapp());

  function validarWhatsapp() {
    inWhatsapp.setCustomValidity(celularValido() ? '' : 'Número inválido');
  }
  inWhatsapp.addEventListener('input', validarWhatsapp);

  function armarMensaje() {
    const lineas = articulos.map(
      (a, i) => `${i + 1}. ${a.nombre} - Talla ${a.talla} (x${a.cantidad})`
    );

    const digitos = digitosWhatsapp();
    const telefono = digitos.length === 10 ? `+57 ${digitos}` : `+${digitos}`;
    const notas = inNotas.value.trim();

    return [
      'Hola Sammy Sports, quiero una cotización:',
      '',
      '*Productos*',
      ...lineas,
      '',
      `*Nombre:* ${inNombre.value.trim()}`,
      `*WhatsApp:* ${telefono}`,
      notas ? `*Notas:* ${notas}` : null,
    ]
      .filter((l) => l !== null)
      .join('\n');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    validarWhatsapp();
    form.classList.add('was-validated');

    if (articulos.length === 0) return;
    if (!form.checkValidity()) {
      form.querySelector(':invalid')?.focus();
      return;
    }

    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(armarMensaje())}`;
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.target = '_blank';
    enlace.rel = 'noopener';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  });

  dibujar();
});