'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface WorkflowLogEntry {
  id: string;
  operacion_id: string;
  step: string;
  status: string;
  message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Hook para consultar y seguir en tiempo real los pasos de un flujo de operaciones (n8n logs)
 */
export function useWorkflowLogs(operacionId?: string) {
  const [logs, setLogs] = useState<WorkflowLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operacionId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Cargar logs existentes
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from('workflow_logs')
          .select('*')
          .eq('operacion_id', operacionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setLogs(data || []);
      } catch (err: any) {
        setError(err.message || 'Error al obtener logs del workflow');
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();

    // 2. Escuchar nuevos logs en tiempo real para esta operación
    const logsChannel = supabase
      .channel(`workflow-logs-${operacionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'workflow_logs',
          filter: `operacion_id=eq.${operacionId}`
        },
        (payload) => {
          const newLog = payload.new as WorkflowLogEntry;
          setLogs((prev) => [...prev, newLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
    };
  }, [operacionId]);

  return { logs, loading, error };
}
