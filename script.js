document.addEventListener('DOMContentLoaded', () => {
  const metricMap = {
    revenue: '€84,240',
    orders: '1,284',
    aov: '€65.60',
    visitors: '42,890'
  };

  const rangeButtons = document.querySelectorAll('.range-btn');
  const primaryButton = document.querySelector('.primary-btn');

  rangeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      rangeButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      const range = button.dataset.range;
      if (range === '7') {
        metricMap.revenue = '€84,240';
        metricMap.orders = '1,284';
        metricMap.aov = '€65.60';
        metricMap.visitors = '42,890';
      }

      if (range === '30') {
        metricMap.revenue = '€318,520';
        metricMap.orders = '4,860';
        metricMap.aov = '€65.50';
        metricMap.visitors = '162,210';
      }

      if (range === '90') {
        metricMap.revenue = '€975,420';
        metricMap.orders = '14,230';
        metricMap.aov = '€68.50';
        metricMap.visitors = '490,440';
      }

      document.querySelector('[data-metric="revenue"]').textContent = metricMap.revenue;
      document.querySelector('[data-metric="orders"]').textContent = metricMap.orders;
      document.querySelector('[data-metric="aov"]').textContent = metricMap.aov;
      document.querySelector('[data-metric="visitors"]').textContent = metricMap.visitors;
    });
  });

  primaryButton.addEventListener('click', () => {
    primaryButton.textContent = 'Exported';
    primaryButton.disabled = true;
    setTimeout(() => {
      primaryButton.textContent = 'Export';
      primaryButton.disabled = false;
    }, 1400);
  });
});

