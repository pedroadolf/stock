"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Settings,
  Briefcase,
  Plus,
  ArrowLeftRight,
  Loader2,
  DollarSign,
  Search,
  Bell,
  Mail,
  Home,
  ChevronDown,
  User,
  Sun,
  Moon,
  Info,
  Calendar,
  Filter,
  ArrowUpDown,
  BookOpen,
  PieChart as PieIcon,
  HelpCircle,
  Percent,
  Layers,
  Award
} from "lucide-react";
import { 
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from "recharts";
import { supabase } from "../services/supabase";
import { backendApi } from "../services/api";

// Paleta de colores Premium para las secciones/categorías
const COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald/Green
  "#F59E0B", // Amber/Orange
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#EF4444", // Red
  "#3B82F6"  // Blue
];

const TIER_COLORS = {
  "Excelente": "border-l-4 border-emerald-500 bg-emerald-500/10 text-emerald-400",
  "Muy bueno": "border-l-4 border-cyan-500 bg-cyan-500/10 text-cyan-400",
  "Bueno": "border-l-4 border-amber-500 bg-amber-500/10 text-amber-400",
  "Paso SIN ver": "border-l-4 border-red-500 bg-red-500/10 text-red-400"
};

const TIER_BG_ROW = {
  "Excelente": "bg-emerald-950/20 [data-theme='light']:bg-emerald-50/50",
  "Muy bueno": "bg-cyan-950/20 [data-theme='light']:bg-cyan-50/50",
  "Bueno": "bg-amber-950/20 [data-theme='light']:bg-amber-50/50",
  "Paso SIN ver": "bg-red-950/20 [data-theme='light']:bg-red-50/50"
};

