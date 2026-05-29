# Carga automática del .env para TODOS los targets
ifneq (,$(wildcard .env))
  include .env
  export
endif

.PHONY: init dev build test clean status \
        migrate-pro patch-n8n-logs deploy-grafana-pro validate-observability

init:
	npm install && cd apps/backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt

dev:
	npm run dev

build:
	npm run build

test:
	npm test

status:
	git status && ls -R apps/ workflows/ supabase/

clean:
	npm run clean
	rm -rf apps/backend/venv
	rm -rf artifacts/

# ── Observabilidad PRO ──────────────────────────────────────────────

## 1. MIGRACIÓN MANUAL REQUERIDA (en Supabase Dashboard)
migrate-pro:
	@echo "⚠️  Nota: Aplica las migraciones de alertas de stock manualmente si el puerto de Supabase está bloqueado."
	@echo "✅ Continuando con el despliegue de n8n y Grafana..."

## 2. Parchea el workflow n8n con log nodes estructurados
patch-n8n-logs:
	@echo "🔧 Patching n8n workflow with Stock PRO logging nodes..."
	python3 scripts/n8n/patch_resilience_logging.py

## 3. Deploya el dashboard PRO en Grafana + alertas
deploy-grafana-pro:
	@echo "📊 Deploying Grafana Stock Resilience PRO Dashboard..."
	node scripts/grafana/deploy_resilience_dashboard.js

## 4. Valida que todo está live
validate-observability:
	@echo "🩺 Running post-deploy validation..."
	bash scripts/validate_pro_logging.sh

## 5. Full deploy de Observabilidad
observability-pro: migrate-pro patch-n8n-logs deploy-grafana-pro validate-observability
	@echo "🏆 Stock Observability PRO — COMPLETE"
