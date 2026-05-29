export type OrderComplianceInput = {
  ticker: string;
  quantity: number;
  price: number;
  userRole: string;
  currentPortfolioValue: number;
  tickerCurrentValue: number;
  dailyTotalTraded: number;
};

export type ComplianceReport = {
  isCompliant: boolean;
  score: number; // 0-100 (100 = full compliance)
  violations: string[];
  warnings: string[];
  requiresHumanApproval: boolean;
};

const RESTRICTED_TICKERS = ['SUSPICIOUS_ASSET', 'PENNY_STOCK_EXCESSIVE'];
const MAX_SINGLE_TICKER_CONCENTRATION_PCT = 25.0; // 25% max in one stock
const MAX_DAILY_TRADING_LIMIT_USD = 100000.0; // $100,000 USD limit per day for standard traders

/**
 * Evalúa si una orden de compra o venta cumple con las reglas de gobernanza y control de riesgo de la empresa.
 */
export function auditOrderCompliance(input: OrderComplianceInput): ComplianceReport {
  const { ticker, quantity, price, userRole, currentPortfolioValue, tickerCurrentValue, dailyTotalTraded } = input;

  const violations: string[] = [];
  const warnings: string[] = [];
  const orderValue = quantity * price;

  // 1. Verificación de Roles para operar
  if (userRole === 'viewer') {
    violations.push('El rol de Lector (viewer) no tiene privilegios para ejecutar operaciones.');
  }

  // 2. Límite de Concentración de Activos (Gobernanza de Portafolio)
  const futureTickerValue = tickerCurrentValue + orderValue;
  const futureConcentrationPct = (futureTickerValue / currentPortfolioValue) * 100;
  
  if (futureConcentrationPct > MAX_SINGLE_TICKER_CONCENTRATION_PCT) {
    violations.push(
      `Violación de Concentración: La orden incrementaría la exposición de ${ticker} a ${futureConcentrationPct.toFixed(1)}%, superando el límite máximo autorizado del ${MAX_SINGLE_TICKER_CONCENTRATION_PCT}%.`
    );
  } else if (futureConcentrationPct > MAX_SINGLE_TICKER_CONCENTRATION_PCT - 5.0) {
    warnings.push(
      `Alerta de Exposición: ${ticker} se acerca al límite máximo con una concentración estimada del ${futureConcentrationPct.toFixed(1)}%.`
    );
  }

  // 3. Activos Restringidos (Blacklist)
  if (RESTRICTED_TICKERS.includes(ticker.toUpperCase())) {
    violations.push(`Activo Restringido: El instrumento ${ticker} está bloqueado por el departamento de Compliance.`);
  }

  // 4. Límite Diario de Operaciones por Trader
  const totalProjectedDailyTraded = dailyTotalTraded + orderValue;
  if (userRole === 'trader' && totalProjectedDailyTraded > MAX_DAILY_TRADING_LIMIT_USD) {
    violations.push(
      `Límite Diario Excedido: El volumen de operaciones diario proyectado ($${totalProjectedDailyTraded.toFixed(2)}) supera el límite diario para Traders ($${MAX_DAILY_TRADING_LIMIT_USD}).`
    );
  }

  // Determinar score final
  const score = Math.max(0, 100 - (violations.length * 40) - (warnings.length * 15));
  const isCompliant = violations.length === 0;
  const requiresHumanApproval = !isCompliant || orderValue > 50000.0; // Requiere aprobación si no cumple o si el monto es mayor a $50k

  return {
    isCompliant,
    score,
    violations,
    warnings,
    requiresHumanApproval
  };
}
