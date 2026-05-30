import os
import json
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timezone
import yfinance as yf

# Mock pricing for common tickers to speed up local testing or act as fallback
MOCK_PRICES = {
    "AAPL": Decimal("175.20"),
    "NVDA": Decimal("920.00"),
    "BTC": Decimal("67500.00"),
    "MSFT": Decimal("420.50"),
    "GOOGL": Decimal("172.10"),
    "CETES28": Decimal("10.00"),
}

def datetime_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_live_price(ticker: str, use_mock: bool = False) -> Decimal:
    """
    Obtiene la cotización en vivo de un ticker usando Yahoo Finance, o un valor de simulación (mock).
    """
    if use_mock:
        return MOCK_PRICES.get(ticker.upper(), Decimal("150.00"))
        
    try:
        ticker_data = yf.Ticker(ticker)
        todays_data = ticker_data.history(period='1d')
        if not todays_data.empty:
            return Decimal(str(todays_data['Close'].iloc[-1]))
        else:
            info = ticker_data.info
            price = info.get('regularMarketPrice', info.get('previousClose'))
            if price is not None:
                return Decimal(str(price))
    except Exception as e:
        print(f"⚠️ Error consultando yfinance para {ticker}: {str(e)}. Usando Mock/Fallback.")
        
    return MOCK_PRICES.get(ticker.upper(), Decimal("150.00"))


def get_ticker_category(ticker: str) -> dict:
    """
    Obtiene la categoría y el tipo de instrumento sugerido para un ticker usando Yahoo Finance.
    """
    try:
        info = yf.Ticker(ticker).info
        quote_type = info.get('quoteType', '')
        
        # Tipo de instrumento
        if quote_type == 'CRYPTOCURRENCY':
            instrument_type = 'Crypto'
        elif quote_type == 'ETF':
            instrument_type = 'ETFs'
        else:
            instrument_type = 'Stocks'
            
        # Categoría
        if quote_type == 'CRYPTOCURRENCY':
            category = 'Crypto'
        elif quote_type == 'ETF':
            category = info.get('category', 'ETFs')
        else:
            sector = info.get('sector', '')
            category = sector if sector else 'General'
            
        return {"category": category, "instrumentType": instrument_type}
    except:
        return {"category": "General", "instrumentType": "Stocks"}


