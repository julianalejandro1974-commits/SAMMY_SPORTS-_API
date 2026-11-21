const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function setSidebarState(isOpen) {
  if (!sidebar) return;
  sidebar.classList.toggle('show', isOpen);
  if (sidebarBackdrop) {
    sidebarBackdrop.classList.toggle('show', isOpen);
  }
  document.body.style.overflow = isOpen && window.innerWidth < 992 ? 'hidden' : '';
}

if (toggleSidebar) {
  toggleSidebar.addEventListener('click', function () {
    const isOpen = sidebar && sidebar.classList.contains('show');
    setSidebarState(!isOpen);
  });
}

if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', function () {
    setSidebarState(false);
  });
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && sidebar && sidebar.classList.contains('show')) {
    setSidebarState(false);
  }
});

window.addEventListener('resize', function () {
  if (window.innerWidth >= 992) {
    setSidebarState(false);
    document.body.style.overflow = '';
  }
});

// Activar enlaces del menú lateral (.sidebar-nav a y .sidebar-footer a)
const sidebarLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-footer a');

sidebarLinks.forEach((link) => {
  link.addEventListener('click', function (e) {
    if (this.classList.contains('sin-destino') || this.getAttribute('href') === '#') {
      e.preventDefault();
    }

    sidebarLinks.forEach((el) => {
      el.classList.remove('active');
      el.removeAttribute('aria-current');
    });

    this.classList.add('active');
    this.setAttribute('aria-current', 'page');

    if (window.innerWidth < 992) {
      setSidebarState(false);
    }
  });
});

// Datos dinámicos para la gráfica de barras
const chartData = {
  semana: {
    heights: ['60%', '40%', '85%', '75%'],
    labels: ['Lun - Mar', 'Mié - Jue', 'Vie - Sáb', 'Domingo'],
  },
  mes: {
    heights: ['45%', '72%', '55%', '92%'],
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
  },
  ano: {
    heights: ['50%', '65%', '78%', '95%'],
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  },
};

const filterButtons = document.querySelectorAll('.chart-filter-btn');
const bars = document.querySelectorAll('#barsContainer .bar-item');
const labelDivs = document.querySelectorAll('#barLabels div');

filterButtons.forEach((btn) => {
  btn.addEventListener('click', function () {
    filterButtons.forEach((b) => b.classList.remove('active'));
    this.classList.add('active');

    const period = this.getAttribute('data-period');
    const selected = chartData[period];
    if (!selected) return;

    bars.forEach((bar, index) => {
      if (selected.heights[index]) {
        bar.style.height = selected.heights[index];
      }
    });

    labelDivs.forEach((label, index) => {
      if (selected.labels[index]) {
        label.textContent = selected.labels[index];
      }
    });
  });
});