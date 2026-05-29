# Guía de Despliegue en Producción: Portfolify Pro (Dokploy)

Esta guía documenta los pasos necesarios para desplegar la aplicación de **Portfolify Pro** (Next.js y FastAPI) en tu servidor VPS administrado con **Dokploy**.

---

## 📦 1. Despliegue de la API (Backend - FastAPI)

En Dokploy, crea una nueva aplicación y configúrala para apuntar a la carpeta `/apps/backend` de tu repositorio.

### Variables de Entorno (Environment Variables)
Configura las siguientes variables en la pestaña **Environment** de Dokploy para el Backend:

| Variable | Descripción | Valor Recomendado |
|---|---|---|
| `STOCK_ENV` | Entorno de ejecución | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu instancia de Supabase | `https://supabase.pash.uno` |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave Service Role de Supabase (Bypass RLS) | *Tu SERVICE_ROLE_KEY de Dokploy Supabase* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima de Supabase | *Tu ANON_KEY de Dokploy Supabase* |
| `PORT` | Puerto de escucha | `8000` |

### Configuración del Puerto en Dokploy
* Puerto expuesto: `8000`
* Configura un dominio en Dokploy (ej. `api-stock.pash.uno`) redirigido a este servicio en el puerto `8000`.

---

## 💻 2. Despliegue del Frontend (Next.js - Web)

Crea una nueva aplicación en Dokploy apuntando a la carpeta `/apps/web` de tu repositorio.

### Variables de Compilación (Build Arguments)
Dado que Next.js compila y embebe las variables con prefijo `NEXT_PUBLIC_` directamente en el bundle JavaScript del cliente durante el build, **debes configurar estas variables como "Build Arguments" en Dokploy** (o agregarlas en la sección de variables de entorno antes de compilar):

| Variable | Descripción | Valor Recomendado |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu instancia de Supabase | `https://supabase.pash.uno` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave anónima de Supabase | *Tu ANON_KEY de Dokploy Supabase* |
| `NEXT_PUBLIC_BACKEND_URL` | URL pública de tu API Backend | `https://api-stock.pash.uno` |

### Configuración del Puerto en Dokploy
* Puerto expuesto: `3000`
* Configura tu dominio principal (ej. `stock.pash.uno`) redirigido a este servicio en el puerto `3000`.

---

## 🛢️ 3. Activación de la Base de Datos (Supabase)

Si aún no lo has hecho, ejecuta la migración SQL para crear la tabla de metadatos de ETFs e insertar los datos iniciales de la Tier List:
1. Ve al panel de tu Supabase en Dokploy (`https://supabase.pash.uno`).
2. Entra al **SQL Editor**.
3. Copia y ejecuta el contenido del archivo [20260529000000_add_instrument_metadata.sql](file:///Users/pash/Documents/350_APP_PASH/Stock/supabase/migrations/20260529000000_add_instrument_metadata.sql).

---

## 🩺 4. Verificación Post-Despliegue

Una vez que Dokploy haya completado las compilaciones y subido los contenedores:
1. Entra a tu dominio principal `https://stock.pash.uno`.
2. Ve a la pestaña **Ficha de Instrumentos**, busca `VOO` o `NAFTRAC` y verifica que cargue la información en cajas y la composición de cartera correctamente.
3. Intenta realizar una compra de prueba en la pestaña **Mis Posiciones** y valida que se inserte en tiempo real.
