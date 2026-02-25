/**
 * tuCreditoRD — Motor de Cálculo de Puntaje de Crédito
 * Basado en los 5 factores FICO
 */

const SCORE_MIN = 300;
const SCORE_MAX = 850;
const SCORE_RANGE = SCORE_MAX - SCORE_MIN;

// Pesos de los 5 factores FICO
const WEIGHTS = {
    paymentHistory: 0.35,
    amountsOwed: 0.30,
    creditAge: 0.15,
    creditMix: 0.10,
    inquiries: 0.10,
};

/**
 * Calcula el puntaje individual de cada factor.
 * Todos los factores retornan un valor normalizado [0, 1]
 */
function calcPaymentHistory(onTimePercent) {
    // onTimePercent: 0-100 (% de pagos realizados a tiempo)
    const p = Math.min(100, Math.max(0, onTimePercent)) / 100;
    // Curva: penaliza fuertemente por debajo de 90%
    if (p >= 0.99) return 1.0;
    if (p >= 0.95) return 0.90 + (p - 0.95) * 2.0;
    if (p >= 0.90) return 0.75 + (p - 0.90) * 3.0;
    if (p >= 0.80) return 0.50 + (p - 0.80) * 2.5;
    return p * 0.625;
}

function calcAmountsOwed(utilizationPercent) {
    // utilizationPercent: 0-100 (% de crédito disponible utilizado)
    const u = Math.min(100, Math.max(0, utilizationPercent)) / 100;
    // Debajo del 30% es ideal; encima penaliza fuertemente
    if (u <= 0.01) return 1.0;
    if (u <= 0.10) return 0.95;
    if (u <= 0.30) return 0.80 - ((u - 0.10) / 0.20) * 0.20;
    if (u <= 0.50) return 0.60 - ((u - 0.30) / 0.20) * 0.25;
    if (u <= 0.75) return 0.35 - ((u - 0.50) / 0.25) * 0.20;
    return Math.max(0, 0.15 - ((u - 0.75) / 0.25) * 0.15);
}

function calcCreditAge(years) {
    // years: 0-30 (años promedio de historial de crédito)
    const y = Math.min(30, Math.max(0, years));
    if (y <= 0) return 0;
    if (y <= 2) return (y / 2) * 0.35;
    if (y <= 5) return 0.35 + ((y - 2) / 3) * 0.25;
    if (y <= 10) return 0.60 + ((y - 5) / 5) * 0.25;
    if (y <= 20) return 0.85 + ((y - 10) / 10) * 0.10;
    return 0.95 + ((y - 20) / 10) * 0.05;
}

function calcCreditMix(types) {
    // types: 0-5 (número de tipos diferentes de crédito)
    const t = Math.min(5, Math.max(0, types));
    const scores = [0, 0.20, 0.50, 0.75, 0.90, 1.0];
    return scores[Math.round(t)];
}

function calcInquiries(count) {
    // count: 0-10 (número de consultas en los últimos 12 meses)
    const c = Math.min(10, Math.max(0, count));
    if (c === 0) return 1.0;
    if (c === 1) return 0.85;
    if (c === 2) return 0.70;
    if (c === 3) return 0.55;
    if (c <= 5) return 0.35 - ((c - 3) / 2) * 0.15;
    return Math.max(0, 0.20 - ((c - 5) / 5) * 0.20);
}

/**
 * Calcula el puntaje FICO estimado y el desglose por factor.
 * @param {Object} inputs - { onTimePercent, utilizationPercent, creditAgeYears, creditTypes, inquiriesCount }
 * @returns {Object} - { score, rating, color, factors, recommendations }
 */
