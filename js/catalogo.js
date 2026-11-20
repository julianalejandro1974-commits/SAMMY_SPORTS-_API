document.addEventListener('click', e => {
  const q = e.target.closest('[data-qty]');
  if (q) { const v = q.parentElement.querySelector('.qty-val'); v.textContent = Math.max(1, (+v.textContent || 1) + (+q.dataset.qty)); }
  const t = e.target.closest('[data-thumb]');
  if (t) { document.getElementById('mainImage').src = t.src; document.querySelectorAll('[data-thumb]').forEach(i => i.classList.toggle('active', i === t)); }
  const r = e.target.closest('[data-remove]');
  if (r) r.closest('.cart-item').remove();
  const p = e.target.closest('[data-toggle-pw]');
  if (p) { const i = p.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; p.querySelector('i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye'; }
});
document.querySelectorAll('.codigo-input').forEach((el, i, all) => {
  el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, ''); if (el.value && all[i + 1]) all[i + 1].focus(); });
  el.addEventListener('keydown', e => { if (e.key === 'Backspace' && !el.value && all[i - 1]) all[i - 1].focus(); });
});
const np = document.getElementById('nueva'), cp = document.getElementById('confirmar'), msg = document.getElementById('matchMsg');
if (np && cp) { const chk = () => { if (!cp.value) { msg.textContent = ''; return; } const ok = np.value === cp.value; msg.textContent = ok ? 'Las contraseñas coinciden.' : 'Las contraseñas no coinciden.'; msg.className = 'match-msg ' + (ok ? 'text-success' : 'text-danger'); cp.setCustomValidity(ok ? '' : 'No coinciden'); }; np.addEventListener('input', chk); cp.addEventListener('input', chk); }

/* Catálogo | Sammy Sports — filtros por categoría + búsqueda por nombre
 *
 * Además: los botones "Cotizar" guardan el producto en localStorage.
 *
 * Reglas:
 *  - Categorías: sin ninguna marcada se muestra todo; con una o más, solo esas.
 *  - Búsqueda: compara el texto con el nombre del producto (<h3>), sin
 *    distinguir mayúsculas ni tildes. Se combina con las categorías (AND).
 *  - Las tarjetas sin data-categoria o con data-categoria="todas"
 *    (p. ej. "¿Tienes una idea distinta?") siempre se muestran.
 */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Cotizar: guarda el producto en localStorage ---------- */
  const STORAGE_KEY = 'sammy_cotizacion'; // misma clave que usa cotizacion.js

  const slug = (texto) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  function agregarACotizacion(card) {
    const nombre = card.querySelector('h3')?.textContent.trim();
    if (!nombre) return;

    let carrito = [];
    try {
      const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(guardado)) carrito = guardado;
    } catch (_) { /* almacenamiento vacío o corrupto: se empieza de cero */ }

    const id = slug(nombre);
    const existente = carrito.find((a) => a && a.id === id);
    if (existente) {
      existente.cantidad = Math.min(99, (parseInt(existente.cantidad, 10) || 1) + 1);
    } else {
      carrito.push({
        id,
        nombre,
        detalle: card.querySelector('p.small')?.textContent.trim() || '',
        imagen: card.querySelector('img')?.getAttribute('src') || '',
        talla: 'M',
        cantidad: 1,
      });
    }

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito)); } catch (_) {}
  }

  // El enlace sigue navegando a cotizacion.html; solo guardamos antes de salir
  document.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[href="cotizacion.html"]');
    const card = enlace?.closest('.card');
    if (card) agregarACotizacion(card);
  });
  const checkboxes = document.querySelectorAll('#filtros input[type="checkbox"][data-categoria]');
  const buscador = document.getElementById('buscador');
  const grid = document.querySelector('#productos .row-cols-1');
  const titulo = document.querySelector('#productos .page-title');
  if (!grid || checkboxes.length === 0) return;

  const tarjetas = Array.from(grid.querySelectorAll(':scope > .col'));

  const TITULOS = {
    futbol: 'Uniformes de fútbol',
    baloncesto: 'Uniformes de baloncesto',
    voleibol: 'Uniformes de voleibol',
    escolares: 'Uniformes escolares',
  };
  const TITULO_TODOS = 'Todos los uniformes';
  const TITULO_VARIOS = 'Uniformes seleccionados';
  const TITULO_BUSQUEDA = 'Resultados de la búsqueda';

  // "Atlético" -> "atletico"
  const normalizar = (texto) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Nombre de cada producto, normalizado una sola vez
  const nombres = new Map(
    tarjetas.map((col) => {
      const h3 = col.querySelector('h3');
      return [col, h3 ? normalizar(h3.textContent) : ''];
    })
  );

  // Mensaje cuando ninguna tarjeta coincide
  const vacio = document.createElement('p');
  vacio.className = 'text-center text-secondary py-5 d-none';
  vacio.textContent = 'No encontramos productos con esos filtros. Prueba otra palabra o desmarca alguna categoría.';
  grid.insertAdjacentElement('afterend', vacio);

  function aplicarFiltros() {
    const activas = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.dataset.categoria);
    const consulta = buscador ? normalizar(buscador.value) : '';

    let visibles = 0;

    tarjetas.forEach((col) => {
      const cat = col.dataset.categoria;
      const siempreVisible = !cat || cat === 'todas';

      const okCategoria = activas.length === 0 || activas.includes(cat);
      const okBusqueda = consulta === '' || nombres.get(col).includes(consulta);

      const mostrar = siempreVisible || (okCategoria && okBusqueda);
      col.classList.toggle('d-none', !mostrar);
      if (mostrar && !siempreVisible) visibles++;
    });

    // Cuenta solo productos reales, no la tarjeta de contacto
    vacio.classList.toggle('d-none', visibles > 0);

    if (titulo) {
      if (consulta !== '') titulo.textContent = TITULO_BUSQUEDA;
      else if (activas.length === 0) titulo.textContent = TITULO_TODOS;
      else if (activas.length === 1) titulo.textContent = TITULOS[activas[0]] || TITULO_VARIOS;
      else titulo.textContent = TITULO_VARIOS;
    }
  }

  checkboxes.forEach((cb) => cb.addEventListener('change', aplicarFiltros));
  if (buscador) buscador.addEventListener('input', aplicarFiltros);

  // Estado inicial (Fútbol viene marcado en el HTML)
  aplicarFiltros();
});