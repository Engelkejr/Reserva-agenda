import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Tenta usar a chave mestra do servidor primeiro (para contornar RLS em rotas seguras da API)
// Se não existir, usa a chave pública (anon key)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const query = async (text, params = []) => {
  // We don't use raw SQL anymore, this is just for compatibility if needed.
  return [];
};

export const run = async (text, params = []) => {
  // Compatibility wrapper
};
