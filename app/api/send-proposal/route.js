import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const empresa = await request.json();
  const linkDossier = "https://a_tua_app_no_vercel.vercel.app/Dossier_Matilde_Mota.pdf";

  let assunto = "Rumo ao Mundial de Dança 2026 - Proposta de Patrocínio";
  let corpoHTML = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h2 style="color: #1F497D;">Dance World Cup - Dublin 2026 🇮🇪</h2>
      <p>Exmo(a). Sr(a). Diretor(a) da <strong>${empresa.nome}</strong>,</p>
      <p>O meu nome é Hugo e contacto-vos na qualidade de encarregado de educação da atleta <b>Matilde Mota</b>, bailarina da prestigiada Flash Li Dance School.</p>
      <p>A nossa escola foi apurada para representar Portugal na grande final mundial em Dublin. Apenas no mês passado, conquistámos <b>24 pódios e 15 Medalhas de Ouro</b> na final nacional!</p>
      <p>Uma vez que não dispomos de apoios estatais, procuramos parceiros empresariais que queiram associar a sua marca ao talento da nossa juventude. Asseguramos a correta emissão do <b>recibo oficial</b> para a vossa contabilidade e grande visibilidade nas redes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${linkDossier}" style="background-color: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
          📥 Descarregar o Dossier Completo (PDF)
        </a>
      </div>
      <p>No dossier acima encontrará o nosso historial de vitórias e os dados para formalizar o apoio.</p>
      <p>Muito obrigado!</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 14px; color: #666;"><b>Hugo</b> (Pai da Matilde Mota)<br/>WhatsApp: 924 368 517</p>
    </div>
  `;

  if (empresa.idioma === 'ES') {
    assunto = "Rumbo al Mundial de Danza 2026 - Propuesta de Patrocinio";
    corpoHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #1F497D;">Dance World Cup - Dublín 2026 🇮🇪</h2>
        <p>Estimado(a) Sr(a). Director(a) de <strong>${empresa.nome}</strong>,</p>
        <p>Mi nombre es Hugo y le contacto como representante de la atleta <b>Matilde Mota</b>, de la prestigiosa Flash Li Dance School.</p>
        <p>Nuestra escuela representará a Portugal en la final mundial. ¡Logramos <b>24 podios y 15 Medallas de Oro</b>!</p>
        <p>Buscamos socios empresariales para apoyar este talento. Garantizamos la emisión del <b>recibo oficial</b> para su contabilidad y gran visibilidad.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkDossier}" style="background-color: #2563eb; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            📥 Descargar el Dossier Completo (PDF)
          </a>
        </div>
        <p>¡Muchas gracias por su atención!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 14px; color: #666;"><b>Hugo</b> (Padre de Matilde Mota)<br/>WhatsApp: +351 924 368 517</p>
      </div>
    `;
  }

  try {
    await resend.emails.send({
      from: 'Flash Li Patrocínios <onboarding@resend.dev>', // Email MUDAR AQUI
      to: empresa.email,
      subject: assunto,
      html: corpoHTML
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}