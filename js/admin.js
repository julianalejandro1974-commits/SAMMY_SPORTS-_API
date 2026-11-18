 // Toggle Sidebar en móviles
        document.getElementById('toggleSidebar').addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('show');
        });

        // Activar enlaces del menú lateral
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Datos dinámicos para la gráfica de barras
        const chartData = {
            semana: {
                heights: ['60%', '40%', '85%', '75%'],
                labels: ['Lun - Mar', 'Mié - Jue', 'Vie - Sáb', 'Domingo']
            },
            mes: {
                heights: ['45%', '72%', '55%', '92%'],
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
            },
            ano: {
                heights: ['50%', '65%', '78%', '95%'],
                labels: ['Q1', 'Q2', 'Q3', 'Q4']
            }
        };

        const filterButtons = document.querySelectorAll('.chart-filter-btn');
        const bars = document.querySelectorAll('#barsContainer .bar-item');
        const labelDivs = document.querySelectorAll('#barLabels div');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const period = this.getAttribute('data-period');
                const selected = chartData[period];

                bars.forEach((bar, index) => {
                    bar.style.height = selected.heights[index];
                });

                labelDivs.forEach((label, index) => {
                    label.textContent = selected.labels[index];
                });
            });
        });