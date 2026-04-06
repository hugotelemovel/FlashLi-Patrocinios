import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Liga ao Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const resp = searchParams.get('resp'); // pode ser 'sim', 'pensar' ou 'nao'

  let novoStatus = 'Pendente';
  let mensagemEcra = '';

  if (resp === 'sim') {
    novoStatus = 'Aceitou';
    mensagemEcra = '🎉 Muito obrigado pelo vosso apoio! O Hugo entrará em contacto muito em breve para tratar dos próximos passos.';
  } else if (resp === 'pensar') {
    novoStatus = 'Em Análise';
    mensagemEcra = '🤔 Obrigado por dedicarem tempo a analisar a nossa proposta! Ficaremos a aguardar o vosso feedback.';
  } else if (resp === 'nao') {
    novoStatus = 'Recusou';
    mensagemEcra = 'Obrigado por terem avaliado a nossa proposta. Compreendemos perfeitamente. Desejamos muito sucesso para a vossa empresa!';
  }

  // Atualiza o teu CRM (Supabase) automaticamente!
  if (id) {
    await supabase.from('patrocinadores').update({ status: novoStatus }).eq('id', id);
  }

  // Mostra uma página bonita à empresa
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flash Li - Resposta Registada</title>
    </head>
    <body style="font-family: Arial, sans-serif; text-align: center; background-color: #f8fafc; color: #1a1a1a; padding: 50px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-top: 6px solid #d4af37;">
        <h1 style="color: #1F497D;">Resposta Registada!</h1>
        <p style="font-size: 18px; line-height: 1.6; color: #475569;">${mensagemEcra}</p>
        <p style="margin-top: 30px; font-size: 14px; color: #94a3b8;">Pode fechar esta janela.</p>
      </div>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
