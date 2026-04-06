'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, Send, Trash2, Search, Download, AlertCircle, Calendar, Award, Phone, Globe, MessageCircle, Mail, Edit, TrendingUp, Target, Filter, X, Crown, PenTool, Printer, LayoutGrid, SortDesc, Radar, ArrowRight, Settings } from 'lucide-react';

export default function App() {
  const [empresas, setEmpresas] = useState([]);
  const [historico, setHistorico] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos'); 
  const [sortBy, setSortBy] = useState('recentes'); 
  const [tab, setTab] = useState('crm');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [objetivo, setObjetivo] = useState(3000);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idioma, setIdioma] = useState('PT');
  const [dataFollowup, setDataFollowup] = useState('');
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState(null);

  const [bAssunto, setBAssunto] = useState('');
  const [bMensagem, setBMensagem] = useState('');
  const [bDestinatarios, setBDestinatarios] = useState('aceites'); 

  const [searchNicho, setSearchNicho] = useState('');
  const [searchLocal, setSearchLocal] = useState('Viana do Castelo');
  const [raioRadar, setRaioRadar] = useState(15); 
  const [radarResultados, setRadarResultados] = useState([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  
  const [msgPropostaPT, setMsgPropostaPT] = useState(`Olá! Sou o Hugo, pai da atleta Matilde Mota (Flash Li Dance School).\n\nEstamos à procura de parceiros para apoiar a nossa equipa rumo ao Campeonato do Mundo de Dança (DWCup 2026) em Dublin. 🇮🇪\n\nDeixo aqui o nosso dossier com a história da Matilde e as propostas de visibilidade para a *{nome}*:\n📄 https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf\n\nGostaria muito de saber a vossa opinião! Muito obrigado.`);
  const [msgPropostaES, setMsgPropostaES] = useState(`¡Hola! Soy Hugo, padre de la atleta Matilde Mota (Flash Li Dance School).\n\nEstamos buscando socios para apoyar a nuestro equipo rumbo al Campeonato Mundial de Danza (DWCup 2026) en Dublín. 🇮🇪\n\nLe dejo aquí nuestro dossier con la historia de Matilde y las propuestas de visibilidad para *{nome}*:\n📄 https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf\n\n¡Me gustaría mucho saber su opinión! Muchas gracias.`);
  const [msgFollowPT, setMsgFollowPT] = useState(`Olá! Sou o Hugo, da Flash Li Dance School.\n\nEntrámos recentemente em contacto com a *{nome}* para uma parceria rumo a Dublin 🇮🇪.\n\nGostava apenas de saber se tiveram oportunidade de analisar o nosso dossier ou se precisam de alguma informação adicional da minha parte.\n\nMuito obrigado pelo vosso tempo!`);
  const [msgFollowES, setMsgFollowES] = useState(`¡Hola! Soy Hugo, de Flash Li Dance School.\n\nRecientemente nos pusimos en contacto con *{nome}* para una colaboración rumbo a Dublín 🇮🇪.\n\nMe gustaría saber si tuvieron la oportunidad de analizar nuestro dossier o si necesitan alguna información adicional.\n\n¡Muchas gracias por su tiempo!`);

  const PRIMARY_COLOR = '#d4af37'; 
  const TEXT_PRIMARY = '#1a1a1a'; 

  useEffect(() => {
    fetchEmpresas(); fetchHistorico();
    if(localStorage.getItem('metaFlashLi')) setObjetivo(Number(localStorage.getItem('metaFlashLi')));
    if(localStorage.getItem('wappPropPT')) setMsgPropostaPT(localStorage.getItem('wappPropPT'));
    if(localStorage.getItem('wappPropES')) setMsgPropostaES(localStorage.getItem('wappPropES'));
    if(localStorage.getItem('wappFollPT')) setMsgFollowPT(localStorage.getItem('wappFollPT'));
    if(localStorage.getItem('wappFollES')) setMsgFollowES(localStorage.getItem('wappFollES'));
  }, []);

  function safePercent(part, total) {
    if (!total || isNaN(total) || total === 0) return 0;
    const calc = (Number(part) / Number(total)) * 100;
    return isNaN(calc) || !isFinite(calc) ? 0 : calc.toFixed(0);
  }

  function safeDateStr(d) {
    if (!d) return '';
    try { const dt = new Date(d); return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('pt-PT'); } catch(e) { return d; }
  }

  function showMessage(text, type = 'info') {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 5000);
  }

  function guardarSettings(e) {
    e.preventDefault();
    localStorage.setItem('wappPropPT', msgPropostaPT); localStorage.setItem('wappPropES', msgPropostaES);
    localStorage.setItem('wappFollPT', msgFollowPT); localStorage.setItem('wappFollES', msgFollowES);
    setShowSettings(false); showMessage('✅ Guiões guardados!', 'success');
  }

  async function fetchEmpresas() {
    setLoading(true);
    const { data, error } = await supabase.from('patrocinadores').select('*').order('created_at', { ascending: false });
    if (!error && data) setEmpresas(data);
    setLoading(false);
  }

  async function fetchHistorico() {
    const { data, error } = await supabase.from('historico_novidades').select('*').order('created_at', { ascending: false });
    if (!error && data) setHistorico(data);
  }

  async function explorarRadar(e) {
    e.preventDefault();
    if (!searchNicho || !searchLocal) return showMessage('Preenche o nicho e a localidade!', 'error');
    setLoadingRadar(true); setRadarResultados([]); showMessage(`A varrer num raio de ${raioRadar}km...`, 'info');

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(searchLocal)}&format=json`);
      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) { setLoadingRadar(false); return showMessage('Localidade não encontrada.', 'error'); }

      const { lat, lon } = geoData[0];
      const overpassQuery = `[out:json][timeout:25];(nwr["name"~"${searchNicho}",i](around:${raioRadar * 1000},${lat},${lon}););out tags;`;
      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: overpassQuery });
      
      if (!res.ok) throw new Error('API sobrecarregada.');
      const data = await res.json();

      if (data && data.elements && data.elements.length > 0) {
        const empresasEncontradas = data.elements.map(el => ({
          id_radar: el.id, nome: el.tags.name, telefone: el.tags.phone || el.tags['contact:phone'] || '',
          website: el.tags.website || el.tags['contact:website'] || '', email: el.tags.email || el.tags['contact:email'] || ''
        })).filter(emp => emp.nome); 
        const unicos = Array.from(new Set(empresasEncontradas.map(a => a.nome))).map(nome => empresasEncontradas.find(a => a.nome === nome));
        if (unicos.length === 0) showMessage('Empresas sem nome registado.', 'error');
        else { setRadarResultados(unicos.slice(0, 40)); showMessage(`✅ Encontradas ${unicos.length} empresas!`, 'success'); }
      } else showMessage('O Radar não encontrou nada.', 'error');
    } catch (error) { showMessage(`Erro: ${error.message}`, 'error'); }
    setLoadingRadar(false);
  }

  async function moverDoRadarParaCRM(empRadar) {
    const novaEmpresa = { nome: empRadar.nome, email: empRadar.email || null, telefone: empRadar.telefone || null, idioma: 'PT', status: 'Pendente', data_followup: null, valor: 0, recibo_enviado: false, logo_recebido: false, redes_sociais: false, notas: empRadar.website ? `Website: ${empRadar.website}` : '' };
    const { data, error } = await supabase.from('patrocinadores').insert([novaEmpresa]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) { setEmpresas([data[0], ...empresas]); setRadarResultados(radarResultados.filter(r => r.id_radar !== empRadar.id_radar)); showMessage('✅ Movida!', 'success'); }
  }

  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome) return showMessage('Nome obrigatório!', 'error');
    if (!email && !telefone) return showMessage('Coloca Email ou Telefone!', 'error');
    const novaEmpresa = { nome, email: email || null, telefone: telefone || null, idioma, status: 'Pendente', data_followup: dataFollowup || null, valor: 0, recibo_enviado: false, logo_recebido: false, redes_sociais: false, notas: '' };
    const { data, error } = await supabase.from('patrocinadores').insert([novaEmpresa]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) { setEmpresas([data[0], ...empresas]); setNome(''); setEmail(''); setTelefone(''); setDataFollowup(''); showMessage('✅ Adicionado!', 'success'); }
  }

  async function updateCampo(id, campo, valor) {
    setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, [campo]: valor } : emp));
    await supabase.from('patrocinadores').update({ [campo]: valor }).eq('id', id);
  }

  function fecharModal() { setEmpresaEmEdicao(null); }

  async function guardarEdicaoTotal(e) {
    e.preventDefault();
    if (!empresaEmEdicao.nome) return showMessage('O nome não pode estar vazio!', 'error');
    const { id, created_at, ...dados } = empresaEmEdicao;
    dados.email = dados.email || null; dados.telefone = dados.telefone || null; dados.data_followup = dados.data_followup || null;
    const { error } = await supabase.from('patrocinadores').update(dados).eq('id', id);
    if (error) showMessage(`❌ Erro: ${error.message}`, 'error');
    else { setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, ...dados } : emp)); fecharModal(); showMessage('✅ Atualizado!', 'success'); }
  }

  async function eliminarEmpresa(id, nomeEmpresa) {
    if (!window.confirm(`Tens a certeza que queres eliminar "${nomeEmpresa}"?`)) return;
    const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
    if (!error) { setEmpresas(empresas.filter(emp => emp.id !== id)); showMessage(`🗑️ Eliminada!`, 'success'); }
  }

  async function enviarProposta(empresa) {
    if (!empresa.email) return showMessage('Sem email!', 'error');
    try {
      const res = await fetch('/api/send-proposal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(empresa) });
      if (res.ok) { showMessage(`✅ Enviado!`, 'success'); updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString()); } 
      else showMessage(`❌ Falha`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }
  
  async function enviarBoasVindas(empresa) {
    if (!empresa.email) return showMessage('Sem email!', 'error');
    try {
      const res = await fetch('/api/send-welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(empresa) });
      if (res.ok) showMessage(`✅ Pedido enviado!`, 'success'); else showMessage(`❌ Falha`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  function getWA(empresa, isFollowUp) {
    let numero = String(empresa.telefone || '').replace(/\D/g, '');
    if (numero.length === 9) numero = empresa.idioma === 'ES' ? '34' + numero : '351' + numero;
    let baseMsg = isFollowUp ? (empresa.idioma === 'ES' ? msgFollowES : msgFollowPT) : (empresa.idioma === 'ES' ? msgPropostaES : msgPropostaPT);
    return `https://wa.me/${numero}?text=${encodeURIComponent(baseMsg.replace(/{nome}/g, empresa.nome))}`;
  }

  async function enviarBroadcast() {
    let alvos = bDestinatarios === 'aceites' ? empresas.filter(e => e.status === 'Aceitou') : bDestinatarios === 'pendentes' ? empresas.filter(e => e.status === 'Pendente' || e.status === 'Em Análise') : empresas;
    if (alvos.length === 0) return showMessage('Sem destinatários.', 'error');
    try {
      const res = await fetch('/api/send-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, empresas: alvos }) });
      if (res.ok) {
        showMessage('✅ Enviado!', 'success');
        const { data: novo } = await supabase.from('historico_novidades').insert([{ assunto: bAssunto, mensagem: bMensagem, total_destinatarios: alvos.length }]).select();
        if (novo) setHistorico([novo[0], ...historico]); setBAssunto(''); setBMensagem('');
      } else showMessage('❌ Erro.', 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  function exportToCSV() {
    const headers = ['Nome', 'Email', 'Telefone', 'Estado', 'Valor', 'Data Follow-up'];
    const rows = empresas.map(e => [ `"${e.nome}"`, e.email || '', e.telefone || '', e.status, e.valor || 0, e.data_followup || '' ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `CRM.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  }

  const angariado = empresas.reduce((acc, curr) => curr.status === 'Aceitou' ? acc + Number(curr.valor || 0) : acc, 0);
  const totalAceites = empresas.filter(e => e.status === 'Aceitou').length;
  const tarefasPendentes = empresas.filter(e => e.status === 'Aceitou' && (!e.recibo_enviado || !e.logo_recebido || !e.redes_sociais));
  const hoje = new Date().toISOString().split('T')[0];
  const urgentesFollowup = empresas.filter(e => (e.status === 'Pendente' || e.status === 'Em Análise') && e.data_followup && e.data_followup <= hoje);
  const countPendentes = empresas.filter(e => e.status === 'Pendente').length;
  const countAnalise = empresas.filter(e => e.status === 'Em Análise').length;
  const countRecusados = empresas.filter(e => e.status === 'Recusou').length;

  function getEscalao(valor) {
    const v = Number(valor);
    if (!v || isNaN(v) || v === 0) return { nome: '-', cor: '#cbd5e1', icon: '' };
    if (v < 50) return { nome: 'Apoiante', cor: '#b45309', icon: '🥉' }; 
    if (v < 150) return { nome: 'Prata', cor: '#94a3b8', icon: '🥈' }; 
    if (v < 300) return { nome: 'Ouro', cor: '#eab308', icon: '🥇' }; 
    return { nome: 'Diamante', cor: '#3b82f6', icon: '💎' }; 
  }

  let topSponsor = { nome: '-', valor: 0 };
  empresas.filter(e => e.status === 'Aceitou').forEach(emp => { if(Number(emp.valor || 0) > topSponsor.valor) topSponsor = { nome: emp.nome, valor: Number(emp.valor) }; });

  let empresasFiltradas = empresas.filter(emp => emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())));
  if (filterStatus !== 'Todos') empresasFiltradas = empresasFiltradas.filter(emp => emp.status === filterStatus);
  if (sortBy === 'valor') empresasFiltradas.sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0));
  else if (sortBy === 'nome') empresasFiltradas.sort((a, b) => a.nome.localeCompare(b.nome));
  else empresasFiltradas.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>A carregar... ⏳</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px', fontFamily: 'sans-serif' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .desktop { display: none; }
        .mobile { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px; }
        .flex { display: flex; flex-wrap: wrap; gap: 10px; }
        .cb { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; padding: 4px 0; }
        .box { background: white; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; }
        .modal-c { background: white; padding: 20px; border-radius: 12px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .inp { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; margin-top: 4px; }
        .btn { padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
        .btn:hover { opacity: 0.9; }
        @media (min-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); } .desktop { display: table; width: 100%; border-collapse: collapse; } .mobile { display: none; } }
        @media print { header, .no-print { display: none !important; } .box { border: 1px solid #ccc; } }
      `}} />

      {/* MODAL CONFIGURAÇÕES */}
      {showSettings && (
        <div className="modal no-print" onClick={() => setShowSettings(false)}>
          <div className="modal-c" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>Definições WhatsApp</h2><button onClick={()=>setShowSettings(false)} className="btn"><X/></button></div>
            <form onSubmit={guardarSettings}>
              <label>Proposta (PT) <textarea className="inp" rows="3" value={msgPropostaPT} onChange={e=>setMsgPropostaPT(e.target.value)} required/></label>
              <label>Proposta (ES) <textarea className="inp" rows="3" value={msgPropostaES} onChange={e=>setMsgPropostaES(e.target.value)} required/></label>
              <label>Follow-up (PT) <textarea className="inp" rows="3" value={msgFollowPT} onChange={e=>setMsgFollowPT(e.target.value)} required/></label>
              <label>Follow-up (ES) <textarea className="inp" rows="3" value={msgFollowES} onChange={e=>setMsgFollowES(e.target.value)} required/></label>
              <button type="submit" className="btn" style={{ background: TEXT_PRIMARY, color: PRIMARY_COLOR, width: '100%', marginTop: '10px' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO */}
      {empresaEmEdicao && (
        <div className="modal no-print" onClick={fecharModal}>
          <div className="modal-c" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>Editar Parceiro</h2><button onClick={fecharModal} className="btn"><X/></button></div>
            <form onSubmit={guardarEdicaoTotal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ gridColumn: 'span 2' }}><label>Nome <input className="inp" value={empresaEmEdicao.nome} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, nome: e.target.value})} required/></label></div>
                <label>Email <input type="email" className="inp" value={empresaEmEdicao.email || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, email: e.target.value})}/></label>
                <label>Telefone <input className="inp" value={empresaEmEdicao.telefone || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, telefone: e.target.value})}/></label>
                <label>Estado <select className="inp" value={empresaEmEdicao.status} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, status: e.target.value})}><option>Pendente</option><option>Em Análise</option><option>Aceitou</option><option>Recusou</option></select></label>
                <label>Data Follow-up <input type="date" className="inp" value={empresaEmEdicao.data_followup || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, data_followup: e.target.value})}/></label>
                <label>Valor (€) <input type="number" className="inp" value={empresaEmEdicao.valor || 0} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, valor: e.target.value})}/></label>
                <label>Idioma <select className="inp" value={empresaEmEdicao.idioma} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, idioma: e.target.value})}><option value="PT">PT</option><option value="ES">ES</option></select></label>
              </div>
              {empresaEmEdicao.status === 'Aceitou' && (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                  <strong>Checklist:</strong>
                  <label className="cb"><input type="checkbox" checked={empresaEmEdicao.recibo_enviado} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, recibo_enviado: e.target.checked})}/> Recibo Emitido</label>
                  <label className="cb"><input type="checkbox" checked={empresaEmEdicao.logo_recebido} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, logo_recebido: e.target.checked})}/> Logo Recebido</label>
                  <label className="cb"><input type="checkbox" checked={empresaEmEdicao.redes_sociais} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, redes_sociais: e.target.checked})}/> Post Redes Sociais</label>
                </div>
              )}
              <div style={{ marginTop: '10px' }}><label>Notas <textarea className="inp" rows="2" value={empresaEmEdicao.notas || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, notas: e.target.value})}/></label></div>
              <div className="flex" style={{ marginTop: '15px' }}>
                <button type="button" onClick={fecharModal} className="btn" style={{ flex: 1, background: '#e2e8f0' }}>Cancelar</button>
                <button type="submit" className="btn" style={{ flex: 2, background: TEXT_PRIMARY, color: PRIMARY_COLOR }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="no-print box" style={{ marginBottom: '20px', borderTop: `5px solid ${PRIMARY_COLOR}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><h1 style={{ margin: 0, fontSize: '20px' }}>ANGARIAÇÃO DWCUP</h1><p style={{ margin: 0, color: '#64748b' }}>Flash Li Dance School</p></div>
          <button onClick={()=>setShowSettings(true)} className="btn" style={{ background: '#f1f5f9' }}><Settings size={18}/></button>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '15px' }}>
          <button onClick={()=>setTab('crm')} className="btn" style={{ background: tab==='crm'?TEXT_PRIMARY:'#f1f5f9', color: tab==='crm'?PRIMARY_COLOR:'#475569' }}><Users size={16}/> CRM</button>
          <button onClick={()=>setTab('radar')} className="btn" style={{ background: tab==='radar'?'#8b5cf6':'#f1f5f9', color: tab==='radar'?'white':'#475569' }}><Radar size={16}/> Radar</button>
          <button onClick={()=>setTab('reports')} className="btn" style={{ background: tab==='reports'?TEXT_PRIMARY:'#f1f5f9', color: tab==='reports'?PRIMARY_COLOR:'#475569' }}><BarChart3 size={16}/> Relatórios</button>
          <button onClick={()=>setTab('broadcast')} className="btn" style={{ background: tab==='broadcast'?TEXT_PRIMARY:'#f1f5f9', color: tab==='broadcast'?PRIMARY_COLOR:'#475569' }}><Send size={16}/> E-mails</button>
          <button onClick={()=>setTab('mural')} className="btn" style={{ background: tab==='mural'?'#3b82f6':'#f1f5f9', color: tab==='mural'?'white':'#475569' }}><LayoutGrid size={16}/> Mural</button>
        </div>
      </header>

      {msg && <div className="no-print" style={{ padding: '15px', borderRadius: '8px', marginBottom: '15px', background: msgType==='error'?'#fee2e2':'#dcfce7', color: msgType==='error'?'#991b1b':'#166534', fontWeight: 'bold' }}>{msg}</div>}

      {/* TAB RADAR */}
      {tab === 'radar' && (
        <div className="no-print box" style={{ borderTop: '4px solid #8b5cf6' }}>
          <h2><Radar size={24} color="#8b5cf6" style={{ verticalAlign: 'middle' }}/> Radar IA (Grátis)</h2>
          <form onSubmit={explorarRadar} className="flex">
            <input className="inp" style={{ flex: '1 1 200px' }} placeholder="Ex: Clínica, Hotel..." value={searchNicho} onChange={e=>setSearchNicho(e.target.value)} />
            <input className="inp" style={{ flex: '1 1 200px' }} placeholder="Cidade (ex: Viana)" value={searchLocal} onChange={e=>setSearchLocal(e.target.value)} />
            <div style={{ flex: '1 1 100px', fontSize: '13px', fontWeight: 'bold' }}>Raio: {raioRadar}km <input type="range" min="2" max="100" value={raioRadar} onChange={e=>setRaioRadar(e.target.value)} style={{ width: '100%' }}/></div>
            <button type="submit" disabled={loadingRadar} className="btn" style={{ flex: '1 1 100%', background: '#8b5cf6', color: 'white', padding: '12px' }}>{loadingRadar ? 'A procurar...' : 'Iniciar Radar'}</button>
          </form>
          {radarResultados.length > 0 && (
            <div className="grid" style={{ marginTop: '20px' }}>
              {radarResultados.map(emp => (
                <div key={emp.id_radar} className="box" style={{ border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{emp.nome}</h4>
                  {emp.telefone && <div style={{ fontSize: '12px', color: '#64748b' }}><Phone size={12}/> {emp.telefone}</div>}
                  {emp.website && <div style={{ fontSize: '12px' }}><Globe size={12}/> <a href={emp.website.startsWith('http')?emp.website:`https://${emp.website}`} target="_blank">Site</a></div>}
                  <button onClick={()=>moverDoRadarParaCRM(emp)} className="btn" style={{ width: '100%', marginTop: '10px', background: '#f1f5f9', color: '#3b82f6', border: '1px dashed #3b82f6' }}><ArrowRight size={14}/> Mover para CRM</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CRM */}
      {tab === 'crm' && (
        <div className="no-print">
          <form onSubmit={addEmpresa} className="box flex" style={{ marginBottom: '15px' }}>
            <input className="inp" style={{ flex: '1 1 200px' }} placeholder="Empresa" value={nome} onChange={e=>setNome(e.target.value)} />
            <input className="inp" style={{ flex: '1 1 150px' }} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="inp" style={{ flex: '1 1 150px' }} placeholder="Telefone" value={telefone} onChange={e=>setTelefone(e.target.value)} />
            <div style={{ flex: '1 1 130px' }}><span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Ligar a:</span><input type="date" className="inp" value={dataFollowup} onChange={e=>setDataFollowup(e.target.value)} style={{ marginTop: 0 }} /></div>
            <select className="inp" style={{ flex: '1 1 60px' }} value={idioma} onChange={e=>setIdioma(e.target.value)}><option value="PT">PT</option><option value="ES">ES</option></select>
            <button type="submit" className="btn" style={{ flex: '1 1 100%', background: TEXT_PRIMARY, color: PRIMARY_COLOR, padding: '12px' }}>+ Adicionar</button>
          </form>

          <div className="flex" style={{ marginBottom: '15px', alignItems: 'center' }}>
            <input className="inp" style={{ flex: '1 1 200px' }} placeholder="Pesquisar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
            <select className="inp" style={{ flex: '1 1 150px' }} value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="recentes">Recentes</option><option value="valor">Maior Valor</option><option value="nome">Ordem Alfabética</option></select>
            <div className="flex" style={{ overflowX: 'auto', flex: '1 1 100%' }}>
              {['Todos', 'Pendente', 'Em Análise', 'Aceitou', 'Recusou'].map(s => <button key={s} onClick={()=>setFilterStatus(s)} className="btn" style={{ background: filterStatus===s?PRIMARY_COLOR:'#e2e8f0', color: filterStatus===s?'white':'black', fontSize: '12px' }}>{s}</button>)}
            </div>
          </div>

          {/* LISTA MOBILE */}
          {empresasFiltradas.map(emp => {
            const escalao = getEscalao(emp.valor);
            return (
              <div key={`m-${emp.id}`} className="mobile" style={{ borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>{emp.nome}</strong><div style={{ fontSize: '12px', color: '#64748b' }}>{emp.telefone || emp.email || 'S/ Contacto'}</div></div>
                  <select className="inp" style={{ width: 'auto', padding: '5px', fontWeight: 'bold' }} value={emp.status} onChange={e=>updateCampo(emp.id, 'status', e.target.value)}><option>Pendente</option><option>Em Análise</option><option>Aceitou</option><option>Recusou</option></select>
                </div>
                
                {emp.status === 'Aceitou' && (
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                    <div className="flex" style={{ alignItems: 'center', marginBottom: '10px' }}>
                      <input type="number" className="inp" style={{ width: '80px', marginTop: 0 }} placeholder="€" value={emp.valor || ''} onChange={e=>updateCampo(emp.id, 'valor', e.target.value)} />
                      <strong style={{ color: escalao.cor }}>{escalao.nome}</strong>
                    </div>
                    <label className="cb" style={{ color: emp.recibo_enviado ? 'green' : 'red' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={e=>updateCampo(emp.id, 'recibo_enviado', e.target.checked)}/> Recibo Emitido</label>
                    <label className="cb" style={{ color: emp.logo_recebido ? 'green' : 'gray' }}><input type="checkbox" checked={emp.logo_recebido} onChange={e=>updateCampo(emp.id, 'logo_recebido', e.target.checked)}/> Logo Recebido</label>
                    <label className="cb" style={{ color: emp.redes_sociais ? 'green' : 'gray' }}><input type="checkbox" checked={emp.redes_sociais} onChange={e=>updateCampo(emp.id, 'redes_sociais', e.target.checked)}/> Post Redes Sociais</label>
                    <button onClick={()=>enviarBoasVindas(emp)} className="btn" style={{ width: '100%', background: '#3b82f6', color: 'white', marginTop: '5px', fontSize: '12px' }}><Mail size={14}/> Pedir NIF e Logo</button>
                  </div>
                )}
                <div className="flex" style={{ marginTop: '10px' }}>
                  {emp.status !== 'Aceitou' && emp.email && <button onClick={()=>enviarProposta(emp)} className="btn" style={{ flex: 1, background: '#3b82f6', color: 'white' }}><Send size={14}/></button>}
                  {emp.status !== 'Aceitou' && emp.telefone && <a href={getWA(emp, false)} target="_blank" className="btn" style={{ flex: 1, background: '#25D366', color: 'white', textDecoration: 'none' }}><MessageCircle size={14}/> WA</a>}
                  {(emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.telefone && <a href={getWA(emp, true)} target="_blank" className="btn" style={{ flex: 1, background: '#128C7E', color: 'white', textDecoration: 'none' }}><MessageCircle size={14}/> F-up</a>}
                  <button onClick={()=>abrirModalEdicao(emp)} className="btn" style={{ background: '#1e293b', color: 'white' }}><PenTool size={14}/></button>
                  <button onClick={()=>eliminarEmpresa(emp.id, emp.nome)} className="btn" style={{ background: '#fee2e2', color: '#ef4444' }}><Trash2 size={14}/></button>
                </div>
              </div>
            );
          })}

          {/* LISTA DESKTOP */}
          <table className="desktop box" style={{ padding: 0, overflow: 'hidden' }}>
            <thead style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}><tr><th style={{ padding: '15px' }}>Parceiro</th><th style={{ padding: '15px' }}>Estado</th><th style={{ padding: '15px' }}>Entregáveis (Se Aceite)</th><th style={{ padding: '15px', textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {empresasFiltradas.map(emp => {
                const escalao = getEscalao(emp.valor);
                return (
                  <tr key={`d-${emp.id}`} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px', borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : 'none' }}>
                      <strong>{emp.nome}</strong><br/><span style={{ fontSize: '12px', color: '#64748b' }}>{emp.email} • {emp.telefone}</span>
                    </td>
                    <td style={{ padding: '15px' }}><select className="inp" value={emp.status} onChange={e=>updateCampo(emp.id, 'status', e.target.value)}><option>Pendente</option><option>Em Análise</option><option>Aceitou</option><option>Recusou</option></select></td>
                    <td style={{ padding: '15px' }}>
                      {emp.status === 'Aceitou' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><input type="number" className="inp" style={{ width: '80px', marginTop: 0 }} value={emp.valor || ''} onChange={e=>updateCampo(emp.id, 'valor', e.target.value)} /><strong style={{ color: escalao.cor }}>{escalao.nome}</strong></div>
                          <label className="cb"><input type="checkbox" checked={emp.recibo_enviado} onChange={e=>updateCampo(emp.id, 'recibo_enviado', e.target.checked)}/> Recibo Emitido</label>
                          <label className="cb"><input type="checkbox" checked={emp.logo_recebido} onChange={e=>updateCampo(emp.id, 'logo_recebido', e.target.checked)}/> Logo Recebido</label>
                          <label className="cb"><input type="checkbox" checked={emp.redes_sociais} onChange={e=>updateCampo(emp.id, 'redes_sociais', e.target.checked)}/> Post Redes Sociais</label>
                          <button onClick={()=>enviarBoasVindas(emp)} className="btn" style={{ background: '#3b82f6', color: 'white', fontSize: '11px', width: 'fit-content' }}><Mail size={12}/> Pedir NIF & Logo</button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      <div className="flex" style={{ justifyContent: 'flex-end' }}>
                        {emp.status !== 'Aceitou' && emp.email && <button onClick={()=>enviarProposta(emp)} className="btn" style={{ background: '#3b82f6', color: 'white' }}><Send size={16}/></button>}
                        {emp.status !== 'Aceitou' && emp.telefone && <a href={getWA(emp, false)} target="_blank" className="btn" style={{ background: '#25D366', color: 'white', textDecoration: 'none' }}><MessageCircle size={16}/></a>}
                        <button onClick={()=>abrirModalEdicao(emp)} className="btn" style={{ background: '#1e293b', color: 'white' }}><PenTool size={16}/></button>
                        <button onClick={()=>eliminarEmpresa(emp.id, emp.nome)} className="btn" style={{ background: '#fee2e2', color: '#ef4444' }}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB RELATÓRIOS */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="no-print flex" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}><BarChart3 size={24} color={PRIMARY_COLOR} style={{ verticalAlign: 'middle' }}/> Dashboards</h2>
            <div className="flex"><button onClick={exportToCSV} className="btn" style={{ background: 'white', border: '1px solid #ccc' }}><Download size={16}/> Excel</button><button onClick={()=>window.print()} className="btn" style={{ background: TEXT_PRIMARY, color: PRIMARY_COLOR }}><Printer size={16}/> PDF</button></div>
          </div>
          <div className="grid">
            <div className="box" style={{ borderLeft: `5px solid ${PRIMARY_COLOR}` }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>Fundo Angariado</div>
              <div style={{ fontSize: '38px', fontWeight: '900' }}>{angariado}€</div>
              <div className="flex" style={{ justifyContent: 'space-between' }}><span className="no-print">Meta: <input type="number" value={objetivo} onChange={e=>handleMetaChange(e.target.value)} style={{ width: '60px' }}/></span><strong>{safePercent(angariado, objetivo)}%</strong></div>
            </div>
            <div className="box" style={{ borderLeft: '5px solid #10b981' }}>
              <div style={{ color: '#166534', fontSize: '13px', fontWeight: 'bold' }}>Top Sponsor</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d' }}>{topSponsor.nome}</div>
              <div style={{ fontWeight: 'bold' }}>{topSponsor.valor > 0 ? `${topSponsor.valor}€` : '-'}</div>
            </div>
            <div className="box">
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Funil de Vendas</h3>
              <div>⏳ Pendentes: {countPendentes}</div><div>🤔 Análise: {countAnalise}</div><div>✅ Aceites: {totalAceites}</div><div>❌ Recusados: {countRecusados}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CAMPANHAS */}
      {tab === 'broadcast' && (
        <div className="no-print box" style={{ maxWidth: '600px', margin: '0 auto', borderTop: `5px solid ${PRIMARY_COLOR}` }}>
          <h2>Campanhas de E-mail</h2>
          <select className="inp" value={bDestinatarios} onChange={e=>setBDestinatarios(e.target.value)}><option value="aceites">Parceiros Aceites</option><option value="pendentes">Pendentes/Análise</option><option value="todos">Todos</option></select>
          <input className="inp" style={{ marginTop: '15px' }} placeholder="Assunto do E-mail" value={bAssunto} onChange={e=>setBAssunto(e.target.value)} />
          <textarea className="inp" style={{ marginTop: '15px' }} rows="6" placeholder="Escreve a tua mensagem aqui..." value={bMensagem} onChange={e=>setBMensagem(e.target.value)} />
          <button onClick={enviarBroadcast} className="btn" style={{ width: '100%', marginTop: '15px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, padding: '15px' }}><Send size={18}/> Enviar Campanha</button>
        </div>
      )}

      {/* TAB MURAL */}
      {tab === 'mural' && (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px' }}>🏆 Mural de Honra</h2>
          <div className="flex" style={{ justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
            <div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#3b82f6' }}>💎 Diamante</h3>{parceirosDiamante.map(e => <div key={e.id} className="box" style={{ background: '#eff6ff', marginBottom: '10px' }}><strong>{e.nome}</strong></div>)}</div>
            <div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#eab308' }}>🥇 Ouro</h3>{parceirosOuro.map(e => <div key={e.id} className="box" style={{ background: '#fefce8', marginBottom: '10px' }}><strong>{e.nome}</strong></div>)}</div>
            <div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#94a3b8' }}>🥈 Prata</h3>{parceirosPrata.map(e => <div key={e.id} className="box" style={{ marginBottom: '10px' }}><strong>{e.nome}</strong></div>)}</div>
          </div>
        </div>
      )}

    </div>
  );
}
