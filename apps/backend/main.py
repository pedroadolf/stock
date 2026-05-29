#!/usr/bin/env python3
"""
🚀 ORQUESTADOR DE PORTAFOLIOS & TRADING (STOCK)
Ejecuta la secuencia de análisis y rebalanceo multi-agente.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END

# Cambiar contexto al root del monorepo
os.chdir(Path(__file__).parent.parent)

class StockAgentState(TypedDict):
    """Estado compartido entre nodos del agente de Inversiones"""
    portfolio_id: str
    ticker: str
    target_weight: float
    current_weight: float
    market_signals: Dict[str, Any]
    compliance_report: Dict[str, Any]
    risk_evaluation: Dict[str, Any]
    artifacts: List[str]

# Nodos del grafo
def market_analysis_node(state: StockAgentState) -> StockAgentState:
    """Nodo 1: Analizar cotizaciones e indicadores de Yahoo Finance"""
    print(f"📊 [Market Agent] Analizando cotización e indicadores para {state['ticker']}...")
    # Placeholder: En producción usaría yfinance para obtener métricas reales
    signals = {
        "ticker": state["ticker"],
        "rsi": 28.5, # Simulación de sobreventa
        "volatility": "MEDIUM",
        "sentiment_score": 0.45
    }
    return {"market_signals": signals}

def compliance_node(state: StockAgentState) -> StockAgentState:
    """Nodo 2: Validar límites de concentración y RLS (Gobernanza)"""
    print(f"🛡️ [Compliance Agent] Auditando límites y reglas de trading para {state['ticker']}...")
    signals = state.get("market_signals", {})
    
    # Simulación de auditoría de gobernanza
    report = {
      "is_compliant": True,
      "score": 100,
      "violations": [],
      "requires_human_approval": False
    }
    return {"compliance_report": report}

def risk_node(state: StockAgentState) -> StockAgentState:
    """Nodo 3: Evaluar Stop-Loss, Margin Call y volatilidad"""
    print(f"🚨 [Risk Agent] Evaluando riesgos del portafolio...")
    report = {
        "status": "HEALTHY",
        "alerts": []
    }
    return {"risk_evaluation": report}

def execution_node(state: StockAgentState) -> StockAgentState:
    """Nodo 4: Ejecutar orden de compra/venta o rebalanceo"""
    print(f"🚀 [Execution Agent] Ejecutando orden para {state['ticker']}...")
    artifacts = state.get("artifacts", []) + [f"trade_execution_{state['ticker']}.json"]
    return {"artifacts": artifacts}

def build_workflow():
    workflow = StateGraph(StockAgentState)
    
    workflow.add_node("market_analysis", market_analysis_node)
    workflow.add_node("compliance", compliance_node)
    workflow.add_node("risk", risk_node)
    workflow.add_node("execution", execution_node)
    
    workflow.set_entry_point("market_analysis")
    workflow.add_edge("market_analysis", "compliance")
    workflow.add_edge("compliance", "risk")
    workflow.add_edge("risk", "execution")
    workflow.add_edge("execution", END)
    
    return workflow.compile()

def main():
    print("🚀 Iniciando Orquestador de Trading Stock...")
    app = build_workflow()
    initial_state = {
        "portfolio_id": "test-portfolio-uuid",
        "ticker": "AAPL",
        "target_weight": 15.0,
        "current_weight": 5.0,
        "market_signals": {},
        "compliance_report": {},
        "risk_evaluation": {},
        "artifacts": []
    }
    final_state = app.invoke(initial_state)
    print("\n✅ ORQUESTACIÓN FINALIZADA:")
    print(f"Señales de Mercado: {final_state.get('market_signals')}")
    print(f"Compliance: {final_state.get('compliance_report')}")
    print(f"Artifacts generados: {final_state.get('artifacts')}")

if __name__ == "__main__":
    main()
