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
  const empresa = await request.json();

  // BUG 8 + 9 — Validações obrigatórias
  if (!empresa.email) {
    return new Response(JSON.stringify({ error: 'Email em falta.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!empresa.id) {
    return new Response(JSON.stringify({ error: 'ID da empresa em falta — os botões de resposta não funcionariam.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const linkDossier = "https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf";
  const baseUrl = "https://flash-li-patrocinios.vercel.app";

  const isES = empresa.idioma === 'ES';

  const assunto = isES
    ? `Rumbo al Mundial de Danza 2026 - Propuesta de Patrocinio (${esc(empresa.nome)})`
    : `Rumo ao Mundial de Dança 2026 - Proposta de Patrocínio (${esc(empresa.nome)})`;

  const corpoHTML = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <div style="background:#1a1a1a;padding:26px 28px;text-align:center;border-bottom:4px solid #d4af37;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">Flash Li Dance School</div>
    <div style="color:white;font-weight:900;font-size:20px;">Dance World Cup 2026 🇮🇪</div>
    <div style="color:#d4af37;font-size:13px;margin-top:4px;">Dublin, Julho 2026</div>
  </div>

  <div style="padding:30px;">
    <p style="font-size:16px;margin:0 0 18px 0;color:#1a1a1a;">
      ${isES ? `Estimado(a) Director(a) de <strong>${esc(empresa.nome)}</strong>,` : `Exmo(a). Sr(a). Diretor(a) da <strong>${esc(empresa.nome)}</strong>,`}
    </p>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 14px 0;">
      ${isES
        ? `Mi nombre es <strong>Hugo Mota</strong> y les contacto como padre de la atleta <strong>Matilde Mota</strong>, bailarina de la Flash Li Dance School (Viana do Castelo, Portugal).`
        : `O meu nome é <strong>Hugo Mota</strong> e contacto-vos na qualidade de encarregado de educação da atleta <strong>Matilde Mota</strong>, bailarina da Flash Li Dance School (Viana do Castelo).`}
    </p>

    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 10px 10px 0;margin:20px 0;">
      <div style="font-size:13px;font-weight:bold;color:#166534;margin-bottom:8px;">🏆 ${isES ? 'Nuestros resultados más recientes' : 'Os nossos resultados mais recentes'}</div>
      <ul style="margin:0;padding-left:18px;color:#15803d;font-size:14px;line-height:1.8;">
        <li>${isES ? '24 podios y <strong>15 Medallas de Oro</strong> en la final nacional' : '24 pódios e <strong>15 Medalhas de Ouro</strong> na final nacional'}</li>
        <li>${isES ? 'Clasificados para representar a Portugal en Dublín 2026' : 'Apurados para representar Portugal em Dublin 2026'}</li>
      </ul>
    </div>

    <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 14px 0;">
      ${isES
        ? `Dado que no contamos con apoyo estatal, buscamos socios empresariales que deseen asociar su marca al talento de nuestra juventud. Aseguramos la emisión del <strong>recibo oficial</strong> para su contabilidad y visibilidad en nuestras redes sociales.`
        : `Uma vez que não dispomos de apoios estatais, procuramos parceiros empresariais que queiram associar a sua marca ao talento da nossa juventude. Asseguramos a emissão do <strong>recibo oficial</strong> para a sua contabilidade e visibilidade nas nossas redes sociais.`}
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${linkDossier}" style="background:#1a1a1a;color:#d4af37;padding:16px 28px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;letter-spacing:0.3px;">
        📥 ${isES ? 'Descargar Dossier Completo (PDF)' : 'Descarregar Dossier Completo (PDF)'}
      </a>
    </div>

    <div style="background:#f8fafc;padding:24px;border-radius:12px;border:1px solid #e2e8f0;text-align:center;margin-top:30px;">
      <p style="margin:0 0 18px 0;font-size:15px;font-weight:bold;color:#334155;">
        ${isES ? '¿Cuál es su decisión?' : 'Qual a vossa decisão?'}
      </p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=sim" style="background:#10b981;color:white;padding:13px 20px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">
          ✅ ${isES ? 'Sí, queremos apoyar' : 'Sim, queremos apoiar'}
        </a>
        <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=pensar" style="background:#f59e0b;color:white;padding:13px 20px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">
          🤔 ${isES ? 'Lo vamos a analizar' : 'Vamos analisar'}
        </a>
        <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=nao" style="background:#ef4444;color:white;padding:13px 20px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;">
          ❌ ${isES ? 'No tenemos interés' : 'Não temos interesse'}
        </a>
      </div>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 4px 0;">${isES ? 'Quedo a su disposición. ¡Muchas gracias!' : 'Fico ao vosso dispor. Muito obrigado!'}</p>
      <p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:6px 0 2px 0;">Hugo Mota</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;">${isES ? 'Padre de Matilde Mota — Flash Li Dance School' : 'Pai da Matilde Mota — Flash Li Dance School'}<br/>
      📱 WhatsApp: +351 924 368 517</p>
    </div>
  </div>

  <div style="background:#f8fafc;padding:12px 28px;text-align:center;border-top:1px solid #e2e8f0;">
    <div style="font-size:11px;color:#94a3b8;">Flash Li Dance School • Dublin 2026 🇮🇪 • flash-li-patrocinios.vercel.app</div>
  </div>
</div>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  // BUG 11 — verificar SMTP antes de enviar
  try { await transporter.verify(); }
  catch (smtpErr) {
    return new Response(JSON.stringify({ error: `Falha SMTP: ${smtpErr.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    await transporter.sendMail({
      from: `"Hugo - Flash Li Dance School" <${process.env.EMAIL_USER}>`,
      to: empresa.email,
      subject: assunto,
      html: corpoHTML,
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
