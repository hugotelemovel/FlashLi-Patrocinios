// Rodapé legal comum a todos os emails enviados a empresas:
// identificação do remetente, aviso de privacidade (RGPD) e link para deixar de receber emails.

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function linkRemover(baseUrl, empresaId) {
  if (!empresaId) return null;
  return `${baseUrl}/api/resposta?id=${encodeURIComponent(empresaId)}&resp=remover`;
}

// Cabeçalhos List-Unsubscribe (botão "Cancelar subscrição" do Gmail/Outlook)
export function cabecalhosRemover(baseUrl, empresaId, emailRemetente) {
  const link = linkRemover(baseUrl, empresaId);
  const partes = [];
  if (emailRemetente) partes.push(`<mailto:${emailRemetente}?subject=REMOVER>`);
  if (link) partes.push(`<${link}>`);
  return partes.length ? { 'List-Unsubscribe': partes.join(', ') } : {};
}

export function rodapeLegal({ baseUrl, empresaId, escola, gestor, emailRemetente, isES = false }) {
  const link = linkRemover(baseUrl, empresaId);
  const remetente = `${esc(gestor)} — ${esc(escola)}${emailRemetente ? ` (${esc(emailRemetente)})` : ''}`;
  const txt = isES
    ? {
        porque: `Recibe este email porque su empresa figura como contacto profesional en nuestra campaña de patrocinio. Remitente: ${remetente}.`,
        dados: 'Usamos solo el nombre de la empresa y el contacto para esta campaña; no los compartimos con terceros. Puede pedir el acceso o la eliminación de sus datos respondiendo a este email.',
        remover: 'No quiero recibir más emails',
        responder: 'o responda con la palabra REMOVER.',
      }
    : {
        porque: `Recebe este email porque a vossa empresa consta como contacto profissional da nossa campanha de patrocínio. Remetente: ${remetente}.`,
        dados: 'Usamos apenas o nome da empresa e o contacto para esta campanha e não os partilhamos com terceiros. Pode pedir o acesso ou a eliminação dos seus dados respondendo a este email.',
        remover: 'Não quero receber mais emails',
        responder: 'ou responda com a palavra REMOVER.',
      };
  return `
  <div style="padding:14px 28px 18px;text-align:center;font-size:10.5px;line-height:1.5;color:#94a3b8;">
    <div>${txt.porque}</div>
    <div style="margin-top:4px;">${txt.dados}</div>
    <div style="margin-top:6px;">${link ? `<a href="${link}" style="color:#64748b;text-decoration:underline;">${txt.remover}</a> ` : ''}${txt.responder}</div>
  </div>`;
}
