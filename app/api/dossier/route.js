import { DOSSIERS, gerarDossierPDF, nomeFicheiroDossier } from '../../../lib/dossier';

export const runtime = 'nodejs';

// GET /api/dossier?t=matilde-dwc2026&empresa=Nome%20da%20Empresa[&download=1]
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const chave = searchParams.get('t') || '';
  const empresa = searchParams.get('empresa') || '';
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
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
