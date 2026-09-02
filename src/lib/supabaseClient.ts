import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getInitialUrl = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tic360_custom_supabase_url');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const getInitialAnonKey = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tic360_custom_supabase_key');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
};

export const getSupabaseConfig = () => {
  const url = getInitialUrl();
  const key = getInitialAnonKey();
  const isConfigured = Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    !key.includes('placeholder')
  );
  return { url, key, isConfigured };
};

export const isSupabaseConfigured = Boolean(
  getInitialUrl() &&
  getInitialAnonKey() &&
  !getInitialUrl().includes('your-project') &&
  !getInitialUrl().includes('placeholder')
);

export const checkIsSupabaseConfigured = () => {
  return getSupabaseConfig().isConfigured;
};

// Create the active client instance
export const createActiveSupabaseClient = (customUrl?: string, customKey?: string): SupabaseClient => {
  const url = customUrl || getInitialUrl() || 'https://placeholder.supabase.co';
  const key = customKey || getInitialAnonKey() || 'placeholder-key';

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

export let supabase: SupabaseClient = createActiveSupabaseClient();

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('tic360_custom_supabase_url', url);
    else localStorage.removeItem('tic360_custom_supabase_url');

    if (key) localStorage.setItem('tic360_custom_supabase_key', key);
    else localStorage.removeItem('tic360_custom_supabase_key');
  }
  supabase = createActiveSupabaseClient(url, key);
};

export const testSupabaseConnection = async (
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string; tableCount?: number }> => {
  try {
    const client = (testUrl && testKey) ? createActiveSupabaseClient(testUrl, testKey) : supabase;
    const { data, error } = await client.from('students').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "students" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Note: tables not yet created. Run supabase_schema.sql in the Supabase SQL Editor)',
        };
      }
      return {
        success: false,
        message: `Supabase Error: ${error.message} (${error.code || 'unknown'})`,
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase and verified students table!',
      tableCount: data ? 1 : 0,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      success: false,
      message: `Connection failed: ${message}`,
    };
  }
};
