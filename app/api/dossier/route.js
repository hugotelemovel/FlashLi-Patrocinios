import { DOSSIERS, gerarDossierPDF, nomeFicheiroDossier } from '../../../lib/dossier';

export const runtime = 'nodejs';

// GET /api/dossier?t=matilde-dwc2026&empresa=Nome%20da%20Empresa[&download=1]
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const chave = searchParams.get('t') || '';
  // Nome limitado a 80 caracteres: evita PDFs gigantes e limita variações que fogem à cache
  const empresa = (searchParams.get('empresa') || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80);
  if (!DOSSIERS[chave]) {
    return new Response(JSON.stringify({ error: 'Dossier não encontrado.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const pdf = await gerarDossierPDF(chave, empresa);
    const nome = nomeFicheiroDossier(chave, empresa);
    const disp = searchParams.get('download') ? 'attachment' : 'inline';
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disp}; filename="${nome}"; filename*=UTF-8''${encodeURIComponent(nome)}`,
        // Cache no CDN da Vercel (1 dia): pedidos repetidos ao mesmo link não geram PDF nem gastam computação
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    console.error('Falha a gerar dossier:', err);
    return new Response(JSON.stringify({ error: 'Falha a gerar o dossier.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
