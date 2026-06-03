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
  ChevronRight,
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
  Award,
  Trash2,
  Edit2
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
  const [precioUnitario, setPrecioUnitario] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [seccion, setSeccion] = useState("");
  const [yahooCategory, setYahooCategory] = useState("");
  const [yahooFundFamily, setYahooFundFamily] = useState("");
  const [instrumentType, setInstrumentType] = useState("");
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [montoUSD, setMontoUSD] = useState("");
  const [porcentajeInversion, setPorcentajeInversion] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyEtfInfo, setBuyEtfInfo] = useState<any>(null);
  const [loadingBuyEtf, setLoadingBuyEtf] = useState(false);

  // Estados para objetivo de instrumento y edición en caliente
  const [porcentajeObjetivoInstrumento, setPorcentajeObjetivoInstrumento] = useState("");
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Lista estática de ETFs populares para comparación rápida
  const [showPopularETFs, setShowPopularETFs] = useState(true);

  // Acordeón de la tabla de distribución
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Estados para sub-portafolios de instrumentos
  const [expandedSubPortfolios, setExpandedSubPortfolios] = useState<Record<string, boolean>>({});
  const [configuringSubPortfolio, setConfiguringSubPortfolio] = useState<{ ticker: string; seccion: string; propietario: string } | null>(null);
  const [subPortfolioType, setSubPortfolioType] = useState<'porcentajes' | 'ahorro'>('porcentajes');
  const [subPortfolioItems, setSubPortfolioItems] = useState<Array<{ ticker: string; porcentaje: number }>>([]);
  const [subPortfolioAhorro, setSubPortfolioAhorro] = useState({
    institucion: "",
    inicial: "",
    mensual: "",
    moneda: "USD"
  });
  const [savingSubPortfolio, setSavingSubPortfolio] = useState(false);

  // Filtros de dueño / propietario
  const [propietarioFilter, setPropietarioFilter] = useState<string>("Todos");
  const [propietarioBuy, setPropietarioBuy] = useState<string>("Pash");

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

  const toggleSubPortfolioExpand = (ticker: string, propietario: string) => {
    const key = `${ticker}_${propietario}`;
    setExpandedSubPortfolios(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const startConfigureSubPortfolio = (ticker: string, seccion: string, propietario: string, existingSubPortfolio?: any) => {
    setConfiguringSubPortfolio({ ticker, seccion, propietario });
    if (existingSubPortfolio) {
      setSubPortfolioType(existingSubPortfolio.tipo);
      if (existingSubPortfolio.tipo === 'porcentajes') {
        setSubPortfolioItems(existingSubPortfolio.metadata?.valores || []);
        setSubPortfolioAhorro({ institucion: "", inicial: "", mensual: "", moneda: "USD" });
      } else {
        setSubPortfolioItems([]);
        setSubPortfolioAhorro({
          institucion: existingSubPortfolio.metadata?.institucion || "",
          inicial: existingSubPortfolio.metadata?.inicial?.toString() || "",
          mensual: existingSubPortfolio.metadata?.mensual?.toString() || "",
          moneda: existingSubPortfolio.metadata?.moneda || "USD"
        });
      }
    } else {
      const isPpr = seccion.toUpperCase().includes("PPR");
      const initialType = isPpr ? 'ahorro' : 'porcentajes';
      setSubPortfolioType(initialType);
      setSubPortfolioItems([{ ticker: "", porcentaje: 100 }]);
      setSubPortfolioAhorro({
        institucion: "",
        inicial: "",
        mensual: "",
        moneda: status?.moneda || "USD"
      });
    }
  };

  const addSubPortfolioRow = () => {
    setSubPortfolioItems(prev => [...prev, { ticker: "", porcentaje: 0 }]);
  };

  const removeSubPortfolioRow = (index: number) => {
    setSubPortfolioItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateSubPortfolioRow = (index: number, field: 'ticker' | 'porcentaje', value: string) => {
    setSubPortfolioItems(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [field]: field === 'porcentaje' ? (parseFloat(value) || 0) : value.toUpperCase()
        };
      }
      return item;
    }));
  };

  const handleSaveSubPortfolio = async () => {
    if (!configuringSubPortfolio || !selectedPortfolioId || !userId) return;
    setSavingSubPortfolio(true);
    try {
      const { ticker, propietario } = configuringSubPortfolio;
      let metadata: any = {};
      
      if (subPortfolioType === 'porcentajes') {
        const validItems = subPortfolioItems.filter(item => item.ticker.trim() !== "");
        if (validItems.length === 0) {
          alert("Debes agregar al menos un instrumento válido.");
          setSavingSubPortfolio(false);
          return;
        }
        
        const sum = validItems.reduce((acc, curr) => acc + curr.porcentaje, 0);
        if (Math.abs(sum - 100) > 0.01) {
          alert(`La suma de los porcentajes debe ser exactamente 100% (Suma actual: ${sum}%).`);
          setSavingSubPortfolio(false);
          return;
        }
        
        metadata = { valores: validItems };
      } else {
        if (!subPortfolioAhorro.institucion.trim()) {
          alert("Debes ingresar el nombre de la institución.");
          setSavingSubPortfolio(false);
          return;
        }
        
        metadata = {
          institucion: subPortfolioAhorro.institucion,
          inicial: parseFloat(subPortfolioAhorro.inicial) || 0,
          mensual: parseFloat(subPortfolioAhorro.mensual) || 0,
          moneda: subPortfolioAhorro.moneda
        };
      }
      
      const res = await backendApi.saveInstrumentSubPortfolio(
        selectedPortfolioId,
        userId,
        ticker,
        subPortfolioType,
        metadata,
        propietario
      );
      
      if (res.success) {
        setConfiguringSubPortfolio(null);
        const key = `${ticker}_${propietario}`;
        setExpandedSubPortfolios(prev => ({ ...prev, [key]: true }));
        await refreshPortfolioStatus(selectedPortfolioId, userId);
      } else {
        alert("Error al guardar sub-portafolio.");
      }
    } catch (err: any) {
      alert("Error de red al guardar: " + err.message);
    } finally {
      setSavingSubPortfolio(false);
    }
  };

  const handleDeleteSubPortfolio = async (ticker: string, propietario: string) => {
    if (!selectedPortfolioId || !userId) return;
    if (!confirm(`¿Estás seguro de eliminar la configuración del portafolio para ${ticker} (${propietario})?`)) return;
    
    try {
      const res = await backendApi.deleteInstrumentSubPortfolio(selectedPortfolioId, userId, ticker, propietario);
      if (res.success) {
        const key = `${ticker}_${propietario}`;
        setExpandedSubPortfolios(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        await refreshPortfolioStatus(selectedPortfolioId, userId);
      } else {
        alert("Error al eliminar sub-portafolio.");
      }
    } catch (err: any) {
      alert("Error de red al eliminar: " + err.message);
    }
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
    if (id === "NEW") {
      router.push("/portfolios/new");
      return;
    }

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

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolioId) return;
    if (!confirm("⚠️ ADVERTENCIA: ¿Estás completamente seguro de borrar este portafolio? Se eliminarán todas las compras, saldos e historial de manera permanente.")) return;
    
    try {
      const result = await backendApi.deletePortfolio(selectedPortfolioId, userId);
      if (result.success) {
        alert("Portafolio eliminado correctamente.");
        localStorage.removeItem("selected_portfolio_id");
        window.location.reload(); // Recarga la app para re-inicializar el estado
      } else {
        alert(result.message || "Error al eliminar el portafolio.");
      }
    } catch (err) {
      alert("Error de conexión al eliminar.");
    }
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
      // 1. Depositar los fondos primero
      const amountToDeposit = parseFloat(rebalanceAmount);
      if (amountToDeposit > 0) {
        await backendApi.depositFunds(selectedPortfolioId, userId, amountToDeposit);
      }

      // 2. Ejecutar las compras
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
      alert(`¡Se aplicó el rebalanceo! Se depositaron $${amountToDeposit.toLocaleString()} USD y se registraron ${appliedCount} inversiones simuladas distribuidas.`);
      await refreshPortfolioStatus(selectedPortfolioId, userId);
    } catch (err: any) {
      alert(`Error al aplicar rebalanceo: ${err.message}`);
    } finally {
      setApplyingRebalance(false);
    }
  };

  const resetBuyModal = () => {
    setShowBuyModal(false);
    setTicker("");
    setPrecioUnitario("");
    setCantidad("1");
    setSeccion("");
    setYahooCategory("");
    setYahooFundFamily("");
    setInstrumentType("");
    setLivePrice(null);
    setMontoUSD("");
    setPorcentajeInversion("");
    setBuyError(null);
    setBuyEtfInfo(null);
    setPorcentajeObjetivoInstrumento("");
    setPropietarioBuy("Pash");
  };

  const handleOpenBuyModal = () => {
    if (status?.secciones && status.secciones.length > 0) {
      setSeccion(status.secciones[0].nombre_seccion);
    }
    setShowBuyModal(true);
  };

  const handlePrecioUnitarioChange = (val: string) => {
    setPrecioUnitario(val);
    const price = parseFloat(val) || 0;
    if (price <= 0) {
      setCantidad("");
      setMontoUSD("");
      setPorcentajeInversion("");
      return;
    }
    // Si ya tenemos MontoUSD, recalculamos la cantidad de títulos
    if (montoUSD && !isNaN(parseFloat(montoUSD))) {
      const m = parseFloat(montoUSD);
      setCantidad((m / price).toString());
    } 
    // Si no hay MontoUSD pero hay cantidad, recalculamos el monto
    else if (cantidad && !isNaN(parseFloat(cantidad))) {
      const cant = parseFloat(cantidad);
      const m = cant * price;
      setMontoUSD(m.toFixed(2));
      if (status?.total_value && status.total_value > 0) {
        setPorcentajeInversion(((m / status.total_value) * 100).toFixed(2));
      }
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
      setBuyError("Debes seleccionar una Clase de Activo.");
      return;
    }

    setBuying(true);
    try {
      const cantFloat = parseFloat(cantidad) || 0;
      const customPrice = parseFloat(precioUnitario) || undefined;
      
      const objVal = porcentajeObjetivoInstrumento ? parseFloat(porcentajeObjetivoInstrumento) : undefined;
      const result = await backendApi.simulateBuy(
        selectedPortfolioId,
        userId,
        ticker.toUpperCase(),
        cantFloat,
        seccion,
        customPrice,
        objVal,
        propietarioBuy
      );

      if (result.success) {
        resetBuyModal();
        await refreshPortfolioStatus(selectedPortfolioId, userId);
      }
    } catch (err: any) {
      setBuyError(err.message || "Error al registrar la compra. Verifica tus fondos.");
    } finally {
      setBuying(false);
    }
  };

  const handleDeleteOperation = async (opId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta compra de prueba? Se revertirá el saldo de efectivo.")) return;
    try {
      const result = await backendApi.deleteOperation(opId, userId);
      if (result.success) {
        await refreshPortfolioStatus(selectedPortfolioId, userId);
      } else {
        alert(result?.message || "No se pudo eliminar la operación.");
      }
    } catch (err: any) {
      alert("Error de conexión al eliminar.");
    }
  };

  const handleSaveInstrumentTarget = async (ticker: string, seccion: string) => {
    if (!selectedPortfolioId || !userId) return;
    try {
      const val = parseFloat(editValue);
      if (isNaN(val) || val < 0 || val > 100) {
        alert("El porcentaje debe ser un número entre 0 y 100.");
        setEditingTicker(null);
        return;
      }
      
      await backendApi.saveInstrumentTarget(selectedPortfolioId, userId, seccion, ticker, val);
      setEditingTicker(null);
      await refreshPortfolioStatus(selectedPortfolioId, userId);
    } catch (err: any) {
      console.error("Error al guardar objetivo de instrumento:", err);
      alert("Error al guardar objetivo: " + err.message);
      setEditingTicker(null);
    }
  };

  const handleTickerBlur = async () => {
    if (!ticker.trim()) return;
    setLoadingBuyEtf(true);
    setBuyError(null);
    try {
      // Autofill from existing holdings if present
      const existingHolding = status?.holdings?.find((h: any) => h.ticker === ticker.trim().toUpperCase());
      if (existingHolding) {
        setSeccion(existingHolding.seccion);
        if (existingHolding.porcentaje_objetivo_clase !== undefined && existingHolding.porcentaje_objetivo_clase !== null) {
          setPorcentajeObjetivoInstrumento(existingHolding.porcentaje_objetivo_clase.toString());
        }
      }

      // 1. Obtener Categoría
      const res = await backendApi.getTickerCategory(ticker.trim());
      let cat = "General";
      let instType = "Stocks";
      let family = "N/A";
      if (res) {
        cat = res.category || "General";
        family = res.fundFamily || "N/A";
        instType = res.instrumentType || "Stocks";
        
        setYahooCategory(cat);
        setYahooFundFamily(family);
        setInstrumentType(instType);
      }
      
      // 2. Obtener Detalles y Precio en Vivo
      const resPrice = await backendApi.getInstrumentDetails(ticker.trim());
      if (resPrice && resPrice.success && resPrice.data) {
        const d = resPrice.data;
        let price = d.precio_actual_vivo || 0;
        const isMxn = status?.moneda === "MXN";
        const rate = status?.usd_mxn_rate || 18.00;
        if (isMxn && price > 0) {
          price = price * rate;
        }
        
        setLivePrice(price > 0 ? price : null);
        if (price > 0) {
          setPrecioUnitario(price.toString());
          // Recalcular montos si ya hay cantidad
          if (cantidad && !isNaN(parseFloat(cantidad))) {
            const val = parseFloat(cantidad);
            const m = val * price;
            setMontoUSD(m.toFixed(2));
            if (status?.total_value && status.total_value > 0) {
              setPorcentajeInversion(((m / status.total_value) * 100).toFixed(2));
            }
          } else if (montoUSD && !isNaN(parseFloat(montoUSD))) {
            const m = parseFloat(montoUSD);
            setCantidad((m / price).toString());
          }
        } else {
          setLivePrice(null);
          setPrecioUnitario("");
        }

        // Crear Ficha del ETF dinámica en tiempo real
        setBuyEtfInfo({
          ticker: d.ticker || ticker.trim().toUpperCase(),
          desc: d.descripcion || d.nombre || `Detalles para ${ticker.trim().toUpperCase()}`,
          fee: d.comision || "N/A",
          retorno5y: d.retorno_5y || "N/A",
          cat: cat,
          clase: existingHolding?.seccion || seccion || "Sin Clase",
          tipo: instType
        });
      } else {
        setLivePrice(null);
        setPrecioUnitario("");
        setYahooCategory("Manual");
        setYahooFundFamily("N/A");
        setInstrumentType("Stocks");
        setBuyEtfInfo(null);
      }
    } catch (err) {
      console.error("Error al obtener detalles del ticker", err);
      setLivePrice(null);
      setPrecioUnitario("");
      setYahooCategory("Manual");
      setYahooFundFamily("N/A");
      setInstrumentType("Stocks");
      setBuyEtfInfo(null);
    } finally {
      setLoadingBuyEtf(false);
    }
  };

  const handleCantidadChange = (val: string) => {
    setCantidad(val);
    const price = parseFloat(precioUnitario) || 0;
    if (!val || isNaN(parseFloat(val)) || price <= 0) {
      setMontoUSD("");
      setPorcentajeInversion("");
      return;
    }
    const cant = parseFloat(val);
    const m = cant * price;
    setMontoUSD(m.toFixed(2));
    if (status?.total_value && status.total_value > 0) {
      setPorcentajeInversion(((m / status.total_value) * 100).toFixed(2));
    } else {
      setPorcentajeInversion("");
    }
  };

  const handleMontoChange = (val: string) => {
    setMontoUSD(val);
    const price = parseFloat(precioUnitario) || 0;
    if (!val || isNaN(parseFloat(val))) {
      setCantidad("");
      setPorcentajeInversion("");
      return;
    }
    const m = parseFloat(val);
    if (price > 0) {
      setCantidad((m / price).toString());
    }
    if (status?.total_value && status.total_value > 0) {
      setPorcentajeInversion(((m / status.total_value) * 100).toFixed(2));
    } else {
      setPorcentajeInversion("");
    }
  };

  const handlePorcentajeChange = (val: string) => {
    setPorcentajeInversion(val);
    const price = parseFloat(precioUnitario) || 0;
    if (!val || isNaN(parseFloat(val)) || !price || !status?.total_value || status.total_value <= 0) {
      setCantidad("");
      setMontoUSD("");
      return;
    }
    const p = parseFloat(val);
    const m = (p / 100) * status.total_value;
    setMontoUSD(m.toFixed(2));
    if (price > 0) {
      setCantidad((m / price).toString());
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

  // 1. Filtrar holdings por propietario
  const filteredHoldings = (status?.holdings || []).filter((h: any) => 
    propietarioFilter === "Todos" || h.propietario === propietarioFilter
  );

  // 2. Calcular valores consolidados según el propietario
  const displayCash = propietarioFilter === "Todos" ? (status?.cash_balance || 0) : 0;
  const displayAssetsValue = filteredHoldings.reduce((sum: number, h: any) => sum + (h.valor_actual || 0), 0);
  const displayTotalValue = propietarioFilter === "Todos" ? (status?.total_value || 0) : displayAssetsValue;

  const displayPnL = filteredHoldings.reduce((sum: number, h: any) => sum + (h.pnl || 0), 0);
  const displayCostTotal = filteredHoldings.reduce((sum: number, h: any) => sum + (h.costo_total || 0), 0);
  const displayPnLPercent = displayCostTotal > 0 ? (displayPnL / displayCostTotal) * 100 : 0;

  // 3. Recalcular secciones (Distribución del Plan)
  const displaySecciones = (status?.secciones || []).map((sec: any) => {
    const secHoldings = filteredHoldings.filter((h: any) => h.seccion === sec.nombre_seccion);
    const valActual = secHoldings.reduce((sum: number, h: any) => sum + (h.valor_actual || 0), 0);
    const pctReal = displayTotalValue > 0 ? (valActual / displayTotalValue) * 100 : 0;
    return {
      ...sec,
      valor_actual: valActual,
      porcentaje_real: pctReal
    };
  });

  // 4. Filtrar y recalcular peso de lotes
  const rawLots = (status?.lots || []).filter((lot: any) =>
    propietarioFilter === "Todos" || lot.propietario === propietarioFilter
  );
  
  const displayLots = rawLots.map((lot: any) => ({
    ...lot,
    peso_portafolio: displayTotalValue > 0 ? (lot.valor_actual / displayTotalValue) * 100 : 0
  }));

  // Filtrado de lotes para la Pestaña 2
  const filteredLots = displayLots.filter((lot: any) => {
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
  const pieData = displaySecciones
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
              <option value="NEW" className="bg-slate-900 text-amber-500 [data-theme='light']:bg-white font-bold">
                ➕ Crear Nuevo Portafolio
              </option>
            </select>
          </div>
          
          <button 
            onClick={handleDeletePortfolio}
            className="w-full text-left text-[10px] text-red-500/70 hover:text-red-500 font-bold uppercase tracking-wider pl-2 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Borrar este portafolio
          </button>
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
        </nav>

        {/* Acciones Rápidas */}
        <div className="pt-4 border-t border-gray-800/60 [data-theme='light']:border-gray-200/60 space-y-2">
          <button 
            onClick={handleOpenBuyModal} 
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
            
            {/* Selector de Propietario */}
            <div className="flex items-center gap-2 bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl px-3 py-1.5 text-xs text-white [data-theme='light']:text-gray-900">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Dueño:</span>
              <select
                value={propietarioFilter}
                onChange={(e) => setPropietarioFilter(e.target.value)}
                className="bg-transparent border-none text-white [data-theme='light']:text-gray-900 font-bold focus:outline-none cursor-pointer"
              >
                <option value="Todos" className="bg-slate-900 text-white [data-theme='light']:bg-white [data-theme='light']:text-gray-900">Todos</option>
                <option value="Chari" className="bg-slate-900 text-white [data-theme='light']:bg-white [data-theme='light']:text-gray-900">Chari</option>
                <option value="Milio" className="bg-slate-900 text-white [data-theme='light']:bg-white [data-theme='light']:text-gray-900">Milio</option>
                <option value="Pash" className="bg-slate-900 text-white [data-theme='light']:bg-white [data-theme='light']:text-gray-900">Pash</option>
                <option value="Otro" className="bg-slate-900 text-white [data-theme='light']:bg-white [data-theme='light']:text-gray-900">Otro</option>
              </select>
            </div>

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
                ${displayTotalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"} {status?.moneda || 'USD'}
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
                ${displayCash?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"} {status?.moneda || 'USD'}
              </h3>
            </div>
          </div>

          {/* Caja 3: Ganancia Absoluta */}
          <div className="gostock-box p-5 flex items-center gap-4 relative overflow-hidden">
            <div className={`p-3.5 rounded-2xl border ${displayPnL >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              {displayPnL >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Ganancia / Pérdida</span>
              <h3 className={`text-xl font-black font-mono mt-1 ${displayPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {displayPnL >= 0 ? "+" : ""}${displayPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"} {status?.moneda || 'USD'}
              </h3>
            </div>
          </div>

          {/* Caja 4: Monto Invertido */}
          <div className="gostock-box p-5 flex items-center gap-4 relative overflow-hidden">
            <div className={`p-3.5 rounded-2xl border bg-blue-500/10 border-blue-500/20 text-blue-400`}>
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Monto Invertido</span>
              <h3 className={`text-xl font-black font-mono mt-1 text-white [data-theme='light']:text-gray-900`}>
                ${((displayAssetsValue || 0) - (displayPnL || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}
              </h3>
            </div>
          </div>

        </section>

        {/* ─── 4. PELES DE NAVEGACIÓN (Vistas del Dashboard) ────────────────────────── */}

        {/* PESTAÑA 1: RESUMEN Y REBALANCEO */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna Izquierda: Tabla de Asignación por Clase de Activo */}
              <div className="lg:col-span-2 gostock-box p-6 space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-white [data-theme='light']:text-gray-900">Distribución del Plan (Asset Allocation)</h3>
                  <p className="text-xs text-gray-500">Compara el objetivo de tu plan contra la valuación real actual</p>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-8 text-white [data-theme='light']:text-gray-900">Clase de Activo</th>
                        <th className="pb-3 text-center text-white [data-theme='light']:text-gray-900">Actual (%)</th>
                        <th className="pb-3 text-right text-white [data-theme='light']:text-gray-900">Inversión Actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs">
                      {displaySecciones?.map((sec: any, idx: number) => {
                        const isExpanded = expandedSections[sec.nombre_seccion];
                        
                        // Encontrar holdings de esta seccion y ordenarlos de mayor a menor por valor_actual
                        const seccionHoldings = filteredHoldings
                          ? filteredHoldings
                              .filter((h: any) => h.seccion === sec.nombre_seccion)
                              .sort((a: any, b: any) => b.valor_actual - a.valor_actual)
                          : [];

                        return (
                          <React.Fragment key={sec.nombre_seccion}>
                            <tr 
                              className="hover:bg-gray-800/20 cursor-pointer transition-colors"
                              onClick={() => setExpandedSections(prev => ({ ...prev, [sec.nombre_seccion]: !prev[sec.nombre_seccion] }))}
                            >
                              <td className="py-4 font-bold text-white [data-theme='light']:text-gray-900 flex items-center gap-2">
                                <button className="text-gray-500 hover:text-white transition-colors p-1">
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                {sec.nombre_seccion}
                              </td>
                              <td className="py-4 text-center font-mono font-bold text-gray-400">{sec.porcentaje_real.toFixed(1)}%</td>
                              <td className="py-4 text-right font-mono text-white [data-theme='light']:text-gray-900">${sec.valor_actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}</td>
                            </tr>
                            
                            {isExpanded && seccionHoldings.length > 0 && seccionHoldings.map((h: any) => {
                              const hasSubPortfolio = h.sub_portafolio !== null && h.sub_portafolio !== undefined;
                              const isSubPortfolioExpanded = expandedSubPortfolios[`${h.ticker}_${h.propietario}`];
                              const isConfiguringThis = configuringSubPortfolio?.ticker === h.ticker && configuringSubPortfolio?.propietario === h.propietario;
                              const editKey = `${h.ticker}_${h.propietario}`;
                              
                              return (
                                <React.Fragment key={editKey}>
                                  <tr className="group bg-gray-900/25 hover:bg-gray-800/10 transition-colors border-t border-gray-800/20">
                                    {/* Col 1: Instrument Details */}
                                    <td className="py-2.5 pl-12">
                                      <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                        <span className="font-bold text-amber-500 font-mono shrink-0">{h.ticker}</span>
                                        {propietarioFilter === "Todos" && (
                                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#111827] border border-gray-800 text-blue-400 font-mono uppercase">
                                            {h.propietario}
                                          </span>
                                        )}
                                        <span className="text-gray-400 truncate max-w-[120px] [data-theme='light']:text-gray-600 font-medium" title={h.nombre}>
                                          {h.nombre}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono ml-auto">
                                          ({h.cantidad.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} tit.)
                                        </span>
                                        
                                        {/* Acciones de Sub-portafolio */}
                                        {hasSubPortfolio ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleSubPortfolioExpand(h.ticker, h.propietario);
                                            }}
                                            className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5 hover:bg-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                                            title="Ver portafolio de este instrumento"
                                          >
                                            <Briefcase className="w-2.5 h-2.5" />
                                            {isSubPortfolioExpanded ? 'Ocultar' : 'Portafolio'}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startConfigureSubPortfolio(h.ticker, h.seccion, h.propietario);
                                            }}
                                            className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded px-1.5 py-0.5 hover:bg-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                                            title="Configurar sub-portafolio"
                                          >
                                            <Briefcase className="w-2.5 h-2.5" />
                                            Añadir
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    
                                    {/* Col 2: Actual % */}
                                    <td className="py-2.5 text-center font-mono">
                                      <div className="text-gray-300">{(h.porcentaje_real_clase || 0).toFixed(1)}%</div>
                                      <div className="text-[9px] text-gray-500 mt-0.5">({(h.porcentaje_real_total || 0).toFixed(2)}% total)</div>
                                    </td>

                                    {/* Col 3: Inversión Actual */}
                                    <td className="py-2.5 text-right font-mono text-white [data-theme='light']:text-gray-900">
                                      ${h.valor_actual.toLocaleString(undefined, { minimumFractionDigits: 2 })} {status?.moneda || 'USD'}
                                    </td>
                                  </tr>

                                  {/* RENDERIZAR EDICIÓN DEL SUBPORTAFOLIO */}
                                  {isConfiguringThis && (
                                    <tr className="bg-slate-900/40 border-t border-b border-gray-800">
                                      <td colSpan={3} className="py-4 pl-16 pr-6">
                                        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 space-y-4">
                                          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                                            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider">
                                              Configurar Portafolio para {h.ticker} ({h.propietario})
                                            </h4>
                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => setSubPortfolioType('porcentajes')}
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition border ${subPortfolioType === 'porcentajes' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-transparent text-gray-400 border-gray-800 hover:text-white'}`}
                                              >
                                                Distribución % (ETFs)
                                              </button>
                                              <button 
                                                onClick={() => setSubPortfolioType('ahorro')}
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition border ${subPortfolioType === 'ahorro' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-transparent text-gray-400 border-gray-800 hover:text-white'}`}
                                              >
                                                Plan Ahorro (PPR)
                                              </button>
                                            </div>
                                          </div>
                                          
                                          {subPortfolioType === 'porcentajes' ? (
                                            <div className="space-y-3">
                                              <p className="text-[10px] text-gray-500">Distribuye el valor de este instrumento en un portafolio de activos. La suma de los porcentajes debe ser exactamente 100%.</p>
                                              <div className="space-y-2">
                                                {subPortfolioItems.map((item, idx) => (
                                                  <div key={idx} className="flex items-center gap-3">
                                                    <input 
                                                      type="text" 
                                                      placeholder="Ticker (ej: VTI)" 
                                                      value={item.ticker}
                                                      onChange={(e) => updateSubPortfolioRow(idx, 'ticker', e.target.value)}
                                                      className="w-1/3 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-amber-500"
                                                    />
                                                    <div className="relative w-1/3">
                                                      <input 
                                                        type="number" 
                                                        placeholder="Porcentaje" 
                                                        value={item.porcentaje || ""}
                                                        onChange={(e) => updateSubPortfolioRow(idx, 'porcentaje', e.target.value)}
                                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 pr-8 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                                        min="0"
                                                        max="100"
                                                      />
                                                      <span className="absolute right-3 top-2 text-xs text-gray-500 font-mono">%</span>
                                                    </div>
                                                    {subPortfolioItems.length > 1 && (
                                                      <button 
                                                        onClick={() => removeSubPortfolioRow(idx)}
                                                        className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                              
                                              <div className="flex justify-between items-center pt-2">
                                                <button 
                                                  onClick={addSubPortfolioRow}
                                                  className="text-[10px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1.5"
                                                >
                                                  <Plus className="w-3.5 h-3.5" /> Agregar Activo
                                                </button>
                                                <span className={`text-[10px] font-mono font-bold ${Math.abs(subPortfolioItems.reduce((acc, curr) => acc + curr.porcentaje, 0) - 100) < 0.01 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                  Suma: {subPortfolioItems.reduce((acc, curr) => acc + curr.porcentaje, 0)}%
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="col-span-2 space-y-1">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Institución / Gestor</label>
                                                <input 
                                                  type="text" 
                                                  placeholder="ej: Fintual, Allianz, etc." 
                                                  value={subPortfolioAhorro.institucion}
                                                  onChange={(e) => setSubPortfolioAhorro(prev => ({ ...prev, institucion: e.target.value }))}
                                                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Aportación Inicial</label>
                                                <input 
                                                  type="number" 
                                                  placeholder="ej: 3000" 
                                                  value={subPortfolioAhorro.inicial}
                                                  onChange={(e) => setSubPortfolioAhorro(prev => ({ ...prev, inicial: e.target.value }))}
                                                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Aportación Mensual</label>
                                                <input 
                                                  type="number" 
                                                  placeholder="ej: 50" 
                                                  value={subPortfolioAhorro.mensual}
                                                  onChange={(e) => setSubPortfolioAhorro(prev => ({ ...prev, mensual: e.target.value }))}
                                                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                                                />
                                              </div>
                                              <div className="col-span-2 space-y-1">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Moneda</label>
                                                <select 
                                                  value={subPortfolioAhorro.moneda}
                                                  onChange={(e) => setSubPortfolioAhorro(prev => ({ ...prev, moneda: e.target.value }))}
                                                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                                >
                                                  <option value="USD">USD ($)</option>
                                                  <option value="MXN">MXN ($)</option>
                                                  <option value="EUR">EUR (€)</option>
                                                </select>
                                              </div>
                                            </div>
                                          )}
                                          
                                          <div className="flex gap-2 justify-end pt-2 border-t border-gray-800">
                                            <button 
                                              onClick={() => setConfiguringSubPortfolio(null)}
                                              className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                                            >
                                              Cancelar
                                            </button>
                                            <button 
                                              onClick={handleSaveSubPortfolio}
                                              disabled={savingSubPortfolio}
                                              className="px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-amber-400 transition flex items-center gap-1.5"
                                            >
                                              {savingSubPortfolio && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                              Guardar
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}

                                  {/* RENDERIZAR DETALLES DEL SUBPORTAFOLIO */}
                                  {isSubPortfolioExpanded && hasSubPortfolio && (
                                    <tr className="bg-slate-950/20 border-t border-gray-800/10">
                                      <td colSpan={3} className="py-3 pl-16 pr-6">
                                        <div className="bg-slate-900/30 border border-gray-800/60 rounded-xl p-4 space-y-3">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                                              Composición de Portafolio: {h.ticker} ({h.propietario})
                                            </span>
                                            <div className="flex gap-2">
                                              <button 
                                                onClick={() => startConfigureSubPortfolio(h.ticker, h.seccion, h.propietario, h.sub_portafolio)}
                                                className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase flex items-center gap-1"
                                              >
                                                <Edit2 className="w-3 h-3" /> Editar
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteSubPortfolio(h.ticker, h.propietario)}
                                                className="text-[9px] text-red-500/80 hover:text-red-500 font-bold uppercase flex items-center gap-1"
                                              >
                                                <Trash2 className="w-3 h-3" /> Eliminar
                                              </button>
                                            </div>
                                          </div>
                                          
                                          {h.sub_portafolio.tipo === 'porcentajes' ? (
                                            <div className="overflow-hidden border border-gray-800/50 rounded-lg">
                                              <table className="w-full text-left border-collapse text-[11px]">
                                                <thead>
                                                  <tr className="bg-gray-950/40 text-[9px] text-gray-500 uppercase font-black border-b border-gray-800/50">
                                                    <th className="py-2 px-3">Activo</th>
                                                    <th className="py-2 px-3 text-center">Porcentaje (%)</th>
                                                    <th className="py-2 px-3 text-right">Valor Asignado</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-800/30 font-mono">
                                                  {(h.sub_portafolio.metadata?.valores || []).map((vItem: any, vIdx: number) => {
                                                    const itemVal = (vItem.porcentaje / 100) * h.valor_actual;
                                                    return (
                                                      <tr key={vIdx} className="hover:bg-gray-800/10">
                                                        <td className="py-2 px-3 font-bold text-amber-500">{vItem.ticker}</td>
                                                        <td className="py-2 px-3 text-center text-gray-300">{vItem.porcentaje}%</td>
                                                        <td className="py-2 px-3 text-right text-white">
                                                          ${itemVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                  {/* Fila de Totales de Sub-portafolio */}
                                                  {h.sub_portafolio.metadata?.valores?.length > 0 && (() => {
                                                    const subP = h.sub_portafolio.metadata.valores;
                                                    const totalPct = subP.reduce((sum: number, vi: any) => sum + (vi.porcentaje || 0), 0);
                                                    const totalVal = subP.reduce((sum: number, vi: any) => sum + ((vi.porcentaje / 100) * h.valor_actual), 0);
                                                    return (
                                                      <tr className="border-t border-gray-700 bg-gray-950/30 font-bold">
                                                        <td className="py-2 px-3 text-white [data-theme='light']:text-gray-900 uppercase">Total</td>
                                                        <td className="py-2 px-3 text-center text-gray-300">{totalPct.toFixed(1)}%</td>
                                                        <td className="py-2 px-3 text-right text-white">
                                                          ${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}
                                                        </td>
                                                      </tr>
                                                    );
                                                  })()}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <div className="bg-gray-950/20 border border-gray-800/40 rounded-lg p-3 text-xs flex flex-wrap gap-x-8 gap-y-2">
                                              <div>
                                                <span className="text-[10px] text-gray-500 block uppercase font-bold">Institución</span>
                                                <span className="font-bold text-white">{h.sub_portafolio.metadata?.institucion}</span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-gray-500 block uppercase font-bold">Inversión Inicial</span>
                                                <span className="font-bold font-mono text-white">
                                                  ${(h.sub_portafolio.metadata?.inicial || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {h.sub_portafolio.metadata?.moneda || status?.moneda}
                                                </span>
                                              </div>
                                              <div>
                                                <span className="text-[10px] text-gray-500 block uppercase font-bold">Aportación Mensual</span>
                                                <span className="font-bold font-mono text-amber-500">
                                                  +${(h.sub_portafolio.metadata?.mensual || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {h.sub_portafolio.metadata?.moneda || status?.moneda} / mes
                                                </span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            
                            {/* Fila de Totales de la Clase */}
                            {isExpanded && seccionHoldings.length > 0 && (() => {
                              const totalClassTargetObj = seccionHoldings.reduce((sum: number, sh: any) => sum + (sh.porcentaje_objetivo_clase || 0), 0);
                              const totalClassRealObj = seccionHoldings.reduce((sum: number, sh: any) => sum + (sh.porcentaje_real_clase || 0), 0);
                              const totalClassValActual = seccionHoldings.reduce((sum: number, sh: any) => sum + (sh.valor_actual || 0), 0);
                              const totalClassDesviacion = seccionHoldings.reduce((sum: number, sh: any) => sum + (sh.desviacion_valor || 0), 0);
                              return (
                                <tr className="bg-gray-800/10 border-t border-b-2 border-gray-700/80 font-bold">
                                  <td className="py-2.5 pl-12 text-white [data-theme='light']:text-gray-900 font-extrabold uppercase">Total Clase</td>
                                  <td className="py-2.5 text-center font-mono text-gray-300">{totalClassTargetObj.toFixed(1)}%</td>
                                  <td className="py-2.5 text-center font-mono text-gray-300">{totalClassRealObj.toFixed(1)}%</td>
                                  <td className="py-2.5 text-right font-mono text-white [data-theme='light']:text-gray-900">${totalClassValActual.toLocaleString(undefined, { minimumFractionDigits: 2 })} {status?.moneda || 'USD'}</td>
                                  <td className={`py-2.5 text-right font-mono ${totalClassDesviacion >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {totalClassDesviacion >= 0 ? "+" : ""}${totalClassDesviacion.toLocaleString(undefined, { minimumFractionDigits: 2 })} {status?.moneda || 'USD'}
                                  </td>
                                </tr>
                              );
                            })()}

                            {/* Alerta si la suma de los objetivos de la clase no es 100% */}
                            {isExpanded && seccionHoldings.length > 0 && (() => {
                              const sumTargets = seccionHoldings.reduce((sum: number, sh: any) => sum + (sh.porcentaje_objetivo_clase || 0), 0);
                              if (Math.abs(sumTargets - 100.0) > 0.05) {
                                return (
                                  <tr className="bg-amber-950/10">
                                    <td colSpan={3} className="py-2 pl-12 pr-4 text-[10px] text-amber-500 font-semibold border-t border-gray-800/30">
                                      <div className="flex items-center gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                        <span>El objetivo de los instrumentos en esta clase suma {sumTargets.toFixed(1)}% (debería ser 100.0%).</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                              return null;
                            })()}
                            
                            {isExpanded && seccionHoldings.length === 0 && (
                              <tr className="bg-gray-900/30">
                                <td colSpan={3} className="py-3 px-12 text-xs text-gray-500 italic">
                                  Sin instrumentos en esta clase
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {/* Fila de Totales de la Tabla Principal */}
                      {displaySecciones.length > 0 && (() => {
                        const totalReal = displaySecciones.reduce((sum: number, s: any) => sum + (s.porcentaje_real || 0), 0);
                        const totalActual = displaySecciones.reduce((sum: number, s: any) => sum + (s.valor_actual || 0), 0);
                        return (
                          <tr className="border-t-2 border-gray-700 bg-gray-900/50 font-bold">
                            <td className="py-4 pl-8 text-white [data-theme='light']:text-gray-900 font-extrabold uppercase">Total</td>
                            <td className="py-4 text-center font-mono text-gray-300">{totalReal.toFixed(1)}%</td>
                            <td className="py-4 text-right font-mono text-white [data-theme='light']:text-gray-900">${totalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })} {status?.moneda || 'USD'}</td>
                          </tr>
                        );
                      })()}
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
                      <span className="absolute right-4 top-2 text-[9px] text-gray-500 font-black">{status?.moneda || 'USD'}</span>
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
                        <div key={rec.nombre_seccion} className="flex justify-between items-center bg-gray-950/40 [data-theme='light']:bg-gray-100 p-2.5 rounded-lg border border-gray-800 [data-theme='light']:border-gray-200">
                          <span className="text-gray-400 [data-theme='light']:text-gray-600 font-bold truncate max-w-[120px]">{rec.nombre_seccion}</span>
                          <div className="text-right font-mono">
                            <span className="text-amber-500 font-bold block">${rec.monto_sugerido.toLocaleString(undefined, { minimumFractionDigits: 2 })} {status?.moneda || 'USD'}</span>
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

                {/* Filtro por Clase de Activo */}
                <select
                  value={posFilterSection}
                  onChange={(e) => setPosFilterSection(e.target.value)}
                  className="bg-[#111827] [data-theme='light']:bg-white border border-gray-800 [data-theme='light']:border-gray-300 rounded-xl px-3 py-2 text-xs text-white [data-theme='light']:text-gray-900 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="">Todas las Clases</option>
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
                    <th className="p-3 text-center">Origen</th>
                    <th className="p-3">Clase de Activo</th>
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
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-xs">
                  {sortedLots.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="p-8 text-center text-gray-500">
                        No se encontraron lotes de inversiones que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {sortedLots.map((lot: any) => {
                        const isPos = lot.pnl >= 0;
                        return (
                          <tr key={lot.id} className="hover:bg-gray-800/10">
                            <td className="p-3 text-center font-mono font-bold text-gray-400">
                              {new Date(lot.fecha_adquisicion).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => selectResearchTickerDirect(lot.ticker)}
                                  className="font-black text-amber-500 hover:underline cursor-pointer bg-transparent border-none text-left"
                                >
                                  {lot.ticker}
                                </button>
                                {propietarioFilter === "Todos" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#111827] border border-gray-800 text-blue-400 font-mono uppercase">
                                    {lot.propietario}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-semibold text-white [data-theme='light']:text-gray-900 truncate max-w-[150px]">{lot.nombre}</td>
                            <td className="p-3 text-center font-bold text-gray-500">{lot.origen}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/10 text-indigo-400">
                                {lot.seccion}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-gray-300">{lot.cantidad.toFixed(4)}</td>
                            <td className="p-3 text-right font-mono text-gray-400">${lot.precio_compra.toFixed(2)} {status?.moneda || 'USD'}</td>
                            <td className="p-3 text-right font-mono text-gray-400">${lot.precio_actual.toFixed(2)} {status?.moneda || 'USD'}</td>
                            <td className="p-3 text-right font-mono text-white [data-theme='light']:text-gray-900">${lot.valor_actual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}</td>
                            <td className={`p-3 text-right font-mono font-bold ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                              {isPos ? "+" : ""}${lot.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}
                            </td>
                            <td className={`p-3 text-right font-mono font-bold ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                              {isPos ? "+" : ""}{lot.pnl_percent.toFixed(2)}%
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-gray-500">{lot.peso_portafolio.toFixed(2)}%</td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => handleDeleteOperation(lot.id)}
                                className="text-red-500 hover:text-red-400 cursor-pointer p-1 rounded-md hover:bg-red-500/10 transition"
                                title="Borrar lote de prueba"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Fila de Totales de Posiciones */}
                      {(() => {
                        const totalVal = sortedLots.reduce((sum: number, l: any) => sum + (l.valor_actual || 0), 0);
                        const totalPnL = sortedLots.reduce((sum: number, l: any) => sum + (l.pnl || 0), 0);
                        const totalCost = sortedLots.reduce((sum: number, l: any) => sum + (l.costo_total || 0), 0);
                        const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
                        const totalWeight = sortedLots.reduce((sum: number, l: any) => sum + (l.peso_portafolio || 0), 0);
                        const isPos = totalPnL >= 0;
                        return (
                          <tr className="border-t-2 border-gray-700 bg-gray-950/60 font-bold">
                            <td className="p-3 text-center text-white [data-theme='light']:text-gray-900 uppercase">Total</td>
                            <td className="p-3"></td>
                            <td className="p-3"></td>
                            <td className="p-3"></td>
                            <td className="p-3"></td>
                            <td className="p-3"></td>
                            <td className="p-3"></td>
                            <td className="p-3"></td>
                            <td className="p-3 text-right font-mono text-white [data-theme='light']:text-gray-900">${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}</td>
                            <td className={`p-3 text-right font-mono ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                              {isPos ? "+" : ""}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {status?.moneda || 'USD'}
                            </td>
                            <td className={`p-3 text-right font-mono ${isPos ? "text-emerald-500" : "text-red-500"}`}>
                              {isPos ? "+" : ""}{totalPnLPercent.toFixed(2)}%
                            </td>
                            <td className="p-3 text-right font-mono text-gray-300">{totalWeight.toFixed(2)}%</td>
                            <td className="p-3"></td>
                          </tr>
                        );
                      })()}
                    </>
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
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50">
          <div className="h-full overflow-y-auto py-6 px-4 flex justify-center">
            <div className="bg-[#0d1117] border border-gray-800 rounded-3xl max-w-3xl w-full shadow-2xl relative self-start">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-extrabold text-white">Registrar Compra</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Escribe el símbolo (ticker) del activo para iniciar el registro</p>
              </div>
              <button onClick={resetBuyModal} className="text-gray-500 hover:text-white transition text-xl font-bold leading-none cursor-pointer px-2">&times;</button>
            </div>

            <div className="p-6 space-y-6">

              {/* ── SECCIÓN 2: Panel del ETF seleccionado ── */}
              {buyEtfInfo && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ficha del ETF Seleccionado</h4>
                  </div>

                  {/* Descripción + meta */}
                  <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <span className="font-black font-mono text-amber-400 text-base">{buyEtfInfo.ticker}</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-300 leading-relaxed">{buyEtfInfo.desc}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-bold">{buyEtfInfo.cat}</span>
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full text-[9px] font-bold">{buyEtfInfo.clase}</span>
                          <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full text-[9px] font-bold">{buyEtfInfo.tipo}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cajas de datos clave */}
                    {(() => {
                      const activePct = parseFloat(porcentajeInversion) || 10;
                      const activeMonto = parseFloat(montoUSD) || ((activePct / 100) * (status?.total_value || 3500));
                      const mensual = (activePct / 100) * 50; // Aporte mensual basado en el peso objetivo
                      const tasa = parseFloat(buyEtfInfo.retorno5y) / 100 || 0.08; // Default 8% if N/A
                      const tasaMensual = tasa / 12;
                      const meses = 120; // 10 años
                      const futuroInicial = activeMonto * Math.pow(1 + tasa, 10);
                      const futuroAportaciones = mensual > 0 && tasaMensual > 0
                        ? mensual * ((Math.pow(1 + tasaMensual, meses) - 1) / tasaMensual)
                        : mensual * meses;
                      const totalFuturo = futuroInicial + futuroAportaciones;
                      const totalInvertido = activeMonto + (mensual * meses);
                      const ganancia = totalFuturo - totalInvertido;
                      const currencySymbol = status?.moneda || 'USD';

                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Comisión */}
                            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Comisión (TER)</span>
                              <span className="text-lg font-black font-mono text-white block">{buyEtfInfo.fee}</span>
                              <span className="text-[9px] text-gray-600">anual</span>
                            </div>
                            {/* Costo ponderado */}
                            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Peso Estimado</span>
                              <span className="text-lg font-black font-mono text-amber-400 block">{activePct.toFixed(1)}%</span>
                              <span className="text-[9px] text-gray-600">del total</span>
                            </div>
                            {/* Monto asignado */}
                            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Monto Asignado</span>
                              <span className="text-base font-black font-mono text-emerald-400 block">
                                ${activeMonto.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:2})} <span className="text-[9px] text-gray-500 font-normal">{currencySymbol}</span>
                              </span>
                              <span className="text-[9px] text-gray-600">esta operación</span>
                            </div>
                            {/* Rendimiento histórico 5y */}
                            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Rend. Histórico</span>
                              <span className={`text-lg font-black font-mono block ${ parseFloat(buyEtfInfo.retorno5y) >= 0 || buyEtfInfo.retorno5y === "N/A" ? 'text-emerald-400' : 'text-red-400' }`}>{buyEtfInfo.retorno5y}</span>
                              <span className="text-[9px] text-gray-600">promedio 5 años</span>
                            </div>
                          </div>

                          {/* Proyección: Inversión inicial + aportaciones mensuales */}
                          <div className="border-t border-gray-800/60 pt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Proyección a 10 años (rendimiento estimado {buyEtfInfo.retorno5y !== 'N/A' ? buyEtfInfo.retorno5y : '8.0%'})</span>
                              {!porcentajeInversion && (
                                <span className="text-[8px] text-amber-500 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-full">Vista Previa (10%)</span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-gray-950/40 rounded-xl p-3 border border-gray-800/50 text-center">
                                <span className="text-[9px] text-gray-500 block font-bold uppercase">Invertido Total</span>
                                <span className="font-mono font-black text-sm text-gray-300 block mt-1">${totalInvertido.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</span>
                                <span className="text-[9px] text-gray-600">${activeMonto.toFixed(0)} inicial + ${(mensual*meses).toFixed(0)} aportes</span>
                              </div>
                              <div className="bg-emerald-950/20 rounded-xl p-3 border border-emerald-800/30 text-center">
                                <span className="text-[9px] text-gray-500 block font-bold uppercase">Rendimiento</span>
                                <span className="font-mono font-black text-sm text-emerald-400 block mt-1">+${ganancia.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</span>
                                <span className="text-[9px] text-emerald-600">{buyEtfInfo.retorno5y !== 'N/A' ? buyEtfInfo.retorno5y : '8.0%'} / año (est.)</span>
                              </div>
                              <div className="bg-amber-950/20 rounded-xl p-3 border border-amber-800/30 text-center">
                                <span className="text-[9px] text-gray-500 block font-bold uppercase">Total Proyectado</span>
                                <span className="font-mono font-black text-sm text-amber-400 block mt-1">${totalFuturo.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0})}</span>
                                <span className="text-[9px] text-amber-700">en 10 años</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ── SECCIÓN 3: Formulario de Compra ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Detalles de la Operación</h4>
                </div>

                <form onSubmit={handleRegisterBuy} className="space-y-4">
                  {/* Ticker manual */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Símbolo (Ticker)</label>
                      <a href="https://finance.yahoo.com/lookup" target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-500 hover:underline font-bold">
                        Buscar símbolo ↗
                      </a>
                    </div>
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => { setTicker(e.target.value.toUpperCase()); setBuyEtfInfo(null); }}
                      onBlur={handleTickerBlur}
                      placeholder="Ej: VOO, NAFTRAC, VTI, CETES..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>

                  {/* Calculadora */}
                  <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Calculadora de Inversión</span>
                      <span className="text-xs text-gray-500">
                        Capital Total: <strong className="text-white">${status?.total_value?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'} {status?.moneda || 'USD'}</strong>
                      </span>
                    </div>

                    {/* Precio Unitario */}
                    <div className="flex flex-col gap-2 bg-[#0d121f] p-4 rounded-xl border border-gray-800">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Precio Unitario ({status?.moneda || 'USD'})</label>
                          {livePrice !== null && (
                            <span className="text-[9px] text-emerald-500 font-mono flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              En Vivo: ${livePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          value={precioUnitario}
                          onChange={(e) => handlePrecioUnitarioChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#111827] border border-amber-500/30 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition"
                          min="0" step="any" required
                        />
                      </div>
                    </div>

                    {/* Monto | % | Títulos */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Monto ({status?.moneda || 'USD'})</label>
                        <input type="number" value={montoUSD} onChange={(e) => handleMontoChange(e.target.value)} placeholder="0.00"
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition"
                          min="0" step="any" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Porcentaje (%)</label>
                        <input type="number" value={porcentajeInversion} onChange={(e) => handlePorcentajeChange(e.target.value)} placeholder="0.00"
                          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition"
                          min="0" step="any" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Títulos (Cant.)</label>
                        <input type="number" value={cantidad} onChange={(e) => handleCantidadChange(e.target.value)} placeholder="1"
                          className="w-full bg-gray-950 border border-amber-500/50 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition"
                          min="0.0001" step="any" required />
                      </div>
                    </div>
                  </div>

                  {/* Categoría, Clase, Tipo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Categoría de Mercado</label>
                      <input
                        type="text"
                        value={yahooCategory ? `${yahooCategory}${yahooFundFamily !== "N/A" && yahooFundFamily ? ` | ${yahooFundFamily}` : ""}` : "Buscando..."}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-500 cursor-not-allowed"
                        readOnly disabled
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tipo de Instrumento</label>
                      <select value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                        required>
                        <option value="" disabled>Seleccionar...</option>
                        <option value="Stocks">Stocks</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Treasury bonds">Treasury bonds</option>
                        <option value="Sectors">Sectors</option>
                        <option value="ETFs">ETFs</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-500 uppercase tracking-wide">Clase de Activo (Tu Estrategia)</label>
                      <input
                        type="text"
                        value={seccion}
                        onChange={(e) => setSeccion(e.target.value)}
                        list="secciones-datalist"
                        placeholder="Ej: Acciones EE.UU., Renta Fija..."
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                        required
                      />
                      <datalist id="secciones-datalist">
                        {(status?.secciones || []).map((sec: any) => (
                          <option key={sec.nombre_seccion} value={sec.nombre_seccion} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-500 uppercase tracking-wide">Objetivo Instrumento (%)</label>
                      <input
                        type="number"
                        value={porcentajeObjetivoInstrumento}
                        onChange={(e) => setPorcentajeObjetivoInstrumento(e.target.value)}
                        placeholder="e.g. 45.0"
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition"
                        min="0" max="100" step="0.1"
                      />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-amber-500 uppercase tracking-wide">Propietario</label>
                      <select value={propietarioBuy} onChange={(e) => setPropietarioBuy(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                        required>
                        <option value="Pash">Pash</option>
                        <option value="Chari">Chari</option>
                        <option value="Milio">Milio</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>

                  {buyError && (
                    <div className="p-3 bg-red-950/20 border border-red-800/30 text-red-200 rounded-xl text-xs flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{buyError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={resetBuyModal}
                      className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer">
                      Cancelar
                    </button>
                    <button type="submit" disabled={buying}
                      className="gostock-btn-primary py-2 px-6 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                      {buying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Registrar Compra
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
