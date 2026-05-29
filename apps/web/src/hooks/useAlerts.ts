'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface AlertLogEntry {
  id: string;
  operacion_id?: string;
  step?: string;
  status: string;
  severity: 'info' | 'warning' | 'critical';
  action?: string;
  retry_attempt?: number;
  reason: string;
  created_at: string;
}

/**
 * Hook para obtener y suscribirse en tiempo real a las alertas del sistema (alerts_log)
 */
export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Obtener alertas iniciales
    async function fetchAlerts() {
      try {
        const { data, error } = await supabase
          .from('alerts_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setAlerts(data || []);
      } catch (err: any) {
        setError(err.message || 'Error al cargar logs de alertas');
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();

    // 2. Suscribirse a cambios en tiempo real
    const alertsChannel = supabase
      .channel('alerts-log-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts_log' },
        (payload) => {
          const newAlert = payload.new as AlertLogEntry;
          setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  return { alerts, loading, error };
}
