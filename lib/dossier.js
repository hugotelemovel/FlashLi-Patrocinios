// Gera o dossier PDF personalizado com o nome da empresa no título.
// O PDF base tem o título "PROPOSTA DE PATROCÍNIO:" e uma linha vazia por baixo,
// onde é desenhado o nome da empresa (centrado e reduzido se for longo).
import { readFile } from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const DOSSIERS = {
  'matilde-dwc2026': {
    nome: 'Matilde Mota — DWC 2026 Dublin',
    base: 'dossiers/matilde-dwc2026/base.pdf',
    prefixo: 'Dossier_MatildeMota',
    titulo: { cx: 364.85, baseline: 720.2, maxW: 318, size: 26, cor: [0.0902, 0.2118, 0.3647] },
  },
};

const FONTE = 'fonts/carlito-sub.ttf';
const cache = new Map();
async function ler(rel) {
  if (!cache.has(rel)) cache.set(rel, await readFile(path.join(process.cwd(), 'assets', rel)));
  return cache.get(rel);
}

export function nomeFicheiroDossier(chave, empresa) {
  const d = DOSSIERS[chave];
  const limpo = String(empresa || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Empresa';
  return `${d?.prefixo || 'Dossier'}_${limpo}.pdf`;
}

export async function gerarDossierPDF(chave, empresa) {
  const d = DOSSIERS[chave];
  if (!d) throw new Error(`Dossier desconhecido: ${chave}`);
  const nome = String(empresa || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const doc = await PDFDocument.load(await ler(d.base));
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await ler(FONTE), { subset: false });
  const t = d.titulo;
  if (nome) {
    let size = t.size;
    while (size > 9 && font.widthOfTextAtSize(nome, size) > t.maxW) size -= 0.5;
    const w = font.widthOfTextAtSize(nome, size);
    doc.getPage(0).drawText(nome, {
      x: t.cx - w / 2, y: t.baseline + (t.size - size) * 0.3, size, font, color: rgb(...t.cor),
    });
  }
  doc.setTitle(`Proposta de Patrocínio${nome ? ' – ' + nome : ''}`);
  doc.setAuthor('Flash Li Dance School');
  return Buffer.from(await doc.save());
}
