// Spendly Custom SVG Chart Engine
// Clean, dependency-free, responsive, and lightweight

class SpendlyCharts {
  constructor() {
    this.tooltipEl = null;
    this.initTooltip();
  }

  initTooltip() {
    if (!document.getElementById('spendly-chart-tooltip')) {
      const tip = document.createElement('div');
      tip.id = 'spendly-chart-tooltip';
      tip.className = 'chart-tooltip';
      tip.style.display = 'none';
      document.body.appendChild(tip);
      this.tooltipEl = tip;
    } else {
      this.tooltipEl = document.getElementById('spendly-chart-tooltip');
    }
  }

  showTooltip(e, text, subtext = '') {
    if (!this.tooltipEl) return;
    this.tooltipEl.innerHTML = `<div class="tooltip-title">${text}</div>${subtext ? `<div class="tooltip-sub">${subtext}</div>` : ''}`;
    this.tooltipEl.style.display = 'block';
    this.positionTooltip(e);
  }

  positionTooltip(e) {
    if (!this.tooltipEl) return;
    const padding = 12;
    const x = e.pageX + padding;
    const y = e.pageY - 38;
    this.tooltipEl.style.left = `${x}px`;
    this.tooltipEl.style.top = `${y}px`;
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = 'none';
    }
  }

  formatMoney(amount, currency = '$') {
    return `${currency}${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Render Category Donut Chart
   * @param {HTMLElement} container
   * @param {Array} categoryBreakdown
   * @param {number} totalSpent
   * @param {string} currency
   */
  renderDonutChart(container, categoryBreakdown, totalSpent, currency = '$') {
    if (!container) return;
    container.innerHTML = '';

    if (!categoryBreakdown || categoryBreakdown.length === 0 || totalSpent <= 0) {
      container.innerHTML = `
        <div class="empty-chart-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <p class="empty-chart-text">No spending recorded for this month</p>
          <span class="empty-chart-sub">Log an expense above to see your category breakdown</span>
        </div>
      `;
      return;
    }

    const size = 260;
    const center = size / 2;
    const radius = 95;
    const strokeWidth = 34;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('class', 'donut-svg');

    // Circumference
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    // Center display group
    const centerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    centerGroup.setAttribute('class', 'donut-center-group');

    const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerLabel.setAttribute('x', center);
    centerLabel.setAttribute('y', center - 10);
    centerLabel.setAttribute('text-anchor', 'middle');
    centerLabel.setAttribute('class', 'donut-center-label');
    centerLabel.textContent = 'Total Spent';

    const centerAmount = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerAmount.setAttribute('x', center);
    centerAmount.setAttribute('y', center + 18);
    centerAmount.setAttribute('text-anchor', 'middle');
    centerAmount.setAttribute('class', 'donut-center-amount');
    centerAmount.textContent = this.formatMoney(totalSpent, currency);

    centerGroup.appendChild(centerLabel);
    centerGroup.appendChild(centerAmount);

    // Track slices for hover effects
    const sliceElements = [];

    categoryBreakdown.forEach((item, index) => {
      const slicePercentage = item.percentage / 100;
      const strokeDasharray = `${slicePercentage * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center);
      circle.setAttribute('cy', center);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', item.category.color);
      circle.setAttribute('stroke-width', strokeWidth);
      circle.setAttribute('stroke-dasharray', strokeDasharray);
      circle.setAttribute('stroke-dashoffset', strokeDashoffset);
      circle.setAttribute('class', 'donut-slice');
      circle.setAttribute('data-category', item.category.name);
      circle.setAttribute('data-amount', this.formatMoney(item.total, currency));
      circle.setAttribute('data-percent', item.percentage.toFixed(1) + '%');
      circle.setAttribute('transform', `rotate(-90 ${center} ${center})`);

      // Mouse events
      circle.addEventListener('mouseenter', (e) => {
        circle.style.strokeWidth = `${strokeWidth + 6}px`;
        centerLabel.textContent = item.category.name;
        centerLabel.style.fill = item.category.color;
        centerAmount.textContent = this.formatMoney(item.total, currency);
        this.showTooltip(e, item.category.name, `${this.formatMoney(item.total, currency)} (${item.percentage.toFixed(1)}%)`);
      });

      circle.addEventListener('mousemove', (e) => {
        this.positionTooltip(e);
      });

      circle.addEventListener('mouseleave', () => {
        circle.style.strokeWidth = `${strokeWidth}px`;
        centerLabel.textContent = 'Total Spent';
        centerLabel.style.fill = '';
        centerAmount.textContent = this.formatMoney(totalSpent, currency);
        this.hideTooltip();
      });

      svg.appendChild(circle);
      sliceElements.push(circle);

      accumulatedOffset += slicePercentage * circumference;
    });

    svg.appendChild(centerGroup);
    container.appendChild(svg);
  }

  /**
   * Render Daily Spending Activity Bar Chart
   * @param {HTMLElement} container
   * @param {Array} dailyBreakdown [{ day: 1, amount: 20 }, ...]
   * @param {number} averageDaily
   * @param {string} currency
   * @param {number} currentMonth
   * @param {number} currentYear
   */
  renderDailyBarChart(container, dailyBreakdown, averageDaily, currency = '$', currentMonth, currentYear) {
    if (!container) return;
    container.innerHTML = '';

    const daysCount = dailyBreakdown.length || 30;
    const maxAmount = Math.max(...dailyBreakdown.map(d => d.amount), 10);
    const hasData = dailyBreakdown.some(d => d.amount > 0);

    if (!hasData) {
      container.innerHTML = `
        <div class="empty-chart-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <p class="empty-chart-text">No daily spending to graph</p>
          <span class="empty-chart-sub">Your daily spending pattern will appear here</span>
        </div>
      `;
      return;
    }

    // Dimensions
    const width = 640;
    const height = 180;
    const paddingLeft = 38;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'bar-chart-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Horizontal grid lines (3 tiers: 0%, 50%, 100%)
    const tiers = [0, maxAmount / 2, maxAmount];
    tiers.forEach((tier) => {
      const y = paddingTop + chartHeight - (tier / maxAmount) * chartHeight;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', paddingLeft);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - paddingRight);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'chart-grid-line');
      svg.appendChild(line);

      // Y-axis label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', paddingLeft - 6);
      text.setAttribute('y', y + 3);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('class', 'chart-axis-label');
      text.textContent = tier === 0 ? '0' : tier >= 1000 ? `${(tier / 1000).toFixed(1)}k` : Math.round(tier);
      svg.appendChild(text);
    });

    // Average line
    if (averageDaily > 0 && averageDaily <= maxAmount) {
      const avgY = paddingTop + chartHeight - (averageDaily / maxAmount) * chartHeight;
      const avgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      avgLine.setAttribute('x1', paddingLeft);
      avgLine.setAttribute('y1', avgY);
      avgLine.setAttribute('x2', width - paddingRight);
      avgLine.setAttribute('y2', avgY);
      avgLine.setAttribute('class', 'chart-avg-line');
      svg.appendChild(avgLine);

      const avgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      avgText.setAttribute('x', width - paddingRight);
      avgText.setAttribute('y', avgY - 4);
      avgText.setAttribute('text-anchor', 'end');
      avgText.setAttribute('class', 'chart-avg-label');
      avgText.textContent = `Avg: ${this.formatMoney(averageDaily, currency)}`;
      svg.appendChild(avgText);
    }

    // Bar spacing & width
    const totalSlots = daysCount;
    const slotWidth = chartWidth / totalSlots;
    const barWidth = Math.max(4, Math.min(14, slotWidth * 0.65));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonthName = monthNames[currentMonth] || '';

    // Render bars
    dailyBreakdown.forEach((item, index) => {
      const day = item.day;
      const barHeight = item.amount > 0 ? (item.amount / maxAmount) * chartHeight : 2;
      const x = paddingLeft + (index * slotWidth) + (slotWidth - barWidth) / 2;
      const y = paddingTop + chartHeight - barHeight;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', Math.max(barHeight, 2));
      rect.setAttribute('rx', 3);
      rect.setAttribute('ry', 3);

      const isHigh = item.amount > 0 && item.amount >= maxAmount * 0.85;
      rect.setAttribute('class', `chart-bar ${item.amount > 0 ? (isHigh ? 'chart-bar-peak' : 'chart-bar-active') : 'chart-bar-empty'}`);

      // Hover events
      rect.addEventListener('mouseenter', (e) => {
        rect.classList.add('bar-hover');
        const dayStr = `${curMonthName} ${day}`;
        const amtStr = this.formatMoney(item.amount, currency);
        this.showTooltip(e, dayStr, item.amount > 0 ? `Spent: ${amtStr}` : 'No spending');
      });

      rect.addEventListener('mousemove', (e) => {
        this.positionTooltip(e);
      });

      rect.addEventListener('mouseleave', () => {
        rect.classList.remove('bar-hover');
        this.hideTooltip();
      });

      svg.appendChild(rect);

      // X-axis label (every 5 days and last day)
      if (day === 1 || day % 5 === 0 || day === daysCount) {
        const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xText.setAttribute('x', x + barWidth / 2);
        xText.setAttribute('y', height - 8);
        xText.setAttribute('text-anchor', 'middle');
        xText.setAttribute('class', 'chart-axis-label');
        xText.textContent = day;
        svg.appendChild(xText);
      }
    });

    container.appendChild(svg);
  }
}

// Global instance
window.spendlyCharts = new SpendlyCharts();
