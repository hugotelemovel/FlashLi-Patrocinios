import nodemailer from 'nodemailer';

// Escape HTML para evitar XSS nos emails
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Valida URL: só http/https permitidos
function safeUrl(url) {
  try {
    const u = new URL(String(url || ''));
    return (u.protocol === 'http:' || u.protocol === 'https:') ? url : '#';
  } catch { return '#'; }
}

export async function POST(request) {
  const {
    assunto, mensagem,
    fotoUrl, fotosExtras = [],
    videos = [],
    linksRS = [],
    empresas,
    tipoCampanha = 'novidade',
    totalAngariado = 0,
    metaObjetivo = 3000,
    totalParceiros = 0,
    projeto = {}
  } = await request.json();
  const evento = projeto.evento || "DWCup";
  const ano = projeto.ano || 2026;
  const cidade = projeto.cidade || "Dublin";
  const bandeira = projeto.bandeira || "🇮🇪";
  const escola = projeto.escola || "${escola}";
  const gestor = projeto.gestor || "Hugo";
  const baseUrl = projeto.url_base || "https://flash-li-patrocinios.vercel.app";

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

  const tipoConfig = {
    novidade:      { icon: '🗞️', label: 'Novidade',      cor: '#3b82f6', bg: '#eff6ff', intro: 'Temos novidades para partilhar convosco!' },
    resultado:     { icon: '🏆', label: 'Resultado',      cor: '#eab308', bg: '#fefce8', intro: 'Temos o prazer de partilhar os resultados mais recentes!' },
    agradecimento: { icon: '💛', label: 'Agradecimento',  cor: '#10b981', bg: '#f0fdf4', intro: 'Queremos expressar a nossa profunda gratidão pelo vosso apoio.' },
    urgente:       { icon: '⚡', label: 'Atualização',    cor: '#ef4444', bg: '#fff1f2', intro: 'Temos uma atualização importante para partilhar!' },
  };
  const tc = tipoConfig[tipoCampanha] || tipoConfig.novidade;

  // Download fotos com timeout de 8s cada (PERF fix)
  const todasFotos = [fotoUrl, ...fotosExtras].filter(Boolean);
  let attachments = [];
  let fotosHtml = '';

  for (let i = 0; i < todasFotos.length; i++) {
    const url = safeUrl(todasFotos[i]?.trim());
    if (!url || url === '#') continue;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000); // timeout 8s
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = (url.split('.').pop().split('?')[0] || 'jpg').toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const cid = `foto_flashli_${i}`;
        attachments.push({ filename: `foto-${i+1}.${ext}`, content: buf, contentType: mime, cid });
        fotosHtml += `<img src="cid:${cid}" style="max-width:100%;border-radius:8px;margin-bottom:6px;display:block;" alt="Fotografia Flash Li" />`;
      } else {
        fotosHtml += `<img src="${esc(url)}" style="max-width:100%;border-radius:8px;margin-bottom:6px;display:block;" alt="Fotografia Flash Li" />`;
      }
    } catch {
      // timeout ou erro de rede — usa link direto como fallback
      fotosHtml += `<img src="${esc(url)}" style="max-width:100%;border-radius:8px;margin-bottom:6px;display:block;" alt="Fotografia Flash Li" />`;
    }
  }

  const fotosSection = fotosHtml ? `
    <div style="margin:20px 0;">
      <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📸 Galeria de Fotografias</div>
      ${fotosHtml}
    </div>` : '';

  // Vídeos — URLs validadas
  const videosSection = videos.length > 0 ? `
    <div style="margin:20px 0;">
      <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">🎬 Vídeos</div>
      ${videos.map(v => `
        <a href="${safeUrl(v.url)}" style="display:flex;align-items:center;gap:14px;background:#f5f3ff;padding:14px 16px;border-radius:10px;text-decoration:none;border:1px solid #e9d5ff;margin-bottom:8px;">
          <span style="font-size:24px;">${esc(v.tipo?.icon || '▶️')}</span>
          <div style="flex:1;">
            <div style="font-weight:bold;color:#7c3aed;font-size:14px;">${esc(v.descricao || 'Ver vídeo')}</div>
            <div style="font-size:11px;color:#a78bfa;">${esc(v.tipo?.nome || 'Vídeo')} · Clica para ver</div>
          </div>
          <span style="background:#7c3aed;color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:bold;flex-shrink:0;">▶ Ver</span>
        </a>`).join('')}
    </div>` : '';

  // Links RS — URLs validadas
  const rsSection = linksRS.length > 0 ? `
    <div style="margin:20px 0;">
      <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📱 Flash Li nas Redes Sociais</div>
      ${linksRS.map(rs => `
        <a href="${safeUrl(rs.url)}" style="display:flex;align-items:center;gap:14px;background:#fdf4ff;padding:14px 16px;border-radius:10px;text-decoration:none;border:1px solid #f0abfc;margin-bottom:8px;">
          <span style="font-size:24px;">${esc(rs.tipo?.icon || '🔗')}</span>
          <div style="flex:1;">
            <div style="font-weight:bold;color:#a21caf;font-size:14px;">${esc(rs.descricao || rs.tipo?.nome || 'Ver post')}</div>
            <div style="font-size:11px;color:#c026d3;">${esc(rs.tipo?.nome || 'Redes Sociais')} · Clica para ver</div>
          </div>
          <span style="background:#a21caf;color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:bold;flex-shrink:0;">Ver Post</span>
        </a>`).join('')}
    </div>` : '';

  const resultados = [];

  for (const empresa of alvosValidos) {
    try {
      await transporter.sendMail({
        from: `"${escola}" <${process.env.EMAIL_USER}>`,
        to: empresa.email,
        subject: esc(assunto),
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:30px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

  <div style="background:#1a1a1a;padding:26px 28px;text-align:center;border-bottom:4px solid #d4af37;">
    <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px;">Flash Li Dance School</div>
    <div style="color:white;font-weight:900;font-size:20px;letter-spacing:0.5px;">Diário de Bordo ${bandeira}</div>
    <div style="color:#d4af37;font-size:12px;margin-top:4px;">${cidade} ${ano} — ${evento}</div>
  </div>

  <div style="background:${tc.bg};padding:9px 28px;border-bottom:1px solid ${tc.cor}33;">
    <span style="font-size:13px;font-weight:bold;color:${tc.cor};">${tc.icon} ${tc.label}</span>
  </div>

  <div style="padding:28px;">
    <h2 style="color:#1a1a1a;font-size:19px;margin:0 0 16px 0;line-height:1.35;font-weight:900;">${esc(assunto)}</h2>
    <p style="color:#475569;font-size:15px;margin:0 0 6px 0;">Estimado(a) parceiro(a) da <strong>${esc(empresa.nome)}</strong>,</p>
    <p style="color:#64748b;font-size:13px;margin:0 0 20px 0;">${tc.intro}</p>

    <div style="background:#f8fafc;border-left:4px solid #d4af37;padding:18px 20px;border-radius:0 10px 10px 0;font-size:15px;line-height:1.7;white-space:pre-wrap;color:#1a1a1a;margin-bottom:20px;">${esc(mensagem)}</div>

    ${fotosSection}
    ${videosSection}
    ${rsSection}

    <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;margin:22px 0 18px 0;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">📊 A nossa jornada para Dublin</div>
      <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden;margin-bottom:8px;">
        <div style="width:${Math.min(100, metaObjetivo > 0 ? Math.round((totalAngariado / metaObjetivo) * 100) : 0)}%;background:linear-gradient(90deg,#d4af37,#f0cc60);height:100%;border-radius:999px;"></div>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:6px;">${totalAngariado.toLocaleString("pt-PT")}€ angariados de ${metaObjetivo.toLocaleString("pt-PT")}€ · ${totalParceiros} parceiro(s) a bordo</div>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 2px 0;">Com os melhores cumprimentos,</p>
      <p style="color:#1a1a1a;font-size:15px;font-weight:bold;margin:5px 0 2px 0;">Hugo Mota</p>
      <p style="color:#94a3b8;font-size:12px;margin:0;">Gestão de Patrocínios — ${escola}</p>
    </div>
  </div>

  <div style="background:#f8fafc;padding:13px 28px;text-align:center;border-top:1px solid #e2e8f0;">
    <div style="font-size:11px;color:#94a3b8;">Flash Li Dance School • ${cidade} ${ano} ${bandeira} • flash-li-patrocinios.vercel.app</div>
  </div>

</div>
</body>
</html>`,
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
    success: true, enviados, total: alvosValidos.length,
    falhados: falhados.map(f => `${f.nome} (${f.email}): ${f.erro}`)
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
