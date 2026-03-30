import { Resend } from 'resend';

// O teu código secreto do Resend (Crias conta grátis em resend.com)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { assunto, mensagem, empresasQueAceitaram } = await request.json();

  try {
    // Para cada empresa que ACEITOU, enviamos um email personalizado
    for (const empresa of empresasQueAceitaram) {
      await resend.emails.send({
        from: 'Hugo <patrocinios@flashlidance.pt>', // Podes alterar para um email verificado no Resend
        to: empresa.email,
        subject: assunto,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #1F497D;">Atualização: Dance World Cup 2026 🇮🇪🏆</h2>
            <p>Estimado(a) parceiro(a) da <strong>${empresa.nome}</strong>,</p>
            <p>Obrigado por acreditar na Matilde y na nossa equipa! Graças ao vosso apoio, aqui estão as últimas novidades:</p>
            <blockquote style="border-left: 4px solid #1F497D; padding-left: 15px; margin: 20px 0; font-style: italic;">
              ${mensagem}
            </blockquote>
            <p>Em breve partilharemos mais fotos e resultados.</p>
            <p>Com os melhores cumprimentos,<br/><strong>Equipa Flash Li Dance School</strong></p>
          </div>
        `
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Atualizações enviadas!" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}