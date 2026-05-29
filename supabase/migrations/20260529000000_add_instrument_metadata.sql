-- ==============================================================================
-- 📊 CATALOG DE INSTRUMENTOS Y METADATOS DE ETFS POPULARES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.instrumentos_metadata (
    ticker TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tamano_aum TEXT,                -- e.g. '$1,480 B'
    precio_referencia TEXT,         -- e.g. '634 USD'
    comision TEXT,                  -- e.g. '0.03%'
    posiciones INTEGER,             -- e.g. 505
    top_10_percentage TEXT,         -- e.g. '40.30%'
    dividendo TEXT,                 -- e.g. '1.12%' o 'Acumula' o 'N/A'
    retorno_10y TEXT,               -- e.g. '15.26%' o 'N/A'
    retorno_5y TEXT,                -- e.g. '16.43%'
    retorno_1y TEXT,                -- e.g. '17.56%'
    tier TEXT CHECK (tier IN ('Excelente', 'Muy bueno', 'Bueno', 'Paso SIN ver')),
    top_holdings JSONB DEFAULT '[]'::jsonb, -- e.g. [{"name": "Microsoft", "weight": 7.1}]
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.instrumentos_metadata ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para desarrollo
DROP POLICY IF EXISTS "Permitir select para instrumentos_metadata" ON public.instrumentos_metadata;
CREATE POLICY "Permitir select para instrumentos_metadata" ON public.instrumentos_metadata FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insert para instrumentos_metadata" ON public.instrumentos_metadata;
CREATE POLICY "Permitir insert para instrumentos_metadata" ON public.instrumentos_metadata FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir update para instrumentos_metadata" ON public.instrumentos_metadata;
CREATE POLICY "Permitir update para instrumentos_metadata" ON public.instrumentos_metadata FOR UPDATE USING (true);

-- Poblar catálogo con la tabla de ETFs y Tier List provista por el usuario
INSERT INTO public.instrumentos_metadata (
    ticker, nombre, descripcion, tamano_aum, precio_referencia, comision, posiciones, top_10_percentage, dividendo, retorno_10y, retorno_5y, retorno_1y, tier, top_holdings
) VALUES
(
    'VGT',
    'Vanguard Information Technology ETF',
    'ETF que sigue el rendimiento de las acciones de tecnología de EE. UU. Tiene una alta concentración en gigantes de software y hardware como Apple y Microsoft.',
    '$129.96 B', '776.32 USD', '0.09%', 322, '57.90%', '0.41%', '23.45%', '19.95%', '27.90%',
    'Bueno',
    '[{"name": "Microsoft Corp.", "weight": 16.50}, {"name": "Apple Inc.", "weight": 15.80}, {"name": "NVIDIA Corp.", "weight": 12.20}, {"name": "Broadcom Inc.", "weight": 4.50}, {"name": "Salesforce Inc.", "weight": 2.20}, {"name": "Adobe Inc.", "weight": 2.10}, {"name": "AMD Inc.", "weight": 1.90}, {"name": "Intel Corp.", "weight": 1.10}, {"name": "Oracle Corp.", "weight": 0.90}, {"name": "Qualcomm Inc.", "weight": 0.70}]'::jsonb
),
(
    'VTV',
    'Vanguard Value ETF',
    'ETF que rastrea las acciones de gran capitalización en la categoría de valor en EE. UU., ofreciendo estabilidad y menor volatilidad comparado al sector de crecimiento.',
    '$215.53 B', '192.87 USD', '0.04%', 315, '21.40%', '2.05%', '12.10%', '15.02%', '9.17%',
    'Bueno',
    '[{"name": "Berkshire Hathaway", "weight": 3.40}, {"name": "JPMorgan Chase & Co.", "weight": 3.10}, {"name": "Broadcom Inc.", "weight": 2.80}, {"name": "Exxon Mobil Corp.", "weight": 2.50}, {"name": "Johnson & Johnson", "weight": 2.10}, {"name": "General Electric", "weight": 1.80}, {"name": "Procter & Gamble", "weight": 1.50}, {"name": "AbbVie Inc.", "weight": 1.20}, {"name": "Chevron Corp.", "weight": 1.10}, {"name": "Home Depot", "weight": 0.90}]'::jsonb
),
(
    'VOO',
    'Vanguard S&P 500 ETF',
    'ETF estándar de la industria que replica el índice S&P 500, agrupando a las 500 empresas de mayor tamaño y relevancia financiera en Estados Unidos.',
    '$1,480 B', '634 USD', '0.03%', 505, '40.30%', '1.12%', '15.26%', '16.43%', '17.56%',
    'Muy bueno',
    '[{"name": "Microsoft Corp.", "weight": 7.10}, {"name": "Apple Inc.", "weight": 6.80}, {"name": "NVIDIA Corp.", "weight": 6.20}, {"name": "Amazon.com Inc.", "weight": 3.80}, {"name": "Alphabet Inc. A", "weight": 2.30}, {"name": "Meta Platforms A", "weight": 2.20}, {"name": "Berkshire Hathaway", "weight": 1.70}, {"name": "Eli Lilly & Co.", "weight": 1.50}, {"name": "Broadcom Inc.", "weight": 1.40}, {"name": "Tesla Inc.", "weight": 1.30}]'::jsonb
),
(
    'VUAA',
    'Vanguard S&P 500 UCITS ETF (USD) Accumulating',
    'ETF de acumulación domiciliado en Irlanda que replica el S&P 500. Reinvierte automáticamente todos los dividendos, haciéndolo ideal para la optimización fiscal.',
    '$79.56 B', '132 USD', '0.07%', 503, '34.70%', 'Acumula', 'N/A', '18.25%', '7.96%',
    'Excelente',
    '[{"name": "Microsoft Corp.", "weight": 7.10}, {"name": "Apple Inc.", "weight": 6.80}, {"name": "NVIDIA Corp.", "weight": 6.20}, {"name": "Amazon.com Inc.", "weight": 3.80}, {"name": "Alphabet Inc. A", "weight": 2.30}, {"name": "Meta Platforms A", "weight": 2.20}, {"name": "Berkshire Hathaway", "weight": 1.70}, {"name": "Eli Lilly & Co.", "weight": 1.50}, {"name": "Broadcom Inc.", "weight": 1.40}, {"name": "Tesla Inc.", "weight": 1.30}]'::jsonb
),
(
    'VTI',
    'Vanguard Total Stock Market ETF',
    'ETF de cobertura total del mercado estadounidense. Incluye micro, pequeña, mediana y gran capitalización (más de 3,500 acciones en un solo instrumento).',
    '$2,060 B', '340 USD', '0.03%', 3527, '35.40%', '1.11%', '14.66%', '15.66%', '17.34%',
    'Excelente',
    '[{"name": "Microsoft Corp.", "weight": 6.10}, {"name": "Apple Inc.", "weight": 5.80}, {"name": "NVIDIA Corp.", "weight": 5.10}, {"name": "Amazon.com Inc.", "weight": 3.20}, {"name": "Alphabet Inc. A", "weight": 2.00}, {"name": "Meta Platforms A", "weight": 1.90}, {"name": "Berkshire Hathaway", "weight": 1.40}, {"name": "Eli Lilly & Co.", "weight": 1.30}, {"name": "Broadcom Inc.", "weight": 1.10}, {"name": "Tesla Inc.", "weight": 1.00}]'::jsonb
),
(
    'IVV',
    'iShares Core S&P 500 ETF',
    'ETF de BlackRock que rastrea el índice S&P 500 de manera eficiente con un costo de administración sumamente bajo.',
    '$764 B', '694 USD', '0.03%', 503, '36.53%', '1.13%', '13.61%', '16.60%', '15.13%',
    'Muy bueno',
    '[{"name": "Microsoft Corp.", "weight": 7.10}, {"name": "Apple Inc.", "weight": 6.80}, {"name": "NVIDIA Corp.", "weight": 6.20}, {"name": "Amazon.com Inc.", "weight": 3.80}, {"name": "Alphabet Inc. A", "weight": 2.30}, {"name": "Meta Platforms A", "weight": 2.20}, {"name": "Berkshire Hathaway", "weight": 1.70}, {"name": "Eli Lilly & Co.", "weight": 1.50}, {"name": "Broadcom Inc.", "weight": 1.40}, {"name": "Tesla Inc.", "weight": 1.30}]'::jsonb
),
(
    'IVVPESO',
    'iShares S&P 500 Peso Hedged TR',
    'ETF mexicano que replica el S&P 500 con cobertura cambiaria de pesos a dólares. Protege al inversionista mexicano frente a variaciones de tipo de cambio.',
    '$0.557 B', '141 MXN', '0.49%', 2, '100.00%', 'Acumula', '16.87%', '17.64%', '18.96%',
    'Excelente',
    '[{"name": "iShares Core S&P 500 ETF", "weight": 99.80}, {"name": "Efectivo MXN", "weight": 0.20}]'::jsonb
),
(
    'NAFTRAC',
    'iShares TRAC Mextrac',
    'Fideicomiso de inversión local que busca replicar el rendimiento del principal índice accionario de México (IPC), compuesto por las 35 empresas más líquidas.',
    '5.79$', '65 MXN', '0.25%', 35, '71.60%', '2.68%', '3.87%', '8.68%', '7.07%',
    'Bueno',
    '[{"name": "GRUPO MEXICO B", "weight": 12.14}, {"name": "GPO FINANCE BANORTE", "weight": 10.35}, {"name": "AMERICA MOVIL B", "weight": 9.30}, {"name": "CEMEX CPO", "weight": 8.00}, {"name": "FOMENTO ECONOMICO MEXICANO", "weight": 7.99}, {"name": "WALMART DE MEXICO V", "weight": 7.86}, {"name": "GRUPO AEROPORTUARIO PACIFICO", "weight": 5.67}, {"name": "INDUST PENOLES", "weight": 4.47}, {"name": "GRUPO AEROPORTUARIO SURESTE B", "weight": 2.96}, {"name": "ARCA CONTINENTAL", "weight": 2.86}]'::jsonb
),
(
    'IEMG',
    'iShares Core MSCI Emerging Markets ETF',
    'ETF diversificado que brinda acceso a más de 2,600 empresas de mediana y pequeña capitalización en mercados emergentes como China, India y Brasil.',
    '$119 B', '66 USD', '0.09%', 2693, '23.63%', '2.80%', '4.96%', '7.53%', '15.15%',
    'Excelente',
    '[{"name": "TSMC Ltd.", "weight": 8.10}, {"name": "Tencent Holdings", "weight": 3.90}, {"name": "Alibaba Group", "weight": 2.10}, {"name": "Reliance Industries", "weight": 1.30}, {"name": "Samsung Electronics", "weight": 1.20}, {"name": "PDD Holdings", "weight": 1.10}, {"name": "Meituan", "weight": 0.90}, {"name": "Infosys Ltd.", "weight": 0.80}, {"name": "China Construction Bank", "weight": 0.70}, {"name": "ICICI Bank", "weight": 0.60}]'::jsonb
),
(
    'IAU',
    'iShares Gold Trust',
    'ETF de materias primas que almacena lingotes de oro físicos en bóvedas seguras alrededor del mundo, reflejando fielmente el precio spot del oro.',
    '$70.95 B', '84 USD', '0.25%', 1, '100%', 'N/A', '12.85%', '14.90%', '45.10%',
    'Excelente',
    '[{"name": "Oro Físico (Lingotes)", "weight": 100.00}]'::jsonb
),
(
    'GLD',
    'SPDR Gold Shares',
    'El ETF de oro físico más grande y antiguo del mundo. Ofrece una forma líquida de invertir en oro sin necesidad de almacenamiento físico propio.',
    '$153 B', '411 USD', '0.40%', 1, '100%', 'N/A', '14.29%', '18.39%', '57.94%',
    'Paso SIN ver',
    '[{"name": "Oro Físico (Lingotes)", "weight": 100.00}]'::jsonb
),
(
    'SPY',
    'SPDR S&P 500 ETF Trust',
    'El primer ETF listado en EE. UU. (1993). Rastrea el S&P 500 y es sumamente popular por su extrema liquidez y volumen diario de trading.',
    '$711 B', '690 USD', '0.09%', 503, '39%', '1.17%', '15.15%', '16.33%', '17.42%',
    'Paso SIN ver',
    '[{"name": "Microsoft Corp.", "weight": 7.10}, {"name": "Apple Inc.", "weight": 6.80}, {"name": "NVIDIA Corp.", "weight": 6.20}, {"name": "Amazon.com Inc.", "weight": 3.80}, {"name": "Alphabet Inc. A", "weight": 2.30}, {"name": "Meta Platforms A", "weight": 2.20}, {"name": "Berkshire Hathaway", "weight": 1.70}, {"name": "Eli Lilly & Co.", "weight": 1.50}, {"name": "Broadcom Inc.", "weight": 1.40}, {"name": "Tesla Inc.", "weight": 1.30}]'::jsonb
),
(
    'QQQ',
    'Invesco QQQ Trust',
    'ETF que sigue a las 100 empresas no financieras más grandes del índice Nasdaq. Tiene un sesgo extremadamente alto a empresas de crecimiento tecnológico.',
    '$411 B', '625 USD', '0.18%', 101, '53%', '0.46%', '20.32%', '17.34%', '23.63%',
    'Paso SIN ver',
    '[{"name": "Microsoft Corp.", "weight": 8.80}, {"name": "Apple Inc.", "weight": 8.50}, {"name": "NVIDIA Corp.", "weight": 7.90}, {"name": "Amazon.com Inc.", "weight": 4.90}, {"name": "Meta Platforms A", "weight": 4.50}, {"name": "Alphabet Inc. A", "weight": 2.80}, {"name": "Tesla Inc.", "weight": 2.70}, {"name": "Broadcom Inc.", "weight": 2.50}, {"name": "Costco Wholesale", "weight": 2.20}, {"name": "Netflix Inc.", "weight": 1.90}]'::jsonb
),
(
    'QQQM',
    'Invesco NASDAQ 100 ETF',
    'ETF alternativo que sigue al Nasdaq 100 idéntico al QQQ, pero diseñado para inversores de largo plazo por su comisión más económica de 0.15%.',
    '$71 B', '256 USD', '0.15%', 103, '53%', '0.49%', 'N/A', 'N/A', '17.97%',
    'Muy bueno',
    '[{"name": "Microsoft Corp.", "weight": 8.80}, {"name": "Apple Inc.", "weight": 8.50}, {"name": "NVIDIA Corp.", "weight": 7.90}, {"name": "Amazon.com Inc.", "weight": 4.90}, {"name": "Meta Platforms A", "weight": 4.50}, {"name": "Alphabet Inc. A", "weight": 2.80}, {"name": "Tesla Inc.", "weight": 2.70}, {"name": "Broadcom Inc.", "weight": 2.50}, {"name": "Costco Wholesale", "weight": 2.20}, {"name": "Netflix Inc.", "weight": 1.90}]'::jsonb
)
ON CONFLICT (ticker) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    tamano_aum = EXCLUDED.tamano_aum,
    precio_referencia = EXCLUDED.precio_referencia,
    comision = EXCLUDED.comision,
    posiciones = EXCLUDED.posiciones,
    top_10_percentage = EXCLUDED.top_10_percentage,
    dividendo = EXCLUDED.dividendo,
    retorno_10y = EXCLUDED.retorno_10y,
    retorno_5y = EXCLUDED.retorno_5y,
    retorno_1y = EXCLUDED.retorno_1y,
    tier = EXCLUDED.tier,
    top_holdings = EXCLUDED.top_holdings;
