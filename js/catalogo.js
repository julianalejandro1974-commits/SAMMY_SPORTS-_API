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
