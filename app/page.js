'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, Image as ImageIcon, Send, Trash2 } from 'lucide-react';

export default function App() {
  const [empresas, setEmpresas] = useState([]);
  const [tab, setTab] = useState('crm');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info'); 

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idioma, setIdioma] = useState('PT');

  const [bAssunto, setBAssunto] = useState('');
  const [bMensagem, setBMensagem] = useState('');
  const [bFoto, setBFoto] = useState('');
  const [bVideo, setBVideo] = useState('');

  const OBJETIVO = 3000;

  useEffect(() => {
    fetchEmpresas();
  }, []);

  function showMessage(text, type = 'info') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 6000);
  }

  async function fetchEmpresas() {
    setLoading(true);
    const { data, error } = await supabase.from('patrocinadores').select('*').order('created_at', { ascending: false });
    if (!error && data) setEmpresas(data);
    setLoading(false);
  }

  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome || !email) return;
    showMessage('A guardar empresa...', 'info');
    const { data, error } = await supabase.from('patrocinadores').insert([{ nome, email, idioma, status: 'Pendente' }]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) {
      setEmpresas([data[0], ...empresas]);
      setNome(''); setEmail('');
      showMessage('✅ Adicionada com sucesso!', 'success');
    }
  }

  async function updateCampo(id, campo, valor) {
    setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, [campo]: valor } : emp));
    await supabase.from('patrocinadores').update({ [campo]: valor }).eq('id', id);
  }

  async function eliminarEmpresa(id, nomeEmpresa) {
    if (!window.confirm(`Eliminar "${nomeEmpresa}"?`)) return;
    const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
    if (!error) {
      setEmpresas(empresas.filter(emp => emp.id !== id));
      showMessage(`🗑️ Eliminada!`, 'success');
    }
  }

  async function enviarProposta(empresa) {
    showMessage(`A enviar proposta via Gmail...`, 'info');
    try {
      const res = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa)
      });
      if (res.ok) {
        showMessage(`✅ Enviado com sucesso!`, 'success');
        updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString());
      } else showMessage(`❌ Erro no envio`, 'error');
    } catch (err) { showMessage('Erro de sistema.', 'error'); }
  }

  async function enviarBroadcast() {
    const aceites = empresas.filter(e => e.status === 'Aceitou');
    if (aceites.length === 0) return showMessage('Sem empresas para envio.', 'error');
    showMessage(`A enviar novidades via Gmail...`, 'info');
    try {
      const res = await fetch('/api/send-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, fotoUrl: bFoto, videoUrl: bVideo, empresas: aceites })
      });
      if (res.ok) {
        showMessage('✅ Novidades enviadas!', 'success');
        setBAssunto(''); setBMensagem(''); setBFoto(''); setBVideo('');
      } else showMessage('❌ Erro no envio.', 'error');
    } catch (err) { showMessage('Erro de sistema.', 'error'); }
  }

  const angariado = empresas.reduce((acc, curr) => curr.status === 'Aceitou' ? acc + Number(curr.valor || 0) : acc, 0);
  const totalContactos = empresas.length;
  const totalAceites = empresas.filter(e => e.status === 'Aceitou').length;

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>A carregar... ☁️</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🌍</span> Flash Li App
        </h1>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          <button onClick={() => setTab('crm')} style={{ flexShrink: 0, padding: '10px 15px', background: tab === 'crm' ? '#2563eb' : '#e2e8f0', color: tab === 'crm' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Gestão</button>
          <button onClick={() => setTab('reports')} style={{ flexShrink: 0, padding: '10px 15px', background: tab === 'reports' ? '#2563eb' : '#e2e8f0', color: tab === 'reports' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Relatórios</button>
          <button onClick={() => setTab('broadcast')} style={{ flexShrink: 0, padding: '10px 15px', background: tab === 'broadcast' ? '#2563eb' : '#e2e8f0', color: tab === 'broadcast' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Novidades</button>
        </div>
      </header>

      {msg && <div style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', background: msgType === 'error' ? '#fee2e2' : '#dcfce7', color: msgType === 'error' ? '#991b1b' : '#166534' }}>{msg}</div>}

      {tab === 'crm' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={addEmpresa} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
            <input type="text" placeholder="Empresa" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: '1 1 200px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: '1 1 200px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ flex: '1 1 100px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <option value="PT">🇵🇹 PT</option><option value="ES">🇪🇸 ES</option>
            </select>
            <button type="submit" style={{ flex: '1 1 100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>+ Adicionar</button>
          </form>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Empresa</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Gestão (€)</th>
                  <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                    <td style={{ padding: '12px' }}><strong>{emp.nome}</strong><br/><span style={{fontSize:'12px', color:'#64748b'}}>{emp.email}</span></td>
                    <td style={{ padding: '12px' }}>
                      <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
                        <option value="Pendente">⏳ Pendente</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {emp.status === 'Aceitou' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input type="number" placeholder="€" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '80px', padding: '6px' }} />
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                        {emp.status !== 'Aceitou' && <button onClick={() => enviarProposta(emp)} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>Enviar</button>}
                        <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} style={{ padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>Apagar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>Total Angariado</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{angariado}€</div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold' }}>Patrocínios Fechados</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{totalAceites}</div>
          </div>
        </div>
      )}

      {tab === 'broadcast' && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, fontSize: '20px' }}>Diário de Bordo Oficial</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <input type="text" value={bAssunto} onChange={e=>setBAssunto(e.target.value)} placeholder="Assunto..." style={{ width: '100%', padding: '12px', borderRadius: '6px' }} />
            <textarea value={bMensagem} onChange={e=>setBMensagem(e.target.value)} rows="5" placeholder="Novidade de hoje..." style={{ width: '100%', padding: '12px', borderRadius: '6px' }}></textarea>
            <input type="text" value={bFoto} onChange={e=>setBFoto(e.target.value)} placeholder="Link de Fotografia 📸" style={{ width: '100%', padding: '12px', borderRadius: '6px' }} />
            <input type="text" value={bVideo} onChange={e=>setBVideo(e.target.value)} placeholder="Link do Vídeo ▶️" style={{ width: '100%', padding: '12px', borderRadius: '6px' }} />
            <button onClick={enviarBroadcast} style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>🚀 Enviar para {totalAceites} Parceiros</button>
          </div>
        </div>
      )}
    </div>
  );
}
