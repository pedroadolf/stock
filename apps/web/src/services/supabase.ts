import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

const FALLBACK_URL = 'https://supabase.pash.uno';

function getEnvConfig() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const finalUrl = envUrl || FALLBACK_URL;
  return { finalUrl, anonKey, serviceKey };
}

export const supabaseUrl = getEnvConfig().finalUrl;

let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const { finalUrl, anonKey } = getEnvConfig();
      
      if (!anonKey || anonKey.includes('missing')) {
        const errorMsg = '🚨 [FATAL] SUPABASE ENV NOT LOADED for STOCK. Check Dokploy Build Args.';
        logger.error(errorMsg, { url: finalUrl });
        if (typeof window !== 'undefined') {
          throw new Error(errorMsg);
        }
      } else {
        logger.info('Supabase client for STOCK initialized successfully', { url: finalUrl });
      }
      
      _supabase = createClient(finalUrl, anonKey || 'missing-key-build-time');
    }
    return (_supabase as any)[prop];
  },
});

/**
 * Cliente con Service Role para operaciones de servidor (bypass RLS)
 * Se recomienda usar esta función siempre en API Routes.
 */
export const getSupabaseService = () => {
  const { finalUrl, anonKey, serviceKey } = getEnvConfig();
  return createClient(finalUrl, serviceKey || anonKey);
};
