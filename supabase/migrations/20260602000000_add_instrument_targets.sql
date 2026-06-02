-- ==============================================================================
-- 📊 PORTFOLIFY EXTENSION - INSTRUMENT LEVEL TARGET ALLOCATIONS
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DE OBJETIVOS POR INSTRUMENTO (DENTRO DE SU CLASE)
CREATE TABLE IF NOT EXISTS public.portafolio_instrumentos_objetivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portafolio_id UUID NOT NULL REFERENCES public.portafolios(id) ON DELETE CASCADE,
    seccion TEXT NOT NULL,
    ticker TEXT NOT NULL,
    porcentaje_objetivo DECIMAL(5,2) NOT NULL CHECK (porcentaje_objetivo >= 0 AND porcentaje_objetivo <= 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_ticker_per_portfolio UNIQUE(portafolio_id, ticker)
);

-- Habilitar timestamp auto-update para portafolio_instrumentos_objetivo
DROP TRIGGER IF EXISTS trigger_update_timestamp ON public.portafolio_instrumentos_objetivo;
CREATE TRIGGER trigger_update_timestamp 
    BEFORE UPDATE ON public.portafolio_instrumentos_objetivo 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. HABILITAR SEGURIDAD RLS
ALTER TABLE public.portafolio_instrumentos_objetivo ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA PORTAFOLIO_INSTRUMENTOS_OBJETIVO (Aislamiento por User ID)
DROP POLICY IF EXISTS "Allow select for owners" ON public.portafolio_instrumentos_objetivo;
CREATE POLICY "Allow select for owners" ON public.portafolio_instrumentos_objetivo
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumentos_objetivo.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow insert for owners" ON public.portafolio_instrumentos_objetivo;
CREATE POLICY "Allow insert for owners" ON public.portafolio_instrumentos_objetivo
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumentos_objetivo.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow update for owners" ON public.portafolio_instrumentos_objetivo;
CREATE POLICY "Allow update for owners" ON public.portafolio_instrumentos_objetivo
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumentos_objetivo.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow delete for owners" ON public.portafolio_instrumentos_objetivo;
CREATE POLICY "Allow delete for owners" ON public.portafolio_instrumentos_objetivo
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumentos_objetivo.portafolio_id AND p.user_id = auth.uid()
        )
    );
