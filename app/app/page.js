'use client';
import { useState, useEffect } from 'react';

export default function CRMDashboard() {
  const [patrocinadores, setPatrocinadores] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idioma, setIdioma] = useState('PT');
  
  const [tab, setTab] = useState('crm'); // crm, update
  const [msgStatus, setMsgStatus] = useState('');

  // Update State
  const [updateAssunto, setUpdateAssunto] = useState('');
  const [updateMensagem, setUpdateMensagem] = useState('');

  // Carregar dados guardados
  useEffect(() => {
    const saved = localStorage.getItem('flashli_sponsors');
    if (saved) setPatrocinadores(JSON.parse(saved));
  }, []);

  // Gravar sempre que muda
  useEffect(() => {
    localStorage.setItem('flashli_sponsors', JSON.stringify(patrocinadores));
  }, [patrocinadores]);

  const adicionarEmpresa = (e) => {
    e.preventDefault();
    if (!nome || !email) return;
    setPatrocinadores([...patrocinadores, { id: Date.now(), nome, email, idioma, status: 'Pendente' }]);
    setNome(''); setEmail('');
  };

  const mudarStatus = (id, novoStatus) => {
    setPatrocinadores(patrocinadores.map(p => p.id === id ? { ...p, status: novoStatus } : p));
  };

  const enviarProposta = async (empresa) => {
    setMsgStatus(`A enviar proposta para ${empresa.nome}...`);
    try {
      const res = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa)
      });
      if (res.ok) {
        setMsgStatus(`✅ Proposta enviada a ${empresa.nome}!`);
      } else {
        setMsgStatus(`❌ Erro a enviar para ${empresa.nome}.`);
      }
    } catch (err) {
      setMsgStatus('Erro de sistema.');
    }
  };

  const enviarAtualizacoes = async () => {
    const aceites = patrocinadores.filter(p => p.status === 'Aceitou');
    if (aceites.length === 0) return setMsgStatus('Não tens empresas que aceitaram ainda.');
    
    setMsgStatus(`A enviar novidades para ${aceites.length} empresas...`);
    try {
      const res = await fetch('/api/send-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: updateAssunto, mensagem: updateMensagem, empresas: aceites })
      });
      if (res.ok) {
        setMsgStatus('✅ Novidades enviadas com sucesso!');
        setUpdateAssunto(''); setUpdateMensagem('');
      } else {
        setMsgStatus('❌ Erro a enviar novidades.');
      }
    } catch (err) {
      setMsgStatus('Erro de sistema.');
    }
  };

  const pendentes = patrocinadores.filter(p => p.status === 'Pendente');
  const aceites = patrocinadores.filter(p => p.status === 'Aceitou');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1F497D', margin: 0 }}>Flash Li CRM - Matilde Mota</h1>
        <div>
          <button onClick={() => setTab('crm')} style={{ padding: '10px 20px', background: tab === 'crm' ? '#1F497D' : '#ddd', color: tab === 'crm' ? 'white' : 'black', border: 'none', borderRadius: '4px', marginRight: '10px', cursor: 'pointer' }}>Gestão de Propostas</button>
          <button onClick={() => setTab('update')} style={{ padding: '10px 20px', background: tab === 'update' ? '#1F497D' : '#ddd', color: tab === 'update' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Diário de Bordo</button>
        </div>
      </header>

      {msgStatus && <div style={{ background: '#e0f2fe', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#0369a1', fontWeight: 'bold' }}>{msgStatus}</div>}

      {tab === 'crm' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3>Adicionar Nova Empresa</h3>
          <form onSubmit={adicionarEmpresa} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input type="text" placeholder="Nome da Empresa" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} required />
            <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="PT">Português (PT)</option>
              <option value="ES">Espanhol (ES)</option>
            </select>
            <button type="submit" style={{ padding: '10px 20px', background: '#00B050', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Adicionar</button>
          </form>

          <h3>Lista de Patrocinadores ({patrocinadores.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px 8px' }}>Empresa</th>
                <th style={{ padding: '12px 8px' }}>Email</th>
                <th style={{ padding: '12px 8px' }}>Idioma</th>
                <th style={{ padding: '12px 8px' }}>Estado</th>
                <th style={{ padding: '12px 8px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {patrocinadores.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{p.nome}</td>
                  <td style={{ padding: '12px 8px' }}>{p.email}</td>
                  <td style={{ padding: '12px 8px' }}>{p.idioma}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', background: p.status === 'Aceitou' ? '#dcfce7' : p.status === 'Recusou' ? '#fee2e2' : '#f3f4f6' }}>
                      <option value="Pendente">⏳ Pendente</option>
                      <option value="Aceitou">✅ Aceitou</option>
                      <option value="Recusou">❌ Recusou</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <button onClick={() => enviarProposta(p)} style={{ padding: '6px 12px', background: '#1F497D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✉️ Enviar Proposta</button>
                  </td>
                </tr>
              ))}
              {patrocinadores.length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Nenhuma empresa adicionada ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'update' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3>📢 Enviar Novidades (Apenas para {aceites.length} empresas que Aceitaram)</h3>
          {aceites.length === 0 ? (
             <p style={{ color: 'red' }}>Ainda não marcaste nenhuma empresa como "Aceitou" na aba de Gestão!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Assunto (ex: Chegámos a Dublin!)" value={updateAssunto} onChange={e => setUpdateAssunto(e.target.value)} style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }} />
              <textarea placeholder="Escreve aqui a novidade. Vai ser enviada a todos os que apoiaram..." value={updateMensagem} onChange={e => setUpdateMensagem(e.target.value)} rows="6" style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}></textarea>
              <button onClick={enviarAtualizacoes} style={{ padding: '12px', background: '#00B050', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>🚀 Enviar Novidades para os {aceites.length} Patrocinadores</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}