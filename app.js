document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    const WEBHOOK_URL = 'https://primary-env.up.railway.app/webhook/credito-rd-public-eval';

    // ── DOM refs ──────────────────────────────────────────────────────────
    const form = document.getElementById('evaluationForm');
    const step1Panel = document.getElementById('step1Panel');
    const step2Panel = document.getElementById('step2Panel');
    const progressBar = document.getElementById('progressBar');
    const stepLabel = document.getElementById('stepLabel');
    const heroSection = document.getElementById('heroSection');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const btnNextStep = document.getElementById('btnNextStep');
    const btnPrevStep = document.getElementById('btnPrevStep');
    const btnBack = document.getElementById('btnBack');
    const btnShare = document.getElementById('btnShare');
    const shareToast = document.getElementById('shareToast');

    // ── Smooth scroll CTAs ────────────────────────────────────────────────
    const scrollToForm = () => document.getElementById('heroSection').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('btnNavCTA')?.addEventListener('click', scrollToForm);
    document.getElementById('btnScrollToForm')?.addEventListener('click', scrollToForm);

    // ── PWA Install Logic ─────────────────────────────────────────────────
    let deferredPrompt;
    const btnInstallApp = document.getElementById('btnInstallApp');

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(console.error);
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        btnInstallApp?.classList.remove('hidden');
    });

    btnInstallApp?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            btnInstallApp.classList.add('hidden');
        }
        deferredPrompt = null;
    });

    window.addEventListener('appinstalled', () => {
        btnInstallApp?.classList.add('hidden');
        deferredPrompt = null;
    });

    const formatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 0 });

    // ── Score card picker ─────────────────────────────────────────────────
    document.querySelectorAll('.score-card').forEach(card => {
        card.addEventListener('click', () => {
            if (document.getElementById('toggleExactScore').checked) return; // ignore if exact mode
            document.querySelectorAll('.score-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.getElementById('score').value = card.dataset.value;
        });
    });

    // ── Exact score toggle ────────────────────────────────────────────────
    document.getElementById('toggleExactScore').addEventListener('change', function () {
        const wrap = document.getElementById('exactScoreWrap');
        const cards = document.getElementById('scoreCards');
        if (this.checked) {
            wrap.classList.remove('hidden');
            cards.style.opacity = '0.35';
            cards.style.pointerEvents = 'none';
            document.getElementById('score').value = '';
            document.querySelectorAll('.score-card').forEach(c => c.classList.remove('selected'));
        } else {
            wrap.classList.add('hidden');
            cards.style.opacity = '1';
            cards.style.pointerEvents = 'auto';
            document.getElementById('exactScoreInput').value = '';
            document.getElementById('score').value = '';
        }
    });

    // Keep hidden score in sync when exact input changes
    document.getElementById('exactScoreInput').addEventListener('input', function () {
        const val = parseInt(this.value);
        if (val >= 300 && val <= 850) {
            document.getElementById('score').value = val;
        } else {
            document.getElementById('score').value = '';
        }
    });

    // ── Step 1 → Step 2 ───────────────────────────────────────────────────
    btnNextStep.addEventListener('click', () => {
        const income = document.getElementById('income').value;
        const expenses = document.getElementById('expenses').value;
        const age = document.getElementById('age').value;
        const employment = document.getElementById('employment').value;

        if (!income || !expenses || !age || !employment) {
            [income, expenses, age, employment].forEach((val, i) => {
                const ids = ['income', 'expenses', 'age', 'employment'];
                const el = document.getElementById(ids[i]);
                el.classList.toggle('input-error', !val);
            });
            return;
        }

        step1Panel.classList.add('hidden');
        step2Panel.classList.remove('hidden');
        progressBar.style.width = '100%';
        stepLabel.textContent = 'Paso 2 de 2 — Historial Crediticio';
    });

    // ── Step 2 → Step 1 ───────────────────────────────────────────────────
    btnPrevStep.addEventListener('click', () => {
        step2Panel.classList.add('hidden');
        step1Panel.classList.remove('hidden');
        progressBar.style.width = '50%';
        stepLabel.textContent = 'Paso 1 de 2 — Situación Financiera';
    });

    // ── Form submit ───────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const score = document.getElementById('score').value;
        if (!score) { alert('Por favor selecciona tu rango de Score Crediticio.'); return; }

        const income = parseFloat(document.getElementById('income').value);
        const expenses = parseFloat(document.getElementById('expenses').value);
        const age = parseInt(document.getElementById('age').value);
        const employment = parseInt(document.getElementById('employment').value);

        // Switch to loading — hide all ancillary sections
        heroSection.classList.add('hidden');
        document.querySelector('.how-it-works')?.classList.add('hidden');
        document.querySelector('.glossary-section')?.classList.add('hidden');
        document.querySelector('.footer')?.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        await animateLoadingSteps(async () => {
            const data = await evaluate(income, expenses, age, employment, parseInt(score));
            renderResults(data, income, expenses);
            loadingSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
        });
    });

    // ── Back button ───────────────────────────────────────────────────────
    btnBack.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        // Restore all sections
        document.querySelector('.how-it-works')?.classList.remove('hidden');
        document.querySelector('.glossary-section')?.classList.remove('hidden');
        document.querySelector('.footer')?.classList.remove('hidden');
        // Reset form to step 1
        step2Panel.classList.add('hidden');
        step1Panel.classList.remove('hidden');
        progressBar.style.width = '50%';
        stepLabel.textContent = 'Paso 1 de 2 — Situación Financiera';
        document.querySelectorAll('.score-card').forEach(c => c.classList.remove('selected'));
        document.getElementById('score').value = '';
        // Reset exact score toggle too
        const tog = document.getElementById('toggleExactScore');
        if (tog.checked) {
            tog.checked = false;
            document.getElementById('exactScoreWrap').classList.add('hidden');
            const cards = document.getElementById('scoreCards');
            if (cards) { cards.style.opacity = '1'; cards.style.pointerEvents = 'auto'; }
        }
        resetLoadingSteps();
        form.reset();
        heroSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ── Share button ──────────────────────────────────────────────────────
    btnShare.addEventListener('click', () => {
        const verdict = document.getElementById('verdictBadge').textContent;
        const product = document.getElementById('productName').textContent;
        const dti = document.getElementById('resDti').textContent;
        const text = `📊 Mi Diagnóstico CreditoRD:\nVeredicto: ${verdict}\nProducto Recomendado: ${product}\nMi DTI: ${dti}\n\n¿Cuál es tu perfil crediticio? Descúbrelo gratis en CreditoRD 👉 creditord.app`;
        navigator.clipboard.writeText(text).then(() => {
            shareToast.classList.remove('hidden');
            setTimeout(() => shareToast.classList.add('hidden'), 4000);
        });
    });

    // ── Loading animation ─────────────────────────────────────────────────
    function animateLoadingSteps(callback) {
        return new Promise(resolve => {
            setTimeout(() => {
                setStep('lstep2', '<i class="fa-solid fa-check-circle"></i> Historial Crediticio Evaluado');
                setTimeout(async () => {
                    setStep('lstep3', '<i class="fa-solid fa-check-circle"></i> Recomendaciones Listas');
                    setTimeout(async () => { await callback(); resolve(); }, 500);
                }, 800);
            }, 800);
        });
    }

    function setStep(id, html) {
        const el = document.getElementById(id);
        el.classList.remove('pending');
        el.innerHTML = html;
    }

    function resetLoadingSteps() {
        ['lstep2', 'lstep3'].forEach(id => {
            const el = document.getElementById(id);
            el.classList.add('pending');
        });
        document.getElementById('lstep2').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Evaluando Historial Crediticio...';
        document.getElementById('lstep3').innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando Recomendaciones...';
    }

    // ── Evaluation engine: try n8n, fallback to local ─────────────────────
    async function evaluate(income, expenses, age, employment, score) {
        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ income, expenses, age, employment, score })
            });
            if (!res.ok) throw new Error('n8n error');
            const raw = await res.json();
            return Array.isArray(raw) ? raw[0] : raw;
        } catch (err) {
            console.warn('n8n no disponible, usando motor local:', err.message);
            return localEngine(income, expenses, age, employment, score);
        }
    }

    // ── Local fallback engine (mirrors n8n logic) ─────────────────────────
    function localEngine(income, expenses, age, employment, score) {
        const dti = income > 0 ? expenses / income : 1;
        const dtiPercent = (dti * 100).toFixed(1);
        const disposable = income - expenses;
        const lowEmployment = employment < 3;

        let verdictBadge = '', verdictBadgeClass = '', adviceText = '', productName = '', productBadgeText = '', productDesc = '', productBg = '';
        let tips = [], confidence = 'Alta';

        if (age < 18) {
            verdictBadge = 'Alerta de Edad'; verdictBadgeClass = 'danger';
            adviceText = 'Debes ser mayor de 18 años para solicitar productos financieros crediticios convencionales.';
            productName = 'Cuenta de Ahorro'; productBadgeText = 'ORIENTACIÓN'; productBg = 'rgba(0,45,98,0.3)';
            productDesc = 'A menores de edad generalmente solo se les ofrece cuentas de ahorro juveniles. No existen productos de crédito formales para este grupo de edad según la regulación dominicana.';
            tips = ['Construye el hábito de ahorro desde ya.', 'Consulta sobre cuentas juveniles en bancos locales.'];
            confidence = 'Alta';
        } else if (dti > 0.50) {
            verdictBadge = 'Alto Riesgo'; verdictBadgeClass = 'danger';
            adviceText = `Tu DTI de ${dtiPercent}% indica que más de la mitad de tus ingresos ya están comprometidos. Esto reduce mucho tus probabilidades ante cualquier banco.`;
            productName = 'Reestructuración o Consolidación de Deuda'; productBadgeText = 'ORIENTACIÓN'; productBg = 'rgba(239,68,68,0.12)';
            productDesc = 'Con este nivel de endeudamiento, la mayoría de entidades financieras con frecuencia rechazan nuevas solicitudes. El primer paso suele ser consolidar o reducir las deudas actuales antes de aplicar a cualquier producto.';
            tips = [
                `Reduce gastos en RD$${Math.round((dti - 0.4) * income).toLocaleString()} para llegar a un DTI del 40%.`,
                'Evita solicitar nuevas tarjetas hasta bajar tu nivel de endeudamiento.',
                'Considera hablar con un asesor financiero para un plan de salida de deuda.'
            ];
            confidence = 'Baja';
        } else if (score >= 800 && disposable > 20000 && !lowEmployment) {
            verdictBadge = 'Perfil de Élite'; verdictBadgeClass = '';
            adviceText = '¡Eres un candidato soñado para los bancos! Tienes excelentes hábitos de pago, solvencia comprobada y estabilidad laboral.';
            productName = 'Tarjetas de alto límite (Premium / Signature)'; productBadgeText = 'ORIENTACIÓN'; productBg = 'linear-gradient(135deg,#1e293b,#0f172a)';
            productDesc = 'Perfiles como el tuyo suelen ser elegibles para productos de élite con altos límites de crédito, tasas preferenciales y beneficios adicionales (seguros, puntos, acceso a salas VIP). Consulta con tu banco principal.';
            tips = ['Solicita el límite más alto disponible para mantener tu uso de crédito bajo.', 'Usa la tarjeta para gastos habituales y paga el total cada mes.'];
            confidence = 'Muy Alta';
        } else if (score >= 700) {
            verdictBadge = 'Perfil Muy Sólido'; verdictBadgeClass = '';
            adviceText = 'Tu historial es saludable y tus finanzas estables. Mantén el buen ritmo y estarás listo para productos más exclusivos pronto.';
            productName = 'Tarjetas de crédito nivel medio-alto'; productBadgeText = 'ORIENTACIÓN'; productBg = 'linear-gradient(135deg,#1e3a5f,#2563a8)';
            productDesc = 'Con este perfil, las entidades financieras generalmente consideran productos con límites moderados-altos y beneficios adicionales. El banco evaluará tu situación actual al momento de aplicar.';
            tips = [
                lowEmployment ? 'Aumentar tu estabilidad laboral (>3 meses) mejoraría tu evaluación.' : 'Mantén tu historial de pagos a tiempo por 6 meses más para escalar a Platinum.',
                'Mantén el uso de tu límite por debajo del 30% del total disponible.'
            ];
            confidence = 'Alta';
        } else if (score >= 600) {
            verdictBadge = 'Perfil en Crecimiento'; verdictBadgeClass = 'warning';
            adviceText = 'Tu crédito avanza en la dirección correcta. Con disciplina y tiempo, podrás calificar a productos superiores.';
            productName = 'Préstamo personal o tarjeta de crédito básica'; productBadgeText = 'ORIENTACIÓN'; productBg = 'linear-gradient(135deg,#1e3a5f,#2563a8)';
            productDesc = 'Personas en esta etapa suelen poder acceder a préstamos personales de monto pequeño o tarjetas de límite inicial bajo. Las cuotas fijas son especialmente útiles para construir historial de forma sostenida.';
            tips = [
                'Paga siempre antes de la fecha de corte para subir rápido tu score.',
                'Evita hacer múltiples solicitudes de crédito en el mismo mes (manchan el buró).',
                lowEmployment ? 'Permanece en tu empleo actual al menos 3 meses para mejorar tu evaluación.' : 'Tu estabilidad laboral es un punto a favor, ¡mantenla!'
            ];
            confidence = 'Media';
        } else {
            verdictBadge = 'Requiere Atención'; verdictBadgeClass = 'warning';
            adviceText = 'Entendemos que construir o reconstruir el historial toma tiempo. La clave es demostrar disciplina sistemáticamente.';
            productName = 'Tarjeta de crédito garantizada (secured)'; productBadgeText = 'ORIENTACIÓN'; productBg = 'linear-gradient(135deg,#002D62,#003f8a)';
            productDesc = 'Para quienes están iniciando o reconstruyendo su historial, una tarjeta garantizada — donde un depósito propio sirve como límite — es la vía más accesible. Muchas entidades la convierten en tarjeta convencional tras 12 meses de buen uso.';
            tips = [
                'Abre una tarjeta garantizada con el mínimo posible y úsala con disciplina.',
                'Establece un único débito automático (ej. Netflix) en la tarjeta y paga el estado de cuenta completo cada mes.',
                'Espera 6 meses antes de solicitar cualquier otro producto de crédito.'
            ];
            confidence = 'Media';
        }

        return { dtiPercent, disposable, verdictBadge, verdictBadgeClass, adviceText, productName, productBadgeText, productDesc, productBg, tips, confidence };
    }

    // ── Render results to DOM ─────────────────────────────────────────────
    function renderResults(data, income, expenses) {
        // Verdict
        const verdictEl = document.getElementById('verdictBadge');
        verdictEl.className = 'verdict-badge';
        if (data.verdictBadgeClass) verdictEl.classList.add(data.verdictBadgeClass);
        verdictEl.textContent = data.verdictBadge;

        // Metrics
        document.getElementById('resDti').textContent = `${data.dtiPercent}%`;
        document.getElementById('resDisposable').textContent = formatter.format(data.disposable);
        document.getElementById('resConfidence').textContent = data.confidence || 'Alta';

        // Advice
        document.getElementById('adviceText').textContent = data.adviceText;

        // Tips
        const tipsList = document.getElementById('tipsList');
        tipsList.innerHTML = '';
        const tips = data.tips || [];
        if (tips.length > 0) {
            tips.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                tipsList.appendChild(li);
            });
            document.getElementById('tipsSection').classList.remove('hidden');
        } else {
            document.getElementById('tipsSection').classList.add('hidden');
        }

        // Product
        document.getElementById('productName').textContent = data.productName;
        document.getElementById('productBadge').textContent = data.productBadgeText;
        document.getElementById('productDesc').textContent = data.productDesc;

        const pv = document.getElementById('productVisual');
        pv.style.background = data.productBg;
        const lightCards = ['GOLD', 'CLÁSICA', 'PLATA'];
        if (lightCards.includes(data.productBadgeText)) {
            pv.querySelector('h4').style.color = '#111';
            pv.querySelector('p').style.color = '#444';
            document.getElementById('productBadge').style.cssText = 'color:#111;background:rgba(0,0,0,0.1)';
        } else {
            pv.querySelector('h4').style.color = '#fff';
            pv.querySelector('p').style.color = 'var(--text-muted)';
            document.getElementById('productBadge').style.cssText = 'color:#fff;background:rgba(255,255,255,0.1)';
        }

        // Draw DTI gauge
        drawGauge(parseFloat(data.dtiPercent));
    }

    // ── DTI Gauge (semicircle via Canvas) ─────────────────────────────────
    function drawGauge(dtiPercent) {
        const canvas = document.getElementById('dtiGauge');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = canvas.width / 2;
        const cy = canvas.height - 10;
        const r = 80;
        const value = Math.min(dtiPercent, 100) / 100;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background arc
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, 0, false);
        ctx.lineWidth = 14;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();

        // Value arc
        const color = dtiPercent < 30 ? '#10b981' : dtiPercent < 50 ? '#f59e0b' : '#ef4444';
        const endAngle = Math.PI + Math.PI * value;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI, endAngle, false);
        ctx.lineWidth = 14;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
});
