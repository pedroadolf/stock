-- ==============================================================================
-- 📊 PORTFOLIFY EXTENSION - INSTRUMENT LEVEL SUB-PORTFOLIOS
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DE SUB-PORTAFOLIOS POR INSTRUMENTO
CREATE TABLE IF NOT EXISTS public.portafolio_instrumento_subportafolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portafolio_id UUID NOT NULL REFERENCES public.portafolios(id) ON DELETE CASCADE,
    ticker TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('porcentajes', 'ahorro')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_subportfolio_per_ticker UNIQUE(portafolio_id, ticker)
);

-- Habilitar timestamp auto-update para portafolio_instrumento_subportafolios
DROP TRIGGER IF EXISTS trigger_update_timestamp ON public.portafolio_instrumento_subportafolios;
CREATE TRIGGER trigger_update_timestamp 
    BEFORE UPDATE ON public.portafolio_instrumento_subportafolios 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. HABILITAR SEGURIDAD RLS
ALTER TABLE public.portafolio_instrumento_subportafolios ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS PARA PORTAFOLIO_INSTRUMENTO_SUBPORTAFOLIOS (Aislamiento por User ID)
DROP POLICY IF EXISTS "Allow select for owners" ON public.portafolio_instrumento_subportafolios;
CREATE POLICY "Allow select for owners" ON public.portafolio_instrumento_subportafolios
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumento_subportafolios.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow insert for owners" ON public.portafolio_instrumento_subportafolios;
CREATE POLICY "Allow insert for owners" ON public.portafolio_instrumento_subportafolios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumento_subportafolios.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow update for owners" ON public.portafolio_instrumento_subportafolios;
CREATE POLICY "Allow update for owners" ON public.portafolio_instrumento_subportafolios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumento_subportafolios.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow delete for owners" ON public.portafolio_instrumento_subportafolios;
CREATE POLICY "Allow delete for owners" ON public.portafolio_instrumento_subportafolios
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_instrumento_subportafolios.portafolio_id AND p.user_id = auth.uid()
        )
    );
