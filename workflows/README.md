# 🔄 Workflows de Automatización (n8n)

Esta carpeta contiene los workflows en formato JSON que automatizan las operaciones de la plataforma **Stock**.

## Estructura de Directorios

- `portafolios/`: Contiene flujos para la creación de portafolios, compras, ventas y rebalanceo automático.
- `alertas/`: Monitoreo en tiempo real de precios de mercado (vía Yahoo Finance) y alertas de Stop-Loss / Margin Calls hacia Slack y Telegram.
- `reportes/`: Generación programada de estados de cuenta consolidados y reportes fiscales (vía email/SendGrid).

## Flujos Core a Implementar

1. **Stock-Main-Orchestrator**: Orquestador principal que recibe señales de compra/venta y coordina con FastAPI y Supabase.
2. **Stock-Price-Monitor**: Job cron (Schedule Trigger) que analiza precios y dispara alertas si se superan los umbrales de riesgo.
3. **Stock-Error-Handler-Proactive**: Manejador de excepciones global que capta errores en cualquier nodo, abre el circuit breaker en Supabase y notifica a Slack.

## Reglas Obligatorias de Construcción (según AGENTS.md)

1. **Validación en 4 Niveles**: Antes de subir un workflow a producción, debe validarse localmente mediante el validador n8n.
2. **Configuración Explícita**: Nunca dejes parámetros por defecto en los nodos (especialmente headers de autenticación, URLs, y métodos).
3. **Idempotencia**: Todas las escrituras de transacciones y ejecuciones de órdenes de compra deben validar mediante `operacion_id` si ya fueron procesadas para evitar ejecuciones duplicadas en el mercado.
4. **Manejo de Errores**: Todo nodo crítico (ej. HTTP Request a la API del broker) debe tener una conexión directa al manejador de errores global o habilitado el reintento autónomo.
