import nodemailer from 'nodemailer';

export async function POST(request) {
  const { assunto, mensagem, fotoUrl, fotosExtras = [], videoUrl, empresas, tipoCampanha = 'novidade' } = await request.json();

  if (!assunto?.trim()) return new Response(JSON.stringify({ error: 'O assunto não pode estar vazio.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  if (!mensagem?.trim()) return new Response(JSON.stringify({ error: 'A mensagem não pode estar vazia.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const alvosValidos = empresas.filter(e => e.email && e.email.includes('@'));
  if (alvosValidos.length === 0) return new Response(JSON.stringify({ error: 'Nenhum destinatário tem email válido.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  try { await transporter.verify(); }
  catch (smtpErr) {
    return new Response(JSON.stringify({ error: `Falha SMTP: ${smtpErr.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Configuração visual por tipo de campanha
  const tipoConfig = {
    novidade:      { icon: '🗞️', label: 'Novidade',      cor: '#3b82f6', bg: '#eff6ff', intro: 'Temos novidades para partilhar convosco!' },
    resultado:     { icon: '🏆', label: 'Resultado',      cor: '#eab308', bg: '#fefce8', intro: 'Temos o prazer de partilhar os nossos mais recentes resultados!' },
    agradecimento: { icon: '💛', label: 'Agradecimento',  cor: '#10b981', bg: '#f0fdf4', intro: 'Queremos expressar a nossa profunda gratidão pelo vosso apoio.' },
    urgente:       { icon: '⚡', label: 'Atualização',    cor: '#ef4444', bg: '#fff1f2', intro: 'Temos uma atualização importante para partilhar!' },
  };
  const tc = tipoConfig[tipoCampanha] || tipoConfig.novidade;

  // Preparar todas as fotos como inline attachments
  const todasFotos = [fotoUrl, ...fotosExtras].filter(Boolean);
  let attachments = [];
  let fotosHtml = '';

  for (let i = 0; i < todasFotos.length; i++) {
    const url = todasFotos[i].trim();
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = url.split('.').pop().split('?')[0].toLowerCase() || 'jpg';
        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const cid = `foto_flashli_${i}`;
        attachments.push({ filename: `foto-${i+1}.${ext}`, content: buf, contentType: mime, cid });
        fotosHtml += `<img src="cid:${cid}" style="max-width:100%;border-radius:8px;margin-bottom:8px;display:block;" alt="Fotografia Flash Li ${i+1}" />`;
      } else {
        // fallback externo
        fotosHtml += `<img src="${url}" style="max-width:100%;border-radius:8px;margin-bottom:8px;display:block;" alt="Fotografia Flash Li" />`;
      }
    } catch {
      fotosHtml += `<img src="${url}" style="max-width:100%;border-radius:8px;margin-bottom:8px;display:block;" alt="Fotografia Flash Li" />`;
    }
  }

  const fotosSection = fotosHtml ? `<div style="margin:20px 0;">${fotosHtml}</div>` : '';
  const videoBtn = videoUrl?.trim()
    ? `<div style="text-align:center;margin:20px 0;"><a href="${videoUrl}" style="background:#10b981;color:white;padding:12px 26px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">▶️ Ver Vídeo Oficial</a></div>`
    : '';

  const resultados = [];

  for (const empresa of alvosValidos) {
    try {
      await transporter.sendMail({
        from: `"Flash Li Dance School" <${process.env.EMAIL_USER}>`,
        to: empresa.email,
        subject: assunto,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <!-- HEADER -->
  <div style="background:#1a1a1a;padding:28px 30px;text-align:center;border-bottom:4px solid #d4af37;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Flash Li Dance School</div>
    <div style="color:white;font-weight:900;font-size:22px;letter-spacing:1px;">Diário de Bordo 🇮🇪</div>
    <div style="color:#d4af37;font-size:13px;margin-top:5px;">Dublin 2026 — DWCup</div>
  </div>

  <!-- TIPO BADGE -->
  <div style="background:${tc.bg};padding:10px 30px;border-bottom:1px solid ${tc.cor}22;">
    <span style="font-size:13px;font-weight:bold;color:${tc.cor};">${tc.icon} ${tc.label}</span>
  </div>

  <!-- CORPO -->
  <div style="padding:30px;">
    <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 18px 0;line-height:1.35;">${assunto}</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 8px 0;">Estimado(a) parceiro(a) da <strong>${empresa.nome}</strong>,</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 20px 0;">${tc.intro}</p>

    <!-- MENSAGEM -->
    <div style="background:#f8fafc;border-left:4px solid #d4af37;padding:20px 22px;border-radius:0 10px 10px 0;font-size:15px;line-height:1.7;white-space:pre-wrap;color:#1a1a1a;margin-bottom:20px;">${mensagem}</div>

    <!-- FOTOS -->
    ${fotosSection}

    <!-- VÍDEO -->
    ${videoBtn}

    <!-- BARRA DE PROGRESSO -->
    <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;margin:24px 0 20px 0;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📊 A nossa jornada para Dublin</div>
      <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden;margin-bottom:8px;">
        <div style="width:${Math.min(100, Math.round((alvosValidos.reduce((s,e)=>s+Number(e.valor||0),0)/3000)*100))}%;background:linear-gradient(90deg,#d4af37,#f0cc60);height:100%;border-radius:999px;"></div>
      </div>
      <div style="font-size:12px;color:#64748b;">${empresa.nome ? empresa.nome + ' faz parte de uma equipa de apoiantes extraordinários!' : 'Obrigado por fazer parte desta aventura!'}</div>
    </div>

    <!-- ASSINATURA -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:4px;">
      <p style="color:#64748b;font-size:14px;margin:0;">Com os melhores cumprimentos,</p>
      <p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:6px 0 2px 0;">Hugo Mota</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;">Gestão de Patrocínios — Flash Li Dance School</p>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#f8fafc;padding:14px 30px;text-align:center;border-top:1px solid #e2e8f0;">
    <div style="font-size:11px;color:#94a3b8;">Flash Li Dance School • Dublin 2026 🇮🇪 • flash-li-patrocinios.vercel.app</div>
  </div>

</div>
</body>
</html>
        `,
        attachments,
      });
      resultados.push({ nome: empresa.nome, email: empresa.email, ok: true });
    } catch (emailErr) {
      console.error(`Erro a enviar para ${empresa.email}:`, emailErr.message);
      resultados.push({ nome: empresa.nome, email: empresa.email, ok: false, erro: emailErr.message });
    }
  }

  const enviados = resultados.filter(r => r.ok).length;
  const falhados = resultados.filter(r => !r.ok);

  return new Response(JSON.stringify({
    success: true,
    enviados,
    total: alvosValidos.length,
    falhados: falhados.map(f => `${f.nome} (${f.email}): ${f.erro}`)
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
