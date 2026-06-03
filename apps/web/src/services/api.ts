import { logger } from '../lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Helper genérico para realizar peticiones fetch al Backend con cabeceras estándar
 */
async function fetchFromBackend(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${BACKEND_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorDetail = 'Error en la petición al Backend';
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errorDetail;
      } catch (_) {
        errorDetail = await response.text() || errorDetail;
      }
      throw new Error(errorDetail);
    }
    
    return await response.json();
  } catch (error: any) {
    logger.error('Error llamando al backend:', { url, error: error.message });
    throw error;
  }
}

/**
 * Cliente de API para interactuar con FastAPI (Stock Agent backend)
 */
export const backendApi = {
  /**
   * Obtiene la cotización de un ticker
   */
  async getPrice(ticker: string, mock = false): Promise<{ ticker: string; price: number }> {
    return fetchFromBackend(`/api/trades/price?ticker=${encodeURIComponent(ticker)}&mock=${mock}`);
  },

  /**
   * Crea un nuevo portafolio con sus secciones y saldo de fondeo inicial
   */
  async createPortfolio(
    userId: string,
    nombre: string,
    descripcion: string,
    initialCash: number,
    secciones: Array<{ nombre_seccion: string; porcentaje_objetivo: number }>,
    moneda: string = "USD"
  ): Promise<{ success: boolean; portfolio_id: string; numero_portafolio: string; message: string }> {
    return fetchFromBackend('/api/trades/portfolio', {
      method: 'POST',
      headers: { 'User-ID': userId },
      body: JSON.stringify({
        nombre,
        descripcion,
        initial_cash: initialCash,
        secciones,
        moneda,
      }),
    });
  },

  /**
   * Obtiene el estado consolidado de un portafolio
   */
  async getPortfolioStatus(
    portfolioId: string,
    userId: string
  ): Promise<{
    success: boolean;
    portfolio_id: string;
    nombre_portafolio: string;
    numero_portafolio: string;
    cash_balance: number;
    assets_value: number;
    total_value: number;
    total_pnl: number;
    total_pnl_percent: number;
    holdings: Array<{
      ticker: string;
      seccion: string;
      cantidad: number;
      costo_promedio: number;
      costo_total: number;
      precio_actual: number;
      valor_actual: number;
      pnl: number;
      pnl_percent: number;
      is_manual: boolean;
    }>;
    lots: Array<{
      id: string;
      fecha_adquisicion: string;
      ticker: string;
      nombre: string;
      seccion: string;
      cantidad: number;
      precio_compra: number;
      precio_actual: number;
      costo_total: number;
      valor_actual: number;
      pnl: number;
      pnl_percent: number;
      peso_portafolio: number;
      is_manual: boolean;
    }>;
    secciones: Array<{
      nombre_seccion: string;
      porcentaje_objetivo: number;
      porcentaje_real: number;
      valor_actual: number;
      desviacion: number;
    }>;
    cash_percent: number;
  }> {
    return fetchFromBackend(`/api/trades/portfolio-status?portfolio_id=${encodeURIComponent(portfolioId)}`, {
      method: 'GET',
      headers: { 'User-ID': userId },
    });
  },

  /**
   * Ejecuta la simulación de compra de un activo
   */
  async simulateBuy(
    portfolioId: string,
    userId: string,
    ticker: string,
    cantidad: number,
    seccion: string,
    valorActualManual?: number,
    porcentajeObjetivoInstrumento?: number,
    propietario?: string,
    comisionAnual?: string
  ): Promise<{
    success: boolean;
    operacion_id: string;
    ticker: string;
    precio_ejecucion: number;
    monto_total: number;
    comision: number;
    total_cargo: number;
  }> {
    return fetchFromBackend('/api/trades/simulate-buy', {
      method: 'POST',
      headers: { 'User-ID': userId },
      body: JSON.stringify({
        portfolio_id: portfolioId,
        ticker,
        cantidad,
        seccion,
        valor_actual_manual: valorActualManual,
        porcentaje_objetivo_instrumento: porcentajeObjetivoInstrumento,
        propietario: propietario || 'Pash',
        comision_anual: comisionAnual,
      }),
    });
  },

  /**
   * Elimina una operación (lote) del portafolio
   */
  async deleteOperation(opId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return fetchFromBackend(`/api/trades/operation/${encodeURIComponent(opId)}`, {
      method: 'DELETE',
      headers: { 'User-ID': userId },
    });
  },

  /**
   * Elimina un portafolio y todas sus operaciones (cascada).
   */
  async deletePortfolio(portfolioId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return fetchFromBackend(`/api/trades/portfolio/${encodeURIComponent(portfolioId)}`, {
      method: 'DELETE',
      headers: { 'User-ID': userId },
    });
  },

  /**
   * Deposita fondos al portafolio
   */
  async depositFunds(
    portfolioId: string,
    userId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    return fetchFromBackend('/api/trades/deposit', {
      method: 'POST',
      headers: { 'User-ID': userId },
      body: JSON.stringify({
        portfolio_id: portfolioId,
        amount,
      }),
    });
  },

  /**
   * Calcula la distribución de rebalanceo sugerida
   */
  async calculateRebalance(
    portfolioId: string,
    userId: string,
    amount: number
  ): Promise<{
    success: boolean;
    portfolio_id: string;
    monto_total: number;
    rebalanceo: Array<{
      nombre_seccion: string;
      monto_sugerido: number;
      porcentaje_sugerido: number;
    }>;
  }> {
    return fetchFromBackend('/api/trades/calculate-rebalance', {
      method: 'POST',
      headers: { 'User-ID': userId },
      body: JSON.stringify({
        portfolio_id: portfolioId,
        amount,
      }),
    });
  },

  /**
   * Obtiene la ficha técnica enriquecida de un ticker
   */
  async getInstrumentDetails(
    ticker: string
  ): Promise<{
    success: boolean;
    data: {
      ticker: string;
      nombre: string;
      descripcion: string;
      tamano_aum: string;
      precio_referencia: string;
      precio_actual_vivo: number;
      comision: string;
      posiciones: number;
      top_10_percentage: string;
      dividendo: string;
      retorno_10y: string;
      retorno_5y: string;
      retorno_1y: string;
      tier: 'Excelente' | 'Muy bueno' | 'Bueno' | 'Paso SIN ver' | null;
      top_holdings: Array<{ name: string; weight: number }>;
    };
  }> {
    return fetchFromBackend(`/api/trades/instrument-details?ticker=${encodeURIComponent(ticker)}`, {
      method: 'GET',
    });
  },

  /**
   * Obtiene la categoría sugerida de un activo
   */
  async getTickerCategory(ticker: string): Promise<{ ticker: string; category: string; instrumentType: string }> {
    return fetchFromBackend(`/api/trades/ticker-category?ticker=${encodeURIComponent(ticker)}`, {
      method: 'GET',
    });
  },

  /**
   * Guarda o actualiza el objetivo de distribución de un instrumento dentro de su clase
   */
  async saveInstrumentTarget(
    portfolioId: string,
    userId: string,
    seccion: string,
    ticker: string,
    porcentajeObjetivo: number
  ): Promise<{ success: boolean; message: string }> {
    return fetchFromBackend('/api/trades/instrument-target', {
      method: 'POST',
      headers: { 'User-ID': userId },
      body: JSON.stringify({
        portfolio_id: portfolioId,
        seccion,
        ticker,
        porcentaje_objetivo: porcentajeObjetivo,
      }),
    });
  },

  /**
   * Guarda o actualiza la configuración del sub-portafolio de un instrumento
   */
  async saveInstrumentSubPortfolio(
    portfolioId: string,
    userId: string,
    ticker: string,
    tipo: 'porcentajes' | 'ahorro',
    metadata: any,
    propietario?: string
  ): Promise<{ success: boolean; message: string }> {
    return fetchFromBackend('/api/trades/instrument-sub-portfolio', {
      method: 'POST',
      headers: { 'User-ID': userId },
      body: JSON.stringify({
        portfolio_id: portfolioId,
        ticker,
        tipo,
        metadata,
        propietario: propietario || 'Pash',
      }),
    });
  },

  /**
   * Elimina la configuración del sub-portafolio de un instrumento
   */
  async deleteInstrumentSubPortfolio(
    portfolioId: string,
    userId: string,
    ticker: string,
    propietario?: string
  ): Promise<{ success: boolean; message: string }> {
    const ownerParam = propietario ? `&propietario=${encodeURIComponent(propietario)}` : '';
    return fetchFromBackend(`/api/trades/instrument-sub-portfolio?portfolio_id=${encodeURIComponent(portfolioId)}&ticker=${encodeURIComponent(ticker)}${ownerParam}`, {
      method: 'DELETE',
      headers: { 'User-ID': userId },
    });
  },
};

