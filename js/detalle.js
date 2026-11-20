/* Detalle de producto | Sammy Sports
 *
 *  - Botones − / + de cantidad (mín. 1, máx. 99).
 *  - "Agregar a la cotización": guarda el producto en localStorage (misma
 *    clave y formato que catalogo.js / cotizacion.js) y sigue al enlace.
 *  - Miniaturas: cambian la imagen principal.
 *
 * Funciona en cualquier página de detalle con esta estructura: un <h1>, una
 * imagen #mainImage, un bloque .qty y, en la misma tarjeta, un enlace a
 * cotizacion.html.
 */
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'sammy_cotizacion';
  const CANTIDAD_MIN = 1;
  const CANTIDAD_MAX = 99;

  const limitar = (n) => Math.min(CANTIDAD_MAX, Math.max(CANTIDAD_MIN, n));

  // Mismo cálculo que catalogo.js: así el catálogo y el detalle comparten id
  // y la cantidad se suma en lugar de duplicar el producto.
  const slug = (texto) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const titulo = document.querySelector('h1');
  const principal = document.getElementById('mainImage');
  const qty = document.querySelector('.qty');
  const valor = qty ? qty.querySelector('.qty-val') : null;
  const btnAgregar = qty ? qty.closest('.card')?.querySelector('a[href$="cotizacion.html"]') : null;
  // Imagen con la que carga la página (la foto principal), antes de tocar miniaturas
  const imagenInicial = principal ? principal.getAttribute('src') : '';

  /* ---------- Miniaturas ---------- */
  const miniaturas = document.querySelectorAll('[data-thumb]');
  if (principal) {
    miniaturas.forEach((mini) => {
      mini.addEventListener('click', () => {
        principal.setAttribute('src', mini.getAttribute('src'));
        miniaturas.forEach((m) => m.classList.toggle('active', m === mini));
      });
    });
  }

  /* ---------- Cantidad ---------- */
  // Captura: evita que otro script procese el mismo clic y duplique el cambio.
  if (qty && valor) {
    qty.addEventListener(
      'click',
      (e) => {
        const btn = e.target.closest('[data-qty]');
        if (!btn) return;
        e.stopPropagation();
        const actual = parseInt(valor.textContent, 10) || CANTIDAD_MIN;
        valor.textContent = String(limitar(actual + parseInt(btn.dataset.qty, 10)));
      },
      true
    );
  }

  /* ---------- Agregar a la cotización ---------- */

  // Resumen corto para la línea del carrito: primera frase de la descripción
  function resumen() {
    const p = document.querySelector('h1 ~ p.text-secondary');
    if (!p) return '';
    const texto = p.textContent.replace(/\s+/g, ' ').trim().split(/[:.]/)[0].trim();
    return texto.length > 90 ? texto.slice(0, 87).trimEnd() + '…' : texto;
  }

  // cotizacion.html está en la raíz: quitamos los "../" de la ruta de la imagen
  const rutaDesdeRaiz = (src) => (src || '').replace(/^(\.\.\/)+/, '');

  function agregar() {
    const nombre = titulo ? titulo.textContent.trim() : '';
    if (!nombre) return;

    const cantidad = limitar(parseInt(valor ? valor.textContent : '1', 10) || CANTIDAD_MIN);

    let carrito = [];
    try {
      const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(guardado)) carrito = guardado;
    } catch (_) { /* almacenamiento vacío o corrupto: se empieza de cero */ }

    const id = slug(nombre);
    const existente = carrito.find((a) => a && a.id === id);
    if (existente) {
      existente.cantidad = limitar((parseInt(existente.cantidad, 10) || CANTIDAD_MIN) + cantidad);
    } else {
      carrito.push({
        id,
        nombre,
        detalle: resumen(),
        imagen: rutaDesdeRaiz(imagenInicial),
        talla: 'M',
        cantidad,
      });
    }

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito)); } catch (_) {}
  }

  // El enlace sigue navegando a cotizacion.html; solo guardamos antes de salir
  if (btnAgregar) btnAgregar.addEventListener('click', agregar);
});