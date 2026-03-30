'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, ImageIcon, Send, Trash2, Search, Download, AlertTriangle, CheckCircle, UploadCloud, Calendar, Award, CheckSquare, Square, Phone, Clock, FileText } from 'lucide-react';

export default function App() {
  const [empresas, setEmpresas] = useState([]);
  const [historico, setHistorico] = useState([]); // NOVA VARIÁVEL PARA O HISTÓRICO
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
  const [dataFollowup, setDataFollowup] = useState('');

  const [bAssunto, setBAssunto] = useState('');
  const [bMensagem, setBMensagem] = useState('');
  const [bFoto, setBFoto] = useState('');
  const [bVideo, setBVideo] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [nomeArquivoTemp, setNomeArquivoTemp] = useState('');

  const OBJETIVO = 3000;
  const PRIMARY_COLOR = '#d4af37'; 
  const TEXT_PRIMARY = '#1a1a1a'; 

  useEffect(() => {
    fetchEmpresas();
    fetchHistorico(); // BUSCAR O HISTÓRICO AO ABRIR A APP
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

  // NOVA FUNÇÃO: BUSCAR HISTÓRICO
  async function fetchHistorico() {
    const { data, error } = await supabase.from('historico_novidades').select('*').order('created_at', { ascending: false });
    if (!error && data) setHistorico(data);
  }

  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome || !email) return;
    showMessage('A adicionar parceiro...', 'info');
    const { data, error } = await supabase.from('patrocinadores').insert([{ 
      nome, email, telefone, idioma, status: 'Pendente', data_followup: dataFollowup || null 
    }]).select();
    
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) {
      setEmpresas([data[0], ...empresas]);
      setNome(''); setEmail(''); setTelefone(''); setDataFollowup('');
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
        showMessage(`✅ Enviado com sucesso!`, 'success');
        updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString());
      } else showMessage(`❌ Falha no envio`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  async function uploadFotoDireta(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    showMessage('A carregar foto para a nuvem temporária...', 'info');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('fotos').upload(fileName, file);
    if (error) {
      showMessage(`❌ Erro no upload: ${error.message}`, 'error');
    } else {
      const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
      setBFoto(publicUrlData.publicUrl);
      setNomeArquivoTemp(fileName); 
      showMessage('📸 Foto pronta! (Será apagada da nuvem após o envio)', 'success');
    }
    setUploadingFoto(false);
  }

  // ENVIO DE NOVIDADES ATUALIZADO (GUARDA NO HISTÓRICO)
  async function enviarBroadcast() {
    const aceites = empresas.filter(e => e.status === 'Aceitou');
    if (aceites.length === 0) return showMessage('Sem parceiros ativos para receber novidades.', 'error');
    showMessage(`A embutir foto e a enviar para ${aceites.length} parceiros...`, 'info');
    
    try {
      const res = await fetch('/api/send-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, fotoUrl: bFoto, videoUrl: bVideo, empresas: aceites })
      });
      
      if (res.ok) {
        showMessage('✅ Novidades entregues com sucesso!', 'success');
        
        // GRAVAR NO HISTÓRICO DA BASE DE DADOS
        const { data: novoHistorico, error: histError } = await supabase.from('historico_novidades').insert([{
          assunto: bAssunto,
          mensagem: bMensagem,
          foto_url: bFoto,
          video_url: bVideo,
          total_destinatarios: aceites.length
        }]).select();

        if (novoHistorico) {
          setHistorico([novoHistorico[0], ...historico]); // Atualiza a lista no ecrã na hora
        }

        // AUTO-DESTRUIR FOTO NO SUPABASE
        if (nomeArquivoTemp) {
          await supabase.storage.from('fotos').remove([nomeArquivoTemp]);
          console.log("Foto temporária apagada do Supabase para poupar espaço!");
        }
        
        setBAssunto(''); setBMensagem(''); setBFoto(''); setBVideo(''); setNomeArquivoTemp('');
      } else {
        showMessage('❌ Erro no envio dos emails.', 'error');
      }
    } catch (err) { 
      showMessage('Erro técnico no servidor.', 'error'); 
    }
  }

  function exportToCSV() {
    const headers = ['Nome', 'Email', 'Telefone', 'Idioma', 'Estado', 'Valor (€)', 'Escalão', 'Recibo', 'Logo Recebido', 'Redes Sociais', 'Follow-up'];
    const rows = empresas.map(emp => [
      `"${emp.nome}"`, emp.email, emp.telefone || '', emp.idioma, emp.status, emp.valor || 0, getEscalao(emp.valor).nome, 
      emp.recibo_enviado ? 'Sim' : 'Não', emp.logo_recebido ? 'Sim' : 'Não', emp.redes_sociais ? 'Sim' : 'Não', emp.data_followup || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FlashLi_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  const angariado = empresas.reduce((acc, curr) => curr.status === 'Aceitou' ? acc + Number(curr.valor || 0) : acc, 0);
  const totalAceites = empresas.filter(e => e.status === 'Aceitou').length;
  const tarefasPendentes = empresas.filter(e => e.status === 'Aceitou' && (!e.recibo_enviado || !e.logo_recebido || !e.redes_sociais)).length;
  const hoje = new Date().toISOString().split('T')[0];
  const followupsAtrasados = empresas.filter(e => e.status === 'Pendente' && e.data_followup && e.data_followup <= hoje).length;

  function getEscalao(valor) {
    const v = Number(valor);
    if (!v || v === 0) return { nome: '-', cor: '#cbd5e1', icon: '' };
    if (v < 50) return { nome: 'Apoiante', cor: '#b45309', icon: '🥉' }; 
    if (v < 150) return { nome: 'Prata', cor: '#94a3b8', icon: '🥈' }; 
    if (v < 300) return { nome: 'Ouro', cor: '#eab308', icon: '🥇' }; 
    return { nome: 'Diamante', cor: '#3b82f6', icon: '💎' }; 
  }

  let empresasFiltradas = empresas.filter(emp => emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
  if (filterStatus !== 'Todos') empresasFiltradas = empresasFiltradas.filter(emp => emp.status === filterStatus);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>A carregar Super App... ⏳</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .responsive-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .desktop-table { display: none; }
        .mobile-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .flex-wrap-mobile { flex-wrap: wrap; }
        .task-checkbox { display: flex; alignItems: center; gap: 8px; font-size: 12px; cursor: pointer; padding: 4px 0; }
        .task-checkbox:hover { opacity: 0.8; }
        
        @media (min-width: 768px) {
          .responsive-grid { grid-template-columns: repeat(3, 1fr); }
          .desktop-table { display: table; width: 100%; border-collapse: collapse; }
          .mobile-card { display: none; }
          .flex-wrap-mobile { flex-wrap: nowrap; }
        }
        input, select, textarea { box-sizing: border-box; }
        .btn-hover:hover { opacity: 0.9; transform: scale(0.98); transition: 0.2s; }
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
          <button onClick={() => setTab('reports')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'reports' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'reports' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            <BarChart3 size={18}/> Dashboards 
            {(followupsAtrasados > 0 || tarefasPendentes > 0) && <span style={{background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px'}}>{followupsAtrasados + tarefasPendentes}</span>}
          </button>
          <button onClick={() => setTab('broadcast')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'broadcast' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'broadcast' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><ImageIcon size={18}/> Diário de Bordo</button>
        </div>
      </header>

      {msg && <div style={{ background: msgType === 'error' ? '#fee2e2' : '#f0fdf4', color: msgType === 'error' ? '#991b1b' : '#166534', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold', border: `1px solid ${msgType === 'error' ? '#f87171' : '#4ade80'}` }}>{msg}</div>}

      {/* === ABA: PIPELINE CRM === */}
      {tab === 'crm' && (
        <div style={{ background: 'transparent' }}>
          <form onSubmit={addEmpresa} style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="flex-wrap-mobile">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Nova Prospecção</h3>
            </div>
            
            <input type="text" placeholder="Empresa (Ex: Talho Central)" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
            <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ flex: '1 1 120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            
            <div style={{ flex: '1 1 140px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-8px', left: '10px', background: 'white', padding: '0 5px', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>Ligar a:</span>
              <input type="date" value={dataFollowup} onChange={e => setDataFollowup(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
            </div>

            <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ flex: '1 1 70px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="PT">🇵🇹</option><option value="ES">🇪🇸</option>
            </select>
            <button type="submit" className="btn-hover" style={{ flex: '1 1 100%', padding: '14px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Adicionar ao Pipeline</button>
          </form>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }} className="flex-wrap-mobile">
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', flex: '1 1 100%' }}>
              {['Todos', 'Pendente', 'Aceitou', 'Recusou'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '8px 12px', borderRadius: '20px', border: 'none', background: filterStatus === status ? PRIMARY_COLOR : '#e2e8f0', color: filterStatus === status ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {status === 'Aceitou' ? '✅ Aceites' : status === 'Recusou' ? '❌ Recusados' : status === 'Pendente' ? '⏳ Pendentes' : '🌍 Todos'}
                </button>
              ))}
            </div>
          </div>

          {empresasFiltradas.map(emp => {
            const escalao = getEscalao(emp.valor);
            const atrasado = emp.status === 'Pendente' && emp.data_followup && emp.data_followup <= hoje;

            return (
              <div key={`mobile-${emp.id}`} className="mobile-card" style={{ borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : atrasado ? '4px solid #ef4444' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '16px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {emp.nome} {emp.status === 'Aceitou' && escalao.icon}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email}</div>
                  </div>
                  <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: emp.status === 'Aceitou' ? '#dcfce7' : emp.status === 'Pendente' ? '#fef9c3' : '#fee2e2' }}>
                    <option value="Pendente">⏳ Pendente</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                  </select>
                </div>

                {emp.status === 'Pendente' && emp.data_followup && (
                  <div style={{ fontSize: '11px', color: atrasado ? '#ef4444' : '#64748b', fontWeight: atrasado ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', background: atrasado ? '#fee2e2' : '#f1f5f9', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                    <Calendar size={12}/> Ligar a: {new Date(emp.data_followup).toLocaleDateString('pt-PT')} {atrasado && '(Atrasado!)'}
                  </div>
                )}

                {emp.status === 'Aceitou' && (
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input type="number" placeholder="Valor €" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '90px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: escalao.cor }}>{escalao.nome}</div>
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Tarefas (Checklist):</div>
                      <label className="task-checkbox" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={(e) => updateCampo(emp.id, 'recibo_enviado', e.target.checked)} /> Emitir Recibo Oficial</label>
                      <label className="task-checkbox" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={(e) => updateCampo(emp.id, 'logo_recebido', e.target.checked)} /> Logo da Empresa Recebido</label>
                      <label className="task-checkbox" style={{ color: emp.redes_sociais ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.redes_sociais} onChange={(e) => updateCampo(emp.id, 'redes_sociais', e.target.checked)} /> Agradecimento nas Redes</label>
                    </div>
                  </div>
                )}

                <input type="text" placeholder="Notas/Observações..." value={emp.notas || ''} onChange={(e) => updateCampo(emp.id, 'notas', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: '10px', background: '#f8fafc' }} />

                <div style={{ display: 'flex', gap: '8px' }}>
                  {emp.status !== 'Aceitou' && (
                    <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><Send size={14}/> Enviar Proposta</button>
                  )}
                  <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px' }}><Trash2 size={16}/></button>
                </div>
              </div>
            );
          })}

          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="desktop-table">
            <table className="desktop-table">
              <thead style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', fontSize: '13px' }}>
                <tr>
                  <th style={{ padding: '15px' }}>Parceiro</th>
                  <th style={{ padding: '15px' }}>Estado do Negócio</th>
                  <th style={{ padding: '15px' }}>Entregáveis (Checklist)</th>
                  <th style={{ padding: '15px' }}>Notas & Follow-up</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresasFiltradas.map(emp => {
                  const escalao = getEscalao(emp.valor);
                  const atrasado = emp.status === 'Pendente' && emp.data_followup && emp.data_followup <= hoje;

                  return (
                    <tr key={`desktop-${emp.id}`} style={{ borderTop: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '15px', borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : '4px solid transparent' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>{emp.nome} {emp.status === 'Aceitou' && escalao.icon}</div>
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginBottom: '5px' }}>
                              <input type="number" placeholder="€" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '80px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                              <span style={{fontSize: '11px', fontWeight: 'bold', color: escalao.cor}}>{escalao.nome}</span>
                            </div>
                            <label className="task-checkbox" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={(e) => updateCampo(emp.id, 'recibo_enviado', e.target.checked)} /> 1. Recibo Emitido</label>
                            <label className="task-checkbox" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={(e) => updateCampo(emp.id, 'logo_recebido', e.target.checked)} /> 2. Logo Recebido</label>
                            <label className="task-checkbox" style={{ color: emp.redes_sociais ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.redes_sociais} onChange={(e) => updateCampo(emp.id, 'redes_sociais', e.target.checked)} /> 3. Post nas Redes</label>
                          </div>
                        ) : <span style={{color: '#cbd5e1'}}>-</span>}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {emp.status === 'Pendente' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Ligar a:</span>
                            <input type="date" value={emp.data_followup || ''} onChange={(e) => updateCampo(emp.id, 'data_followup', e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', background: atrasado ? '#fee2e2' : 'white', color: atrasado ? '#ef4444' : 'inherit' }} />
                          </div>
                        )}
                        <textarea placeholder="Notas..." value={emp.notas || ''} onChange={(e) => updateCampo(emp.id, 'notas', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', minHeight: '40px', fontSize: '12px', background: '#f8fafc', resize: 'vertical' }}></textarea>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {emp.status !== 'Aceitou' && <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Enviar Email"><Send size={16}/></button>}
                          <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} className="btn-hover" style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === ABA: RELATÓRIOS E ANALÍTICA === */}
      {tab === 'reports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button onClick={exportToCSV} className="btn-hover" style={{ padding: '10px 20px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Download size={16}/> Exportar Ficheiro Excel (.csv)</button>
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
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Parceiros / Conversão</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#3b82f6', margin: '5px 0' }}>{totalAceites}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>{empresas.length > 0 ? ((totalAceites / empresas.length) * 100).toFixed(0) : 0}% de taxa de fecho</div>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '16px', borderLeft: `5px solid ${tarefasPendentes > 0 ? '#ef4444' : '#10b981'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tarefas (Recibos e Logos)</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: tarefasPendentes > 0 ? '#ef4444' : '#10b981', margin: '5px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {tarefasPendentes} {tarefasPendentes > 0 ? <AlertTriangle size={30}/> : <CheckCircle size={30}/>}
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Parceiros com tarefas de fecho pendentes</div>
            </div>
          </div>
        </div>
      )}

      {/* === ABA: DIÁRIO DE BORDO E HISTÓRICO === */}
      {tab === 'broadcast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* CAIXA DE NOVO ENVIO */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: `1px solid ${PRIMARY_COLOR}` }}>
            <h2 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '24px', fontWeight: '900' }}>Diário de Bordo 🇮🇪</h2>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Comunica novidades e resultados diretamente para as <b>{totalAceites} empresas</b> oficiais.</p>

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
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#334155', fontSize: '14px' }}>Adicionar Imagem / Álbum 📸</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label className="btn-hover" style={{ background: TEXT_PRIMARY, color: 'white', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                      <UploadCloud size={16}/> Enviar Foto Solta do Telemóvel
                      <input type="file" accept="image/*" onChange={uploadFotoDireta} style={{ display: 'none' }} disabled={uploadingFoto} />
                    </label>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{uploadingFoto ? 'A carregar para a nuvem...' : '(Guarda e anexa ao email)'}</span>
                  </div>
                  
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>OU</div>
                  
                  <input type="text" value={bFoto} onChange={e=>setBFoto(e.target.value)} placeholder="Cola aqui um link partilhado (Google Fotos / iCloud)" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155', fontSize: '13px' }}>Adicionar Vídeo ▶️</label>
                <input type="text" value={bVideo} onChange={e=>setBVideo(e.target.value)} placeholder="Link direto do YouTube / Instagram" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <button onClick={enviarBroadcast} className="btn-hover" style={{ padding: '18px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
                🚀 Disparar para {totalAceites} Parceiros Oficiais
              </button>
            </div>
          </div>

          {/* SECÇÃO DO HISTÓRICO DE ENVIOS */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <Clock size={22} color={PRIMARY_COLOR}/> Histórico de Atualizações Enviadas
            </h3>
            
            {historico.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0', fontSize: '15px' }}>Ainda não foram enviadas atualizações.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {historico.map((item) => (
                  <div key={item.id} style={{ padding: '20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                      <strong style={{ fontSize: '16px', color: '#1e293b' }}>{item.assunto}</strong>
                      <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '4px 10px', borderRadius: '20px', color: '#475569', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14}/> {new Date(item.created_at).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                    
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 15px 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {item.mensagem && item.mensagem.length > 150 ? item.mensagem.substring(0, 150) + '...' : item.mensagem}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14}/> Enviado para {item.total_destinatarios} parceiros</span>
                      {(item.foto_url || item.video_url) && (
                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={14}/> Incluiu Multimédia</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
