/**
 * tuCreditoRD — Gráficas SVG (Gauge + Donut + Barras)
 */

const Charts = {
  /**
   * Renderiza el gauge semicircular animado en el SVG con id `gaugesvg`
   */
  renderGauge(score) {
    const svg = document.getElementById('gaugesvg');
    if (!svg) return;

    const min = 300, max = 850;
    const pct = Math.min(1, Math.max(0, (score - min) / (max - min)));
    const angle = pct * 180; // 0 = izquierda, 180 = derecha
    const rad = (angle - 180) * (Math.PI / 180);

    // Parámetros del arco
    const cx = 150, cy = 135, r = 110;
    const strokeWidth = 22;

    // Color dinámico según el puntaje
    const color = this.getScoreColor(score);

    // Needle (aguja)
    const nx = cx + r * Math.cos(rad);
    const ny = cy + r * Math.sin(rad);

    // Gradiente de colores en el arco
    const stops = [
      { offset: '0%', color: '#ef4444' },
      { offset: '25%', color: '#f97316' },
      { offset: '50%', color: '#fbbf24' },
      { offset: '75%', color: '#6ee7b7' },
      { offset: '100%', color: '#10b981' },
    ];

    svg.innerHTML = `
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          ${stops.map(s => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('')}
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="needleGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Arco fondo (gris) -->
      <path
        d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
        fill="none" stroke="var(--border)" stroke-width="${strokeWidth}"
        stroke-linecap="round"
      />

      <!-- Arco de progreso con gradiente-->
      <path
        id="arcProgress"
        d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"
        fill="none" stroke="url(#arcGrad)" stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-dasharray="${Math.PI * r}"
        stroke-dashoffset="${Math.PI * r * (1 - pct)}"
        style="transition: stroke-dashoffset 1s cubic-bezier(.4,0,.2,1); filter: url(#glow)"
      />

      <!-- Marcas de escala -->
      ${[300, 400, 500, 600, 700, 800, 850].map(v => {
      const p = (v - min) / (max - min);
      const a = (p * 180 - 180) * (Math.PI / 180);
      const x1 = cx + (r - 13) * Math.cos(a), y1 = cy + (r - 13) * Math.sin(a);
      const x2 = cx + (r + 5) * Math.cos(a), y2 = cy + (r + 5) * Math.sin(a);
      const lx = cx + (r - 28) * Math.cos(a), ly = cy + (r - 28) * Math.sin(a);
      return `
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--text-muted)" stroke-width="1.5"/>
          <text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
            font-size="9" fill="var(--text-muted)" font-family="Inter,sans-serif">${v}</text>
        `;
    }).join('')}

      <!-- Aguja -->
      <line
        x1="${cx}" y1="${cy}"
        x2="${nx}" y2="${ny}"
        stroke="${color}" stroke-width="3" stroke-linecap="round"
        filter="url(#needleGlow)"
        style="transition: all 1s cubic-bezier(.4,0,.2,1)"
      />

      <!-- Centro de la aguja -->
      <circle cx="${cx}" cy="${cy}" r="8" fill="${color}" filter="url(#glow)"/>
      <circle cx="${cx}" cy="${cy}" r="4" fill="var(--bg-card)"/>

      <!-- Etiqueta Tu Score -->
      <text x="${cx}" y="${cy - 52}" text-anchor="middle"
        font-size="11" font-weight="600" fill="var(--text-muted)"
        font-family="Inter,sans-serif" letter-spacing="1"
      >TU SCORE</text>

      <!-- Puntaje central -->
      <text x="${cx}" y="${cy - 16}" text-anchor="middle"
        font-size="44" font-weight="900" fill="${color}"
        font-family="Inter,sans-serif"
        style="transition: fill 0.5s"
      >${score}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle"
        font-size="11" fill="var(--text-muted)" font-family="Inter,sans-serif"
      >de 850 puntos</text>
    `;
  },

  getScoreColor(score) {
    if (score >= 800) return '#10b981';
    if (score >= 740) return '#6ee7b7';
    if (score >= 670) return '#fbbf24';
    if (score >= 580) return '#f97316';
    return '#ef4444';
  },

  /**
   * Actualiza las barras de progreso de cada factor
   */
  renderFactorBars(factors) {
    Object.entries(factors).forEach(([key, factor]) => {
      const bar = document.getElementById(`bar-${key}`);
      const pctEl = document.getElementById(`pct-${key}`);
      if (bar) {
        bar.style.width = `${factor.pct}%`;
        bar.style.background = this.getFactorColor(factor.pct);
      }
      if (pctEl) pctEl.textContent = `${factor.pct}%`;
    });
  },

  getFactorColor(pct) {
    if (pct >= 80) return 'linear-gradient(90deg,#10b981,#6ee7b7)';
    if (pct >= 60) return 'linear-gradient(90deg,#fbbf24,#fde68a)';
    if (pct >= 40) return 'linear-gradient(90deg,#f97316,#fdba74)';
    return 'linear-gradient(90deg,#ef4444,#fca5a5)';
  },

  /**
   * Anima el número del puntaje con efecto contador
   */
  animateScore(targetEl, from, to, duration = 1000) {
    if (!targetEl) return;
    const start = performance.now();
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * ease);
      targetEl.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  },
};

window.Charts = Charts;
