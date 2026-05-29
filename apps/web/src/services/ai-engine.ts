export type TradingSignalInput = {
  ticker: string;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  rsi: number; // Relative Strength Index (0-100)
  movingAverageDiff: number; // Difference percentage vs 50-day moving average
  sentimentScore: number; // Sentiment analysis score (-1.0 to 1.0)
  portfolioWeight: number; // Current portfolio allocation % (0-100)
  targetWeight: number; // Target allocation % (0-100)
};

export type TradingAction = {
  type: 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE';
  quantityPercent?: number;
  reason: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
};

/**
 * Analiza las señales de mercado y del portafolio para recomendar una acción de trading.
 */
export function analyzeTradingSignal(input: TradingSignalInput): TradingAction {
  const { ticker, volatility, rsi, movingAverageDiff, sentimentScore, portfolioWeight, targetWeight } = input;

  const weightDeviation = portfolioWeight - targetWeight;
  const isOverweight = weightDeviation > 5.0; // Desviado por más de 5% positivo
  const isUnderweight = weightDeviation < -5.0; // Desviado por más de 5% negativo

  // 1. Detección de Sobre-exposición Crítica
  if (portfolioWeight > 40.0 && volatility === 'HIGH') {
    return {
      type: 'SELL',
      quantityPercent: Math.round(portfolioWeight - targetWeight),
      reason: `Sobre-exposición crítica detectada en ${ticker} (${portfolioWeight.toFixed(1)}% del portafolio) con alta volatilidad. Reduciendo a peso objetivo de ${targetWeight}%.`,
      severity: 'critical',
      confidence: 95
    };
  }

  // 2. Sobreventa extrema (Oportunidad de Compra) + Sentimiento Positivo
  if (rsi < 30 && sentimentScore > 0.1 && isUnderweight) {
    return {
      type: 'BUY',
      quantityPercent: Math.round(targetWeight - portfolioWeight),
      reason: `Señal de sobreventa extrema en ${ticker} (RSI: ${rsi}). El sentimiento de noticias es positivo (${sentimentScore}) y el activo está sub-representado en el portafolio.`,
      severity: 'info',
      confidence: 88
    };
  }

  // 3. Sobrecarga técnica (Oportunidad de Toma de Utilidades)
  if (rsi > 75 && isOverweight) {
    return {
      type: 'SELL',
      quantityPercent: Math.round(portfolioWeight - targetWeight),
      reason: `Señal de sobrecompra en ${ticker} (RSI: ${rsi}). Tomando utilidades para regresar al peso objetivo del ${targetWeight}%.`,
      severity: 'warning',
      confidence: 85
    };
  }

  // 4. Desviación de Portafolio estándar (Rebalanceo)
  if (Math.abs(weightDeviation) > 3.0) {
    return {
      type: 'REBALANCE',
      quantityPercent: Math.abs(Math.round(weightDeviation)),
      reason: `Desviación de asignación detectada en ${ticker} (${portfolioWeight.toFixed(1)}% actual vs ${targetWeight}% objetivo). Programando rebalanceo.`,
      severity: 'info',
      confidence: 90
    };
  }

  // 5. Señales de Hold (Estable)
  return {
    type: 'HOLD',
    reason: `${ticker} se mantiene estable dentro de los límites de tolerancia de portafolio y señales técnicas neutrales.`,
    severity: 'info',
    confidence: 99
  };
}
