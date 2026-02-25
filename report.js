/**
 * tuCreditoRD — Generador de Reporte Imprimible
 */
const Report = {
    generate(result, inputs) {
        const date = new Date().toLocaleDateString('es-DO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });

        const factorRows = Object.entries(result.factors).map(([key, f]) => {
            const bar = '█'.repeat(Math.round(f.pct / 10)) + '░'.repeat(10 - Math.round(f.pct / 10));
            return `
        <tr>
          <td style="padding:10px 12px;font-weight:600">${f.label}</td>
          <td style="padding:10px 12px;text-align:center;color:#6b7280">${Math.round(f.weight * 100)}%</td>
          <td style="padding:10px 12px;font-family:monospace;color:${Report.factorColor(f.pct)}">${bar}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700;color:${Report.factorColor(f.pct)}">${f.pct}%</td>
        </tr>
      `;
        }).join('');

        const recsHtml = result.recommendations.map(r => `
      <div style="margin-bottom:12px;padding:14px 16px;border-left:4px solid ${r.priority === 'high' ? '#ef4444' : r.priority === 'medium' ? '#f97316' : r.priority === 'positive' ? '#10b981' : '#3b82f6'};background:#f9fafb;border-radius:0 8px 8px 0">
        <strong>${r.icon} ${r.title}</strong>
        <p style="margin:4px 0 0;color:#4b5563;font-size:14px">${r.text}</p>
      </div>
    `).join('');

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Crédito — tuCreditoRD</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; background: #f3f4f6; color: #111827; }
    .page { max-width: 800px; margin: 20px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
    .header { background: linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%); color: #fff; padding: 32px 40px; }
    .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { opacity: .8; font-size: 13px; margin-top: 4px; }
    .score-box { background: #f8fafc; border-bottom: 1px solid #e5e7eb; padding: 28px 40px; display: flex; align-items: center; gap: 32px; }
    .score-num { font-size: 72px; font-weight: 800; line-height: 1; }
    .score-label { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .score-sub { color: #6b7280; font-size: 14px; }
    .section { padding: 28px 40px; border-bottom: 1px solid #e5e7eb; }
    .section-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: .5px; color: #374151; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    tr:nth-child(even) { background: #f9fafb; }
    .inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .input-item { background: #f9fafb; border-radius: 8px; padding: 12px; }
    .input-item label { font-size: 11px; text-transform: uppercase; color: #6b7280; display: block; margin-bottom: 2px; }
    .input-item value { font-size: 18px; font-weight: 700; color: #111827; }
    .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
    .disclaimer { font-size: 11px; color: #9ca3af; font-style: italic; margin-top: 8px; }
    @media print {
      body { background: #fff; }
      .page { box-shadow: none; margin: 0; border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:16px;background:#1e3a5f">
    <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">🖨️ Imprimir Reporte</button>
    <button onclick="window.close()" style="background:#fff;color:#1e3a5f;border:none;padding:10px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;margin-left:12px">✕ Cerrar</button>
  </div>
  <div class="page">
    <div class="header">
      <h1>tuCreditoRD — Reporte de Crédito Estimado</h1>
      <p>Generado el ${date} · Sistema Open Source · Solo para referencia personal</p>
    </div>

    <div class="score-box">
      <div>
        <div class="score-num" style="color:${result.colorHex}">${result.score}</div>
      </div>
      <div>
        <div class="score-label" style="color:${result.colorHex}">${result.emoji} ${result.rating}</div>
        <div class="score-sub">Rango de puntaje: 300 – 850</div>
        <div class="score-sub" style="margin-top:4px">Basado en metodología FICO</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Desglose por Factor</div>
      <table>
        <thead>
          <tr>
            <th>Factor</th>
            <th>Peso</th>
            <th>Desempeño</th>
            <th>Puntuación</th>
          </tr>
        </thead>
        <tbody>${factorRows}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Tus Datos Ingresados</div>
      <div class="inputs-grid">
        <div class="input-item">
          <label>Pagos a tiempo</label>
          <value>${inputs.onTimePercent}%</value>
        </div>
        <div class="input-item">
          <label>Utilización de crédito</label>
          <value>${inputs.utilizationPercent}%</value>
        </div>
        <div class="input-item">
          <label>Antigüedad del historial</label>
          <value>${inputs.creditAgeYears} año(s)</value>
        </div>
        <div class="input-item">
          <label>Tipos de crédito</label>
          <value>${inputs.creditTypes} tipo(s)</value>
        </div>
        <div class="input-item">
          <label>Consultas recientes</label>
          <value>${inputs.inquiriesCount} consulta(s)</value>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Recomendaciones Personalizadas</div>
      ${recsHtml}
    </div>

    <div class="footer">
      <strong>tuCreditoRD</strong> — Sistema Open Source de Educación Financiera 🇩🇴<br/>
      <span class="disclaimer">Este reporte es una estimación educativa basada en la metodología FICO. No reemplaza un informe oficial. Consulta la Central de Riesgos de la Superintendencia de Bancos de la República Dominicana para tu historial crediticio real.</span>
    </div>
  </div>
</body>
</html>`;

        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    },

    factorColor(pct) {
        if (pct >= 80) return '#10b981';
        if (pct >= 60) return '#fbbf24';
        if (pct >= 40) return '#f97316';
        return '#ef4444';
    },
};

window.Report = Report;
