import nodemailer from 'nodemailer';

export async function POST(request) {
  const { assunto, mensagem, fotoUrl, videoUrl, empresas } = await request.json();

  // CONFIGURAÇÃO SMTP GMAIL
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    // 1. PREPARAR O ANEXO EMBUTIDO (A Magia acontece aqui)
    let attachments = [];
    let imgTag = '';
    
    // Se houver uma foto, pedimos ao Gmail para a descarregar e embutir com a tag "cid"
    if (fotoUrl) {
      attachments.push({
        filename: 'foto-novidade.jpg',
        path: fotoUrl, // O Gmail descarrega a foto daqui temporariamente
        cid: 'foto_magica_embutida' // Identificador único
      });
      // Em vez de usar o link da net, usamos a foto embutida
      imgTag = `<div style="text-align:center; margin: 20px 0;"><img src="cid:foto_magica_embutida" style="max-width: 100%; border-radius: 8px;" alt="Fotografia DWCup" /></div>`;
    }

    let videoBtn = videoUrl ? `<div style="text-align:center; margin: 20px 0;"><a href="${videoUrl}" style="background: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">▶️ Ver Vídeo Oficial</a></div>` : '';

    // 2. ENVIAR PARA TODAS AS EMPRESAS
    for (const empresa of empresas) {
      await transporter.sendMail({
        from: `"Angariação DWCup - Flash Li" <${process.env.EMAIL_USER}>`,
        to: empresa.email,
        subject: assunto,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #1a1a1a; padding: 25px; text-align: center; border-bottom: 4px solid #d4af37;">
               <h2 style="color: white; margin: 0; font-size: 22px;">Diário de Bordo 🇮🇪</h2>
               <p style="color: #d4af37; margin: 5px 0 0 0; font-size: 14px;">Flash Li Dance School</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; margin-top: 0;">Estimado(a) parceiro(a) da <strong>${empresa.nome}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.6; color: #475569;">Obrigado por apoiar o talento da nossa equipa rumo a Dublin! Aqui ficam as novidades mais recentes:</p>
              
              <div style="background: #f8fafc; border-left: 4px solid #d4af37; padding: 20px; margin: 25px 0; font-size: 16px; line-height: 1.6; white-space: pre-wrap; color: #1a1a1a;">${mensagem}</div>
              
              ${imgTag}
              ${videoBtn}
              
              <p style="margin-top: 30px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                Com os melhores cumprimentos,<br>
                <strong>Hugo</strong><br>
                <span style="font-size: 12px;">Gestão de Patrocínios</span>
              </p>
            </div>
          </div>
        `,
        attachments: attachments // Insere a foto de forma invisível
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Erro no envio:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
