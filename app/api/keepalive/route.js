import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

// Chamado diariamente pelo Vercel Cron (vercel.json) para o Supabase gratuito
// não ser pausado por inatividade (pausa ao fim de 7 dias sem pedidos).
export async function GET() {
  const { error } = await supabase.rpc('ping');
  return new Response(JSON.stringify({ ok: !error, error: error?.message || null, em: new Date().toISOString() }), {
    status: error ? 500 : 200, headers: { 'Content-Type': 'application/json' },
  });
}
