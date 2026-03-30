import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const empresa = await request.json();
  const linkDossier = "https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf";
  let assunto = "Rumo ao Mundial de Dança 2026 - Proposta de Patrocínio";
  let corpoHTML = `
    <p>Exmo(a). Sr(a). Diretor(a) da <strong>${empresa.nome}</strong>,</p>
    <p>O meu nome é Hugo e contacto-vos na qualidade de encarregado de educação da atleta Matilde Mota, bailarina da prestigiada Flash Li Dance School.</p>
    <p>A nossa escola foi apurada para representar Portugal na final mundial do Dance World Cup, em Dublin. Apenas no mês passado, conquistámos 24 pódios e 15 Medalhas de Ouro!</p>
    <p>Procuramos parceiros que queiram associar a sua marca ao talento. Asseguramos a correta emissão do recibo oficial do seu patrocínio, perfeitamente dedutível.</p>
    <p><strong>Por favor, consulte o nosso Dossier de Patrocínio no anexo deste email para ver o nosso historial e fotos.</strong></p>
    <p>Muito obrigado,<br/>Hugo (Pai da Matilde Mota)<br/>Telemóvel: 924 368 517</p>
  `;

  if (empresa.idioma === 'ES') {
    assunto = "Rumbo al Mundial de Danza 2026 - Propuesta de Patrocinio";
    corpoHTML = `
      <p>Estimado(a) Sr(a). Director(a) de <strong>${empresa.nome}</strong>,</p>
      <p>Mi nombre es Hugo y le contacto como representante de la atleta Matilde Mota, bailarina de la Flash Li Dance School (Portugal).</p>
      <p>Nuestra escuela representará a Portugal en la final de la Dance World Cup en Dublín. ¡Solo el mes pasado logramos 24 podios y 15 Oros!</p>
      <p>Buscamos socios que deseen asociar su marca al talento. Garantizamos la emisión del recibo oficial de su patrocinio (deducible en contabilidad).</p>
      <p><strong>Por favor, consulte nuestro Dossier de Patrocinio en el adjunto de este email para ver nuestro historial y fotos.</strong></p>
      <p>¡Muchas gracias!,<br/>Hugo (Padre de Matilde Mota)<br/>Móvil: +351 924 368 517</p>
    `;
  }

  try {
    await resend.emails.send({
      from: 'Hugo <patrocinios@flashlidance.pt>', // MUDA AQUI PARA O TEU EMAIL VERIFICADO NO RESEND
      to: empresa.email,
      subject: assunto + ` (${empresa.nome})`,
      html: corpoHTML
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
