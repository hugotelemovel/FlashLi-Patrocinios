import nodemailer from 'nodemailer';

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request) {
  const payload = await request.json();
  const empresa = payload;
  const proj = payload.projeto || {};
  const evento = proj.evento || "DWCup";
  const ano = proj.ano || 2026;
  const cidade = proj.cidade || "Dublin";
  const bandeira = proj.bandeira || "🇮🇪";
  const escola = proj.escola || "Flash Li Dance School";
  const gestor = proj.gestor || "Hugo";
  const baseUrl = proj.url_base || "https://flash-li-patrocinios.vercel.app";

  if (!empresa.email) {
    return new Response(JSON.stringify({ error: 'Email em falta.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  // BUG 10 — verificar SMTP
  try { await transporter.verify(); }
  catch (smtpErr) {
    return new Response(JSON.stringify({ error: `Falha SMTP: ${smtpErr.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const assunto = `Bem-vindos à equipa! 🎉 — Próximos passos (${esc(empresa.nome)})`;

  const corpoHTML = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <div style="background:#1a1a1a;padding:26px 28px;text-align:center;border-bottom:4px solid #d4af37;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">Flash Li Dance School</div>
    <div style="color:white;font-weight:900;font-size:20px;">Obrigado pelo vosso apoio! 🏆</div>
    <div style="color:#d4af37;font-size:13px;margin-top:4px;">${cidade} ${ano} — ${evento}</div>
  </div>

  <div style="padding:30px;">
    <p style="font-size:16px;margin:0 0 16px 0;color:#1a1a1a;">
      Estimado(a) parceiro(a) da <strong>${esc(empresa.nome)}</strong>,
    </p>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 14px 0;">
      É com enorme alegria que vos damos as <strong>boas-vindas à nossa equipa de patrocinadores oficiais</strong> rumo ao Campeonato do Mundo ${evento} ${ano} em ${cidade}! 🇮🇪
    </p>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 20px 0;">
      Para avançarmos com a divulgação da vossa marca e emitirmos o recibo, precisamos dos seguintes dados:
    </p>

    <div style="background:#f0f9ff;border-radius:12px;padding:20px 24px;border:1px solid #bae6fd;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:bold;color:#0369a1;margin-bottom:12px;">📋 Dados necessários — responda a este email com:</div>
      <ul style="margin:0;padding-left:20px;color:#0284c7;font-size:14px;line-height:2;">
        <li><strong>Nome Fiscal</strong> (entidade a faturar) e <strong>NIF</strong></li>
        <li><strong>Morada completa</strong> (sede social) para o recibo</li>
        <li><strong>Logotipo oficial</strong> (PNG sem fundo, se possível)</li>
        <li><strong>Redes sociais</strong> (Instagram/Facebook) para vos mencionar nos posts</li>
      </ul>
    </div>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 24px 0;">
      Assim que recebermos estes dados, <strong>emitimos o recibo imediatamente</strong> e começamos a divulgar a vossa marca nas nossas redes sociais e materiais de competição.
    </p>

    <div style="background:#f0fdf4;border-radius:10px;padding:16px 20px;border:1px solid #bbf7d0;">
      <div style="font-size:13px;color:#166534;font-weight:bold;margin-bottom:4px;">🎯 O que acontece a seguir:</div>
      <div style="font-size:13px;color:#15803d;line-height:1.8;">
        1. Enviam-nos os dados acima por resposta a este email<br/>
        2. Emitimos o recibo fiscal<br/>
        3. Publicamos a vossa marca nas nossas redes sociais<br/>
        4. Mantemo-vos atualizados com novidades do campeonato!
      </div>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 4px 0;">Com os melhores cumprimentos e um enorme obrigado,</p>
      <p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:6px 0 2px 0;">Hugo Mota</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;">${gestor} — ${escola}<br/>
      📱 WhatsApp: +351 924 368 517</p>
    </div>
  </div>

  <div style="background:#f8fafc;padding:12px 28px;text-align:center;border-top:1px solid #e2e8f0;">
    <div style="font-size:11px;color:#94a3b8;">Flash Li Dance School • ${cidade} ${ano} 🇮🇪 • flash-li-patrocinios.vercel.app</div>
  </div>
</div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${gestor} - ${escola}" <${process.env.EMAIL_USER}>`,
      to: empresa.email,
      subject: assunto,
      html: corpoHTML,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
