-- ==============================================================================
-- 📊 PORTFOLIFY EXTENSION - SECTIONS & ASSET ALLOCATION
-- ==============================================================================

-- 1. CREACIÓN DE LA TABLA DE SECCIONES / OBJETIVOS
CREATE TABLE IF NOT EXISTS public.portafolio_secciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portafolio_id UUID NOT NULL REFERENCES public.portafolios(id) ON DELETE CASCADE,
    nombre_seccion TEXT NOT NULL,
    porcentaje_objetivo DECIMAL(5,2) NOT NULL CHECK (porcentaje_objetivo >= 0 AND porcentaje_objetivo <= 100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_seccion_per_portfolio UNIQUE(portafolio_id, nombre_seccion)
);

-- Habilitar timestamp auto-update para portafolio_secciones
DROP TRIGGER IF EXISTS trigger_update_timestamp ON public.portafolio_secciones;
CREATE TRIGGER trigger_update_timestamp 
    BEFORE UPDATE ON public.portafolio_secciones 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ALTERACIÓN DE LA TABLA DE OPERACIONES PARA CATEGORIZACIÓN Y ACTIVOS MANUALES
ALTER TABLE public.operaciones ADD COLUMN IF NOT EXISTS seccion TEXT;
ALTER TABLE public.operaciones ADD COLUMN IF NOT EXISTS valor_actual_manual DECIMAL(14,4);

-- 3. HABILITAR SEGURIDAD RLS EN NUEVAS TABLAS Y COLUMNAS
ALTER TABLE public.portafolio_secciones ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS PARA PORTAFOLIO_SECCIONES (Aislamiento por User ID)
DROP POLICY IF EXISTS "Allow select for owners" ON public.portafolio_secciones;
CREATE POLICY "Allow select for owners" ON public.portafolio_secciones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_secciones.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow insert for owners" ON public.portafolio_secciones;
CREATE POLICY "Allow insert for owners" ON public.portafolio_secciones
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_secciones.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow update for owners" ON public.portafolio_secciones;
CREATE POLICY "Allow update for owners" ON public.portafolio_secciones
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_secciones.portafolio_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Allow delete for owners" ON public.portafolio_secciones;
CREATE POLICY "Allow delete for owners" ON public.portafolio_secciones
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.portafolios p
            WHERE p.id = portafolio_secciones.portafolio_id AND p.user_id = auth.uid()
        )
    );
