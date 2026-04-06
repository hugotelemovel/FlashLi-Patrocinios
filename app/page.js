'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, Send, Trash2, Search, Download, AlertCircle, Calendar, Award, Phone, Globe, MessageCircle, Mail, Edit, TrendingUp, Target, Filter, X, Crown, PenTool, Printer, LayoutGrid, SortDesc, Radar, ArrowRight, Settings, UploadCloud } from 'lucide-react';

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
  const [bFoto, setBFoto] = useState('');
  const [bVideo, setBVideo] = useState('');
  const [bDestinatarios, setBDestinatarios] = useState('aceites'); 
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [nomeArquivoTemp, setNomeArquivoTemp] = useState('');

  const [searchNicho, setSearchNicho] = useState('');
  const [searchLocal, setSearchLocal] = useState('Viana do Castelo');
  const [raioRadar, setRaioRadar] = useState(15); 
  const [radarResultados, setRadarResultados] = useState([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  
  const defaultPropPT = `Olá! Sou o Hugo, pai da atleta Matilde Mota (Flash Li Dance School).\n\nEstamos à procura de parceiros para apoiar a nossa equipa rumo ao Campeonato do Mundo de Dança (DWCup 2026) em Dublin. 🇮🇪\n\nDeixo aqui o nosso dossier com a história da Matilde e as propostas de visibilidade para a *{nome}*:\n📄 https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf\n\nGostaria muito de saber a vossa opinião! Muito obrigado.`;
  const defaultPropES = `¡Hola! Soy Hugo, padre de la atleta Matilde Mota (Flash Li Dance School).\n\nEstamos buscando socios para apoyar a nuestro equipo rumbo al Campeonato Mundial de Danza (DWCup 2026) en Dublín. 🇮🇪\n\nLe dejo aquí nuestro dossier con la historia de Matilde y las propuestas de visibilidad para *{nome}*:\n📄 https://flash-li-patrocinios.vercel.app/Dossier_Matilde_Mota.pdf\n\n¡Me gustaría mucho saber su opinión! Muchas gracias.`;
  const defaultFollPT = `Olá! Sou o Hugo, da Flash Li Dance School.\n\nEntrámos recentemente em contacto com a *{nome}* para uma parceria rumo a Dublin 🇮🇪.\n\nGostava apenas de saber se tiveram oportunidade de analisar o nosso dossier ou se precisam de alguma informação adicional da minha parte.\n\nMuito obrigado pelo vosso tempo!`;
  const defaultFollES = `¡Hola! Soy Hugo, de Flash Li Dance School.\n\nRecientemente nos pusimos en contacto con *{nome}* para una colaboración rumbo a Dublín 🇮🇪.\n\nMe gustaría saber si tuvieron la oportunidad de analizar nuestro dossier o si necesitan alguna información adicional.\n\n¡Muchas gracias por su tiempo!`;

  const [msgPropostaPT, setMsgPropostaPT] = useState(defaultPropPT);
  const [msgPropostaES, setMsgPropostaES] = useState(defaultPropES);
  const [msgFollowPT, setMsgFollowPT] = useState(defaultFollPT);
  const [msgFollowES, setMsgFollowES] = useState(defaultFollES);

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

  function handleMetaChange(val) {
    const num = Number(val) || 0;
    setObjetivo(num); localStorage.setItem('metaFlashLi', num);
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
      
      if (!res.ok) throw new Error('API do mapa sobrecarregada.');
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
    else if (data) { setEmpresas([data[0], ...empresas]); setRadarResultados(radarResultados.filter(r => r.id_radar !== empRadar.id_radar)); showMessage('✅ Movida para o CRM!', 'success'); }
  }

  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome) return showMessage('Nome obrigatório!', 'error');
    if (!email && !telefone) return showMessage('Coloca Email ou Telefone!', 'error');
    const novaEmpresa = { nome, email: email || null, telefone: telefone || null, idioma, status: 'Pendente', data_followup: dataFollowup || null, valor: 0, recibo_enviado: false, logo_recebido: false, redes_sociais: false, notas: '' };
    const { data, error } = await supabase.from('patrocinadores').insert([novaEmpresa]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) { setEmpresas([data[0], ...empresas]); setNome(''); setEmail(''); setTelefone(''); setDataFollowup(''); showMessage('✅ Parceiro adicionado!', 'success'); }
  }

  async function updateCampo(id, campo, valor) {
    setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, [campo]: valor } : emp));
    await supabase.from('patrocinadores').update({ [campo]: valor }).eq('id', id);
  }

  function abrirModalEdicao(emp) { setEmpresaEmEdicao({ ...emp }); }
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

  async function uploadFotoDireta(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true); showMessage('A carregar foto...', 'info');
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('fotos').upload(fileName, file);
    if (error) showMessage(`❌ Erro no upload: ${error.message}`, 'error');
    else {
      const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
      setBFoto(publicUrlData.publicUrl); setNomeArquivoTemp(fileName); showMessage('📸 Foto pronta!', 'success');
    }
    setUploadingFoto(false);
  }

  async function enviarBroadcast() {
    let alvos = bDestinatarios === 'aceites' ? empresas.filter(e => e.status === 'Aceitou') : bDestinatarios === 'pendentes' ? empresas.filter(e => e.status === 'Pendente' || e.status === 'Em Análise') : empresas;
    if (alvos.length === 0) return showMessage('Sem destinatários.', 'error');
    showMessage('A enviar campanha...', 'info');
    try {
      const res = await fetch('/api/send-update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, fotoUrl: bFoto, videoUrl: bVideo, empresas: alvos }) });
      if (res.ok) {
        showMessage('✅ Enviado!', 'success');
        const { data: novo } = await supabase.from('historico_novidades').insert([{ assunto: bAssunto, mensagem: bMensagem, foto_url: bFoto, video_url: bVideo, total_destinatarios: alvos.length }]).select();
        if (novo) setHistorico([novo[0], ...historico]); 
        setBAssunto(''); setBMensagem(''); setBFoto(''); setBVideo('');
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
  const valorMedio = totalAceites > 0 ? (angariado / totalAceites).toFixed(0) : 0;
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

  const parceirosDiamante = empresas.filter(e => e.status === 'Aceitou' && getEscalao(e.valor).nome === 'Diamante');
  const parceirosOuro = empresas.filter(e => e.status === 'Aceitou' && getEscalao(e.valor).nome === 'Ouro');
  const parceirosPrata = empresas.filter(e => e.status === 'Aceitou' && getEscalao(e.valor).nome === 'Prata');
  const parceirosApoiante = empresas.filter(e => e.status === 'Aceitou' && getEscalao(e.valor).nome === 'Apoiante');

  let topSponsor = { nome: '-', valor: 0 };
  empresas.filter(e => e.status === 'Aceitou').forEach(emp => { if(Number(emp.valor || 0) > topSponsor.valor) topSponsor = { nome: emp.nome, valor: Number(emp.valor) }; });

  function getStatusColor(status) {
    if (status === 'Aceitou') return '#dcfce7'; 
    if (status === 'Pendente') return '#fef9c3'; 
    if (status === 'Em Análise') return '#ffedd5'; 
    return '#fee2e2'; 
  }

  let empresasFiltradas = empresas.filter(emp => emp.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase())));
  if (filterStatus !== 'Todos') empresasFiltradas = empresasFiltradas.filter(emp => emp.status === filterStatus);
  if (sortBy === 'valor') empresasFiltradas.sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0));
  else if (sortBy === 'nome') empresasFiltradas.sort((a, b) => a.nome.localeCompare(b.nome));
  else empresasFiltradas.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>A carregar Super App... ⏳</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .desktop { display: none; }
        .mobile { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .flex { display: flex; flex-wrap: wrap; gap: 10px; }
        .cb { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; padding: 4px 0; cursor: pointer; }
        .box { background: white; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; }
        .modal-c { background: white; padding: 25px; border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .inp { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit; margin-top: 4px; }
        .btn { padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
        .btn:hover { opacity: 0.9; }
        @media (min-width: 768px) { .grid { grid-template-columns: repeat(3, 1fr); } .desktop { display: table; width: 100%; border-collapse: collapse; } .mobile { display: none; } }
        @media print { header, .no-print { display: none !important; } .box { border: 1px solid #ccc; box-shadow: none; break-inside: avoid; } }
      `}} />

      {/* MODAL CONFIGURAÇÕES */}
      {showSettings && (
        <div className="modal no-print" onClick={() => setShowSettings(false)}>
          <div className="modal-c" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}><Settings size={20} style={{ verticalAlign: 'middle' }}/> Textos do WhatsApp</h2>
              <button onClick={()=>setShowSettings(false)} className="btn" style={{ background: 'transparent' }}><X size={24}/></button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Usa <b>{`{nome}`}</b> no texto para a App substituir automaticamente.</p>
            <form onSubmit={guardarSettings}>
              <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Proposta (PT) <textarea className="inp" rows="3" value={msgPropostaPT} onChange={e=>setMsgPropostaPT(e.target.value)} required/></label>
              <label style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '10px', display: 'block' }}>Proposta (ES) <textarea className="inp" rows="3" value={msgPropostaES} onChange={e=>setMsgPropostaES(e.target.value)} required/></label>
              <label style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '10px', display: 'block' }}>Follow-up (PT) <textarea className="inp" rows="3" value={msgFollowPT} onChange={e=>setMsgFollowPT(e.target.value)} required/></label>
              <label style={{ fontWeight: 'bold', fontSize: '13px', marginTop: '10px', display: 'block' }}>Follow-up (ES) <textarea className="inp" rows="3" value={msgFollowES} onChange={e=>setMsgFollowES(e.target.value)} required/></label>
              <button type="submit" className="btn" style={{ background: TEXT_PRIMARY, color: PRIMARY_COLOR, width: '100%', marginTop: '15px', padding: '15px' }}>💾 Guardar Definições</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO */}
      {empresaEmEdicao && (
        <div className="modal no-print" onClick={fecharModal}>
          <div className="modal-c" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}><Edit size={20} style={{ verticalAlign: 'middle' }}/> Editar Parceiro</h2>
              <button onClick={fecharModal} className="btn" style={{ background: 'transparent' }}><X size={24}/></button>
            </div>
            <form onSubmit={guardarEdicaoTotal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ gridColumn: 'span 2' }}><label style={{ fontWeight: 'bold', fontSize: '13px' }}>Nome <input className="inp" value={empresaEmEdicao.nome} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, nome: e.target.value})} required/></label></div>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Email <input type="email" className="inp" value={empresaEmEdicao.email || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, email: e.target.value})}/></label>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Telefone <input className="inp" value={empresaEmEdicao.telefone || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, telefone: e.target.value})}/></label>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Estado <select className="inp" value={empresaEmEdicao.status} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, status: e.target.value})} style={{ background: getStatusColor(empresaEmEdicao.status) }}><option>Pendente</option><option>Em Análise</option><option>Aceitou</option><option>Recusou</option></select></label>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Data Lembrete <input type="date" className="inp" value={empresaEmEdicao.data_followup || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, data_followup: e.target.value})}/></label>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Valor (€) <input type="number" className="inp" value={empresaEmEdicao.valor || 0} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, valor: e.target.value})}/></label>
                <label style={{ fontWeight: 'bold', fontSize: '13px' }}>Idioma <select className="inp" value={empresaEmEdicao.idioma} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, idioma: e.target.value})}><option value="PT">PT</option><option value="ES">ES</option></select></label>
              </div>
              {empresaEmEdicao.status === 'Aceitou' && (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '15px' }}>
                  <strong style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>Checklist:</strong>
                  <label className="cb"><input type="checkbox" checked={empresaEmEdicao.recibo_enviado} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, recibo_enviado: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Recibo Emitido</label>
                  <label className="cb"><input type="checkbox" checked={empresaEmEdicao.logo_recebido} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, logo_recebido: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Logo Recebido</label>
                  <label className="cb"><input type="checkbox" checked={empresaEmEdicao.redes_sociais} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, redes_sociais: e.target.checked})} style={{ transform: 'scale(1.2)' }}/> Post Redes Sociais</label>
                </div>
              )}
              <div style={{ marginTop: '10px' }}><label style={{ fontWeight: 'bold', fontSize: '13px' }}>Notas <textarea className="inp" rows="2" value={empresaEmEdicao.notas || ''} onChange={e=>setEmpresaEmEdicao({...empresaEmEdicao, notas: e.target.value})}/></label></div>
              <div className="flex" style={{ marginTop: '20px' }}>
                <button type="button" onClick={fecharModal} className="btn" style={{ flex: 1, background: '#e2e8f0', padding: '12px' }}>Cancelar</button>
                <button type="submit" className="btn" style={{ flex: 2, background: TEXT_PRIMARY, color: PRIMARY_COLOR, padding: '12px' }}>💾 Guardar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="no-print box" style={{ marginBottom: '20px', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '65px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
            <div><h1 style={{ color: TEXT_PRIMARY, margin: 0, fontSize: '22px', fontWeight: '900' }}>ANGARIAÇÃO DWCUP</h1><h2 style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Flash Li Dance School</h2></div>
          </div>
          <button onClick={()=>setShowSettings(true)} className="btn" style={{ background: '#f1f5f9', color: '#475569', padding: '12px' }} title="Definições"><Settings size={20}/></button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', marginTop: '20px' }}>
          <button onClick={()=>setTab('crm')} className="btn" style={{ background: tab==='crm'?TEXT_PRIMARY:'#f1f5f9', color: tab==='crm'?PRIMARY_COLOR:'#475569', padding: '12px 20px' }}><Users size={18}/> CRM</button>
          <button onClick={()=>setTab('radar')} className="btn" style={{ background: tab==='radar'?'#8b5cf6':'#f1f5f9', color: tab==='radar'?'white':'#475569', padding: '12px 20px' }}><Radar size={18}/> Radar IA</button>
          <button onClick={()=>setTab('reports')} className="btn" style={{ background: tab==='reports'?TEXT_PRIMARY:'#f1f5f9', color: tab==='reports'?PRIMARY_COLOR:'#475569', padding: '12px 20px' }}><BarChart3 size={18}/> Relatórios {(urgentesFollowup.length > 0 || tarefasPendentes.length > 0) && <span style={{background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px'}}>{urgentesFollowup.length + tarefasPendentes.length}</span>}</button>
          <button onClick={()=>setTab('broadcast')} className="btn" style={{ background: tab==='broadcast'?TEXT_PRIMARY:'#f1f5f9', color: tab==='broadcast'?PRIMARY_COLOR:'#475569', padding: '12px 20px' }}><Send size={18}/> Campanhas</button>
          <button onClick={()=>setTab('mural')} className="btn" style={{ background: tab==='mural'?'#3b82f6':'#f1f5f9', color: tab==='mural'?'white':'#475569', padding: '12px 20px' }}><LayoutGrid size={18}/> Mural</button>
        </div>
      </header>

      {msg && <div className="no-print" style={{ padding: '15px', borderRadius: '8px', marginBottom: '20px', background: msgType==='error'?'#fee2e2':'#f0fdf4', color: msgType==='error'?'#991b1b':'#166534', fontWeight: 'bold', border: `1px solid ${msgType==='error'?'#f87171':'#4ade80'}` }}>{msg}</div>}

      {/* ================= ABA RADAR ================= */}
      {tab === 'radar' && (
        <div className="no-print box" style={{ maxWidth: '900px', margin: '0 auto', borderTop: `6px solid #8b5cf6` }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0' }}><Radar size={28} color="#8b5cf6"/> Radar de Prospeção (Grátis)</h2>
          <form onSubmit={explorarRadar} className="flex">
            <div style={{ flex: '1 1 250px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>O que procuras?</label><input className="inp" placeholder="Ex: Clínica, Imobiliária..." value={searchNicho} onChange={e=>setSearchNicho(e.target.value)} /></div>
            <div style={{ flex: '1 1 200px' }}><label style={{ fontSize: '13px', fontWeight: 'bold' }}>Cidade Base</label><input className="inp" placeholder="Ex: Viana do Castelo" value={searchLocal} onChange={e=>setSearchLocal(e.target.value)} /></div>
            <div style={{ flex: '1 1 150px' }}><label style={{ fontSize: '13px', fontWeight: 'bold', color: '#8b5cf6' }}>Raio: {raioRadar} km</label><input type="range" min="2" max="100" value={raioRadar} onChange={e=>setRaioRadar(e.target.value)} style={{ width: '100%', marginTop: '10px', accentColor: '#8b5cf6' }}/></div>
            <button type="submit" disabled={loadingRadar} className="btn" style={{ flex: '1 1 100%', background: '#8b5cf6', color: 'white', padding: '15px', marginTop: '10px', fontSize: '16px' }}>{loadingRadar ? 'A varrer o mapa...' : <><Search size={18}/> Iniciar Varrimento</>}</button>
          </form>
          {radarResultados.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '15px' }}>Resultados em Quarentena ({radarResultados.length})</h3>
              <div className="grid">
                {radarResultados.map(emp => (
                  <div key={emp.id_radar} className="box" style={{ padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{emp.nome}</h4>
                      {emp.telefone && <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><Phone size={14}/> {emp.telefone}</div>}
                      {emp.website && <div style={{ fontSize: '13px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={14}/> <a href={emp.website.startsWith('http')?emp.website:`https://${emp.website}`} target="_blank" style={{ color: 'inherit' }}>Website</a></div>}
                    </div>
                    <button onClick={()=>moverDoRadarParaCRM(emp)} className="btn" style={{ width: '100%', marginTop: '15px', background: '#f1f5f9', color: '#3b82f6', border: '1px dashed #3b82f6', padding: '12px' }}><ArrowRight size={16}/> Mover para o CRM</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= ABA CRM ================= */}
      {tab === 'crm' && (
        <div className="no-print">
          <form onSubmit={addEmpresa} className="box flex" style={{ marginBottom: '20px' }}>
            <input className="inp" style={{ flex: '1 1 200px' }} placeholder="Empresa (Obrigatório)" value={nome} onChange={e=>setNome(e.target.value)} />
            <input className="inp" style={{ flex: '1 1 200px' }} placeholder="Email (Opcional)" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="inp" style={{ flex: '1 1 120px' }} placeholder="Telefone (Opcional)" value={telefone} onChange={e=>setTelefone(e.target.value)} />
            <div style={{ flex: '1 1 140px', position: 'relative' }}><span style={{ position: 'absolute', top: '-8px', left: '10px', background: 'white', padding: '0 5px', fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>Ligar a:</span><input type="date" className="inp" value={dataFollowup} onChange={e=>setDataFollowup(e.target.value)} style={{ marginTop: '4px' }} /></div>
            <select className="inp" style={{ flex: '1 1 70px' }} value={idioma} onChange={e=>setIdioma(e.target.value)}><option value="PT">PT</option><option value="ES">ES</option></select>
            <button type="submit" className="btn" style={{ flex: '1 1 100%', background: TEXT_PRIMARY, color: PRIMARY_COLOR, padding: '14px', fontSize: '15px' }}>+ Adicionar Parceiro</button>
          </form>

          <div className="flex" style={{ marginBottom: '15px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 200px', position: 'relative' }}><Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} /><input className="inp" style={{ paddingLeft: '40px' }} placeholder="Pesquisar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} /></div>
            <div style={{ flex: '1 1 150px', position: 'relative' }}><SortDesc size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} /><select className="inp" style={{ paddingLeft: '40px', fontWeight: 'bold' }} value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="recentes">Mais Recentes</option><option value="valor">Maior Valor</option><option value="nome">Ordem Alfabética</option></select></div>
            <div className="flex" style={{ overflowX: 'auto', flex: '1 1 100%' }}>
              {['Todos', 'Pendente', 'Em Análise', 'Aceitou', 'Recusou'].map(s => <button key={s} onClick={()=>setFilterStatus(s)} className="btn" style={{ background: filterStatus===s?PRIMARY_COLOR:'#e2e8f0', color: filterStatus===s?'white':'#475569', borderRadius: '20px', padding: '8px 15px', fontSize: '13px', whiteSpace: 'nowrap' }}>{s === 'Aceitou' ? '✅ Aceites' : s === 'Recusou' ? '❌ Recusados' : s === 'Em Análise' ? '🤔 Em Análise' : s === 'Pendente' ? '⏳ Pendentes' : '🌍 Todos'}</button>)}
            </div>
          </div>

          {/* LISTA MOBILE */}
          {empresasFiltradas.map(emp => {
            const escalao = getEscalao(emp.valor);
            const atrasado = (emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.data_followup && emp.data_followup <= hoje;
            return (
              <div key={`m-${emp.id}`} className="mobile" style={{ borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : atrasado ? '4px solid #ef4444' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div><div style={{ fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>{emp.nome} {emp.status === 'Aceitou' && escalao.icon}</div><div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email || 'S/ Email'} {emp.telefone && `• ${emp.telefone}`}</div></div>
                  <select className="inp" style={{ width: 'auto', padding: '6px', fontWeight: 'bold', background: getStatusColor(emp.status) }} value={emp.status} onChange={e=>updateCampo(emp.id, 'status', e.target.value)}><option>Pendente</option><option>Em Análise</option><option>Aceitou</option><option>Recusou</option></select>
                </div>
                
                {(emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.data_followup && (<div style={{ fontSize: '11px', color: atrasado ? '#ef4444' : '#64748b', fontWeight: atrasado ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', background: atrasado ? '#fee2e2' : '#f1f5f9', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}><Calendar size={12}/> Ligar a: {safeDateStr(emp.data_followup)} {atrasado && '(Atrasado!)'}</div>)}

                {emp.status === 'Aceitou' && (
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '2px dashed #cbd5e1', marginBottom: '10px' }}>
                    <div className="flex" style={{ alignItems: 'center', marginBottom: '15px' }}><input type="number" className="inp" style={{ width: '100px', marginTop: 0, fontWeight: 'bold', fontSize: '16px' }} placeholder="Valor €" value={emp.valor || ''} onChange={e=>updateCampo(emp.id, 'valor', e.target.value)} /><strong style={{ color: escalao.cor, fontSize: '14px' }}>{escalao.nome}</strong></div>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>CHECKLIST:</div>
                      <label className="cb" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={e=>updateCampo(emp.id, 'recibo_enviado', e.target.checked)} style={{ transform: 'scale(1.2)' }}/> Recibo Emitido</label>
                      <label className="cb" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={e=>updateCampo(emp.id, 'logo_recebido', e.target.checked)} style={{ transform: 'scale(1.2)' }}/> Logo Recebido</label>
                      <label className="cb" style={{ color: emp.redes_sociais ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.redes_sociais} onChange={e=>updateCampo(emp.id, 'redes_sociais', e.target.checked)} style={{ transform: 'scale(1.2)' }}/> Post Redes Sociais</label>
                      <button onClick={()=>enviarBoasVindas(emp)} className="btn" style={{ width: '100%', background: '#3b82f6', color: 'white', marginTop: '10px', padding: '10px' }}><Mail size={16}/> Pedir NIF & Logo</button>
                    </div>
                  </div>
                )}
                <div className="flex" style={{ marginTop: '10px' }}>
                  {emp.status !== 'Aceitou' && emp.email && <button onClick={()=>enviarProposta(emp)} className="btn" style={{ flex: '1 1 120px', background: '#3b82f6', color: 'white', padding: '10px' }}><Send size={14}/> Email Proposta</button>}
                  {emp.status !== 'Aceitou' && emp.telefone && <a onClick={()=>updateCampo(emp.id, 'proposta_enviada_em', new Date().toISOString())} href={getWA(emp, false)} target="_blank" className="btn" style={{ flex: '1 1 120px', background: '#25D366', color: 'white', textDecoration: 'none', padding: '10px' }}><MessageCircle size={14}/> WA Proposta</a>}
                  {(emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.telefone && emp.proposta_enviada_em && <a href={getWA(emp, true)} target="_blank" className="btn" style={{ flex: '1 1 120px', background: '#128C7E', color: 'white', textDecoration: 'none', padding: '10px' }}><MessageCircle size={14}/> WA Follow-up</a>}
                  <button onClick={()=>abrirModalEdicao(emp)} className="btn" style={{ background: '#1e293b', color: 'white', padding: '10px' }}><PenTool size={16}/></button>
                  <button onClick={()=>eliminarEmpresa(emp.id, emp.nome)} className="btn" style={{ background: '#fee2e2', color: '#ef4444', padding: '10px' }}><Trash2 size={16}/></button>
                </div>
              </div>
            );
          })}

          {/* LISTA DESKTOP */}
          <table className="desktop box" style={{ padding: 0, overflow: 'hidden' }}>
            <thead style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', fontSize: '13px' }}><tr><th style={{ padding: '15px' }}>Parceiro</th><th style={{ padding: '15px' }}>Estado</th><th style={{ padding: '15px' }}>Gestão & Entregáveis</th><th style={{ padding: '15px', textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {empresasFiltradas.map(emp => {
                const escalao = getEscalao(emp.valor);
                return (
                  <tr key={`d-${emp.id}`} style={{ borderTop: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                    <td style={{ padding: '15px', borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : '4px solid transparent', width: '25%' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>{emp.nome} {emp.status === 'Aceitou' && escalao.icon}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.email || 'S/ Email'} <br/> {emp.telefone}</div>
                    </td>
                    <td style={{ padding: '15px', width: '20%' }}>
                      <select className="inp" value={emp.status} onChange={e=>updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '8px', fontWeight: 'bold', background: getStatusColor(emp.status) }}><option>Pendente</option><option>Em Análise</option><option>Aceitou</option><option>Recusou</option></select>
                      {emp.proposta_enviada_em && <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '5px' }}>✓ Proposta Enviada</div>}
                    </td>
                    <td style={{ padding: '15px', width: '35%' }}>
                      {emp.status === 'Aceitou' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}><input type="number" className="inp" style={{ width: '80px', marginTop: 0, fontWeight: 'bold' }} placeholder="€" value={emp.valor || ''} onChange={e=>updateCampo(emp.id, 'valor', e.target.value)} /><strong style={{ color: escalao.cor, fontSize: '12px' }}>{escalao.nome}</strong></div>
                          <label className="cb" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={e=>updateCampo(emp.id, 'recibo_enviado', e.target.checked)}/> Recibo Emitido</label>
                          <label className="cb" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={e=>updateCampo(emp.id, 'logo_recebido', e.target.checked)}/> Logo Recebido</label>
                          <label className="cb" style={{ color: emp.redes_sociais ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.redes_sociais} onChange={e=>updateCampo(emp.id, 'redes_sociais', e.target.checked)}/> Post Redes Sociais</label>
                          <button onClick={()=>enviarBoasVindas(emp)} className="btn" style={{ background: '#3b82f6', color: 'white', fontSize: '11px', width: 'fit-content', marginTop: '5px', padding: '6px 12px' }}><Mail size={14}/> Pedir NIF & Logo</button>
                        </div>
                      ) : <span style={{color: '#cbd5e1'}}>-</span>}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', width: '20%' }}>
                      <div className="flex" style={{ justifyContent: 'flex-end', maxWidth: '160px', marginLeft: 'auto' }}>
                        {emp.status !== 'Aceitou' && emp.email && <button onClick={()=>enviarProposta(emp)} className="btn" style={{ background: '#3b82f6', color: 'white' }} title="Email Proposta"><Send size={16}/></button>}
                        {emp.status !== 'Aceitou' && emp.telefone && <a onClick={()=>updateCampo(emp.id, 'proposta_enviada_em', new Date().toISOString())} href={getWA(emp, false)} target="_blank" className="btn" style={{ background: '#25D366', color: 'white', textDecoration: 'none' }} title="WhatsApp Proposta"><MessageCircle size={16}/></a>}
                        <button onClick={()=>abrirModalEdicao(emp)} className="btn" style={{ background: '#1e293b', color: 'white' }} title="Editar"><PenTool size={16}/></button>
                        <button onClick={()=>eliminarEmpresa(emp.id, emp.nome)} className="btn" style={{ background: '#fee2e2', color: '#ef4444' }} title="Eliminar"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= ABA RELATÓRIOS ================= */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="no-print flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><BarChart3 size={24} color={PRIMARY_COLOR}/> Resumo Operacional</h2>
            <div className="flex"><button onClick={exportToCSV} className="btn" style={{ background: 'white', border: '1px solid #cbd5e1' }}><Download size={16}/> Excel (.csv)</button><button onClick={()=>window.print()} className="btn" style={{ background: TEXT_PRIMARY, color: PRIMARY_COLOR }}><Printer size={16}/> PDF</button></div>
          </div>

          <div className="grid">
            <div className="box" style={{ borderLeft: `5px solid ${PRIMARY_COLOR}` }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><Target size={16}/> Fundo Angariado</div>
              <div style={{ fontSize: '38px', fontWeight: '900', margin: '5px 0' }}>{angariado}€</div>
              <div className="flex" style={{ justifyContent: 'space-between', fontSize: '13px', color: '#94a3b8' }}><span className="no-print">Meta: <input type="number" value={objetivo} onChange={e=>handleMetaChange(e.target.value)} style={{ width: '70px', padding: '2px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/> €</span><strong>{safePercent(angariado, objetivo)}%</strong></div>
              <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}><div style={{ width: `${Math.min(safePercent(angariado, objetivo), 100)}%`, background: PRIMARY_COLOR, height: '100%' }}></div></div>
            </div>
            <div className="box" style={{ borderLeft: '5px solid #3b82f6' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><TrendingUp size={16}/> Ticket Médio</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#3b82f6', margin: '5px 0' }}>{valorMedio}€</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Valor médio recebido</div>
            </div>
            <div className="box" style={{ borderLeft: '5px solid #10b981', background: 'linear-gradient(to right, #ffffff, #f0fdf4)' }}>
              <div style={{ color: '#166534', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><Crown size={16}/> Top Sponsor</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d', margin: '5px 0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{topSponsor.nome}</div>
              <div style={{ fontWeight: 'bold', color: '#166534' }}>{topSponsor.valor > 0 ? `${topSponsor.valor}€ angariados` : '-'}</div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="box">
              <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Filter size={18} color="#64748b"/> Funil ({safePercent(totalAceites, empresas.length)}% Fecho)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#64748b'}}>⏳ Pendentes</span> <span>{countPendentes}</span></div><div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(countPendentes, empresas.length)}%`, background: '#cbd5e1', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#f59e0b'}}>🤔 Em Análise</span> <span>{countAnalise}</span></div><div style={{ background: '#fef3c7', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(countAnalise, empresas.length)}%`, background: '#f59e0b', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#10b981'}}>✅ Aceites</span> <span>{totalAceites}</span></div><div style={{ background: '#dcfce7', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(totalAceites, empresas.length)}%`, background: '#10b981', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#ef4444'}}>❌ Recusados</span> <span>{countRecusados}</span></div><div style={{ background: '#fee2e2', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(countRecusados, empresas.length)}%`, background: '#ef4444', height: '100%' }}></div></div></div>
              </div>
            </div>
            <div className="box">
              <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={18} color={PRIMARY_COLOR}/> Quadro de Medalhas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>💎</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6' }}>{parceirosDiamante.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>DIAMANTE</div></div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>🥇</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#eab308' }}>{parceirosOuro.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>OURO</div></div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>🥈</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#94a3b8' }}>{parceirosPrata.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>PRATA</div></div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>🥉</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#b45309' }}>{parceirosApoiante.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>APOIANTE</div></div>
              </div>
            </div>
          </div>

          {(urgentesFollowup.length > 0 || tarefasPendentes.length > 0) && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {urgentesFollowup.length > 0 && (
                <div className="box" style={{ border: '2px solid #ef4444' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={18}/> Atrasados / Ligar Hoje ({urgentesFollowup.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {urgentesFollowup.map(emp => (
                      <div key={emp.id} style={{ padding: '10px', background: '#fee2e2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '14px' }}>{emp.nome}</div><div style={{ fontSize: '11px', color: '#ef4444' }}>Para: {safeDateStr(emp.data_followup)}</div></div>
                        <a href={getWhatsAppFollowUpLink(emp)} target="_blank" className="btn no-print" style={{ background: '#25D366', color: 'white', textDecoration: 'none', padding: '6px 12px', fontSize: '12px' }}><MessageCircle size={14}/> Falar</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tarefasPendentes.length > 0 && (
                <div className="box" style={{ border: '2px solid #f59e0b' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18}/> Tarefas Pendentes ({tarefasPendentes.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tarefasPendentes.map(emp => (
                      <div key={emp.id} style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '14px' }}>{emp.nome}</div>
                        <div className="flex" style={{ gap: '5px' }}>
                          {!emp.recibo_enviado && <span style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 'bold', border: '1px solid #fcd34d' }}>Recibo</span>}
                          {!emp.logo_recebido && <span style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 'bold', border: '1px solid #fcd34d' }}>Logo</span>}
                          {!emp.redes_sociais && <span style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 'bold', border: '1px solid #fcd34d' }}>Post</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= ABA CAMPANHAS ================= */}
      {tab === 'broadcast' && (
        <div className="no-print box" style={{ maxWidth: '800px', margin: '0 auto', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
          <h2 style={{ marginTop: 0, fontSize: '24px', fontWeight: '900' }}>Campanhas de E-mail 🚀</h2>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Comunica novidades em massa para um grupo específico.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#166534' }}>Público-Alvo</label>
              <select className="inp" style={{ border: '1px solid #86efac', color: '#15803d', fontWeight: 'bold' }} value={bDestinatarios} onChange={e=>setBDestinatarios(e.target.value)}><option value="aceites">🏆 Apenas Parceiros Aceites</option><option value="pendentes">⏳ A aguardar resposta (Pendentes/Análise)</option><option value="todos">🌍 Todos os contactos</option></select>
            </div>

            <div><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Assunto do Email</label><input className="inp" placeholder="Ex: Medalha de Ouro! 🥇" value={bAssunto} onChange={e=>setBAssunto(e.target.value)} /></div>
            <div><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Mensagem (HTML suportado)</label><textarea className="inp" rows="6" placeholder="Escreve o email aqui..." value={bMensagem} onChange={e=>setBMensagem(e.target.value)} /></div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Adicionar Imagem 📸</label>
              <div className="flex" style={{ alignItems: 'center', gap: '15px' }}>
                <label className="btn" style={{ background: TEXT_PRIMARY, color: 'white', padding: '12px 20px' }}><UploadCloud size={16}/> Enviar Foto<input type="file" accept="image/*" onChange={uploadFotoDireta} style={{ display: 'none' }} disabled={uploadingFoto} /></label>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>OU</span>
                <input className="inp" style={{ flex: 1, marginTop: 0 }} placeholder="Link partilhado (Google Fotos)" value={bFoto} onChange={e=>setBFoto(e.target.value)} />
              </div>
              {uploadingFoto && <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '5px', fontWeight: 'bold' }}>A carregar imagem...</div>}
            </div>

            <div><label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Adicionar Link de Vídeo ▶️</label><input className="inp" placeholder="Link do YouTube / Instagram" value={bVideo} onChange={e=>setBVideo(e.target.value)} /></div>

            <button onClick={enviarBroadcast} className="btn" style={{ background: TEXT_PRIMARY, color: PRIMARY_COLOR, padding: '18px', fontSize: '16px', marginTop: '10px' }}><Send size={18}/> Enviar Campanha Agora</button>
          </div>
        </div>
      )}

      {/* ================= ABA MURAL ================= */}
      {tab === 'mural' && (
        <div style={{ textAlign: 'center' }}>
          <div className="box" style={{ borderTop: `6px solid ${PRIMARY_COLOR}`, marginBottom: '25px' }}>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>🏆 Mural de Honra</h2>
            <p style={{ color: '#64748b' }}>Um agradecimento especial aos visionários que apoiam rumo a Dublin 2026.</p>
          </div>

          {parceirosDiamante.length > 0 && (
            <div style={{ marginBottom: '30px' }}><h3 style={{ color: '#3b82f6', display: 'flex', justifyContent: 'center', gap: '10px' }}>💎 Parceiros Diamante</h3><div className="flex" style={{ justifyContent: 'center', gap: '15px' }}>{parceirosDiamante.map(e => <div key={e.id} className="box" style={{ background: '#eff6ff', border: '2px solid #bfdbfe', width: '250px' }}><strong style={{ fontSize: '18px', color: '#1e3a8a' }}>{e.nome}</strong></div>)}</div></div>
          )}
          {parceirosOuro.length > 0 && (
            <div style={{ marginBottom: '30px' }}><h3 style={{ color: '#eab308', display: 'flex', justifyContent: 'center', gap: '10px' }}>🥇 Parceiros Ouro</h3><div className="flex" style={{ justifyContent: 'center', gap: '15px' }}>{parceirosOuro.map(e => <div key={e.id} className="box" style={{ background: '#fefce8', border: '2px solid #fef08a', width: '220px' }}><strong style={{ fontSize: '16px', color: '#854d0e' }}>{e.nome}</strong></div>)}</div></div>
          )}
          
          <div className="flex" style={{ justifyContent: 'center', gap: '30px' }}>
            {parceirosPrata.length > 0 && (
              <div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#94a3b8' }}>🥈 Parceiros Prata</h3><div className="flex" style={{ justifyContent: 'center', gap: '10px' }}>{parceirosPrata.map(e => <div key={e.id} className="box" style={{ padding: '10px 15px', border: '1px solid #e2e8f0' }}><strong style={{ color: '#475569' }}>{e.nome}</strong></div>)}</div></div>
            )}
            {parceirosApoiante.length > 0 && (
              <div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#b45309' }}>🥉 Apoiantes Oficiais</h3><div className="flex" style={{ justifyContent: 'center', gap: '10px' }}>{parceirosApoiante.map(e => <div key={e.id} className="box" style={{ padding: '10px 15px', border: '1px solid #ffedd5' }}><strong style={{ color: '#9a3412' }}>{e.nome}</strong></div>)}</div></div>
            )}
          </div>
          
          {totalAceites === 0 && <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '40px' }}>O Mural de Honra ganhará vida assim que registares o primeiro "Aceite".</div>}
        </div>
      )}

    </div>
  );
}
