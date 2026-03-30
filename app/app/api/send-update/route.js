import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const { assunto, mensagem, empresas } = await request.json();

  try {
    for (const empresa of empresas) {
      await resend.emails.send({
        from: 'Hugo <patrocinios@flashlidance.pt>', // MUDA AQUI PARA O TEU EMAIL VERIFICADO NO RESEND
        to: empresa.email,
        subject: assunto,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #1F497D;">Atualização: Dance World Cup 2026 🇮🇪🏆</h2>
            <p>Estimado(a) parceiro(a) da <strong>${empresa.nome}</strong>,</p>
            <p>Obrigado por acreditar na Matilde e na nossa equipa! Aqui estão as últimas novidades:</p>
            <blockquote style="border-left: 4px solid #1F497D; padding-left: 15px; margin: 20px 0; font-style: italic;">
              ${mensagem}
            </blockquote>
            <p>Com os melhores cumprimentos,<br/><strong>Equipa Flash Li Dance School</strong></p>
          </div>
        `
      });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}