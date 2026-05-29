# 💹 Stock — Monorepo de Trading e Inversiones

Sistema empresarial y resiliente de gestión de portafolios, rebalanceo autónomo y alertas de riesgo financieras, impulsado por Agentes de IA en LangGraph y automatización de n8n.

Este proyecto replica la arquitectura avanzada, observabilidad y resiliencia de la plataforma **Gastos-Medicos (GMM)**, adaptada al dominio financiero.

---

## 🏛️ Estructura del Proyecto

```
stock/
├── apps/
│   ├── web/              # Next.js 16 (App Router) — Dashboard de Inversiones
│   └── backend/          # Python (FastAPI + LangGraph) — Agentes de Trading IA
├── workflows/            # Workflows de n8n versionados (JSON)
│   ├── portafolios/      # Compra, venta y rebalanceo
│   ├── alertas/          # Stop-loss, margin call, volatilidad
│   └── reportes/         # Estados de cuenta y PDFs
├── supabase/
│   ├── migrations/       # Migraciones SQL de base de datos
│   └── config.toml       # Configuración local de Supabase
├── scripts/              # Utilidades de automatización
├── docker-compose.observability.yml
├── prometheus.yml        # Configuración de métricas Prometheus
├── promtail-config.yml   # Configuración de logs Promtail
├── Makefile              # Comandos rápidos de operación
├── AGENTS.md             # Reglas para desarrollo de workflows n8n
├── .antigravity/rules.md # Reglas del IDE Antigravity
└── .gitignore
```

---

## ⚡ Tech Stack Core

| Capa | Tecnología | Propósito |
|---|---|---|
| **Frontend** | Next.js 16 + TypeScript + Tailwind 4 | Dashboard reactivo de alto rendimiento |
| **Backend IA** | Python 3 + FastAPI + LangGraph | Agentes autónomos (Market, Portfolio, Risk) |
| **Base de Datos** | Supabase (PostgreSQL) | Almacenamiento seguro, RLS y triggers de resiliencia |
| **API Financiera**| Yahoo Finance (yfinance) | Obtención de cotizaciones y datos de mercado en tiempo real |
| **Workflows** | n8n self-hosted | Automatización de flujos de ejecución de órdenes y notificaciones |
| **Observabilidad** | Prometheus + Grafana + Loki | Telemetría, tracing (OpenTelemetry) y logs consolidados |

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 22.x
- Python 3.10+
- Docker y Docker Compose (para el stack de observabilidad)

### 1. Inicialización

Clona el proyecto y ejecuta el instalador del monorepo (instala módulos de node en la raíz/web, crea el entorno virtual de Python en el backend y descarga dependencias):

```bash
make init
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo y rellena con tus credenciales:

```bash
cp .env.example .env
```

### 3. Ejecución en Desarrollo

Ejecuta el servidor de desarrollo de Next.js y el backend de FastAPI de manera simultánea en el monorepo mediante Turborepo:

```bash
make dev
```

El frontend estará disponible en `http://localhost:3000` y el backend en `http://localhost:8000`.

### 4. Compilación de Producción

Para validar tipos y compilar el proyecto standalone para producción:

```bash
make build
```

---

## 🛡️ Resiliencia y Gobernanza Financiera

El proyecto implementa varios mecanismos de seguridad y prevención idénticos a los del sistema GMM:

1. **Aislamiento de Clientes (Tenant Isolation)**: RLS estricto en Supabase e inyección de headers `User-ID` en el API backend para evitar fugas de información.
2. **Circuit Breaker**: Monitoreo de tasa de fallos de APIs externas (Yahoo Finance, Broker). Si hay interrupción, el circuito se abre y bloquea órdenes preventivamente para evitar pérdidas de fondos.
3. **Smart Retry**: Lógica de reintento en Supabase con backoff exponencial y jitter aleatorio para re-ejecutar órdenes fallidas por latencia.
4. **Idempotencia de Operaciones**: Comprobación estricta de folios de operación para evitar que una reconexión de red de n8n o de la API ejecute una orden duplicada en el mercado.
