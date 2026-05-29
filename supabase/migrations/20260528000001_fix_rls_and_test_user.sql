-- ==============================================================================
-- 👤 TEST USER & RLS POLICIES FOR DEVELOPMENT
-- ==============================================================================

-- 1. CREACIÓN DEL USUARIO DE PRUEBAS EN EL SCHEMA DE AUTH
-- Esto evita violaciones de llave foránea al asociar portafolios sin haber iniciado sesión
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'test@stock.pash', 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    false, 
    'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Crear el perfil asociado en public.profiles
INSERT INTO public.profiles (id, email, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@stock.pash', 'admin')
ON CONFLICT (id) DO NOTHING;


-- 2. HABILITAR POLÍTICAS PERMISIVAS DE LECTURA/ESCRITURA PARA DESARROLLO LOCAL
-- Nota: En producción, estas políticas se restringen usando auth.uid()

-- Políticas para Portafolios
DROP POLICY IF EXISTS "Allow select for owners" ON public.portafolios;
DROP POLICY IF EXISTS "Permitir select para portafolios" ON public.portafolios;
CREATE POLICY "Permitir select para portafolios" ON public.portafolios
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for owners" ON public.portafolios;
DROP POLICY IF EXISTS "Permitir insert para portafolios" ON public.portafolios;
CREATE POLICY "Permitir insert para portafolios" ON public.portafolios
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for owners" ON public.portafolios;
DROP POLICY IF EXISTS "Permitir update para portafolios" ON public.portafolios;
CREATE POLICY "Permitir update para portafolios" ON public.portafolios
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for owners" ON public.portafolios;
DROP POLICY IF EXISTS "Permitir delete para portafolios" ON public.portafolios;
CREATE POLICY "Permitir delete para portafolios" ON public.portafolios
    FOR DELETE USING (true);


-- Políticas para Operaciones
DROP POLICY IF EXISTS "Allow select for owners" ON public.operaciones;
DROP POLICY IF EXISTS "Permitir select para operaciones" ON public.operaciones;
CREATE POLICY "Permitir select para operaciones" ON public.operaciones
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for owners" ON public.operaciones;
DROP POLICY IF EXISTS "Permitir insert para operaciones" ON public.operaciones;
CREATE POLICY "Permitir insert para operaciones" ON public.operaciones
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for owners" ON public.operaciones;
DROP POLICY IF EXISTS "Permitir update para operaciones" ON public.operaciones;
CREATE POLICY "Permitir update para operaciones" ON public.operaciones
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for owners" ON public.operaciones;
DROP POLICY IF EXISTS "Permitir delete para operaciones" ON public.operaciones;
CREATE POLICY "Permitir delete para operaciones" ON public.operaciones
    FOR DELETE USING (true);


-- Políticas para Transacciones
DROP POLICY IF EXISTS "Allow select for owners" ON public.transacciones;
DROP POLICY IF EXISTS "Permitir select para transacciones" ON public.transacciones;
CREATE POLICY "Permitir select para transacciones" ON public.transacciones
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for owners" ON public.transacciones;
DROP POLICY IF EXISTS "Permitir insert para transacciones" ON public.transacciones;
CREATE POLICY "Permitir insert para transacciones" ON public.transacciones
    FOR INSERT WITH CHECK (true);


-- Políticas para Workflow Logs
DROP POLICY IF EXISTS "Allow select for owners" ON public.workflow_logs;
DROP POLICY IF EXISTS "Permitir select para workflow_logs" ON public.workflow_logs;
CREATE POLICY "Permitir select para workflow_logs" ON public.workflow_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for owners" ON public.workflow_logs;
DROP POLICY IF EXISTS "Permitir insert para workflow_logs" ON public.workflow_logs;
CREATE POLICY "Permitir insert para workflow_logs" ON public.workflow_logs
    FOR INSERT WITH CHECK (true);
