import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const resp = searchParams.get('resp');

  // BUG 12 — Validar parâmetros obrigatórios
  if (!id || !resp) {
    return new NextResponse('<h1>Link inválido.</h1>', { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  // BUG 12 — Validar valor de resp
  if (!['sim', 'pensar', 'nao'].includes(resp)) {
    return new NextResponse('<h1>Resposta inválida.</h1>', { status: 400, headers: { 'Content-Type': 'text/html' } });
  }

  const mapa = {
    sim:    { status: 'Aceitou',    emoji: '🎉', titulo: 'Obrigado pelo vosso apoio!', msg: 'A vossa decisão foi registada com sucesso. O Hugo entrará em contacto muito em breve para tratar dos próximos passos.' },
    pensar: { status: 'Em Análise', emoji: '🤔', titulo: 'Obrigado por analisarem!',   msg: 'Ficamos a aguardar o vosso feedback. Qualquer dúvida, não hesitem em contactar.' },
    nao:    { status: 'Recusou',    emoji: '🙏', titulo: 'Obrigado pela honestidade!', msg: 'Compreendemos perfeitamente. Desejamos muito sucesso para a vossa empresa!' },
  };

  const { status, emoji, titulo, msg } = mapa[resp];

  // Atualizar Supabase
  const { data: empresa, error: dbError } = await supabase
    .from('patrocinadores')
    .update({ status })
    .eq('id', id)
    .select('nome, email')
    .single();

  // Se id não existe na BD, empresa será null — resposta visual continua mas sem notificação
  if (dbError && !empresa) {
    console.warn('Empresa não encontrada para id:', id, dbError?.message);
  }

  // Notificar Hugo quando empresa responde (só se empresa existir)
  if (!dbError && empresa && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      // Ir buscar url_base do projeto para o link do CRM
      let crmUrl = 'https://flash-li-patrocinios.vercel.app';
      try {
        const { data: pat } = await supabase.from('patrocinadores').select('projeto_id').eq('id', id).single();
        if (pat?.projeto_id) {
          const { data: proj } = await supabase.from('projetos').select('url_base, nome').eq('id', pat.projeto_id).single();
          if (proj?.url_base) crmUrl = proj.url_base;
        }
      } catch (_) {}

      await transporter.sendMail({
        from: `"Flash Li CRM" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `${emoji} ${empresa.nome} respondeu: ${status}`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;max-width:500px;">
            <h2 style="color:#1a1a1a;">Nova resposta no CRM</h2>
            <p><strong>Empresa:</strong> ${empresa.nome}</p>
            <p><strong>Resposta:</strong> ${emoji} ${status}</p>
            <p><strong>Email:</strong> ${empresa.email || '-'}</p>
            <p style="margin-top:20px;"><a href="${crmUrl}" style="background:#1a1a1a;color:#d4af37;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:bold;">Ver no CRM</a></p>
          </div>`,
      });
    } catch (e) {
      console.warn('Notificação ao Hugo falhou (não crítico):', e.message);
    }
  }

  return new NextResponse(`
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flash Li — Resposta Registada</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;width:90%;background:white;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);border-top:6px solid #d4af37;text-align:center;">
    <div style="font-size:52px;margin-bottom:16px;">${emoji}</div>
    <h1 style="color:#1a1a1a;font-size:22px;margin:0 0 14px 0;">${titulo}</h1>
    <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 28px 0;">${msg}</p>
    <div style="background:#f8fafc;border-radius:10px;padding:14px;font-size:12px;color:#94a3b8;">
      Flash Li Dance School • Dublin 2026 🇮🇪
    </div>
  </div>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}
