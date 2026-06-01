"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Briefcase, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { supabase } from "../../../services/supabase";
import { backendApi } from "../../../services/api";

interface SectionInput {
  nombre_seccion: string;
  porcentaje_objetivo: number;
}

export default function NewPortfolioPage() {
  const router = useRouter();
  
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [initialCash, setInitialCash] = useState<number>(100000);
  const [moneda, setMoneda] = useState("USD");
  const [preset, setPreset] = useState("classic");
  
  // Secciones por defecto para facilitarle al usuario
  const [secciones, setSecciones] = useState<SectionInput[]>([
    { nombre_seccion: "Acciones USA", porcentaje_objetivo: 50 },
    { nombre_seccion: "CETEs (Renta Fija)", porcentaje_objetivo: 30 },
    { nombre_seccion: "Criptomonedas", porcentaje_objetivo: 20 }
  ]);

  const applyPreset = (presetName: string, selectedMoneda?: string) => {
    setPreset(presetName);
    const currMoneda = selectedMoneda || moneda;
    
    if (presetName === "classic") {
      setSecciones([
        { nombre_seccion: "Acciones USA", porcentaje_objetivo: 50 },
        { nombre_seccion: "CETEs (Renta Fija)", porcentaje_objetivo: 30 },
        { nombre_seccion: "Criptomonedas", porcentaje_objetivo: 20 }
      ]);
      if (currMoneda === "MXN") {
        setInitialCash(1800000);
      } else {
        setInitialCash(100000);
      }
    } else if (presetName === "pash") {
      setSecciones([
        { nombre_seccion: "PPR (Allianz)", porcentaje_objetivo: 45 },
        { nombre_seccion: "CETEs", porcentaje_objetivo: 20 },
        { nombre_seccion: "Sofipos (Revolut)", porcentaje_objetivo: 15 },
        { nombre_seccion: "ETFs (Fórmula VTI/QQQM/AVUV)", porcentaje_objetivo: 20 }
      ]);
      if (currMoneda === "MXN") {
        setInitialCash(224000);
      } else {
        setInitialCash(12440);
      }
    } else {
      setSecciones([
        { nombre_seccion: "", porcentaje_objetivo: 0 }
      ]);
    }
  };

  const handleMonedaChange = (val: string) => {
    setMoneda(val);
    applyPreset(preset, val);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular la suma de porcentajes
  const totalPercentage = secciones.reduce((sum, sec) => sum + sec.porcentaje_objetivo, 0);

  const handleAddSection = () => {
    setSecciones([...secciones, { nombre_seccion: "", porcentaje_objetivo: 0 }]);
  };

  const handleRemoveSection = (index: number) => {
    setSecciones(secciones.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof SectionInput, value: any) => {
    const updated = [...secciones];
    if (field === "porcentaje_objetivo") {
      updated[index].porcentaje_objetivo = parseFloat(value) || 0;
    } else {
      updated[index].nombre_seccion = value;
    }
    setSecciones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!nombre.trim()) {
      setError("El nombre del portafolio es obligatorio.");
      return;
    }

    if (totalPercentage !== 100) {
      setError(`La suma de los porcentajes objetivos debe ser exactamente 100%. Actualmente es ${totalPercentage}%.`);
      return;
    }

    const emptySectionNames = secciones.some(sec => !sec.nombre_seccion.trim());
    if (emptySectionNames) {
      setError("Todas las secciones deben tener un nombre válido.");
      return;
    }

    setLoading(true);

    try {
      // 1. Obtener usuario actual o de prueba
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || "00000000-0000-0000-0000-000000000000";

      // 2. Enviar petición de creación al backend de FastAPI
      const result = await backendApi.createPortfolio(
        currentUserId,
        nombre,
        descripcion,
        initialCash,
        secciones,
        moneda
      );

      if (!result.success) {
        throw new Error(result.message || "Error al crear el portafolio");
      }

      // 3. Guardar como seleccionado y redirigir
      localStorage.setItem("selected_portfolio_id", result.portfolio_id);
      router.push("/");
      router.refresh();
      
    } catch (err: any) {
      console.error("Error creating portfolio:", err);
      setError(err.message || "Ocurrió un error inesperado al guardar el portafolio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col font-inter">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center gap-3">
        <Link href="/portfolios" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl">
          <Briefcase className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight font-plus-jakarta">Crear Portafolio</h1>
          <p className="text-xs text-gray-400">Define tu distribución de activos y fondeo inicial</p>
        </div>
      </header>

      {/* Form Container */}
      <main className="flex-1 p-6 max-w-2xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Card 1: Datos Básicos */}
          <div className="stock-box space-y-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider border-b border-gray-800 pb-2">
              Información del Portafolio
            </h2>
            
            <div className="space-y-1">
              <label htmlFor="nombre" className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nombre del Portafolio</label>
              <input 
                id="nombre"
                type="text" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Mi Portafolio de Retiro, Fideicomiso, etc."
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="descripcion" className="text-xs font-bold text-gray-400 uppercase tracking-wide">Descripción (Opcional)</label>
              <textarea 
                id="descripcion"
                value={descripcion} 
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Escribe el propósito de este portafolio..."
                rows={2}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="moneda" className="text-xs font-bold text-gray-400 uppercase tracking-wide">Moneda Base</label>
                <select 
                  id="moneda"
                  value={moneda} 
                  onChange={(e) => handleMonedaChange(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  <option value="USD">Dólares (USD)</option>
                  <option value="MXN">Pesos (MXN)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="preset" className="text-xs font-bold text-gray-400 uppercase tracking-wide">Estrategia Predefinida</label>
                <select 
                  id="preset"
                  value={preset} 
                  onChange={(e) => applyPreset(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500 transition cursor-pointer"
                >
                  <option value="classic">Estrategia Clásica (3 Rubros)</option>
                  <option value="pash">Estrategia Pash (4 Rubros Real)</option>
                  <option value="custom">Personalizado (Crear desde cero)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="initialCash" className="text-xs font-bold text-gray-400 uppercase tracking-wide">Saldo Inicial de Simulación ({moneda})</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500 font-mono text-sm">$</span>
                <input 
                  id="initialCash"
                  type="number" 
                  value={initialCash} 
                  onChange={(e) => setInitialCash(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="100,000"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-gray-100 focus:outline-none focus:border-amber-500 transition"
                  min="0"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-500">Este saldo libre se depositará en tu cuenta de transacciones en {moneda} para simular compras de activos.</p>
            </div>
          </div>

          {/* Card 2: Distribución de Secciones (Portfolify) */}
          <div className="stock-box space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Distribución de Secciones Target (Plan)
              </h2>
              <button 
                type="button" 
                onClick={handleAddSection}
                className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" />
                Agregar Sección
              </button>
            </div>

            <div className="space-y-3">
              {secciones.map((sec, index) => (
                <div key={index} className="flex gap-4 items-center bg-gray-900/30 p-3 rounded-xl border border-gray-800/40">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Nombre de Sección</label>
                    <input 
                      type="text" 
                      value={sec.nombre_seccion} 
                      onChange={(e) => handleSectionChange(index, "nombre_seccion", e.target.value)}
                      placeholder="Ej: Acciones USA, CETEs, Cripto..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-700 focus:outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                  
                  <div className="w-28 space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">% Objetivo</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={sec.porcentaje_objetivo} 
                        onChange={(e) => handleSectionChange(index, "porcentaje_objetivo", e.target.value)}
                        placeholder="0"
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-3 pr-6 py-1.5 text-xs font-mono text-gray-100 focus:outline-none focus:border-amber-500 transition"
                        min="0"
                        max="100"
                        required
                      />
                      <span className="absolute right-2 top-1.5 text-gray-500 text-xs">%</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleRemoveSection(index)}
                    disabled={secciones.length <= 1}
                    className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 mt-5 disabled:opacity-20 transition"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Suma de porcentajes alert */}
            <div className="flex items-center justify-between p-3.5 bg-gray-950/40 rounded-xl border border-gray-800/80">
              <span className="text-xs text-gray-400 font-bold">Total Asignado:</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold font-mono ${totalPercentage === 100 ? "text-emerald-500" : "text-amber-500"}`}>
                  {totalPercentage}%
                </span>
                {totalPercentage === 100 ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                )}
              </div>
            </div>
          </div>

          {/* Errores */}
          {error && (
            <div className="p-4 bg-red-950/20 border border-red-800/30 text-red-200 rounded-xl flex gap-2.5 text-xs">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-2">
            <Link 
              href="/portfolios" 
              className="stock-btn-ghost flex items-center justify-center text-xs py-2 px-5 font-bold uppercase tracking-wider"
            >
              Cancelar
            </Link>
            
            <button 
              type="submit" 
              disabled={loading || totalPercentage !== 100}
              className="stock-btn-primary flex items-center gap-1.5 px-6 disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  Crear Portafolio
                </>
              )}
            </button>
          </div>
          
        </form>
      </main>
    </div>
  );
}
