export type AssetRiskInput = {
  ticker: string;
  purchasePrice: number;
  currentPrice: number;
  volatilityPct: number; // Daily volatility percentage
  isMarginEnabled: boolean;
  maintenanceMarginPct?: number; // Margin requirement %
  currentMarginLevel?: number; // Current margin ratio %
};

export type RiskAlert = {
  ticker: string;
  type: 'STOP_LOSS_ALERT' | 'TAKE_PROFIT_ALERT' | 'VOLATILITY_ALERT' | 'MARGIN_CALL_ALERT' | 'HEALTHY';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  recommendedAction: string;
};

const STOP_LOSS_THRESHOLD_PCT = -8.0; // -8% stop loss
const TAKE_PROFIT_THRESHOLD_PCT = 30.0; // +30% take profit
const HIGH_VOLATILITY_THRESHOLD_PCT = 15.0; // 15% daily movement

/**
 * Evalúa las métricas de un activo en tiempo real para disparar alertas preventivas de riesgo.
 */
export function evaluateAssetRisk(input: AssetRiskInput): RiskAlert {
  const { ticker, purchasePrice, currentPrice, volatilityPct, isMarginEnabled, maintenanceMarginPct = 30, currentMarginLevel = 100 } = input;

  const priceDiffPct = ((currentPrice - purchasePrice) / purchasePrice) * 100;

  // 1. Margen de Riesgo Crítico (Margin Call)
  if (isMarginEnabled && currentMarginLevel <= maintenanceMarginPct) {
    return {
      ticker,
      type: 'MARGIN_CALL_ALERT',
      message: `¡LLAMADA DE MARGEN CRÍTICA en ${ticker}! El nivel de margen actual (${currentMarginLevel}%) es inferior al margen de mantenimiento requerido (${maintenanceMarginPct}%).`,
      severity: 'critical',
      recommendedAction: 'Depositar fondos de inmediato o liquidar posiciones para cubrir el margen de garantía.'
    };
  }

  // 2. Alerta de Stop-Loss alcanzado
  if (priceDiffPct <= STOP_LOSS_THRESHOLD_PCT) {
    return {
      ticker,
      type: 'STOP_LOSS_ALERT',
      message: `Alerta Stop-Loss en ${ticker}. El precio ha caído ${priceDiffPct.toFixed(1)}% desde la compra (Precio de compra: $${purchasePrice}, Actual: $${currentPrice}).`,
      severity: 'critical',
      recommendedAction: `Ejecutar orden de venta preventiva (Stop-Loss de seguridad activado a ${STOP_LOSS_THRESHOLD_PCT}%).`
    };
  }

  // 3. Alerta de Toma de Ganancias (Take-Profit)
  if (priceDiffPct >= TAKE_PROFIT_THRESHOLD_PCT) {
    return {
      ticker,
      type: 'TAKE_PROFIT_ALERT',
      message: `Objetivo Take-Profit alcanzado en ${ticker}. Rendimiento positivo de +${priceDiffPct.toFixed(1)}%.`,
      severity: 'warning', // Clasificado como advertencia para indicar acción requerida de rebalanceo o venta
      recommendedAction: 'Vender posición parcial o total para consolidar ganancias de portafolio.'
    };
  }

  // 4. Alerta de Volatilidad Anómala
  if (volatilityPct >= HIGH_VOLATILITY_THRESHOLD_PCT) {
    return {
      ticker,
      type: 'VOLATILITY_ALERT',
      message: `Volatilidad extremadamente alta en ${ticker} (${volatilityPct.toFixed(1)}% diario). Fluctuaciones rápidas detectadas en el mercado.`,
      severity: 'warning',
      recommendedAction: 'Ajustar órdenes límite y evitar la colocación de órdenes a precio de mercado durante este periodo de inestabilidad.'
    };
  }

  return {
    ticker,
    type: 'HEALTHY',
    message: `El activo ${ticker} opera con normalidad. Desviación de precio actual: ${priceDiffPct.toFixed(1)}%.`,
    severity: 'info',
    recommendedAction: 'Mantener posición (HOLD) y monitorear cotización.'
  };
}
