'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [mensagem, setMensagem] = useState('');
  const [assunto, setAssunto] = useState('');
  const [status, setStatus] = useState('');

  // Simulação da tua base de dados de empresas que já aceitaram
  const empresasQueAceitaram = [
    { nome: 'Talho Central', email: 'geral@talhocentral.pt' },
    { nome: 'Minho Defeso', email: 'geral@minhodefeso.pt' }
  ];

  const enviarAtualizacao = async () => {
    setStatus('A enviar...');
    const res = await fetch('/api/send-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assunto, mensagem, empresasQueAceitaram })
    });

    if (res.ok) {
      setStatus('✅ Emails enviados com sucesso para todos os patrocinadores!');
      setMensagem(''); setAssunto('');
    } else {
      setStatus('❌ Erro ao enviar os emails.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#1F497D' }}>🌟 Portal de Patrocinadores - Matilde Mota</h1>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>📢 Enviar Novidades de Dublin</h2>
        <p>Este email será enviado <b>apenas</b> para as {empresasQueAceitaram.length} empresas que aceitaram patrocinar.</p>
        
        <input 
          type="text" 
          placeholder="Assunto (ex: Chegámos a Dublin!)" 
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <textarea 
          placeholder="Escreve aqui as novidades para os patrocinadores..." 
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows="6"
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        ></textarea>
        
        <button 
          onClick={enviarAtualizacao}
          style={{ background: '#00B050', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🚀 Enviar Novidades
        </button>

        {status && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
      </div>
    </div>
  );
}