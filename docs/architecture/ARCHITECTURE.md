# 🏛️ Arquitectura del Sistema (Stock)

Este documento detalla el flujo de datos, los límites de seguridad y la arquitectura de observabilidad implementados en el monorepo de **Stock**.

---

## 🔄 1. Flujo de Operaciones (Trading Core Flow)

El flujo operativo sigue un ciclo de vida resiliente y automatizado que conecta el frontend, el orquestador n8n, el backend de agentes y la base de datos Supabase:

```
[Usuario crea Orden UI] ──> [Supabase: operaciones (status: pending)]
                                    │
                                    ▼ (Trigger de Webhook)
                            [n8n: Stock-Main-Orchestrator]
                                    │
                                    ├──> [FastAPI /api/trades/execute-order]
                                    │      │
                                    │      ▼ (LangGraph Agents)
                                    │      1. [Market Agent] Consulta cotizaciones en vivo (Yahoo Finance)
                                    │      2. [Compliance Agent] Audita límites de concentración
                                    │      3. [Risk Agent] Evalúa stop-loss y niveles de margen
                                    │      │
                                    │      ▼ (Respuesta JSON)
                                    │
                                    ▼
                            [Supabase: transacciones / ledger contable (completed)]
                                    │
                                    ▼ (Notificación en tiempo real)
                            [Usuario ve confirmación de Trade en Dashboard]
```

---

## 🛡️ 2. Seguridad y Aislamiento (Tenant Isolation & RBAC)

La plataforma garantiza que ningún usuario pueda ver o interactuar con portafolios de terceros a través de múltiples niveles de defensa:

1. **Row Level Security (RLS)**: Habilitado en todas las tablas de Supabase. La política `auth.uid() = user_id` restringe las consultas a nivel de motor de base de datos.
2. **Middleware Next.js**: Valida los tokens de sesión de NextAuth en rutas protegidas y verifica que el rol del usuario (`viewer`, `trader`, `advisor`, `compliance`, `admin`) esté autorizado para la vista.
3. **Inyección de Header User-ID**: La pasarela n8n y el frontend agregan el header `User-ID` en cada llamada HTTP al backend FastAPI. El backend valida de forma cruzada este header contra los registros antes de autorizar cualquier cálculo.

---

## 📊 3. Arquitectura de Observabilidad y Telemetría

El stack de observabilidad recopila métricas operativas y logs estructurados para alertar sobre fallos en tiempo real:

```
┌─────────────────────────────────┐
│          Next.js App            │
│  Expone métricas: /api/metrics  │──(Scrape cada 15s)──> [ Prometheus ] ──> [ Grafana ]
│  OTel Tracing (OpenTelemetry)   │                             ▲               │
└────────────────┬────────────────┘                             │               │
                 │                                              │               │
         (Logs en Docker stdout)                                │               │
                 ▼                                              │               │
          [ Promtail ] ──(Envía logs estructurados)──> [ Loki ] ┘               │
                                                                                ▼
                                                                        [ Alertas Slack/n8n ]
```

- **Loki & Promtail**: Capturan los logs estructurados (en formato JSON) emitidos por los microservicios en Docker, permitiendo filtrar logs por `trace_id` o `operacion_id` para trazabilidad completa.
- **Prometheus**: Recopila métricas clave del frontend de Next.js (utilizando la biblioteca `prom-client`), como tiempos de respuesta del API, latencias de brokers externos y recuento de fallos.
- **Grafana**: Consolida las métricas y logs en un solo panel de mandos que grafica el estado de salud del sistema, tasas de reintentos y el estado de los Circuit Breakers.
