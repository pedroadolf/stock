"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  Activity, 
  ArrowLeft,
  Briefcase,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { backendApi } from "../../services/api";

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortfolios() {
      try {
        // 1. Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        
        // Si no hay sesión (desarrollo local sin login), usamos un UUID de test
        const currentUserId = user?.id || "00000000-0000-0000-0000-000000000000";
        setUserId(currentUserId);

        // 2. Cargar portafolios desde Supabase
        const { data: dbPortfolios, error: dbError } = await supabase
          .from("portafolios")
          .select("*, portafolio_secciones(*)")
          .eq("user_id", currentUserId);

        if (dbError) throw dbError;

        // 3. Para cada portafolio, consultar su status consolidado en FastAPI
        const portfoliosWithStatus = await Promise.all(
          (dbPortfolios || []).map(async (p) => {
            try {
              const status = await backendApi.getPortfolioStatus(p.id, currentUserId);
              return { ...p, ...status };
            } catch (err) {
              console.warn(`No se pudo obtener el status consolidado para portafolio ${p.id}:`, err);
              // Fallback con datos parciales
              return {
                ...p,
                total_value: 0,
                total_pnl: 0,
                total_pnl_percent: 0,
                holdings: []
              };
            }
          })
        );

        setPortfolios(portfoliosWithStatus);
      } catch (err: any) {
        console.error("Error al cargar portafolios:", err);
        setError("Ocurrió un error al cargar tus portafolios. Asegúrate de tener la base de datos migrada.");
      } finally {
        setLoading(false);
      }
    }

    loadPortfolios();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-inter">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
            <Briefcase className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight font-plus-jakarta">Tus Portafolios</h1>
            <p className="text-xs text-gray-400">Administra tus planes de inversión y distribución de activos</p>
          </div>
        </div>

        <Link href="/portfolios/new" className="stock-btn-primary flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo Portafolio
        </Link>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            <p className="text-sm text-gray-400">Obteniendo estado financiero de tus portafolios...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-2xl flex gap-3 text-red-200">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Error de Carga</h3>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
            </div>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="stock-box py-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-full text-gray-500">
              <Briefcase className="h-12 w-12" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-bold text-lg font-plus-jakarta text-white">No tienes portafolios activos</h3>
              <p className="text-xs text-gray-400">Crea un portafolio para definir tu plan de distribución (secciones) y empezar a registrar inversiones.</p>
            </div>
            <Link href="/portfolios/new" className="stock-btn-primary flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Crear mi Primer Portafolio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolios.map((p) => (
              <div key={p.id} className="stock-box flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                        {p.status}
                      </span>
                      <h3 className="font-bold text-lg font-plus-jakarta text-white mt-2">{p.nombre_portafolio}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.descripcion || "Sin descripción disponible"}</p>
                    </div>
                    <span className="font-mono text-xs text-gray-500">{p.numero_portafolio}</span>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-900/40 border border-gray-800/40 p-3 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Valor Total</span>
                      <span className="text-lg font-bold font-mono text-white mt-1 block">
                        ${p.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </span>
                    </div>

                    <div className="bg-gray-900/40 border border-gray-800/40 p-3 rounded-xl">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Ganancia Total</span>
                      <span className={`text-lg font-bold font-mono mt-1 block ${p.total_pnl >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                        {p.total_pnl >= 0 ? "+" : ""}${p.total_pnl?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Allocations breakdown */}
                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-bold text-gray-300">Distribución por Sección</h4>
                    <div className="space-y-2">
                      {p.secciones?.map((sec: any) => (
                        <div key={sec.nombre_seccion} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-300 font-semibold">{sec.nombre_seccion}</span>
                            <span className="text-gray-400 font-mono">
                              {sec.porcentaje_real.toFixed(1)}% <span className="text-gray-600">/ {sec.porcentaje_objetivo}%</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full" 
                              style={{ width: `${Math.min(sec.porcentaje_real, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-gray-400" />
                    {p.holdings?.length || 0} activos registrados
                  </div>
                  
                  {/* Almacenamos el portafolio seleccionado en localStorage para el dashboard */}
                  <Link 
                    href="/" 
                    onClick={() => localStorage.setItem("selected_portfolio_id", p.id)}
                    className="stock-btn-ghost text-xs py-1.5 px-3 uppercase tracking-wider font-bold"
                  >
                    Ver Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
