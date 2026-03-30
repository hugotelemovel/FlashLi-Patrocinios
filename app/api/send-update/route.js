import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { assunto, mensagem, fotoUrl, videoUrl, empresas } = await request.json();

  try {
    for (const empresa of empresas) {
      let imgTag = fotoUrl ? `<div style="text-align:center; margin: 20px 0;"><img src="${fotoUrl}" style="max-width: 100%; border-radius: 8px;" alt="Foto" /></div>` : '';
      let videoBtn = videoUrl ? `<div style="text-align:center; margin: 20px 0;"><a href="${videoUrl}" style="background: #E1306C; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">▶️ Ver Vídeo Oficial</a></div>` : '';

      await resend.emails.send({
        from: 'Flash Li Patrocínios <onboarding@resend.dev>', // MUDAR AQUI
        to: empresa.email,
        subject: assunto,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: #1F497D; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
               <h2 style="color: white; margin: 0;">Atualização: Diário de Bordo 🇮🇪</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Estimado(a) parceiro(a) da <strong>${empresa.nome}</strong>,</p>
              <p>Obrigado por apoiar a Matilde e a nossa equipa! Aqui ficam as novidades:</p>
              <blockquote style="background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; font-style: italic; white-space: pre-wrap;">${mensagem}</blockquote>
              ${imgTag}
              ${videoBtn}
              <p style="margin-top: 30px;">Com os melhores cumprimentos,<br/><strong>Equipa Flash Li Dance School</strong></p>
            </div>
          </div>
        `
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}