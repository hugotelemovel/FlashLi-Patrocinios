import nodemailer from 'nodemailer';

export async function POST(request) {
  const empresa = await request.json();

  let assunto = `Bem-vindos à equipa! 🇮🇪 - Acordo de Patrocínio (${empresa.nome})`;
  
  // TEXTO DO EMAIL DE BOAS-VINDAS E PEDIDO DE DADOS
  let corpoHTML = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #1a1a1a; padding: 25px; text-align: center; border-bottom: 4px solid #d4af37;">
         <h2 style="color: white; margin: 0; font-size: 22px;">Obrigado pelo vosso apoio! 🏆</h2>
         <p style="color: #d4af37; margin: 5px 0 0 0; font-size: 14px;">Flash Li Dance School - Rumo a Dublin</p>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; margin-top: 0;">Estimado(a) parceiro(a) da <strong>${empresa.nome}</strong>,</p>
        
        <p style="font-size: 15px; color: #475569;">É com enorme alegria que vos damos as boas-vindas à nossa equipa de patrocinadores oficiais rumo ao Campeonato do Mundo (DWCup 2026)!</p>
        
        <p style="font-size: 15px; color: #475569;">Para podermos avançar com a divulgação imediata da vossa marca e preparar a emissão do respetivo recibo, pedimos que <b>respondam a este email com a seguinte informação:</b></p>
        
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <ul style="margin: 0; padding-left: 20px; color: #1e293b; font-weight: bold;">
            <li style="margin-bottom: 10px;">O vosso Logotipo Oficial (preferencialmente em alta qualidade / formato PNG sem fundo ou Vetor).</li>
            <li>O vosso NIF e nome da entidade para faturação/recibo.</li>
          </ul>
        </div>
        
        <p style="font-size: 15px; color: #475569;">Mais uma vez, o nosso profundo agradecimento por acreditarem no talento da nossa juventude.</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          Com os melhores cumprimentos,<br>
          <strong>Hugo</strong><br>
          <span style="font-size: 12px;">Gestão de Patrocínios</span>
        </p>
      </div>
    </div>
  `;

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
    });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Erro no envio:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
