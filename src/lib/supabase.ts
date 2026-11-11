const SUPABASE_URL = 'https://epiaoiirxjztvotzsedx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bHRXNxkVWJJAY9ZLkoLS2A_HqZdCL6i';

declare global {
  interface Window {
    supabase?: {
      createClient: (url: string, key: string) => any;
    };
  }
}

let cachedClient: any = null;

export function getSupabase() {
  if (cachedClient) return cachedClient;
  if (typeof window === 'undefined' || !window.supabase) {
    throw new Error('Client Supabase non chargé. Vérifiez votre connexion.');
  }
  cachedClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cachedClient;
}

export function phoneToAuthEmail(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  return `${clean}@med-invest.mg`;
}
