import { createClient } from '@supabase/supabase-js';

function json(status, error) {
  return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
}

// Valida o token de sessão enviado pela app (Authorization: Bearer ...) e confirma que o utilizador é admin.
// Impede que alguém use as rotas de envio para mandar emails a partir da tua conta Gmail.
export async function exigirAdmin(request) {
  const h = request.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return { erro: json(401, 'Sessão em falta — faz login outra vez.') };
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return { erro: json(401, 'Sessão expirada — faz login outra vez.') };
  const { data: admin } = await sb.rpc('is_admin');
  if (admin !== true) return { erro: json(403, 'Sem permissão.') };
  return { user: data.user, sb };
}
