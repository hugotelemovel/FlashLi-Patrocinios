import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAPA = {
  sim:     { status: 'Aceitou',    emoji: '🎉', pergunta: 'Confirmam que querem apoiar?',               botao: 'Sim, confirmo o apoio',        titulo: 'Obrigado pelo vosso apoio!', msg: 'A vossa decisão foi registada com sucesso. O Hugo entrará em contacto muito em breve para tratar dos próximos passos.' },
  pensar:  { status: 'Em Análise', emoji: '🤔', pergunta: 'Querem mais tempo para analisar a proposta?', botao: 'Sim, vamos analisar',           titulo: 'Obrigado por analisarem!',   msg: 'Ficamos a aguardar o vosso feedback. Qualquer dúvida, não hesitem em contactar.' },
  nao:     { status: 'Recusou',    emoji: '🙏', pergunta: 'Confirmam que não têm interesse?',           botao: 'Confirmo, não temos interesse', titulo: 'Obrigado pela honestidade!', msg: 'Compreendemos perfeitamente. Desejamos muito sucesso para a vossa empresa!' },
  remover: { status: null,         emoji: '✉️', pergunta: 'Querem deixar de receber os nossos emails?', botao: 'Sim, não quero receber mais emails', titulo: 'Pedido registado', msg: 'Não voltaremos a enviar emails para este contacto. Se foi engano, basta responder a qualquer email nosso.' },
};

const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function notificar(assunto, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
    await transporter.sendMail({
      from: `"Flash Li CRM" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: assunto,
      html: `<div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;"><h2 style="color:#1a1a1a;">Nova resposta no CRM</h2>${html}</div>`,
    });
  } catch (e) {
    console.warn('Notificação ao Hugo falhou (não crítico):', e.message);
  }
}

function pagina({ emoji, titulo, corpo, status = 200 }) {
  return new NextResponse(`<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Flash Li — Resposta</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <main style="max-width:480px;width:90%;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border-top:6px solid #d4af37;text-align:center;">
    <div style="font-size:52px;margin-bottom:16px;" aria-hidden="true">${emoji}</div>
    <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 14px 0;">${titulo}</h1>
    ${corpo}
    <div style="background:#f8fafc;border-radius:10px;padding:14px;font-size:12px;color:#64748b;margin-top:28px;">
      Flash Li Dance School
    </div>
  </main>
</body>
</html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}

function validar(id, resp) {
  if (!id || !resp || !UUID.test(id)) return 'Link inválido.';
  if (!MAPA[resp]) return 'Resposta inválida.';
  return null;
}

// GET: só mostra uma página de confirmação. Os antivírus de email (ex.: Outlook Safe Links)
// abrem os links automaticamente; se o GET registasse a resposta, empresas podiam
// aparecer como "Aceitou" sem nunca terem clicado.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const resp = searchParams.get('resp');
  const erro = validar(id, resp);
  if (erro) return pagina({ emoji: '⚠️', titulo: erro, corpo: '', status: 400 });

  const { emoji, pergunta, botao } = MAPA[resp];
  const acao = `/api/resposta?id=${encodeURIComponent(id)}&resp=${encodeURIComponent(resp)}`;
  return pagina({
    emoji,
    titulo: pergunta,
    corpo: `<form method="POST" action="${acao}">
      <button type="submit" style="background:#1a1a1a;color:#d4af37;border:none;padding:14px 22px;border-radius:8px;font-weight:bold;font-size:15px;cursor:pointer;">${botao}</button>
    </form>`,
  });
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const resp = searchParams.get('resp');
  const erro = validar(id, resp);
  if (erro) return pagina({ emoji: '⚠️', titulo: erro, corpo: '', status: 400 });

  const { status, emoji, titulo, msg } = MAPA[resp];

  if (resp === 'remover') {
    const { data, error } = await supabase.rpc('cancelar_contactos', { p_id: id });
    const emp = Array.isArray(data) ? data[0] : null;
    if (error) console.warn('Falha a registar remoção para id:', id, error.message);
    // Avisar sempre o Hugo: se a BD falhar, ele marca a empresa à mão e o pedido nunca se perde
    await notificar(
      `✉️ Pedido para não receber mais emails${emp ? `: ${emp.nome}` : ''}`,
      `<p><strong>Empresa:</strong> ${escHtml(emp?.nome) || '(desconhecida)'}</p>
       <p><strong>Email:</strong> ${escHtml(emp?.email) || '-'}</p>
       <p><strong>ID:</strong> ${escHtml(id)}</p>
       <p>${error ? '⚠️ <strong>Não foi possível marcar automaticamente</strong> (' + escHtml(error.message) + '). Remove este contacto das listas à mão.' : 'Já ficou marcada como "Não contactar" no CRM.'}</p>`
    );
    return pagina({ emoji, titulo, corpo: `<p style="font-size:15px;line-height:1.6;color:#475569;margin:0;">${msg}</p>` });
  }

  // Atualizar Supabase (função segura: só altera o estado desta empresa)
  const { data: linhas, error: dbError } = await supabase.rpc('registar_resposta', { p_id: id, p_status: status });
  const empresa = Array.isArray(linhas) ? linhas[0] : null;

  // Se id não existe na BD, empresa será null — resposta visual continua mas sem notificação
  if (dbError || !empresa) {
    console.warn('Empresa não encontrada para id:', id, dbError?.message);
  }

  // Notificar Hugo quando empresa responde (só se empresa existir)
  if (!dbError && empresa) {
    const crmUrl = empresa.url_base || 'https://flash-li-patrocinios.vercel.app';
    await notificar(
      `${emoji} ${empresa.nome} respondeu: ${status}`,
      `<p><strong>Empresa:</strong> ${escHtml(empresa.nome)}</p>
       <p><strong>Resposta:</strong> ${emoji} ${status}</p>
       <p><strong>Email:</strong> ${escHtml(empresa.email) || '-'}</p>
       <p style="margin-top:20px;"><a href="${crmUrl}" style="background:#1a1a1a;color:#d4af37;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">Ver no CRM</a></p>`
    );
  }

  return pagina({ emoji, titulo, corpo: `<p style="font-size:15px;line-height:1.6;color:#475569;margin:0;">${msg}</p>` });
}
