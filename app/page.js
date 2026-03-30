'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, ImageIcon, Send, Trash2, Search, Download, AlertTriangle, CheckCircle, UploadCloud } from 'lucide-react';

export default function App() {
  const [empresas, setEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos'); 
  const [tab, setTab] = useState('crm');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idioma, setIdioma] = useState('PT');

  const [bAssunto, setBAssunto] = useState('');
  const [bMensagem, setBMensagem] = useState('');
  const [bFoto, setBFoto] = useState('');
  const [bVideo, setBVideo] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const OBJETIVO = 3000;
  const PRIMARY_COLOR = '#d4af37'; 
  const TEXT_PRIMARY = '#1a1a1a'; 

  useEffect(() => {
    fetchEmpresas();
  }, []);

  function showMessage(text, type = 'info') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 5000);
  }

  async function fetchEmpresas() {
    setLoading(true);
    const { data, error } = await supabase.from('patrocinadores').select('*').order('created_at', { ascending: false });
    if (error) showMessage(`Erro: ${error.message}`, 'error');
    else if (data) setEmpresas(data);
    setLoading(false);
  }

  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome || !email) return;
    showMessage('A adicionar parceiro...', 'info');
    const { data, error } = await supabase.from('patrocinadores').insert([{ nome, email, telefone, idioma, status: 'Pendente' }]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) {
      setEmpresas([data[0], ...empresas]);
      setNome(''); setEmail(''); setTelefone('');
      showMessage('✅ Parceiro adicionado com sucesso!', 'success');
    }
  }

  async function updateCampo(id, campo, valor) {
    setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, [campo]: valor } : emp));
    await supabase.from('patrocinadores').update({ [campo]: valor }).eq('id', id);
  }

  async function eliminarEmpresa(id, nomeEmpresa) {
    if (!window.confirm(`Eliminar permanentemente "${nomeEmpresa}"?`)) return;
    const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
    if (!error) {
      setEmpresas(empresas.filter(emp => emp.id !== id));
      showMessage(`🗑️ Eliminada!`, 'success');
    }
  }

  async function enviarProposta(empresa) {
    showMessage(`A enviar proposta profissional para ${empresa.nome}...`, 'info');
    try {
      const res = await fetch('/api/send-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa)
      });
      if (res.ok) {
        showMessage(`✅ Enviado!`, 'success');
        updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString());
      } else showMessage(`❌ Falha no envio`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  // --- NOVA FUNÇÃO DE UPLOAD DE FOTOS SOLTAS ---
  async function uploadFotoDireta(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFoto(true);
    showMessage('A carregar foto para a nuvem...', 'info');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage.from('fotos').upload(fileName, file);
    
    if (error) {
      showMessage(`❌ Erro no upload: ${error.message}`, 'error');
    } else {
      const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
      setBFoto(publicUrlData.publicUrl);
      showMessage('📸 Foto carregada e pronta a enviar!', 'success');
    }
    setUploadingFoto(false);
  }

  async function enviarBroadcast() {
    const aceites = empresas.filter(e => e.status === 'Aceitou');
    if (aceites.length === 0) return showMessage('Sem parceiros ativos para receber novidades.', 'error');
    showMessage(`A enviar diário para ${aceites.length} parceiros...`, 'info');
    try {
      const res = await fetch('/api/send-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, fotoUrl: bFoto, videoUrl: bVideo, empresas: aceites })
      });
      if (res.ok) {
        showMessage('✅ Novidades entregues!', 'success');
        setBAssunto(''); setBMensagem(''); setBFoto(''); setBVideo('');
      } else showMessage('❌ Erro no envio.', 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  function exportToCSV() {
    const headers = ['Nome', 'Email', 'Telefone', 'Idioma', 'Estado', 'Valor (€)', 'Recibo Emitido', 'Notas'];
    const rows = empresas.map(emp => [
      `"${emp.nome}"`, emp.email, emp.telefone || '', emp.idioma, emp.status, emp.valor || 0, emp.recibo_enviado ? 'Sim' : 'Não', `"${emp.notas || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FlashLi_Patrocinadores.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const angariado = empresas.reduce((acc, curr) => curr.status === 'Aceitou' ? acc + Number(curr.valor || 0) : acc, 0);
  const totalAceites = empresas.filter(e => e.status === 'Aceitou').length;
  const recibosPendentes = empresas.filter(e => e.status === 'Aceitou' && !e.recibo_enviado).length;

  let empresasFiltradas = empresas.filter(emp => emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
  if (filterStatus !== 'Todos') {
    empresasFiltradas = empresasFiltradas.filter(emp => emp.status === filterStatus);
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>A carregar Super App... ⏳</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .responsive-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .desktop-table { display: none; }
        .mobile-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .flex-wrap-mobile { flex-wrap: wrap; }
        
        @media (min-width: 768px) {
          .responsive-grid { grid-template-columns: repeat(3, 1fr); }
          .desktop-table { display: table; width: 100%; border-collapse: collapse; }
          .mobile-card { display: none; }
          .flex-wrap-mobile { flex-wrap: nowrap; }
        }
        
        input, select, textarea { box-sizing: border-box; }
        .btn-hover:hover { opacity: 0.9; transform: scale(0.98); }
      `}} />

      {/* CABEÇALHO */}
      <header style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.jpg" alt="Logotipo Oficial Flash Li" style={{ width: '65px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
          <div>
            <h1 style={{ color: TEXT_PRIMARY, margin: 0, fontSize: '22px', fontWeight: '900' }}>ANGARIAÇÃO DWCUP</h1>
            <h2 style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Flash Li Dance School • Dublin 2026</h2>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          <button onClick={() => setTab('crm')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'crm' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'crm' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><Users size={18}/> Pipeline CRM</button>
          <button onClick={() => setTab('reports')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'reports' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'reports' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><BarChart3 size={18}/> Dashboards</button>
          <button onClick={() => setTab('broadcast')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'broadcast' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'broadcast' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><ImageIcon size={18}/> Diário Rumo a Dublin</button>
        </div>
      </header>

      {msg && <div style={{ background: msgType === 'error' ? '#fee2e2' : '#f0fdf4', color: msgType === 'error' ? '#991b1b' : '#166534', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold', border: `1px solid ${msgType === 'error' ? '#f87171' : '#4ade80'}` }}>{msg}</div>}

      {/* === ABA: PIPELINE CRM === */}
      {tab === 'crm' && (
        <div style={{ background: 'transparent' }}>
          <form onSubmit={addEmpresa} style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="flex-wrap-mobile">
            <h3 style={{ width: '100%', margin: '0 0 10px 0', fontSize: '16px' }}>Novo Contacto</h3>
            <input type="text" placeholder="Nome da Empresa" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
            <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ flex: '1 1 120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ flex: '1 1 80px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="PT">🇵🇹</option><option value="ES">🇪🇸</option>
            </select>
            <button type="submit" className="btn-hover" style={{ flex: '1 1 100%', padding: '12px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar e Adicionar</button>
          </form>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }} className="flex-wrap-mobile">
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', flex: '1 1 100%' }}>
              {['Todos', 'Pendente', 'Aceitou', 'Recusou'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '8px 12px', borderRadius: '20px', border: 'none', background: filterStatus === status ? PRIMARY_COLOR : '#e2e8f0', color: filterStatus === status ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                  {status === 'Aceitou' ? '✅ Aceites' : status === 'Recusou' ? '❌ Recusados' : status === 'Pendente' ? '⏳ Pendentes' : '🌍 Todos'}
                </button>
              ))}
            </div>
          </div>

          {empresasFiltradas.map(emp => (
            <div key={`mobile-${emp.id}`} className="mobile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '16px', color: TEXT_PRIMARY }}>{emp.nome}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email} {emp.telefone && `• ${emp.telefone}`}</div>
                </div>
                <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: emp.status === 'Aceitou' ? '#dcfce7' : emp.status === 'Pendente' ? '#fef9c3' : '#fee2e2' }}>
                  <option value="Pendente">⏳ Pendente</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                </select>
              </div>
              {emp.status === 'Aceitou' && (
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Gestão Financeira:</div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="number" placeholder="Valor €" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    <button onClick={() => updateCampo(emp.id, 'recibo_enviado', !emp.recibo_enviado)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: emp.recibo_enviado ? '#10b981' : '#ef4444', color: 'white' }}>
                      {emp.recibo_enviado ? <><CheckCircle size={16}/> Recibo Emitido</> : <><X size={16}/> Faltar Emitir Recibo</>}
                    </button>
                  </div>
                </div>
              )}
              <input type="text" placeholder="Adicionar notas (Ex: Ligar à tarde)..." value={emp.notas || ''} onChange={(e) => updateCampo(emp.id, 'notas', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '10px', background: '#f8fafc' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                {emp.status !== 'Aceitou' && (
                  <button onClick={() => enviarProposta(emp)} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><Send size={14}/> Enviar Proposta</button>
                )}
                <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px' }}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}

          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="desktop-table">
            <table className="desktop-table">
              <thead style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', fontSize: '13px' }}>
                <tr>
                  <th style={{ padding: '15px' }}>Parceiro / Empresa</th>
                  <th style={{ padding: '15px' }}>Estado do Negócio</th>
                  <th style={{ padding: '15px' }}>Financeiro & Recibos</th>
                  <th style={{ padding: '15px' }}>Notas Internas</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map(emp => (
                  <tr key={`desktop-${emp.id}`} style={{ borderTop: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{emp.nome}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email} <br/> {emp.telefone}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', outline: 'none' }}>
                        <option value="Pendente">⏳ Pendente</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                      </select>
                      {emp.proposta_enviada_em && <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '5px' }}>✓ Proposta Enviada</div>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      {emp.status === 'Aceitou' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input type="number" placeholder="Valor €" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '100px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          <button onClick={() => updateCampo(emp.id, 'recibo_enviado', !emp.recibo_enviado)} style={{ width: '130px', padding: '6px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', background: emp.recibo_enviado ? '#10b981' : '#ef4444', color: 'white', fontSize: '11px' }}>
                            {emp.recibo_enviado ? '✅ Recibo Emitido' : '❌ Falta Recibo'}
                          </button>
                        </div>
                      ) : <span style={{color: '#cbd5e1'}}>-</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <textarea placeholder="Adicionar nota..." value={emp.notas || ''} onChange={(e) => updateCampo(emp.id, 'notas', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '50px', fontSize: '12px', background: '#f8fafc', resize: 'vertical' }}></textarea>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {emp.status !== 'Aceitou' && <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Enviar Email"><Send size={16}/></button>}
                        <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} className="btn-hover" style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === ABA: RELATÓRIOS E ANALÍTICA === */}
      {tab === 'reports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={exportToCSV} className="btn-hover" style={{ padding: '10px 20px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Download size={16}/> Exportar para Excel (.csv)</button>
          </div>
          
          <div className="responsive-grid">
            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', borderLeft: `5px solid ${PRIMARY_COLOR}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Fundo Angariado</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: TEXT_PRIMARY, margin: '5px 0' }}>{angariado}€</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Objetivo: {OBJETIVO}€</div>
              <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((angariado/OBJETIVO)*100, 100)}%`, background: PRIMARY_COLOR, height: '100%' }}></div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', borderLeft: '5px solid #3b82f6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Parceiros Oficiais</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#3b82f6', margin: '5px 0' }}>{totalAceites}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>De {empresas.length} contactos efetuados</div>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', borderLeft: `5px solid ${recibosPendentes > 0 ? '#ef4444' : '#10b981'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Contabilidade (Recibos)</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: recibosPendentes > 0 ? '#ef4444' : '#10b981', margin: '5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {recibosPendentes} {recibosPendentes > 0 ? <AlertTriangle size={30}/> : <CheckCircle size={30}/>}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Recibos pendentes de emissão</div>
            </div>
          </div>
        </div>
      )}

      {/* === ABA: DIÁRIO DE BORDO === */}
      {tab === 'broadcast' && (
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto', border: `1px solid ${PRIMARY_COLOR}` }}>
          <h2 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '24px', fontWeight: '900' }}>Diário de Bordo 🇮🇪</h2>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Comunica novidades diretamente para as <b>{totalAceites} empresas</b> que já garantiram o patrocínio.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Assunto do Email</label>
              <input type="text" value={bAssunto} onChange={e=>setBAssunto(e.target.value)} placeholder="Ex: Medalha de Ouro em Acro Dance! 🥇🏆" style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '16px' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Mensagem aos Patrocinadores</label>
              <textarea value={bMensagem} onChange={e=>setBMensagem(e.target.value)} rows="6" placeholder="Escreva a atualização aqui..." style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', resize: 'vertical' }}></textarea>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#334155', fontSize: '14px' }}>Fotografia / Imagem da Novidade 📸</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* 1. Escolher ficheiro solto */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ background: TEXT_PRIMARY, color: 'white', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                    <UploadCloud size={16}/> Escolher Foto
                    <input type="file" accept="image/*" onChange={uploadFotoDireta} style={{ display: 'none' }} disabled={uploadingFoto} />
                  </label>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{uploadingFoto ? 'A carregar para a nuvem...' : 'Faz upload direto da galeria'}</span>
                </div>
                
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>OU</div>
                
                {/* 2. Colar link */}
                <input type="text" value={bFoto} onChange={e=>setBFoto(e.target.value)} placeholder="Cola aqui um link do iCloud/Google Fotos se preferires um álbum" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155', fontSize: '13px' }}>Link Vídeo ▶️</label>
              <input type="text" value={bVideo} onChange={e=>setBVideo(e.target.value)} placeholder="URL YouTube/Insta" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>

            <button onClick={enviarBroadcast} className="btn-hover" style={{ padding: '18px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
              🚀 Disparar para {totalAceites} Parceiros Oficiais
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
