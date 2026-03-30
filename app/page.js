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
    if (error) {
      showMessage(`Erro de BD: ${error.message}`, 'error');
    } else if (data) {
      setEmpresas(data);
    }
    setLoading(false);
  }

  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome || !email) return;
    
    showMessage('A guardar empresa...', 'info');
    const { data, error } = await supabase.from('patrocinadores').insert([{ nome, email, idioma, status: 'Pendente' }]).select();
    
    if (error) {
      showMessage(`❌ ERRO: ${error.message}`, 'error');
    } else if (data) {
      setEmpresas([data[0], ...empresas]);
      setNome(''); setEmail('');
      showMessage('✅ Empresa adicionada com sucesso!', 'success');
    }
  }

  async function updateCampo(id, campo, valor) {
    setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, [campo]: valor } : emp));
    await supabase.from('patrocinadores').update({ [campo]: valor }).eq('id', id);
  }

  async function eliminarEmpresa(id, nomeEmpresa) {
    if (!window.confirm(`Tens a certeza que queres eliminar os dados da empresa "${nomeEmpresa}"? Isto não tem volta a dar.`)) return;
    
    showMessage(`A eliminar ${nomeEmpresa}...`, 'info');
    
    const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
    if (error) {
      showMessage(`❌ Erro ao eliminar: ${error.message}`, 'error');
    } else {
      setEmpresas(empresas.filter(emp => emp.id !== id));
      showMessage(`🗑️ Empresa ${nomeEmpresa} eliminada com sucesso!`, 'success');
    }
  }

  async function enviarProposta(empresa) {
    showMessage(`A enviar proposta para ${empresa.nome}...`, 'info');
    try {
      const res = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa)
      });
      if (res.ok) {
        showMessage(`✅ Proposta enviada a ${empresa.nome}! Vê o teu email.`, 'success');
        updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString());
      } else {
        const errData = await res.json();
        showMessage(`❌ Erro no envio: ${errData.error}`, 'error');
      }
    } catch (err) { showMessage('Erro de sistema.', 'error'); }
  }

  async function enviarBroadcast() {
    const aceites = empresas.filter(e => e.status === 'Aceitou');
    if (aceites.length === 0) return showMessage('Sem empresas válidas para envio.', 'error');
    showMessage(`A preparar o envio para ${aceites.length} empresas...`, 'info');
    
    try {
      const res = await fetch('/api/send-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, fotoUrl: bFoto, videoUrl: bVideo, empresas: aceites })
      });
      if (res.ok) {
        showMessage('✅ Novidades enviadas com sucesso!', 'success');
        setBAssunto(''); setBMensagem(''); setBFoto(''); setBVideo('');
      } else showMessage('❌ Erro no envio das novidades.', 'error');
    } catch (err) { showMessage('Erro no sistema.', 'error'); }
  }

  const angariado = empresas.reduce((acc, curr) => curr.status === 'Aceitou' ? acc + Number(curr.valor || 0) : acc, 0);
  const totalContactos = empresas.length;
  const totalAceites = empresas.filter(e => e.status === 'Aceitou').length;

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>A carregar sistema Cloud... ☁️</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '30px' }}>🌍</span> Flash Li App
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setTab('crm')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: tab === 'crm' ? '#2563eb' : '#e2e8f0', color: tab === 'crm' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><Users size={18}/> Gestão & Pipeline</button>
          <button onClick={() => setTab('reports')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: tab === 'reports' ? '#2563eb' : '#e2e8f0', color: tab === 'reports' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><BarChart3 size={18}/> Relatórios</button>
          <button onClick={() => setTab('broadcast')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: tab === 'broadcast' ? '#2563eb' : '#e2e8f0', color: tab === 'broadcast' ? 'white' : '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}><ImageIcon size={18}/> Enviar Novidades</button>
        </div>
      </header>

      {msg && (
        <div style={{ 
          background: msgType === 'error' ? '#fee2e2' : msgType === 'success' ? '#dcfce7' : '#dbeafe', 
          color: msgType === 'error' ? '#991b1b' : msgType === 'success' ? '#166534' : '#1e40af', 
          padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', border: '1px solid',
          borderColor: msgType === 'error' ? '#f87171' : msgType === 'success' ? '#4ade80' : '#bfdbfe'
        }}>
          {msg}
        </div>
      )}

      {/* --- PIPELINE CRM --- */}
      {tab === 'crm' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={addEmpresa} style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="text" placeholder="Nome da Empresa" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            <input type="email" placeholder="Email Direto" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} required />
            <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}>
              <option value="PT">🇵🇹 Portugal</option><option value="ES">🇪🇸 Espanha</option>
            </select>
            <button type="submit" style={{ padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Adicionar</button>
          </form>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Empresa</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Gestão (Aceites)</th>
                <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{emp.nome}</div>
                    <div style={{ color: '#64748b', fontSize: '13px' }}>{emp.email} • {emp.idioma}</div>
                    {emp.proposta_enviada_em && <div style={{ color: '#10b981', fontSize: '11px', marginTop: '4px' }}>✓ Proposta enviada</div>}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', outline: 'none' }}>
                      <option value="Pendente">⏳ Pendente</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    {emp.status === 'Aceitou' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input type="number" placeholder="Valor €" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={(e) => updateCampo(emp.id, 'recibo_enviado', e.target.checked)} /> Recibo</label>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {emp.status !== 'Aceitou' && (
                        <button onClick={() => enviarProposta(emp)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><Send size={14}/> Enviar Proposta</button>
                      )}
                      <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} title="Eliminar" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- RELATÓRIOS --- */}
      {tab === 'reports' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Total Angariado</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10b981' }}>{angariado}€</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>De {OBJETIVO}€ necessários</div>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Patrocínios Fechados</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>{totalAceites}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>De {totalContactos} contactos tota</div>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Recibos em Atraso</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>{empresas.filter(e => e.status === 'Aceitou' && !e.recibo_enviado).length}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>Ação contabilística pendente</div>
            </div>
          </div>
        </div>
      )}

      {/* --- BROADCAST / DIÁRIO --- */}
      {tab === 'broadcast' && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginTop: 0, color: '#0f172a' }}>Diário de Bordo Oficial</h2>
          <p style={{ color: '#64748b' }}>Envia novidades espetaculares diretamente para as <b>{totalAceites} empresas</b> que já garantiram o patrocínio.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Assunto do Email</label>
              <input type="text" value={bAssunto} onChange={e=>setBAssunto(e.target.value)} placeholder="Ex: Matilde Mota na Final Mundial! 🥇" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Mensagem (A tua história de hoje)</label>
              <textarea value={bMensagem} onChange={e=>setBMensagem(e.target.value)} rows="6" placeholder="Escreve aqui a novidade..." style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Link de Fotografia 📸</label>
                <input type="text" value={bFoto} onChange={e=>setBFoto(e.target.value)} placeholder="https://site.com/foto.jpg" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Link do Vídeo ▶️</label>
                <input type="text" value={bVideo} onChange={e=>setBVideo(e.target.value)} placeholder="URL do Youtube/Instagram" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <button onClick={enviarBroadcast} style={{ padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
              🚀 Enviar Atualização Multimédia ({totalAceites} Destinatários)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}