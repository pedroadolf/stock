from fastapi import APIRouter, HTTPException, Depends, Header, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from supabase import create_client

from src.mcp_handlers import MCPRequestHandler, get_live_price, get_ticker_category

router = APIRouter()

# --- Modelos de Petición ---

class SimulateBuyRequest(BaseModel):
    portfolio_id: str
    ticker: str
    cantidad: float
    seccion: str
    valor_actual_manual: Optional[float] = None

class CalculateRebalanceRequest(BaseModel):
    portfolio_id: str
    amount: float

class DepositFundsRequest(BaseModel):
    portfolio_id: str
    amount: float

class SectionDefinition(BaseModel):
    nombre_seccion: str
    porcentaje_objetivo: float

class CreatePortfolioRequest(BaseModel):
    nombre: str
    descripcion: str
    initial_cash: float
    secciones: List[SectionDefinition]
    moneda: Optional[str] = "USD"



# --- Dependencia para Supabase ---

def get_supabase_client():
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    if not url or not key:
        # Fallback al anon key si no se cargó el service role key en desarrollo local
        key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if not url or not key:
        raise HTTPException(status_code=500, detail="Missing Supabase credentials in environment variables")
    return create_client(url, key)


# --- Endpoints ---

@router.get("/price")
def get_price_endpoint(
    ticker: str = Query(..., description="Ticker del activo (ej: AAPL, BTC)"),
    mock: bool = Query(False, description="Forzar el uso de valores de simulación")
):
    """
    Obtiene la cotización en vivo de un ticker usando Yahoo Finance (o mock).
    """
    try:
        price = get_live_price(ticker, use_mock=mock)
        return {"ticker": ticker.upper(), "price": float(price)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio")
def create_portfolio_endpoint(
    payload: CreatePortfolioRequest,
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Crea un nuevo portafolio con sus secciones objetivo y le abona el capital inicial de simulación.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    secciones_dict = [sec.dict() for sec in payload.secciones]
    
    result = handler.create_portfolio(
        user_id=user_id,
        nombre=payload.nombre,
        descripcion=payload.descripcion,
        initial_cash=payload.initial_cash,
        secciones=secciones_dict,
        moneda=payload.moneda
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
        
    return result


@router.get("/portfolio-status")
def get_portfolio_status_endpoint(
    portfolio_id: str = Query(..., description="ID del portafolio a consultar"),
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Obtiene el estado consolidado de un portafolio: efectivo, activos y balance de secciones.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    result = handler.get_portfolio_status(portfolio_id, user_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404 if "no encontrado" in result.get("error", "").lower() else 400, detail=result.get("error"))
        
    return result


@router.post("/simulate-buy")
def simulate_buy_endpoint(
    payload: SimulateBuyRequest,
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Simula la compra de un activo validando fondos y registrando transacciones contables.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    result = handler.execute_simulate_buy(
        portfolio_id=payload.portfolio_id,
        user_id=user_id,
        ticker=payload.ticker,
        cantidad=payload.cantidad,
        seccion=payload.seccion,
        valor_actual_manual=payload.valor_actual_manual
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=result.get("status_code", 400), detail=result.get("error"))
        
    return result


@router.delete("/operation/{op_id}")
def delete_operation_endpoint(
    op_id: str,
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Elimina una operación (lote) y revierte su impacto en el saldo de efectivo.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    result = handler.delete_operation(op_id, user_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=result.get("status_code", 400), detail=result.get("error"))
        
    return result


@router.delete("/portfolio/{portfolio_id}")
def delete_portfolio_endpoint(
    portfolio_id: str,
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Elimina un portafolio y todas sus operaciones (cascada).
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    result = handler.delete_portfolio(portfolio_id, user_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=result.get("status_code", 400), detail=result.get("error"))
        
    return result


@router.post("/deposit")
def deposit_funds_endpoint(
    payload: DepositFundsRequest,
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Deposita fondos al portafolio (para rebalanceo o aportaciones adicionales).
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    result = handler.add_funds(
        portfolio_id=payload.portfolio_id,
        user_id=user_id,
        amount=payload.amount
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
        
    return result


@router.post("/calculate-rebalance")
def calculate_rebalance_endpoint(
    payload: CalculateRebalanceRequest,
    user_id: Optional[str] = Header(None, alias="User-ID", description="El ID del usuario propietario"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Calcula la distribución óptima fiscal de un monto a invertir o retirar en el portafolio.
    """
    if not user_id:
        raise HTTPException(status_code=401, detail="Header 'User-ID' es requerido para aislamiento de inquilinos")
        
    handler = MCPRequestHandler(supabase_client)
    result = handler.calculate_rebalance(
        portfolio_id=payload.portfolio_id,
        user_id=user_id,
        amount=payload.amount
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
        
    return result


@router.get("/instrument-details")
def get_instrument_details_endpoint(
    ticker: str = Query(..., description="Ticker del activo a consultar"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Obtiene la ficha técnica enriquecida de un ticker desde la base de datos de catálogo.
    """
    handler = MCPRequestHandler(supabase_client)
    result = handler.get_instrument_metadata(ticker)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result


@router.get("/ticker-category")
def get_ticker_category_endpoint(
    ticker: str = Query(..., description="Ticker del activo a consultar")
):
    """
    Obtiene la categoría sugerida de un activo.
    """
    result = get_ticker_category(ticker)
    return {"ticker": ticker, "category": result["category"], "instrumentType": result["instrumentType"]}


@router.get("/ticker-details")
def get_ticker_details_endpoint(
    ticker: str = Query(..., description="Ticker del activo a consultar"),
    supabase_client = Depends(get_supabase_client)
):
    """
    Obtiene los detalles enriquecidos del ticker desde Yahoo Finance.
    """
    handler = MCPRequestHandler(supabase_client)
    result = handler.get_ticker_details(ticker)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result
