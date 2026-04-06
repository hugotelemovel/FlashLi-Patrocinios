import nodemailer from 'nodemailer';

export async function POST(request) {
  const empresa = await request.json();
  const linkDossier = "https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf";
  
  // Link base para onde os botões vão apontar
  const baseUrl = "https://flash-li-patrocinios.vercel.app";

  let assunto = "";
  let corpoHTML = "";

  // SE O IDIOMA FOR ESPANHOL
  if (empresa.idioma === 'ES') {
    assunto = `Rumbo al Mundial de Danza 2026 - Propuesta de Patrocinio (${empresa.nome})`;
    corpoHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #1F497D;">Dance World Cup - Dublin 2026 🇮🇪</h2>
        <p>Estimado(a) Director(a) de <strong>${empresa.nome}</strong>,</p>
        
        <p>Mi nombre es Hugo y les contacto como padre de la atleta <b>Matilde Mota</b>, bailarina de la prestigiosa Flash Li Dance School (Viana do Castelo, Portugal).</p>
        
        <p>Nuestra escuela ha sido clasificada para representar a Portugal en la gran final mundial en Dublín (Julio de 2026). ¡Solo el mes pasado, conquistamos <b>24 podios y 15 Medallas de Oro</b> en la final nacional!</p>
        
        <p>Dado que no contamos con apoyo estatal, buscamos socios empresariales que deseen asociar su marca al talento y éxito de nuestra juventud. Aseguramos la emisión del <b>recibo oficial</b> para su contabilidad y gran visibilidad en nuestras redes.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkDossier}" style="background-color: #00B050; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            📥 Descargar el Dossier Completo (PDF)
          </a>
        </div>
        
        <p>En el dossier encontrará nuestro historial de victorias completo, fotografías y los datos para formalizar el apoyo.</p>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center; margin-top: 40px;">
          <p style="margin-top: 0; font-size: 16px;"><strong>¿Cuál es su decisión? (Haga clic en un botón abajo)</strong></p>
          
          <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=sim" style="background-color: #10b981; color: white; padding: 12px 15px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block; font-weight: bold; font-size: 14px;">✅ Sí, queremos apoyar!</a>
          
          <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=pensar" style="background-color: #f59e0b; color: white; padding: 12px 15px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block; font-weight: bold; font-size: 14px;">🤔 Lo vamos a analizar</a>
          
          <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=nao" style="background-color: #ef4444; color: white; padding: 12px 15px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block; font-weight: bold; font-size: 14px;">❌ No tenemos interés</a>
        </div>

        <p style="margin-top: 30px;">Quedo a la espera de sus valiosos comentarios. ¡Muchas gracias!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 14px; color: #666;">
          <b>Hugo</b> (Padre de Matilde Mota)<br/>
          Móvil / WhatsApp: +351 924 368 517
        </p>
      </div>
    `;
  } 
  // SE O IDIOMA FOR PORTUGUÊS (DEFAULT)
  else {
    assunto = `Rumo ao Mundial de Dança 2026 - Proposta de Patrocínio (${empresa.nome})`;
    corpoHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #1F497D;">Dance World Cup - Dublin 2026 🇮🇪</h2>
        <p>Exmo(a). Sr(a). Diretor(a) da <strong>${empresa.nome}</strong>,</p>
        
        <p>O meu nome é Hugo e contacto-vos na qualidade de encarregado de educação da atleta <b>Matilde Mota</b>, bailarina da prestigiada Flash Li Dance School (Viana do Castelo).</p>
        
        <p>A nossa escola foi apurada para representar Portugal na grande final mundial em Dublin (Julho de 2026). Apenas no mês passado, conquistámos <b>24 pódios e 15 Medalhas de Ouro</b> na final nacional!</p>
        
        <p>Uma vez que não dispomos de apoios estatais, procuramos parceiros empresariais que queiram associar a sua marca ao talento e sucesso da nossa juventude. Asseguramos a correta emissão do <b>recibo oficial</b> para a sua contabilidade e grande visibilidade nas nossas redes.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkDossier}" style="background-color: #00B050; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
            📥 Descarregar o Dossier Completo (PDF)
          </a>
        </div>
        
        <p>No dossier encontrará o nosso historial de vitórias completo, fotografias e os dados para formalizar o apoio.</p>
        
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border: 1px dashed #cbd5e1; text-align: center; margin-top: 40px;">
          <p style="margin-top: 0; font-size: 16px;"><strong>Qual a vossa decisão? (Basta clicar num botão abaixo)</strong></p>
          
          <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=sim" style="background-color: #10b981; color: white; padding: 12px 15px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block; font-weight: bold; font-size: 14px;">✅ Sim, queremos apoiar!</a>
          
          <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=pensar" style="background-color: #f59e0b; color: white; padding: 12px 15px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block; font-weight: bold; font-size: 14px;">🤔 Vamos analisar o dossier</a>
          
          <a href="${baseUrl}/api/resposta?id=${empresa.id}&resp=nao" style="background-color: #ef4444; color: white; padding: 12px 15px; text-decoration: none; border-radius: 5px; margin: 5px; display: inline-block; font-weight: bold; font-size: 14px;">❌ Não temos interesse</a>
        </div>

        <p style="margin-top: 30px;">Fico a aguardar os vossos valiosos comentários. Muito obrigado!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 14px; color: #666;">
          <b>Hugo</b> (Pai da Matilde Mota)<br/>
          Telemóvel / WhatsApp: +351 924 368 517
        </p>
      </div>
    `;
  }

  // CONFIGURAÇÃO SMTP GMAIL
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

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