function calculateScore(inputs) {
    const factorScores = {
        paymentHistory: calcPaymentHistory(inputs.onTimePercent ?? 80),
        amountsOwed: calcAmountsOwed(inputs.utilizationPercent ?? 50),
        creditAge: calcCreditAge(inputs.creditAgeYears ?? 3),
        creditMix: calcCreditMix(inputs.creditTypes ?? 2),
        inquiries: calcInquiries(inputs.inquiriesCount ?? 3),
    };

    // Suma ponderada
    const weighted =
        factorScores.paymentHistory * WEIGHTS.paymentHistory +
        factorScores.amountsOwed * WEIGHTS.amountsOwed +
        factorScores.creditAge * WEIGHTS.creditAge +
        factorScores.creditMix * WEIGHTS.creditMix +
        factorScores.inquiries * WEIGHTS.inquiries;

    const score = Math.round(SCORE_MIN + weighted * SCORE_RANGE);
    const { rating, color, colorHex, emoji } = getRating(score);
    const recommendations = getRecommendations(inputs, factorScores, score);

    return {
        score,
        rating,
        color,
        colorHex,
        emoji,
        factors: {
            paymentHistory: { score: factorScores.paymentHistory, weight: WEIGHTS.paymentHistory, label: 'Historial de Pago', pct: Math.round(factorScores.paymentHistory * 100) },
            amountsOwed: { score: factorScores.amountsOwed, weight: WEIGHTS.amountsOwed, label: 'Cantidades Adeudadas', pct: Math.round(factorScores.amountsOwed * 100) },
            creditAge: { score: factorScores.creditAge, weight: WEIGHTS.creditAge, label: 'Duración del Historial', pct: Math.round(factorScores.creditAge * 100) },
            creditMix: { score: factorScores.creditMix, weight: WEIGHTS.creditMix, label: 'Tipos de Crédito', pct: Math.round(factorScores.creditMix * 100) },
            inquiries: { score: factorScores.inquiries, weight: WEIGHTS.inquiries, label: 'Consultas Recientes', pct: Math.round(factorScores.inquiries * 100) },
        },
        recommendations,
    };
}

function getRating(score) {
    if (score >= 800) return { rating: 'Excepcional', color: 'exceptional', colorHex: '#10b981', emoji: '🌟' };
    if (score >= 740) return { rating: 'Muy Bueno', color: 'very-good', colorHex: '#6ee7b7', emoji: '✅' };
    if (score >= 670) return { rating: 'Bueno', color: 'good', colorHex: '#fbbf24', emoji: '👍' };
    if (score >= 580) return { rating: 'Regular', color: 'fair', colorHex: '#f97316', emoji: '⚠️' };
    return { rating: 'Deficiente', color: 'poor', colorHex: '#ef4444', emoji: '🔴' };
}

function getRecommendations(inputs, factorScores, score) {
    const recs = [];

    if (factorScores.paymentHistory < 0.85) {
        recs.push({
            icon: '📅',
            title: 'Historial de pagos',
            text: inputs.onTimePercent < 95
                ? `Tienes un ${inputs.onTimePercent}% de pagos a tiempo. Activa pagos automáticos para llegar al 100% y mejorar hasta 50 puntos.`
                : 'Asegúrate de pagar al menos el mínimo antes de la fecha de vencimiento cada mes.',
            priority: 'high',
        });
    }

    if (factorScores.amountsOwed < 0.75) {
        recs.push({
            icon: '💳',
            title: 'Utilización de crédito',
            text: inputs.utilizationPercent > 30
                ? `Tu utilización es ${inputs.utilizationPercent}%. Redúcela por debajo del 30% (idealmente 10%) para un impacto inmediato en tu puntaje.`
                : 'Buen manejo del crédito disponible. Mantén tu utilización bajo el 30%.',
            priority: 'high',
        });
    }

    if (factorScores.creditAge < 0.60) {
        recs.push({
            icon: '⏳',
            title: 'Antigüedad del historial',
            text: `Con ${inputs.creditAgeYears} año(s) de historial, el tiempo es tu mejor aliado. No cierres cuentas antiguas, aunque no las uses activamente.`,
            priority: 'medium',
        });
    }

    if (factorScores.creditMix < 0.70) {
        recs.push({
            icon: '🏦',
            title: 'Diversificación del crédito',
            text: `Tienes ${inputs.creditTypes} tipo(s) de crédito. Considera agregar una mezcla sana: tarjeta de crédito, préstamo personal y/o hipoteca.`,
            priority: 'low',
        });
    }

    if (factorScores.inquiries < 0.70) {
        recs.push({
            icon: '🔍',
            title: 'Consultas de crédito',
            text: `Con ${inputs.inquiriesCount} consulta(s) reciente(s), reduce las solicitudes de nuevos créditos. Cada consulta dura 2 años en tu historial.`,
            priority: 'medium',
        });
    }

    // Recomendación positiva si el puntaje es alto
    if (score >= 740) {
        recs.push({
            icon: '🎉',
            title: '¡Excelente manejo financiero!',
            text: 'Tu puntaje te califica para las mejores tasas de interés. Mantén estos hábitos y considera un monitoreo periódico.',
            priority: 'positive',
        });
    }

    return recs;
}

window.CreditCalculator = { calculateScore, getRating, WEIGHTS };
