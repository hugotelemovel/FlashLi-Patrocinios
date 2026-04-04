import nodemailer from 'nodemailer';
import path from 'path';

export async function POST(request) {
  const empresa = await request.json();
  const linkDossier = "https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf";

  let assunto = `Rumo ao Mundial de Dança 2026 - Proposta de Patrocínio (${empresa.nome})`;
  let corpoHTML = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
      <h2 style="color: #1F497D;">Dance World Cup - Dublin 2026 🇮🇪</h2>
      <p>Exmo(a). Sr(a). Responsável,</p>
      <p>Entramos em contacto com a equipa de <strong>${empresa.nome}</strong>.</p>
      
      <p>O meu nome é Hugo e contacto-vos na qualidade de encarregado de educação da atleta <b>Matilde Mota</b>, bailarina da prestigiada Flash Li Dance School (Viana do Castelo).</p>
      
      <p>A nossa escola foi apurada para representar Portugal na grande final mundial em Dublin (Julho de 2026). Apenas no mês passado, conquistámos <b>24 pódios e 15 Medalhas de Ouro</b> na final nacional!</p>
      
      <p>Uma vez que não dispomos de apoios estatais, procuramos parceiros empresariais que queiram associar a sua marca ao talento e sucesso da nossa juventude. Asseguramos a correta emissão do <b>recibo oficial</b> para a vossa contabilidade e grande visibilidade nas nossas redes.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${linkDossier}" style="background-color: #00B050; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
          📥 Descarregar o Dossier Completo (PDF)
        </a>
      </div>

      <p>No dossier acima encontrará o nosso historial de vitórias completo, fotografias e os dados para formalizar o apoio.</p>
      <p>Fico a aguardar o vosso prezado feedback. Muito obrigado!</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 14px; color: #666;">
        <b>Hugo</b> (Pai da Matilde Mota)<br/>
        Telemóvel / WhatsApp: 924 368 517
      </p>
    </div>
  `;

  if (empresa.idioma === 'ES') {
    assunto = `Rumbo al Mundial de Danza 2026 - Propuesta de Patrocinio (${empresa.nome})`;
    corpoHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #1F497D;">Dance World Cup - Dublín 2026 🇮🇪</h2>
        <p>Estimado(a) Sr(a). Responsable,</p>
        <p>Nos ponemos en contacto con el equipo de <strong>${empresa.nome}</strong>.</p>
        <p>Mi nombre es Hugo y le contacto como representante de la atleta <b>Matilde Mota</b>, bailarina de la prestigiosa Flash Li Dance School (Viana do Castelo).</p>
        <p>Nuestra escuela representará a Portugal en la gran final mundial en Dublín. ¡Solo el mes pasado logramos <b>24 podios y 15 Medallas de Oro</b> en la final nacional!</p>
        <p>Dado que no contamos con apoyos estatales, buscamos socios empresariales que deseen asociar su marca al talento y éxito de nuestra juventud. Garantizamos la correcta emisión del <b>recibo oficial</b> para su contabilidad y gran visibilidad en nuestras redes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkDossier}" style="background-color: #00B050; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            📥 Descargar el Dossier Completo (PDF)
          </a>
        </div>
        <p>En el dossier encontrará nuestro historial de victorias completo, fotografías y los datos para formalizar el apoyo.</p>
        <p>Quedo a la espera de sus valiosos comentarios. ¡Muchas gracias!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 14px; color: #666;">
          <b>Hugo</b> (Padre de Matilde Mota)<br/>
          Móvil / WhatsApp: +351 924 368 517
        </p>
      </div>
    `;
  }

  // CONFIGURAÇÃO SMTP GMAIL
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Hugo - Flash Li Dance School" <${process.env.EMAIL_USER}>`,
      to: empresa.email,
      subject: assunto,
      html: corpoHTML,
      attachments: [
        {
          filename: 'Dossier_Matilde_Mota.pdf',
          path: path.join(process.cwd(), 'public', 'Dossier_Matilde_Mota.pdf')
        }
      ]
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
