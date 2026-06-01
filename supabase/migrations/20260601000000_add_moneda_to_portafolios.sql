-- ==============================================================================
-- 📊 PORTFOLIFY EXTENSION - BASE CURRENCY FOR PORTFOLIOS
-- ==============================================================================

-- Agregar la columna moneda a la tabla de portafolios (por defecto 'USD')
ALTER TABLE public.portafolios ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'USD';