class MCPRequestHandler:
    """
    Orquestador de negocio para la gestión de Portafolios, Operaciones y Rebalanceo inteligente.
    """
    
    def __init__(self, supabase_client: Any):
        self.supabase = supabase_client
        
    def _log_workflow_step(self, operacion_id: str, step: str, status: str, message: str, metadata: dict = None):
        try:
            log_data = {
                "operacion_id": operacion_id,
                "step": step,
                "status": status,
                "message": message,
                "metadata": metadata or {}
            }
            self.supabase.table('workflow_logs').insert(log_data).execute()
        except Exception as ex:
            print(f"Error escribiendo workflow_logs: {str(ex)}")

    def create_portfolio(self, user_id: str, nombre: str, descripcion: str, initial_cash: float, secciones: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Crea un nuevo portafolio, inicializa sus secciones y genera una transacción de fondeo inicial.
        """
        try:
            # 1. Crear portafolio
            num_ref = f"PF-{datetime.now().strftime('%Y%m%d')}-{os.urandom(3).hex().upper()}"
            port_data = {
                "user_id": user_id,
                "nombre_portafolio": nombre,
                "descripcion": descripcion,
                "numero_portafolio": num_ref,
                "status": "activo"
            }
            port_res = self.supabase.table('portafolios').insert(port_data).execute()
            if not port_res.data:
                return {"success": False, "error": "No se pudo crear el portafolio"}
            
            portfolio = port_res.data[0]
            portfolio_id = portfolio['id']
            
            # 2. Insertar secciones objetivo
            secciones_insert = []
            for sec in secciones:
                secciones_insert.append({
                    "portafolio_id": portfolio_id,
                    "nombre_seccion": sec['nombre_seccion'],
                    "porcentaje_objetivo": float(sec['porcentaje_objetivo'])
                })
            
            if secciones_insert:
                self.supabase.table('portafolio_secciones').insert(secciones_insert).execute()
                
            # 3. Crear operación y transacción de Fondeo Inicial (Abono de Efectivo)
            op_data = {
                "portafolio_id": portfolio_id,
                "user_id": user_id,
                "tipo": "dividendo",  # Usamos dividendo/abono como tipo contable de ingreso de efectivo inicial
                "status": "completed",
                "ticker": "CASH",
                "cantidad": 1.0,
                "precio_ejecucion": float(initial_cash),
                "comision": 0.0,
                "seccion": "Efectivo",
                "folio": f"DEP-{portfolio_id[:8].upper()}"
            }
            op_res = self.supabase.table('operaciones').insert(op_data).execute()
            if op_res.data:
                op_id = op_res.data[0]['id']
                trans_data = {
                    "operacion_id": op_id,
                    "tipo_movimiento": "abono",
                    "monto_total": float(initial_cash),
                    "moneda": "USD",
                    "metadata": {"nota": "Depósito de fondeo inicial"}
                }
                self.supabase.table('transacciones').insert(trans_data).execute()
                
            return {
                "success": True,
                "portfolio_id": portfolio_id,
                "numero_portafolio": num_ref,
                "message": f"Portafolio creado exitosamente con fondeo de ${initial_cash:.2f} USD."
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def execute_simulate_buy(self, portfolio_id: str, user_id: str, ticker: str, cantidad: float, seccion: str, valor_actual_manual: Optional[float] = None) -> Dict[str, Any]:
        """
        Ejecuta la compra simulada de un activo validando fondos disponibles del portafolio.
        """
        try:
            # 1. Validar propiedad del portafolio
            port_res = self.supabase.table('portafolios').select('*').eq('id', portfolio_id).execute()
            if not port_res.data:
                return {"success": False, "error": "Portafolio no encontrado", "status_code": 404}
            portfolio = port_res.data[0]
            if str(portfolio['user_id']) != str(user_id):
                return {"success": False, "error": "Acceso no autorizado", "status_code": 403}
                
            # 2. Calcular saldo actual de efectivo
            status_data = self.get_portfolio_status(portfolio_id, user_id)
            if not status_data.get("success"):
                error_msg = status_data.get("error", "Error desconocido")
                return {"success": False, "error": f"No se pudo obtener el saldo del portafolio: {error_msg}", "status_code": 500}
                
            cash_balance = Decimal(str(status_data["cash_balance"]))
            
            # 3. Obtener cotización actual
            is_manual = valor_actual_manual is not None
            if is_manual:
                price = Decimal(str(valor_actual_manual))
            else:
                price = get_live_price(ticker)
                
            monto_compra = Decimal(str(cantidad)) * price
            comision = monto_compra * Decimal("0.0015")  # 0.15% comisión
            total_cargo = monto_compra + comision
            
            # 4. Validar saldo suficiente
            if cash_balance < total_cargo:
                return {
                    "success": False, 
                    "error": f"Fondos insuficientes. Requerido: ${total_cargo:.2f} USD, Disponible: ${cash_balance:.2f} USD",
                    "status_code": 400
                }
                
            # 5. Insertar operación en estado pending
            op_data = {
                "portafolio_id": portfolio_id,
                "user_id": user_id,
                "tipo": "compra",
                "status": "pending",
                "ticker": ticker.upper(),
                "cantidad": float(cantidad),
                "precio_ejecucion": float(price),
                "comision": float(comision),
                "seccion": seccion,
                "valor_actual_manual": float(valor_actual_manual) if is_manual else None,
                "broker": "Yahoo Finance" if not is_manual else "Manual"
            }
            op_res = self.supabase.table('operaciones').insert(op_data).execute()
            if not op_res.data:
                return {"success": False, "error": "No se pudo registrar la operación", "status_code": 500}
                
            op_id = op_res.data[0]['id']
            self._log_workflow_step(op_id, "VALIDATE_PRICE", "completed", f"Cotización obtenida: ${price:.2f} USD. Total cargo proyectado: ${total_cargo:.2f} USD.")
            
            # 6. Registrar la transacción contable (cargo al efectivo)
            trans_data = {
                "operacion_id": op_id,
                "tipo_movimiento": "cargo",
                "monto_total": float(total_cargo),
                "moneda": "USD",
                "metadata": {
                    "ticker": ticker.upper(),
                    "cantidad": float(cantidad),
                    "precio_unitario": float(price),
                    "comision": float(comision)
                }
            }
            self.supabase.table('transacciones').insert(trans_data).execute()
            self._log_workflow_step(op_id, "EXECUTE_TRADE", "completed", f"Orden de COMPRA procesada exitosamente. Cargo realizado.")
            
            # 7. Actualizar operación a completada
            update_data = {
                "status": "completed",
                "folio": f"FOL-{op_id[:8].upper()}",
                "last_retry_at": datetime_now_iso()
            }
            self.supabase.table('operaciones').update(update_data).eq('id', op_id).execute()
            self._log_workflow_step(op_id, "ORCHESTRATOR_FINISHED", "completed", f"Operación de compra finalizada con éxito.")
            
            return {
                "success": True,
                "operacion_id": op_id,
                "ticker": ticker.upper(),
                "precio_ejecucion": float(price),
                "monto_total": float(monto_compra),
                "comision": float(comision),
                "total_cargo": float(total_cargo),
                "status_code": 200
            }
            
        except Exception as e:
            return {"success": False, "error": str(e), "status_code": 500}

    def delete_operation(self, op_id: str, user_id: str) -> Dict[str, Any]:
        """
        Elimina una operación específica y por cascada sus transacciones (reembolsando efectivo).
        Verifica que el portafolio pertenezca al usuario.
        """
        try:
            # Check ownership and get operation info
            op_check = self.supabase.table('operaciones').select('id, portafolio_id').eq('id', op_id).execute()
            if not op_check.data:
                return {"success": False, "error": "Operación no encontrada", "status_code": 404}
                
            port_id = op_check.data[0]['portafolio_id']
            port_check = self.supabase.table('portafolios').select('user_id').eq('id', port_id).execute()
            if not port_check.data or port_check.data[0]['user_id'] != user_id:
                return {"success": False, "error": "No autorizado", "status_code": 403}
                
            # Perform delete (cascade handles transacciones automatically)
            self.supabase.table('operaciones').delete().eq('id', op_id).execute()
            
            return {"success": True, "message": "Operación eliminada y efectivo reembolsado correctamente."}
        except Exception as e:
            return {"success": False, "error": str(e), "status_code": 500}

    def get_portfolio_status(self, portfolio_id: str, user_id: str) -> Dict[str, Any]:
        """
        Calcula el estado del portafolio: balance de efectivo, holdings activos,
        y distribución real vs objetivo de secciones.
        """
        try:
            # 1. Obtener portafolio y secciones objetivo
            port_res = self.supabase.table('portafolios').select('*, portafolio_secciones(*)').eq('id', portfolio_id).execute()
            if not port_res.data:
                return {"success": False, "error": "Portafolio no encontrado"}
            portfolio = port_res.data[0]
            if str(portfolio['user_id']) != str(user_id):
                return {"success": False, "error": "Acceso no autorizado"}
                
            secciones_target = portfolio.get('portafolio_secciones', [])
            target_map = {sec['nombre_seccion']: float(sec['porcentaje_objetivo']) for sec in secciones_target}
            
            # Obtener mapeo de nombres desde el catálogo de instrumentos
            meta_res = self.supabase.table('instrumentos_metadata').select('ticker, nombre').execute()
            names_map = {item['ticker']: item['nombre'] for item in meta_res.data} if meta_res.data else {}
            
            # 2. Obtener todas las operaciones completadas
            op_res = self.supabase.table('operaciones').select('*, transacciones(*)').eq('portafolio_id', portfolio_id).eq('status', 'completed').execute()
            operaciones = op_res.data
            
            # 3. Calcular Efectivo (Cash Balance)
            # Cash balance = Sum(abonos) - Sum(cargos)
            cash_balance = Decimal("0.00")
            for op in operaciones:
                for trans in op.get('transacciones', []):
                    monto = Decimal(str(trans['monto_total']))
                    if trans['tipo_movimiento'] == 'abono':
                        cash_balance += monto
                    elif trans['tipo_movimiento'] == 'cargo':
                        cash_balance -= monto
                        
            # 4. Calcular posiciones agrupadas de activos
            # Holdings structure: { ticker: { "cantidad": Decimal, "seccion": str, "costo_total": Decimal, "valor_actual_manual": Optional } }
            holdings = {}
            for op in operaciones:
                ticker = op['ticker']
                if ticker == 'CASH':
                    continue
                tipo = op['tipo']
                cantidad = Decimal(str(op['cantidad']))
                precio = Decimal(str(op['precio_ejecucion']))
                comision = Decimal(str(op['comision']))
                seccion = op['seccion'] or "Sin Categoría"
                val_manual = op['valor_actual_manual']
                
                if ticker not in holdings:
                    holdings[ticker] = {
                        "ticker": ticker,
                        "cantidad": Decimal("0.00"),
                        "costo_total": Decimal("0.00"),
                        "seccion": seccion,
                        "valor_actual_manual": None
                    }
                    
                if tipo == 'compra':
                    holdings[ticker]["cantidad"] += cantidad
                    holdings[ticker]["costo_total"] += (cantidad * precio) + comision
                elif tipo == 'venta':
                    holdings[ticker]["cantidad"] -= cantidad
                    # Reducción proporcional del costo promedio
                    holdings[ticker]["costo_total"] -= cantidad * precio
                    
                # El valor manual más reciente pisa los anteriores
                if val_manual is not None:
                    holdings[ticker]["valor_actual_manual"] = Decimal(str(val_manual))
                    
            # Filtrar holdings con cantidad cero
            active_holdings = []
            assets_total_value = Decimal("0.00")
            
            for ticker, hold in holdings.items():
                if hold["cantidad"] > Decimal("0.0001"):
                    # Valuar posición
                    is_manual = hold["valor_actual_manual"] is not None
                    if is_manual:
                        current_price = hold["valor_actual_manual"]
                        current_value = hold["cantidad"] * current_price
                    else:
                        current_price = get_live_price(ticker)
                        current_value = hold["cantidad"] * current_price
                        
                    assets_total_value += current_value
                    costo_promedio = hold["costo_total"] / hold["cantidad"]
                    pnl = current_value - hold["costo_total"]
                    pnl_percent = (pnl / hold["costo_total"] * 100) if hold["costo_total"] > 0 else 0
                    
                    nombre = names_map.get(ticker, f"Activo {ticker}")
                    
                    active_holdings.append({
                        "ticker": ticker,
                        "nombre": nombre,
                        "seccion": hold["seccion"],
                        "cantidad": float(hold["cantidad"]),
                        "costo_promedio": float(costo_promedio),
                        "costo_total": float(hold["costo_total"]),
                        "precio_actual": float(current_price),
                        "valor_actual": float(current_value),
                        "pnl": float(pnl),
                        "pnl_percent": float(pnl_percent),
                        "is_manual": is_manual
                    })
                    
            # 5. Calcular valor total de portafolio y porcentajes reales de secciones
            total_portfolio_value = assets_total_value + cash_balance
            
            # Calcular lotes individuales de compra (replicando Excel)
            lots = []
            for op in operaciones:
                if op['ticker'] == 'CASH':
                    continue
                if op['tipo'] != 'compra':
                    continue
                
                tk = op['ticker']
                cant = Decimal(str(op['cantidad']))
                pr_compra = Decimal(str(op['precio_ejecucion']))
                comis = Decimal(str(op['comision']))
                c_total = (cant * pr_compra) + comis
                
                # Valuar en vivo
                is_m = op['valor_actual_manual'] is not None
                if is_m:
                    pr_actual = Decimal(str(op['valor_actual_manual']))
                else:
                    pr_actual = get_live_price(tk)
                    
                v_actual = cant * pr_actual
                pnl_abs = v_actual - c_total
                pnl_pct = (pnl_abs / c_total * 100) if c_total > 0 else Decimal("0.00")
                peso = (v_actual / total_portfolio_value * 100) if total_portfolio_value > 0 else Decimal("0.00")
                
                lots.append({
                    "id": op['id'],
                    "fecha_adquisicion": op['created_at'],
                    "ticker": tk,
                    "nombre": names_map.get(tk, f"Activo {tk}"),
                    "seccion": op['seccion'] or "Sin Categoría",
                    "cantidad": float(cant),
                    "precio_compra": float(pr_compra),
                    "precio_actual": float(pr_actual),
                    "costo_total": float(c_total),
                    "valor_actual": float(v_actual),
                    "pnl": float(pnl_abs),
                    "pnl_percent": float(pnl_pct),
                    "peso_portafolio": float(peso),
                    "is_manual": is_m
                })
            
            # Ordenar lotes por fecha de adquisición descendente
            lots.sort(key=lambda x: x["fecha_adquisicion"], reverse=True)
            
            # Agrupar valores reales por sección
            section_values = {}
            for hold in active_holdings:
                sec = hold["seccion"]
                section_values[sec] = section_values.get(sec, Decimal("0.00")) + Decimal(str(hold["valor_actual"]))
                
            secciones_analisis = []
            for sec_name, target_pct in target_map.items():
                val_real = section_values.get(sec_name, Decimal("0.00"))
                pct_real = float((val_real / total_portfolio_value * 100) if total_portfolio_value > 0 else 0)
                desviacion = pct_real - target_pct
                
                secciones_analisis.append({
                    "nombre_seccion": sec_name,
                    "porcentaje_objetivo": target_pct,
                    "porcentaje_real": float(pct_real),
                    "valor_actual": float(val_real),
                    "desviacion": float(desviacion)
                })
                
            # Añadir "Efectivo Libre" como información complementaria
            pct_cash = (cash_balance / total_portfolio_value * 100) if total_portfolio_value > 0 else 0
            
            # PnL Total Global (Monto y %)
            total_cost = sum([h['costo_total'] for h in active_holdings])
            total_pnl = float(assets_total_value) - total_cost
            total_pnl_percent = (total_pnl / total_cost * 100) if total_cost > 0 else 0
            
            return {
                "success": True,
                "portfolio_id": portfolio_id,
                "nombre_portafolio": portfolio["nombre_portafolio"],
                "numero_portafolio": portfolio["numero_portafolio"],
                "cash_balance": float(cash_balance),
                "assets_value": float(assets_total_value),
                "total_value": float(total_portfolio_value),
                "total_pnl": total_pnl,
                "total_pnl_percent": total_pnl_percent,
                "holdings": active_holdings,
                "lots": lots,
                "secciones": secciones_analisis,
                "cash_percent": float(pct_cash)
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_instrument_metadata(self, ticker: str) -> Dict[str, Any]:
        """
        Obtiene los metadatos y ficha técnica de un instrumento del catálogo.
        """
        try:
            ticker_upper = ticker.upper()
            res = self.supabase.table('instrumentos_metadata').select('*').eq('ticker', ticker_upper).execute()
            if res.data:
                data = res.data[0]
                # Asegurar precio actual en vivo
                live_price = get_live_price(ticker_upper)
                data['precio_actual_vivo'] = float(live_price)
                return {"success": True, "data": data}
            
            # Fallback si no está en el catálogo pre-poblado
            live_price = get_live_price(ticker_upper)
            return {
                "success": True,
                "data": {
                    "ticker": ticker_upper,
                    "nombre": f"{ticker_upper} Fund/Stock",
                    "descripcion": f"Ficha técnica generada automáticamente para {ticker_upper}. Información detallada no disponible en base de datos de catálogo local.",
                    "tamano_aum": "N/A",
                    "precio_referencia": f"{live_price} USD",
                    "precio_actual_vivo": float(live_price),
                    "comision": "N/A",
                    "posiciones": 0,
                    "top_10_percentage": "N/A",
                    "dividendo": "N/A",
                    "retorno_10y": "N/A",
                    "retorno_5y": "N/A",
                    "retorno_1y": "N/A",
                    "tier": None,
                    "top_holdings": []
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def calculate_rebalance(self, portfolio_id: str, user_id: str, amount: float) -> Dict[str, Any]:
        """
        Algoritmo de rebalanceo óptimo fiscalmente basado en flujos de efectivo.
        Inversión (monto > 0): Prioriza secciones subponderadas (nunca vende).
        Retiro (monto < 0): Prioriza secciones sobreponderadas.
        """
        try:
            # 1. Obtener estado del portafolio
            status_data = self.get_portfolio_status(portfolio_id, user_id)
            if not status_data.get("success"):
                return {"success": False, "error": "No se pudo obtener el estado del portafolio"}
                
            total_value = Decimal(str(status_data["total_value"]))
            secciones = status_data["secciones"]
            
            # Rebalanceo sobre la suma de las secciones actuales
            # En caso de fondeo inicial, total_value puede ser solo efectivo.
            # Convertir secciones a una estructura interna manejable
            # [{ "nombre": str, "target_weight": Decimal, "current_val": Decimal }]
            sec_list = []
            for s in secciones:
                sec_list.append({
                    "nombre": s["nombre_seccion"],
                    "target_weight": Decimal(str(s["porcentaje_objetivo"])) / Decimal("100.00"),
                    "current_val": Decimal(str(s["valor_actual"]))
                })
                
            amount_dec = Decimal(str(amount))
            new_total_value = total_value + amount_dec
            
            # Caso A: Invertir Dinero (monto > 0)
            if amount_dec >= 0:
                allocation = self._optimize_investment(sec_list, amount_dec, new_total_value)
            # Caso B: Retirar Dinero (monto < 0)
            else:
                allocation = self._optimize_withdrawal(sec_list, -amount_dec, new_total_value)
                
            # Formatear el resultado
            output_allocation = []
            for name, val in allocation.items():
                output_allocation.append({
                    "nombre_seccion": name,
                    "monto_sugerido": float(val),
                    "porcentaje_sugerido": float(val / amount_dec * 100) if amount_dec != 0 else 0
                })
                
            return {
                "success": True,
                "portfolio_id": portfolio_id,
                "monto_total": amount,
                "rebalanceo": output_allocation
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _optimize_investment(self, sec_list: List[Dict[str, Any]], amount: Decimal, new_total: Decimal) -> Dict[str, Decimal]:
        """
        Distribución óptima (water-filling) para inversiones.
        """
        # Inicializar asignación en cero
        allocation = {s["nombre"]: Decimal("0.00") for s in sec_list}
        
        # Resolver interactivamente
        active_secs = list(sec_list)
        remaining_cash = amount
        
        while remaining_cash > Decimal("0.0001") and active_secs:
            # Calcular suma de pesos objetivo de secciones activas
            sum_weights = sum(s["target_weight"] for s in active_secs)
            if sum_weights == 0:
                # Si no hay pesos definidos, distribuir equitativamente
                for s in active_secs:
                    allocation[s["nombre"]] += remaining_cash / len(active_secs)
                break
                
            # Calcular target_value proporcional para las secciones activas
            # V'_active = Sum(C_i) + remaining_cash
            sum_current = sum(s["current_val"] for s in active_secs)
            v_prime_active = sum_current + remaining_cash
            
            # Calcular asignación temporal para cada sección activa
            temp_alloc = {}
            has_negative = False
            
            for s in active_secs:
                normalized_weight = s["target_weight"] / sum_weights
                target_val = normalized_weight * v_prime_active
                alloc_i = target_val - s["current_val"]
                temp_alloc[s["nombre"]] = alloc_i
                if alloc_i < 0:
                    has_negative = True
                    
            if not has_negative:
                # Si todos son no-negativos, esta asignación es óptima y final!
                for s in active_secs:
                    allocation[s["nombre"]] += temp_alloc[s["nombre"]]
                remaining_cash = Decimal("0.00")
            else:
                # Remover secciones que no requieren dinero (sobreponderadas) y re-iterar
                # Filtrar activas: solo se quedan las que sí tienen déficit
                new_active = []
                for s in active_secs:
                    # Si su asignación teórica es negativa o cero, se descarta para recibir fondos
                    if temp_alloc[s["nombre"]] > 0:
                        new_active.append(s)
                
                # Si ninguna sección requiere dinero (todas están perfectamente balanceadas o sobreponderadas),
                # distribuir proporcionalmente al peso objetivo original de todas
                if not new_active:
                    for s in active_secs:
                        allocation[s["nombre"]] += remaining_cash * (s["target_weight"] / sum_weights)
                    break
                    
                active_secs = new_active
                
        return allocation

    def _optimize_withdrawal(self, sec_list: List[Dict[str, Any]], withdrawal_amount: Decimal, new_total: Decimal) -> Dict[str, Decimal]:
        """
        Distribución óptima para retiros (venta prioritaria de activos sobreponderados).
        """
        allocation = {s["nombre"]: Decimal("0.00") for s in sec_list}
        active_secs = list(sec_list)
        remaining_withdrawal = withdrawal_amount
        
        while remaining_withdrawal > Decimal("0.0001") and active_secs:
            sum_weights = sum(s["target_weight"] for s in active_secs)
            if sum_weights == 0:
                for s in active_secs:
                    allocation[s["nombre"]] += remaining_withdrawal / len(active_secs)
                break
                
            # V'_active = Sum(C_i) - remaining_withdrawal
            sum_current = sum(s["current_val"] for s in active_secs)
            v_prime_active = sum_current - remaining_withdrawal
            
            temp_alloc = {}
            has_positive = False
            
            for s in active_secs:
                normalized_weight = s["target_weight"] / sum_weights
                target_val = normalized_weight * v_prime_active
                # alloc_i es negativo (representa retiro / venta)
                alloc_i = target_val - s["current_val"]
                temp_alloc[s["nombre"]] = alloc_i
                if alloc_i > 0:
                    has_positive = True
                    
            if not has_positive:
                # Si todos son negativos, es la distribución ideal
                for s in active_secs:
                    # Asegurar no vender más de lo que tiene el activo
                    sell_amt = min(-temp_alloc[s["nombre"]], s["current_val"])
                    allocation[s["nombre"]] -= sell_amt
                remaining_withdrawal = Decimal("0.00")
            else:
                # Descartar las que están subponderadas (no se les debe vender)
                new_active = []
                for s in active_secs:
                    if temp_alloc[s["nombre"]] < 0:
                        new_active.append(s)
                        
                if not new_active:
                    # Si no quedan activas, forzar la venta proporcional de los activos disponibles
                    sum_active_val = sum(s["current_val"] for s in active_secs)
                    for s in active_secs:
                        pct = s["current_val"] / sum_active_val if sum_active_val > 0 else 0
                        allocation[s["nombre"]] -= remaining_withdrawal * pct
                    break
                    
                active_secs = new_active
                
        return allocation


def process_mcp_request(request_data: dict, context: dict) -> dict:
    """
    Punto de entrada orquestador para llamadas desde n8n / Agentes.
    """
    try:
        action = request_data.get('action', 'execute_trade')
        supabase_client = context.get('supabase_client')
        user_id = context.get('user_id')
        handler = MCPRequestHandler(supabase_client)
        
        if action == 'execute_trade':
            operacion_id = request_data.get('operacion_id')
            force_execution = request_data.get('force_execution', False)
            # Adaptamos al flujo original de trades individuales si se llama directamente
            return handler.execute_simulate_buy(
                portfolio_id=request_data.get("portfolio_id"),
                user_id=user_id,
                ticker=request_data.get("ticker"),
                cantidad=float(request_data.get("cantidad", 0)),
                seccion=request_data.get("seccion", "General"),
                valor_actual_manual=request_data.get("valor_actual_manual")
            )
        elif action == 'portfolio_status':
            return handler.get_portfolio_status(request_data.get("portfolio_id"), user_id)
        elif action == 'calculate_rebalance':
            return handler.calculate_rebalance(
                request_data.get("portfolio_id"), 
                user_id, 
                float(request_data.get("amount", 0))
            )
        else:
            return {"success": False, "error": f"Acción desconocida: {action}"}
            
    except Exception as e:
        return {"success": False, "error": f"MCP process failed: {str(e)}"}