export default function DashboardPage() {
  const router = useRouter();
  
  // Tema (Light / Dark)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Navegación de Pestañas
  const [activeTab, setActiveTab] = useState<'summary' | 'positions' | 'research'>('summary');
  
  // Estados de carga y sesión
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [portfolioList, setPortfolioList] = useState<any[]>([]);
  
  // Estado financiero consolidado
  const [status, setStatus] = useState<any>(null);
  
  // Ficha técnica del Instrumento Seleccionado
  const [researchTicker, setResearchTicker] = useState<string>("VOO");
  const [instrumentDetails, setInstrumentDetails] = useState<any>(null);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Simulador de Rebalanceo Inteligente
  const [rebalanceAmount, setRebalanceAmount] = useState<string>("5000");
  const [rebalanceResults, setRebalanceResults] = useState<any[]>([]);
  const [calculatingRebalance, setCalculatingRebalance] = useState(false);
  const [applyingRebalance, setApplyingRebalance] = useState(false);

  // Filtros y Ordenamiento para la Pestaña de Posiciones (Lotes)
  const [posFilterText, setPosFilterText] = useState("");
  const [posFilterSection, setPosFilterSection] = useState("");
  const [posSortField, setPosSortField] = useState<string>("fecha_adquisicion");
  const [posSortDirection, setPosSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal / Formulario de Compra Manual
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [ticker, setTicker] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [seccion, setSeccion] = useState("");
  const [instrumentType, setInstrumentType] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // Lista estática de ETFs populares para comparación rápida
  const [showPopularETFs, setShowPopularETFs] = useState(true);

  // Carga inicial y listeners
  useEffect(() => {
    const storedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);

    async function initDashboard() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || "00000000-0000-0000-0000-000000000000";
        setUserId(currentUserId);

        const { data: portfolios, error: portError } = await supabase
          .from("portafolios")
          .select("*")
          .eq("user_id", currentUserId);

        if (portError) throw portError;
        setPortfolioList(portfolios || []);

        if (!portfolios || portfolios.length === 0) {
          router.push("/portfolios/new");
          return;
        }

        let storedId = localStorage.getItem("selected_portfolio_id");
        const exists = portfolios.some(p => p.id === storedId);
        if (!storedId || !exists) {
          storedId = portfolios[0].id;
          localStorage.setItem("selected_portfolio_id", storedId);
        }
        setSelectedPortfolioId(storedId);
        
        const { data: sections } = await supabase
          .from("portafolio_secciones")
          .select("nombre_seccion")
          .eq("portafolio_id", storedId);
          
        if (sections && sections.length > 0) {
          setSeccion(sections[0].nombre_seccion);
        }

        await refreshPortfolioStatus(storedId, currentUserId);
        await loadResearchDetails(researchTicker);

      } catch (err) {
        console.error("Error al inicializar dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const refreshPortfolioStatus = async (portfolioId: string, currentUserId: string) => {
    try {
      const data = await backendApi.getPortfolioStatus(portfolioId, currentUserId);
      if (data.success) {
        setStatus(data);
        if (rebalanceAmount) {
          calculateRebalanceOffline(data, parseFloat(rebalanceAmount) || 0);
        }
      }
    } catch (err) {
      console.error("Error al refrescar status:", err);
    }
  };

  const loadResearchDetails = async (symbol: string) => {
    setLoadingResearch(true);
    try {
      const res = await backendApi.getInstrumentDetails(symbol);
      if (res.success) {
        setInstrumentDetails(res.data);
      }
    } catch (err) {
      console.error("Error al cargar ficha de investigación:", err);
    } finally {
      setLoadingResearch(false);
    }
  };

  const handlePortfolioChange = async (id: string) => {
    setSelectedPortfolioId(id);
    localStorage.setItem("selected_portfolio_id", id);
    setLoading(true);
    
    const { data: sections } = await supabase
      .from("portafolio_secciones")
      .select("nombre_seccion")
      .eq("portafolio_id", id);
      
    if (sections && sections.length > 0) {
      setSeccion(sections[0].nombre_seccion);
    } else {
      setSeccion("");
    }

    if (userId) {
      await refreshPortfolioStatus(id, userId);
    }
    setLoading(false);
  };

  const handleCalculateRebalance = async () => {
    if (!selectedPortfolioId || !userId) return;
    setCalculatingRebalance(true);
    try {
      const amount = parseFloat(rebalanceAmount) || 0;
      const res = await backendApi.calculateRebalance(selectedPortfolioId, userId, amount);
      if (res.success) {
        setRebalanceResults(res.rebalanceo);
      }
    } catch (err) {
      console.error("Error al calcular rebalanceo:", err);
    } finally {
      setCalculatingRebalance(false);
    }
  };

  const calculateRebalanceOffline = async (currentStatus: any, amount: number) => {
    if (!selectedPortfolioId || !userId) return;
    try {
      const res = await backendApi.calculateRebalance(selectedPortfolioId, userId, amount);
      if (res.success) {
        setRebalanceResults(res.rebalanceo);
      }
    } catch (_) {}
  };

  const handleApplyRebalance = async () => {
    if (!selectedPortfolioId || !userId || rebalanceResults.length === 0) return;
    setApplyingRebalance(true);
    try {
      let appliedCount = 0;
      for (const rec of rebalanceResults) {
        if (rec.monto_sugerido > 0.01) {
          // Registrar compra simulada
          await backendApi.simulateBuy(
            selectedPortfolioId,
            userId,
            rec.nombre_seccion.replace(/\s+/g, '').substring(0, 4).toUpperCase() + "T", // Ticker representativo temporal
            rec.monto_sugerido / 100, // Cantidad de títulos (suponiendo precio base de 100)
            rec.nombre_seccion,
            100 // precio unitario manual
          );
          appliedCount++;
        }
      }
      alert(`¡Se aplicó el rebalanceo! Se registraron ${appliedCount} inversiones simuladas distribuidas.`);
      await refreshPortfolioStatus(selectedPortfolioId, userId);
    } catch (err: any) {
      alert(`Error al aplicar rebalanceo: ${err.message}`);
    } finally {
      setApplyingRebalance(false);
    }
  };

  const handleRegisterBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuyError(null);
    if (!selectedPortfolioId || !userId) return;

    if (!ticker.trim()) {
      setBuyError("El símbolo es requerido.");
      return;
    }
    if (!seccion) {
      setBuyError("Debes seleccionar una sección.");
      return;
    }

    setBuying(true);
    try {
      const cantFloat = parseFloat(cantidad) || 0;
      
      const result = await backendApi.simulateBuy(
        selectedPortfolioId,
        userId,
        ticker.toUpperCase(),
        cantFloat,
        seccion,
        undefined
      );

      if (result.success) {
        setShowBuyModal(false);
        setTicker("");
        setCantidad("1");
        setInstrumentType("");
        await refreshPortfolioStatus(selectedPortfolioId, userId);
      }
    } catch (err: any) {
      setBuyError(err.message || "Error al registrar la compra. Verifica tus fondos.");
    } finally {
      setBuying(false);
    }
  };

  const handleTickerBlur = async () => {
    if (!ticker.trim()) return;
    try {
      const res = await backendApi.getTickerCategory(ticker.trim());
      if (res) {
        if (res.category && res.category !== "General") {
          setSeccion(res.category);
        }
        if (res.instrumentType) {
          setInstrumentType(res.instrumentType);
        }
      }
    } catch (err) {
      console.error("Error al obtener categoría", err);
    }
  };

  // Ejecutar búsqueda de instrumento en pestaña 3
  const handleResearchSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setResearchTicker(searchQuery.toUpperCase());
      loadResearchDetails(searchQuery.toUpperCase());
    }
  };

  const selectResearchTickerDirect = (sym: string) => {
    setResearchTicker(sym);
    setSearchQuery(sym);
    setActiveTab('research');
    loadResearchDetails(sym);
  };

  // Manejar ordenamiento de la tabla
  const handleSort = (field: string) => {
    if (posSortField === field) {
      setPosSortDirection(posSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setPosSortField(field);
      setPosSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Cargando Portfolify Pro...</h2>
      </div>
    );
  }

  // Filtrado de lotes para la Pestaña 2
  const filteredLots = (status?.lots || []).filter((lot: any) => {
    const matchesText = lot.ticker.toLowerCase().includes(posFilterText.toLowerCase()) || 
                        lot.nombre.toLowerCase().includes(posFilterText.toLowerCase());
    const matchesSection = posFilterSection === "" || lot.seccion === posFilterSection;
    return matchesText && matchesSection;
  });

  // Ordenamiento de lotes
  const sortedLots = [...filteredLots].sort((a: any, b: any) => {
    let valA = a[posSortField];
    let valB = b[posSortField];

    if (posSortField === 'fecha_adquisicion') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) return posSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return posSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Preparar datos para el gráfico de torta de Recharts
  const pieData = (status?.secciones || [])
    .filter((sec: any) => sec.valor_actual > 0)
    .map((sec: any, idx: number) => ({
      name: sec.nombre_seccion,
      value: sec.valor_actual,
      percentage: sec.porcentaje_real,
      color: COLORS[idx % COLORS.length]
    }));

  return (
    <div className="min-h-screen bg-[#0B0F19] [data-theme='light']:bg-[#F3F4F6] text-gray-100 [data-theme='light']:text-gray-900 flex transition-colors duration-300 font-inter">
      
      {/* ─── 1. SIDEBAR (Izquierda) ────────────────────────────────────── */}
      <aside className="w-64 bg-[#111827] [data-theme='light']:bg-[#FFFFFF] border-r border-gray-800/80 [data-theme='light']:border-gray-200/80 flex flex-col p-6 space-y-8 shrink-0">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F59E0B] p-2.5 rounded-2xl text-slate-900 shadow-lg shadow-amber-500/20">
            <Zap className="h-5 w-5 fill-slate-900" />
          </div>
          <span className="text-xl font-extrabold tracking-tight font-plus-jakarta text-white [data-theme='light']:text-gray-900">
            Portfolify Pro
          </span>
        </div>

        {/* Cuentas y Selección */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-gray-950/40 [data-theme='light']:bg-gray-100 border border-gray-800 [data-theme='light']:border-gray-200 rounded-2xl px-4 py-3 text-xs">
            <Briefcase className="h-4 w-4 text-amber-500 shrink-0" />
            <select 
              value={selectedPortfolioId || ""} 
              onChange={(e) => handlePortfolioChange(e.target.value)}
              className="bg-transparent text-white [data-theme='light']:text-gray-900 font-bold focus:outline-none cursor-pointer w-full text-ellipsis"
            >
              {portfolioList.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white [data-theme='light']:bg-white [data-theme='light']:text-gray-900">
                  {p.nombre_portafolio}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navegación Interna */}
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`w-full gostock-sidebar-link ${activeTab === 'summary' ? 'active' : ''} cursor-pointer`}
          >
            <PieIcon className="h-4.5 w-4.5" />
            Resumen y Rebalanceo
          </button>
          
          <button 
            onClick={() => setActiveTab('positions')}
            className={`w-full gostock-sidebar-link ${activeTab === 'positions' ? 'active' : ''} cursor-pointer`}
          >
            <Layers className="h-4.5 w-4.5" />
            Mis Posiciones (Lotes)
          </button>

          <button 
            onClick={() => setActiveTab('research')}
            className={`w-full gostock-sidebar-link ${activeTab === 'research' ? 'active' : ''} cursor-pointer`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            Ficha de Instrumentos
          </button>
          
          <div className="pt-6 pb-2 border-t border-gray-800/60 [data-theme='light']:border-gray-200/60">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block px-4">
              Mi Distribución Real
            </span>
          </div>
          
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            {status?.secciones?.map((sec: any, idx: number) => (
              <div key={sec.nombre_seccion} className="flex justify-between items-center px-4 py-2 rounded-xl hover:bg-gray-800/30">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-[11px] text-gray-400 font-semibold truncate">{sec.nombre_seccion}</span>
                </div>
                <span className="font-mono text-[11px] text-gray-300 font-bold">{sec.porcentaje_real.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Acciones Rápidas */}
        <div className="pt-4 border-t border-gray-800/60 [data-theme='light']:border-gray-200/60 space-y-2">
          <button 
            onClick={() => setShowBuyModal(true)} 
            className="w-full gostock-btn-primary flex items-center justify-center gap-2 py-2.5 cursor-pointer text-xs"
          >
            <Plus className="h-4 w-4" />
            Registrar Compra
          </button>
          
          <div className="flex justify-between items-center px-4 py-2 text-[10px] text-gray-500 font-semibold">
            <span>Servidor API</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              En Línea
            </span>
          </div>
        </div>
      </aside>

      {/* ─── 2. CONTENIDO PRINCIPAL (Derecha) ───────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 p-8 space-y-6 overflow-y-auto custom-scrollbar">
        
        {/* Top Header Bar */}
        <header className="flex justify-between items-center gap-4">
          
          {/* Título de la pestaña activa */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white [data-theme='light']:text-gray-900 uppercase">
              {activeTab === 'summary' && "Resumen de Portafolio y Rebalanceo"}
              {activeTab === 'positions' && "Mis Posiciones Detalladas"}
              {activeTab === 'research' && "Ficha de Investigación"}
            </h1>
            <p className="text-xs text-gray-500">Maneja y planifica tus distribuciones con datos consolidados en USD</p>
          </div>

          {/* Opciones del Header */}
          <div className="flex items-center gap-3">
            
            {/* Ticker Search Bar */}
            <form onSubmit={handleResearchSearch} className="relative max-w-xs w-full hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar ficha ETF (ej. VOO)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs text-white [data-theme='light']:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
              />
            </form>

            {/* Tema Light/Dark */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl text-gray-400 hover:text-white [data-theme='light']:hover:text-gray-900 transition cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-4 border-l border-gray-800 [data-theme='light']:border-gray-200">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-sm">
                PA
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-black block text-white [data-theme='light']:text-gray-900">Pedro Adolfo</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Inversionista</span>
              </div>
            </div>

          </div>

        </header>

        {/* ─── 3. RESUMEN EN CAJAS (Cajas de Datos Generales del Portafolio) ───────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Caja 1: Valor Total */}
          <div className="gostock-box p-5 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-5 text-amber-500">
              <DollarSign size={80} />
            </div>
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Valor Total Portafolio</span>
              <h3 className="text-xl font-black font-mono mt-1 text-white [data-theme='light']:text-gray-900">
                ${status?.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </h3>
            </div>
          </div>

          {/* Caja 2: Efectivo Disponible */}
          <div className="gostock-box p-5 flex items-center gap-4 relative overflow-hidden">
            <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Efectivo Disponible (Cash)</span>
              <h3 className="text-xl font-black font-mono mt-1 text-white [data-theme='light']:text-gray-900">
                ${status?.cash_balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </h3>
            </div>
          </div>

          {/* Caja 3: Ganancia Absoluta */}
          <div className="gostock-box p-5 flex items-center gap-4 relative overflow-hidden">
            <div className={`p-3.5 rounded-2xl border ${status?.total_pnl >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              {status?.total_pnl >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Ganancia / Pérdida ($)</span>
              <h3 className={`text-xl font-black font-mono mt-1 ${status?.total_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {status?.total_pnl >= 0 ? "+" : ""}${status?.total_pnl?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </h3>
            </div>
          </div>

          {/* Caja 4: Ganancia Porcentual */}
          <div className="gostock-box p-5 flex items-center gap-4 relative overflow-hidden">
            <div className={`p-3.5 rounded-2xl border ${status?.total_pnl >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Desempeño Total</span>
              <h3 className={`text-xl font-black font-mono mt-1 ${status?.total_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {status?.total_pnl >= 0 ? "+" : ""}{status?.total_pnl_percent?.toFixed(2)}%
              </h3>
            </div>
          </div>

        </section>

        {/* ─── 4. PELES DE NAVEGACIÓN (Vistas del Dashboard) ────────────────────────── */}

        {/* PESTAÑA 1: RESUMEN Y REBALANCEO */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna Izquierda: Tabla de Asignación por Sección */}
              <div className="lg:col-span-2 gostock-box p-6 space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-white [data-theme='light']:text-gray-900">Distribución del Plan (Asset Allocation)</h3>
                  <p className="text-xs text-gray-500">Compara el objetivo de tu plan contra la valuación real actual</p>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Nombre de la Sección</th>
                        <th className="pb-3 text-center">Objetivo (%)</th>
                        <th className="pb-3 text-center">Actual (%)</th>
                        <th className="pb-3 text-right">Inversión Actual</th>
                        <th className="pb-3 text-right">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs">
                      {status?.secciones?.map((sec: any, idx: number) => {
                        const diff = sec.valor_actual - (sec.porcentaje_objetivo / 100 * status.total_value);
                        return (
                          <tr key={sec.nombre_seccion} className="hover:bg-gray-800/10">
                            <td className="py-4 font-bold text-white [data-theme='light']:text-gray-900 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                              {sec.nombre_seccion}
                            </td>
                            <td className="py-4 text-center font-mono font-bold text-gray-300">{sec.porcentaje_objetivo.toFixed(1)}%</td>
                            <td className="py-4 text-center font-mono font-bold text-gray-400">{sec.porcentaje_real.toFixed(1)}%</td>
                            <td className="py-4 text-right font-mono text-white [data-theme='light']:text-gray-900">${sec.valor_actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className={`py-4 text-right font-mono font-bold ${diff >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {diff >= 0 ? "+" : ""}${diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Columna Derecha: Gráfico de Dona y Simulador de Rebalanceo */}
              <div className="space-y-6">
                
                {/* Gráfico de Dona */}
                <div className="gostock-box p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Distribución de Activos</h3>
                  <div className="h-56 flex items-center justify-center">
                    {pieData.length === 0 ? (
                      <span className="text-xs text-gray-500">Sin posiciones invertidas</span>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`$${value.toLocaleString()}`, "Valuación"]}
                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                            labelStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Simulador de Aportaciones (Rebalanceo Inteligente) */}
                <div className="gostock-box p-6 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">¿Cuánto vas a invertir hoy?</h4>
                    <p className="text-[10px] text-gray-500">Distribución óptima sin vender activos (Optimización Fiscal)</p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-sm text-gray-500 font-mono font-bold">$</span>
                      <input 
                        type="number"
                        value={rebalanceAmount}
                        onChange={(e) => {
                          setRebalanceAmount(e.target.value);
                          calculateRebalanceOffline(status, parseFloat(e.target.value) || 0);
                        }}
                        placeholder="Monto de aportación"
                        className="w-full bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl pl-8 pr-12 py-1.5 text-xs font-mono font-bold text-white [data-theme='light']:text-gray-900 focus:outline-none focus:border-amber-500 transition"
                      />
                      <span className="absolute right-4 top-2 text-[9px] text-gray-500 font-black">USD</span>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleCalculateRebalance}
                        disabled={calculatingRebalance}
                        className="gostock-btn-primary py-2 text-[11px] flex-1 font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {calculatingRebalance && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Calcular
                      </button>
                      {rebalanceResults.length > 0 && (
                        <button 
                          onClick={handleApplyRebalance}
                          disabled={applyingRebalance}
                          className="border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 py-2 text-[11px] flex-1 font-bold uppercase tracking-wider flex items-center justify-center gap-1 rounded-xl cursor-pointer"
                        >
                          {applyingRebalance && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Aplicar
                        </button>
                      )}
                    </div>
                  </div>

                  {rebalanceResults.length > 0 && (
                    <div className="space-y-2 border-t border-gray-800/80 pt-3">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-2">Sugerencia de Distribución</span>
                      {rebalanceResults.map((rec: any, idx: number) => (
                        <div key={rec.nombre_seccion} className="flex justify-between items-center text-xs p-2 bg-gray-950/20 [data-theme='light']:bg-gray-100 rounded-lg border border-gray-800/30">
                          <span className="font-semibold text-gray-300 [data-theme='light']:text-gray-700 truncate max-w-[120px]">{rec.nombre_seccion}</span>
                          <div className="text-right font-mono">
                            <span className="text-amber-500 font-bold block">${rec.monto_sugerido.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <span className="text-[9px] text-gray-500">{rec.porcentaje_sugerido.toFixed(0)}% de aportación</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MIS POSICIONES (EXCEL-LIKE PRO) */}
        {activeTab === 'positions' && (
          <div className="gostock-box p-6 space-y-6">
            
            {/* Filtros e Interacción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              
              <div className="flex flex-wrap gap-2.5 items-center w-full sm:w-auto">
                {/* Búsqueda de Texto */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Filtrar por ticker o nombre..." 
                    value={posFilterText}
                    onChange={(e) => setPosFilterText(e.target.value)}
                    className="w-full bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs text-white [data-theme='light']:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Filtro por Sección */}
                <select
                  value={posFilterSection}
                  onChange={(e) => setPosFilterSection(e.target.value)}
                  className="bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl px-3 py-2 text-xs text-white [data-theme='light']:text-gray-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">Todas las Secciones</option>
                  {status?.secciones?.map((sec: any) => (
                    <option key={sec.nombre_seccion} value={sec.nombre_seccion}>
                      {sec.nombre_seccion}
                    </option>
                  ))}
                </select>

                {(posFilterText || posFilterSection) && (
                  <button 
                    onClick={() => { setPosFilterText(""); setPosFilterSection(""); }}
                    className="text-xs text-amber-500 hover:text-amber-400 font-bold underline px-2"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">
                Mostrando {sortedLots.length} lotes de inversión
              </div>

            </div>

            {/* Tabla Detallada estilo Excel */}
            <div className="overflow-x-auto custom-scrollbar border border-gray-800/80 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950/40 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                    <th className="p-3 text-center cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('fecha_adquisicion')}>
                      Adquisición <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('ticker')}>
                      Símbolo <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="p-3">Nombre del Instrumento</th>
                    <th className="p-3">Sección</th>
                    <th className="p-3 text-right">Títulos</th>
                    <th className="p-3 text-right cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('precio_compra')}>
                      Compra <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="p-3 text-right">Precio Actual</th>
                    <th className="p-3 text-right cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('valor_actual')}>
                      Valor Actual <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('pnl')}>
                      G/P Abs. <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('pnl_percent')}>
                      G/P % <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                    <th className="p-3 text-right cursor-pointer hover:bg-gray-800/20" onClick={() => handleSort('peso_portafolio')}>
                      Peso (%) <ArrowUpDown className="h-3 w-3 inline ml-1" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs">
                  {sortedLots.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-500">
                        No se encontraron lotes de inversiones que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    sortedLots.map((lot: any) => {
                      const isPos = lot.pnl >= 0;
                      return (
                        <tr key={lot.id} className="hover:bg-gray-800/10">
                          <td className="p-3 text-center font-mono font-bold text-gray-400">
                            {new Date(lot.fecha_adquisicion).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => selectResearchTickerDirect(lot.ticker)}
                              className="font-black text-amber-500 hover:underline cursor-pointer bg-transparent border-none text-left"
                            >
                              {lot.ticker}
                            </button>
                          </td>
                          <td className="p-3 font-semibold text-white [data-theme='light']:text-gray-900 truncate max-w-[150px]">{lot.nombre}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400">
                              {lot.seccion}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-gray-300">{lot.cantidad.toFixed(4)}</td>
                          <td className="p-3 text-right font-mono text-gray-400">${lot.precio_compra.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-gray-400">${lot.precio_actual.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono text-white [data-theme='light']:text-gray-900">${lot.valor_actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`p-3 text-right font-mono font-bold ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                            {isPos ? "+" : ""}${lot.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`p-3 text-right font-mono font-bold ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                            {isPos ? "+" : ""}{lot.pnl_percent.toFixed(2)}%
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-gray-500">{lot.peso_portafolio.toFixed(2)}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* PESTAÑA 3: FICHA DE INVESTIGACIÓN (TABS DE CAJAS) */}
        {activeTab === 'research' && (
          <div className="space-y-6">
            
            {/* Buscador de Ticker Principal */}
            <div className="gostock-box p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="space-y-1 w-full md:w-auto">
                <h3 className="text-base font-extrabold text-white [data-theme='light']:text-gray-900">Buscar Radiografía de ETF / Activo</h3>
                <p className="text-xs text-gray-500">Revisa la comisión, tamaño del fondo, rendimiento histórico y composición</p>
              </div>
              <form onSubmit={handleResearchSearch} className="flex gap-2 w-full md:max-w-md">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Escribe Ticker (ej. NAFTRAC, VTI, VOO, IAU)..."
                  className="w-full bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl px-4 py-2 text-xs text-white [data-theme='light']:text-gray-900 focus:outline-none focus:border-amber-500 transition font-mono font-bold"
                />
                <button type="submit" className="gostock-btn-primary px-5 py-2 text-xs uppercase tracking-wider font-bold shrink-0 cursor-pointer">
                  Buscar
                </button>
              </form>
            </div>

            {loadingResearch ? (
              <div className="gostock-box p-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                <span className="text-xs text-gray-500">Cargando ficha de {researchTicker}...</span>
              </div>
            ) : instrumentDetails ? (
              <div className="space-y-6">
                
                {/* Encabezado del Instrumento */}
                <div className="gostock-box p-6 flex flex-col md:flex-row justify-between gap-4 items-start relative overflow-hidden">
                  
                  {/* Tier Ribbon */}
                  {instrumentDetails.tier && (
                    <div className="absolute right-0 top-0">
                      <span className={`px-4 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-bl-2xl flex items-center gap-1 ${TIER_COLORS[instrumentDetails.tier as keyof typeof TIER_COLORS]}`}>
                        <Award className="h-3 w-3" />
                        Tier {instrumentDetails.tier}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 font-mono font-black text-lg">
                        {instrumentDetails.ticker}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white [data-theme='light']:text-gray-900 leading-tight">{instrumentDetails.nombre}</h2>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Metadatos Enriquecidos</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{instrumentDetails.descripcion}</p>
                  </div>

                  <div className="text-left md:text-right shrink-0">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Precio de Referencia</span>
                    <h3 className="text-3xl font-black font-mono text-white [data-theme='light']:text-gray-900 mt-1">
                      {instrumentDetails.precio_referencia}
                    </h3>
                    <div className="flex items-center md:justify-end gap-1.5 mt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">En Vivo: ${instrumentDetails.precio_actual_vivo?.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Radiografía en Cajas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  
                  {/* Caja 1: Tamaño */}
                  <div className="gostock-box p-4 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Tamaño (AUM)</span>
                    <h4 className="text-lg font-black text-white [data-theme='light']:text-gray-900 font-mono">{instrumentDetails.tamano_aum}</h4>
                  </div>

                  {/* Caja 2: Comisión */}
                  <div className="gostock-box p-4 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Comisión Anual</span>
                    <h4 className="text-lg font-black text-white [data-theme='light']:text-gray-900 font-mono">{instrumentDetails.comision}</h4>
                  </div>

                  {/* Caja 3: Posiciones */}
                  <div className="gostock-box p-4 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Posiciones Totales</span>
                    <h4 className="text-lg font-black text-white [data-theme='light']:text-gray-900 font-mono">{instrumentDetails.posiciones}</h4>
                  </div>

                  {/* Caja 4: Concentración */}
                  <div className="gostock-box p-4 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Concentración Top 10</span>
                    <h4 className="text-lg font-black text-white [data-theme='light']:text-gray-900 font-mono">{instrumentDetails.top_10_percentage}</h4>
                  </div>

                  {/* Caja 5: Dividendo */}
                  <div className="gostock-box p-4 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Dividendo (Yield)</span>
                    <h4 className="text-lg font-black text-white [data-theme='light']:text-gray-900 font-mono">{instrumentDetails.dividendo}</h4>
                  </div>

                  {/* Caja 6: Tier List */}
                  <div className="gostock-box p-4 text-center flex flex-col justify-center space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Calificación</span>
                    <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest">{instrumentDetails.tier || "Sin Tier"}</h4>
                  </div>

                </div>

                {/* Composición de Cartera y Rendimientos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Composición Cartera (Top 10 holdings) */}
                  <div className="gostock-box p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                      <h3 className="font-extrabold text-sm text-white [data-theme='light']:text-gray-900 uppercase">Top 10 Empresas (%)</h3>
                      <span className="text-[10px] font-bold text-gray-500 font-mono">Concentración: {instrumentDetails.top_10_percentage}</span>
                    </div>

                    <div className="space-y-3.5">
                      {instrumentDetails.top_holdings && instrumentDetails.top_holdings.length > 0 ? (
                        instrumentDetails.top_holdings.map((hold: any, idx: number) => (
                          <div key={hold.name} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-300 [data-theme='light']:text-gray-700">{idx + 1}. {hold.name}</span>
                              <span className="font-mono text-gray-400 font-bold">{hold.weight.toFixed(2)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-900/60 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${hold.weight * 6}%` }}></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-gray-500 py-12">Detalle de holdings no disponible para este activo</div>
                      )}
                    </div>
                  </div>

                  {/* Rendimientos Históricos y Gráfico comparativo */}
                  <div className="gostock-box p-6 space-y-5">
                    <div className="border-b border-gray-800 pb-3">
                      <h3 className="font-extrabold text-sm text-white [data-theme='light']:text-gray-900 uppercase">Rendimientos Históricos</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 bg-gray-950/20 [data-theme='light']:bg-gray-100 rounded-xl text-center border border-gray-800/40">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">1 Año</span>
                        <h4 className="text-base font-black font-mono text-emerald-400 mt-1">{instrumentDetails.retorno_1y}</h4>
                      </div>
                      <div className="p-4 bg-gray-950/20 [data-theme='light']:bg-gray-100 rounded-xl text-center border border-gray-800/40">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">5 Años</span>
                        <h4 className="text-base font-black font-mono text-emerald-400 mt-1">{instrumentDetails.retorno_5y}</h4>
                      </div>
                      <div className="p-4 bg-gray-950/20 [data-theme='light']:bg-gray-100 rounded-xl text-center border border-gray-800/40">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">10 Años</span>
                        <h4 className="text-base font-black font-mono text-emerald-400 mt-1">{instrumentDetails.retorno_10y}</h4>
                      </div>
                    </div>

                    {/* Gráfico comparativo vs S&P500 */}
                    <div className="space-y-3 pt-3">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Comparativa Desempeño vs S&P 500</span>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: '1 Año', [instrumentDetails.ticker]: parseFloat(instrumentDetails.retorno_1y) || 0, 'S&P 500': 17.56 },
                              { name: '5 Años', [instrumentDetails.ticker]: parseFloat(instrumentDetails.retorno_5y) || 0, 'S&P 500': 16.43 },
                              { name: '10 Años', [instrumentDetails.ticker]: parseFloat(instrumentDetails.retorno_10y) || 0, 'S&P 500': 15.26 },
                            ]}
                            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                            <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                            <Bar dataKey={instrumentDetails.ticker} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="S&P 500" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              <div className="gostock-box p-12 text-center text-xs text-gray-500">
                Selecciona o busca un ticker para ver su ficha técnica enriquecida.
              </div>
            )}

            {/* TABLA COMPARATIVA COMPLETA DE ETFS (Ocultable) */}
            <div className="gostock-box p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-500" />
                  <h3 className="font-extrabold text-sm text-white [data-theme='light']:text-gray-900 uppercase">Tabla de Características de ETFs Populares</h3>
                </div>
                <button 
                  onClick={() => setShowPopularETFs(!showPopularETFs)}
                  className="text-xs text-amber-500 font-bold hover:underline cursor-pointer"
                >
                  {showPopularETFs ? "Ocultar tabla" : "Mostrar tabla"}
                </button>
              </div>

              {showPopularETFs && (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-3">Ticker</th>
                        <th className="pb-3">Calificación (Tier)</th>
                        <th className="pb-3 text-right">Tamaño</th>
                        <th className="pb-3 text-right">Precio Ref</th>
                        <th className="pb-3 text-center">Comisión</th>
                        <th className="pb-3 text-center">Posiciones</th>
                        <th className="pb-3 text-center">Top 10 %</th>
                        <th className="pb-3 text-center">Dividendo</th>
                        <th className="pb-3 text-right">Rend 1y</th>
                        <th className="pb-3 text-right">Rend 5y</th>
                        <th className="pb-3 text-right">Rend 10y</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {["VTI", "VUAA", "IVVPESO", "IAU", "VOO", "IVV", "QQQM", "VGT", "VTV", "NAFTRAC", "QQQ", "SPY", "GLD"].map((t) => {
                        const tierLabels = {
                          "Excelente": "EXC",
                          "Muy bueno": "MB",
                          "Bueno": "B",
                          "Paso SIN ver": "PASO"
                        };
                        
                        // Información mock/estática de la imagen provista para poblar la tabla
                        const etfInfo: Record<string, any> = {
                          "VGT": { size: "$129.96 B", price: "776.32 USD", fee: "0.09%", count: 322, top10: "57.90%", div: "0.41%", r1: "27.90%", r5: "19.95%", r10: "23.45%", tier: "Bueno" },
                          "VTV": { size: "$215.53 B", price: "192.87 USD", fee: "0.04%", count: 315, top10: "21.40%", div: "2.05%", r1: "9.17%", r5: "15.02%", r10: "12.10%", tier: "Bueno" },
                          "VOO": { size: "$1,480 B", price: "634 USD", fee: "0.03%", count: 505, top10: "40.30%", div: "1.12%", r1: "17.56%", r5: "16.43%", r10: "15.26%", tier: "Muy bueno" },
                          "VUAA": { size: "$79.56 B", price: "132 USD", fee: "0.07%", count: 503, top10: "34.70%", div: "Acumula", r1: "7.96%", r5: "18.25%", r10: "N/A", tier: "Excelente" },
                          "VTI": { size: "$2,060 B", price: "340 USD", fee: "0.03%", count: 3527, top10: "35.40%", div: "1.11%", r1: "17.34%", r5: "15.66%", r10: "14.66%", tier: "Excelente" },
                          "IVV": { size: "$764 B", price: "694 USD", fee: "0.03%", count: 503, top10: "36.53%", div: "1.13%", r1: "15.13%", r5: "16.60%", r10: "13.61%", tier: "Muy bueno" },
                          "IVVPESO": { size: "$0.557 B", price: "141 MXN", fee: "0.49%", count: 2, top10: "100.00%", div: "Acumula", r1: "18.96%", r5: "17.64%", r10: "16.87%", tier: "Excelente" },
                          "NAFTRAC": { size: "5.79$", price: "65 MXN", fee: "0.25%", count: 35, top10: "71.60%", div: "2.68%", r1: "7.07%", r5: "8.68%", r10: "3.87%", tier: "Bueno" },
                          "IAU": { size: "$70.95 B", price: "84 USD", fee: "0.25%", count: 1, top10: "100%", div: "N/A", r1: "45.10%", r5: "14.90%", r10: "12.85%", tier: "Excelente" },
                          "GLD": { size: "$153 B", price: "411 USD", fee: "0.40%", count: 1, top10: "100%", div: "N/A", r1: "57.94%", r5: "18.39%", r10: "14.29%", tier: "Paso SIN ver" },
                          "SPY": { size: "$711 B", price: "690 USD", fee: "0.09%", count: 503, top10: "39%", div: "1.17%", r1: "17.42%", r5: "16.33%", r10: "15.15%", tier: "Paso SIN ver" },
                          "QQQ": { size: "$411 B", price: "625 USD", fee: "0.18%", count: 101, top10: "53%", div: "0.46%", r1: "23.63%", r5: "17.34%", r10: "20.32%", tier: "Paso SIN ver" },
                          "QQQM": { size: "$71 B", price: "256 USD", fee: "0.15%", count: 103, top10: "53%", div: "0.49%", r1: "17.97%", r5: "N/A", r10: "N/A", tier: "Muy bueno" }
                        };

                        const info = etfInfo[t];
                        if (!info) return null;

                        return (
                          <tr key={t} className="hover:bg-gray-850/50 cursor-pointer" onClick={() => selectResearchTickerDirect(t)}>
                            <td className="py-2.5 pl-3 font-mono font-black text-amber-500">{t}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                info.tier === 'Excelente' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                info.tier === 'Muy bueno' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                info.tier === 'Bueno' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {info.tier}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono text-gray-300">{info.size}</td>
                            <td className="py-2.5 text-right font-mono text-gray-300">{info.price}</td>
                            <td className="py-2.5 text-center font-mono text-gray-400">{info.fee}</td>
                            <td className="py-2.5 text-center font-mono text-gray-400">{info.count}</td>
                            <td className="py-2.5 text-center font-mono text-gray-400">{info.top10}</td>
                            <td className="py-2.5 text-center font-mono text-gray-400">{info.div}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-emerald-400">{info.r1}</td>
                            <td className="py-2.5 text-right font-mono text-emerald-400">{info.r5}</td>
                            <td className="py-2.5 text-right font-mono text-emerald-400">{info.r10}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TIER LIST VISUAL INTERACTIVO */}
            <div className="gostock-box p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                <Award className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-white [data-theme='light']:text-gray-900 uppercase">Clasificación Personal de ETFs (Tier List)</h3>
              </div>

              <div className="space-y-3 rounded-2xl overflow-hidden border border-gray-800">
                {["Excelente", "Muy bueno", "Bueno", "Paso SIN ver"].map((tierLevel) => {
                  const tierTickers: Record<string, string[]> = {
                    "Excelente": ["VTI", "VUAA", "IVVPESO", "IAU"],
                    "Muy bueno": ["VOO", "IVV", "QQQM"],
                    "Bueno": ["VGT", "VTV", "NAFTRAC"],
                    "Paso SIN ver": ["QQQ", "SPY", "GLD"]
                  };
                  const colorClass = tierLevel === "Excelente" ? "bg-emerald-500 text-slate-900" :
                                     tierLevel === "Muy bueno" ? "bg-cyan-500 text-slate-900" :
                                     tierLevel === "Bueno" ? "bg-amber-500 text-slate-900" :
                                     "bg-red-500 text-slate-900";
                  
                  return (
                    <div key={tierLevel} className="flex border-b border-gray-800 last:border-0">
                      <div className={`w-32 ${colorClass} font-black text-xs uppercase flex items-center justify-center p-3 text-center shrink-0`}>
                        {tierLevel}
                      </div>
                      <div className="flex-1 bg-gray-900/40 p-3 flex flex-wrap gap-2 items-center">
                        {tierTickers[tierLevel].map((sym) => (
                          <button
                            key={sym}
                            onClick={() => selectResearchTickerDirect(sym)}
                            className="px-3.5 py-1.5 bg-gray-800 hover:bg-amber-500 hover:text-slate-900 border border-gray-700/80 rounded-xl text-xs font-mono font-black text-white transition cursor-pointer"
                          >
                            {sym}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ─── REGISTRAR COMPRA MODAL ────────────────────────────────────────── */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <div>
              <h3 className="text-lg font-extrabold font-plus-jakarta text-white">Registrar Inversión</h3>
              <p className="text-xs text-gray-400 mt-1">Registra la compra simulada de un activo para actualizar tu portafolio.</p>
            </div>

            <form onSubmit={handleRegisterBuy} className="space-y-4">
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Símbolo (Ticker)</label>
                  <a 
                    href="https://finance.yahoo.com/lookup" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-amber-500 hover:underline font-bold"
                  >
                    Buscar símbolo ↗
                  </a>
                </div>
                <input 
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onBlur={handleTickerBlur}
                  placeholder="Ej: VOO, NAFTRAC, VTI, CETES..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cantidad</label>
                  <input 
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="1"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition"
                    min="0.0001"
                    step="any"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Categoría (Sección)</label>
                  <input 
                    type="text"
                    list="secciones-list"
                    value={seccion}
                    onChange={(e) => setSeccion(e.target.value)}
                    placeholder="Ej: ETFs, Tecnología..."
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition h-[38px]"
                    required
                  />
                  <datalist id="secciones-list">
                    {(status?.secciones?.length > 0 
                      ? status.secciones 
                      : [
                          { nombre_seccion: "General" },
                          { nombre_seccion: "Tecnología" },
                          { nombre_seccion: "Bienes Raíces" },
                          { nombre_seccion: "Salud" },
                          { nombre_seccion: "Renta Fija" },
                          { nombre_seccion: "Efectivo" }
                        ]
                    ).map((sec: any) => (
                      <option key={sec.nombre_seccion} value={sec.nombre_seccion} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tipo de Instrumento</label>
                <select 
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                  required
                >
                  <option value="" disabled>Seleccionar...</option>
                  <option value="Stocks">Stocks</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Treasury bonds">Treasury bonds</option>
                  <option value="Sectors">Sectors</option>
                  <option value="ETFs">ETFs</option>
                </select>
              </div>

              {buyError && (
                <div className="p-3 bg-red-950/20 border border-red-800/30 text-red-200 rounded-xl text-xs flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{buyError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowBuyModal(false)}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={buying}
                  className="gostock-btn-primary py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  {buying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Registrar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
