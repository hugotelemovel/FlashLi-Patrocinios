'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, ImageIcon, Send, Trash2, Search, Download, AlertTriangle, CheckCircle, UploadCloud, Calendar, Award, CheckSquare, Square, Phone, Clock, FileText, MessageCircle, Mail, Edit, TrendingUp, Target, Filter, AlertCircle, X, Crown, PenTool, Printer, LayoutGrid, SortDesc, Radar, MapPin, Globe, ArrowRight, Settings } from 'lucide-react';

export default function App() {
  // === ESTADOS BASE ===
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

  // === ESTADOS DO FORMULÁRIO E EDIÇÃO ===
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [idioma, setIdioma] = useState('PT');
  const [dataFollowup, setDataFollowup] = useState('');
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState(null);

  // === ESTADOS DO BROADCAST ===
  const [bAssunto, setBAssunto] = useState('');
  const [bMensagem, setBMensagem] = useState('');
  const [bFoto, setBFoto] = useState('');
  const [bVideo, setBVideo] = useState('');
  const [bDestinatarios, setBDestinatarios] = useState('aceites'); 
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [nomeArquivoTemp, setNomeArquivoTemp] = useState('');

  // === ESTADOS DO RADAR IA ===
  const [searchNicho, setSearchNicho] = useState('');
  const [searchLocal, setSearchLocal] = useState('Viana do Castelo');
  const [raioRadar, setRaioRadar] = useState(15); // NOVO: Raio em KM
  const [radarResultados, setRadarResultados] = useState([]);
  const [loadingRadar, setLoadingRadar] = useState(false);

  // === ESTADOS DAS CONFIGURAÇÕES GLOBAIS (WHATSAPP) ===
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
    fetchEmpresas();
    fetchHistorico();
    
    // Carregar configurações guardadas
    const savedGoal = localStorage.getItem('metaFlashLi');
    if(savedGoal) setObjetivo(Number(savedGoal));
    
    if(localStorage.getItem('wappPropPT')) setMsgPropostaPT(localStorage.getItem('wappPropPT'));
    if(localStorage.getItem('wappPropES')) setMsgPropostaES(localStorage.getItem('wappPropES'));
    if(localStorage.getItem('wappFollPT')) setMsgFollowPT(localStorage.getItem('wappFollPT'));
    if(localStorage.getItem('wappFollES')) setMsgFollowES(localStorage.getItem('wappFollES'));
  }, []);

  // --- FUNÇÕES DE SEGURANÇA MATEMÁTICA (ANTI-CRASH) ---
  function safePercent(part, total) {
    if (!total || isNaN(total) || total === 0) return 0;
    const calc = (Number(part) / Number(total)) * 100;
    return isNaN(calc) || !isFinite(calc) ? 0 : calc.toFixed(0);
  }

  function safeDateStr(d) {
    if (!d) return '';
    try { 
      const dt = new Date(d); 
      return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('pt-PT'); 
    } catch(e) { return d; }
  }

  function handleMetaChange(val) {
    const num = Number(val) || 0;
    setObjetivo(num);
    localStorage.setItem('metaFlashLi', num);
  }

  function guardarSettings(e) {
    e.preventDefault();
    localStorage.setItem('wappPropPT', msgPropostaPT);
    localStorage.setItem('wappPropES', msgPropostaES);
    localStorage.setItem('wappFollPT', msgFollowPT);
    localStorage.setItem('wappFollES', msgFollowES);
    setShowSettings(false);
    showMessage('✅ Guiões do WhatsApp guardados com sucesso!', 'success');
  }

  function showMessage(text, type = 'info') {
    setMsg(text); setMsgType(type); setTimeout(() => setMsg(''), 5000);
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

  // --- FUNÇÕES DO RADAR IA ---
  async function explorarRadar(e) {
    e.preventDefault();
    if (!searchNicho || !searchLocal) return showMessage('Preenche o nicho e a localidade!', 'error');
    
    setLoadingRadar(true);
    setRadarResultados([]);
    showMessage(`A varrer o mapa num raio de ${raioRadar}km...`, 'info');

    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(searchLocal)}&format=json`);
      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) { setLoadingRadar(false); return showMessage('Localidade não encontrada.', 'error'); }

      const { lat, lon } = geoData[0];
      const raioMetros = raioRadar * 1000;

      const overpassQuery = `[out:json];(node["name"~"${searchNicho}",i](around:${raioMetros},${lat},${lon});way["name"~"${searchNicho}",i](around:${raioMetros},${lat},${lon}););out tags;`;

      const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: overpassQuery });
      const data = await res.json();

      if (data && data.elements && data.elements.length > 0) {
        const empresasEncontradas = data.elements.map(el => ({
          id_radar: el.id, nome: el.tags.name, telefone: el.tags.phone || el.tags['contact:phone'] || '',
          website: el.tags.website || el.tags['contact:website'] || '', email: el.tags.email || el.tags['contact:email'] || ''
        })).filter(emp => emp.nome); 

        const unicos = Array.from(new Set(empresasEncontradas.map(a => a.nome))).map(nome => empresasEncontradas.find(a => a.nome === nome));
        setRadarResultados(unicos.slice(0, 40)); 
        showMessage(`✅ O Radar encontrou ${unicos.length} empresas!`, 'success');
      } else showMessage('O Radar não encontrou nada. Tenta outro termo.', 'error');
    } catch (error) { showMessage('Erro de comunicação com o mapa.', 'error'); }
    setLoadingRadar(false);
  }

  async function moverDoRadarParaCRM(empRadar) {
    showMessage(`A mover ${empRadar.nome} para o CRM...`, 'info');
    const novaEmpresa = { 
      nome: empRadar.nome, email: empRadar.email || null, telefone: empRadar.telefone || null, idioma: 'PT', 
      status: 'Pendente', data_followup: null, valor: 0, recibo_enviado: false, logo_recebido: false, redes_sociais: false, 
      notas: empRadar.website ? `Website: ${empRadar.website}` : ''
    };
    const { data, error } = await supabase.from('patrocinadores').insert([novaEmpresa]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) {
      setEmpresas([data[0], ...empresas]);
      setRadarResultados(radarResultados.filter(r => r.id_radar !== empRadar.id_radar));
      showMessage('✅ Empresa movida para os Pendentes!', 'success');
    }
  }

  // --- CRM BASE ---
  async function addEmpresa(e) {
    e.preventDefault();
    if (!nome) return showMessage('O Nome da empresa é obrigatório!', 'error');
    if (!email && !telefone) return showMessage('Tens de colocar ou o Email ou o Telefone!', 'error');
    showMessage('A adicionar parceiro...', 'info');
    const novaEmpresa = { 
      nome, email: email || null, telefone: telefone || null, idioma, status: 'Pendente', data_followup: dataFollowup || null,
      valor: 0, recibo_enviado: false, logo_recebido: false, redes_sociais: false, notas: ''
    };
    const { data, error } = await supabase.from('patrocinadores').insert([novaEmpresa]).select();
    if (error) showMessage(`❌ ERRO: ${error.message}`, 'error');
    else if (data) {
      setEmpresas([data[0], ...empresas]); setNome(''); setEmail(''); setTelefone(''); setDataFollowup('');
      showMessage('✅ Parceiro adicionado!', 'success');
    }
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
    showMessage('A guardar...', 'info');
    const { id, created_at, ...dadosParaAtualizar } = empresaEmEdicao;
    dadosParaAtualizar.email = dadosParaAtualizar.email || null;
    dadosParaAtualizar.telefone = dadosParaAtualizar.telefone || null;
    dadosParaAtualizar.data_followup = dadosParaAtualizar.data_followup || null;

    const { error } = await supabase.from('patrocinadores').update(dadosParaAtualizar).eq('id', id);
    if (error) showMessage(`❌ Erro: ${error.message}`, 'error');
    else {
      setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, ...dadosParaAtualizar } : emp));
      fecharModal(); showMessage('✅ Atualizado!', 'success');
    }
  }

  async function eliminarEmpresa(id, nomeEmpresa) {
    if (!window.confirm(`Eliminar permanentemente "${nomeEmpresa}"?`)) return;
    const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
    if (!error) { setEmpresas(empresas.filter(emp => emp.id !== id)); showMessage(`🗑️ Eliminada!`, 'success'); }
  }

  async function enviarProposta(empresa) {
    if (!empresa.email) return showMessage('Sem email guardado!', 'error');
    showMessage(`A enviar proposta para ${empresa.nome}...`, 'info');
    try {
      const res = await fetch('/api/send-proposal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(empresa) });
      if (res.ok) { showMessage(`✅ Enviado!`, 'success'); updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString()); } 
      else showMessage(`❌ Falha no envio`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  function getWhatsAppPropostaLink(empresa) {
    let numero = String(empresa.telefone || '').replace(/\D/g, '');
    if (numero.length === 9) numero = empresa.idioma === 'ES' ? '34' + numero : '351' + numero;
    let baseMsg = empresa.idioma === 'ES' ? msgPropostaES : msgPropostaPT;
    let finalMsg = baseMsg.replace(/{nome}/g, empresa.nome);
    return `https://wa.me/${numero}?text=${encodeURIComponent(finalMsg)}`;
  }

  function getWhatsAppFollowUpLink(empresa) {
    let numero = String(empresa.telefone || '').replace(/\D/g, '');
    if (numero.length === 9) numero = empresa.idioma === 'ES' ? '34' + numero : '351' + numero;
    let baseMsg = empresa.idioma === 'ES' ? msgFollowES : msgFollowPT;
    let finalMsg = baseMsg.replace(/{nome}/g, empresa.nome);
    return `https://wa.me/${numero}?text=${encodeURIComponent(finalMsg)}`;
  }

  // --- DASHBOARD CALCULATIONS (SAFE) ---
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
        .responsive-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .desktop-table { display: none; }
        .mobile-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .flex-wrap-mobile { flex-wrap: wrap; }
        .task-checkbox { display: flex; alignItems: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 6px 0; font-weight: 500;}
        .task-checkbox input { cursor: pointer; transform: scale(1.2); }
        .dash-box { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; backdrop-filter: blur(4px); }
        .modal-content { background: white; padding: 25px; border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 5px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit; }
        .btn-hover:hover { opacity: 0.9; transform: scale(0.98); transition: 0.2s; }
        
        @media (min-width: 768px) {
          .responsive-grid { grid-template-columns: repeat(3, 1fr); }
          .desktop-table { display: table; width: 100%; border-collapse: collapse; }
          .mobile-card { display: none; }
          .flex-wrap-mobile { flex-wrap: nowrap; }
        }
        @media print {
          body { background: white; }
          header, .no-print { display: none !important; }
          .dash-box { border: 1px solid #ccc; box-shadow: none; break-inside: avoid; }
        }
      `}} />

      {/* MODAL CONFIGURAÇÕES GLOBAIS */}
      {showSettings && (
        <div className="modal-overlay no-print" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={20}/> Textos do WhatsApp</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24}/></button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Usa <b>{`{nome}`}</b> no texto para a App substituir automaticamente pelo nome da empresa.</p>
            <form onSubmit={guardarSettings}>
              <div className="form-group"><label>📄 Mensagem de Proposta (PT)</label><textarea rows="3" value={msgPropostaPT} onChange={e => setMsgPropostaPT(e.target.value)} required></textarea></div>
              <div className="form-group"><label>📄 Mensagem de Proposta (ES)</label><textarea rows="3" value={msgPropostaES} onChange={e => setMsgPropostaES(e.target.value)} required></textarea></div>
              <div className="form-group"><label>💬 Mensagem de Follow-up / Lembrete (PT)</label><textarea rows="3" value={msgFollowPT} onChange={e => setMsgFollowPT(e.target.value)} required></textarea></div>
              <div className="form-group"><label>💬 Mensagem de Follow-up / Lembrete (ES)</label><textarea rows="3" value={msgFollowES} onChange={e => setMsgFollowES(e.target.value)} required></textarea></div>
              
              <button type="submit" className="btn-hover" style={{ width: '100%', padding: '14px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>💾 Guardar Textos</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DO PARCEIRO */}
      {empresaEmEdicao && (
        <div className="modal-overlay no-print" onClick={fecharModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px' }}><Edit size={20}/> Editar Parceiro</h2>
              <button onClick={fecharModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24}/></button>
            </div>
            <form onSubmit={guardarEdicaoTotal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nome da Empresa (Obrigatório)</label>
                  <input type="text" value={empresaEmEdicao.nome} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, nome: e.target.value})} required />
                </div>
                <div className="form-group"><label>Email</label><input type="email" value={empresaEmEdicao.email || ''} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, email: e.target.value})} /></div>
                <div className="form-group"><label>Telefone</label><input type="text" value={empresaEmEdicao.telefone || ''} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, telefone: e.target.value})} /></div>
                <div className="form-group">
                  <label>Estado do Negócio</label>
                  <select value={empresaEmEdicao.status} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, status: e.target.value})} style={{ background: getStatusColor(empresaEmEdicao.status), fontWeight: 'bold' }}>
                    <option value="Pendente">⏳ Pendente</option><option value="Em Análise">🤔 Em Análise</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                  </select>
                </div>
                <div className="form-group"><label>Data Lembrete</label><input type="date" value={empresaEmEdicao.data_followup || ''} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, data_followup: e.target.value})} /></div>
                <div className="form-group"><label>Valor (€)</label><input type="number" value={empresaEmEdicao.valor || 0} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, valor: e.target.value})} /></div>
                <div className="form-group"><label>Idioma</label><select value={empresaEmEdicao.idioma} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, idioma: e.target.value})}><option value="PT">🇵🇹 PT</option><option value="ES">🇪🇸 ES</option></select></div>
              </div>
              {empresaEmEdicao.status === 'Aceitou' && (
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', marginTop: '10px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>Checklist de Entregáveis</label>
                  <label className="task-checkbox"><input type="checkbox" checked={empresaEmEdicao.recibo_enviado} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, recibo_enviado: e.target.checked})} /> Recibo Emitido</label>
                  <label className="task-checkbox"><input type="checkbox" checked={empresaEmEdicao.logo_recebido} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, logo_recebido: e.target.checked})} /> Logotipo Recebido</label>
                  <label className="task-checkbox"><input type="checkbox" checked={empresaEmEdicao.redes_sociais} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, redes_sociais: e.target.checked})} /> Post Publicado</label>
                </div>
              )}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Notas e Histórico</label>
                <textarea rows="4" value={empresaEmEdicao.notas || ''} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, notas: e.target.value})}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={fecharModal} className="btn-hover" style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-hover" style={{ flex: 2, padding: '12px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Guardar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CABEÇALHO PRINCIPAL */}
      <header className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo.jpg" alt="Logotipo Oficial Flash Li" style={{ width: '65px', borderRadius: '12px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
            <div>
              <h1 style={{ color: TEXT_PRIMARY, margin: 0, fontSize: '22px', fontWeight: '900' }}>ANGARIAÇÃO DWCUP</h1>
              <h2 style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px', fontWeight: '500' }}>Flash Li Dance School • Dublin 2026</h2>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="btn-hover" style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', color: '#475569' }} title="Configurar Textos do WhatsApp"><Settings size={20}/></button>
        </div>
        
        {/* NAVEGAÇÃO */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', marginTop: '10px' }}>
          <button onClick={() => setTab('crm')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'crm' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'crm' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><Users size={18}/> CRM</button>
          <button onClick={() => setTab('radar')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'radar' ? '#8b5cf6' : '#f1f5f9', color: tab === 'radar' ? 'white' : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><Radar size={18}/> Radar IA</button>
          <button onClick={() => setTab('reports')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'reports' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'reports' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            <BarChart3 size={18}/> Relatório 
            {(urgentesFollowup.length > 0 || tarefasPendentes.length > 0) && <span style={{background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px'}}>{urgentesFollowup.length + tarefasPendentes.length}</span>}
          </button>
          <button onClick={() => setTab('broadcast')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'broadcast' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'broadcast' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><Send size={18}/> Campanhas</button>
          <button onClick={() => setTab('mural')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'mural' ? '#3b82f6' : '#f1f5f9', color: tab === 'mural' ? 'white' : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><LayoutGrid size={18}/> Mural</button>
        </div>
      </header>

      {msg && <div className="no-print" style={{ background: msgType === 'error' ? '#fee2e2' : '#f0fdf4', color: msgType === 'error' ? '#991b1b' : '#166534', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold', border: `1px solid ${msgType === 'error' ? '#f87171' : '#4ade80'}` }}>{msg}</div>}

      {/* === ABA 5: RADAR DE PROSPEÇÃO === */}
      {tab === 'radar' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '25px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: `6px solid #8b5cf6` }}>
            <h2 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}><Radar size={28} color="#8b5cf6"/> Radar de Prospeção</h2>
            
            <form onSubmit={explorarRadar} style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>O que procuras?</label>
                <input type="text" placeholder="Ex: Clínica, Imobiliária, Restaurante..." value={searchNicho} onChange={e => setSearchNicho(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Cidade Base</label>
                <input type="text" placeholder="Ex: Viana do Castelo" value={searchLocal} onChange={e => setSearchLocal(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }} />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '5px' }}>Raio de Ação: {raioRadar} km</label>
                <input type="range" min="2" max="100" value={raioRadar} onChange={e => setRaioRadar(e.target.value)} style={{ width: '100%', marginTop: '8px', accentColor: '#8b5cf6' }} />
              </div>
              <button type="submit" disabled={loadingRadar} className="btn-hover" style={{ flex: '1 1 100%', padding: '15px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                {loadingRadar ? 'A varrer o mapa...' : <><Search size={18}/> Iniciar Varrimento</>}
              </button>
            </form>
          </div>

          {radarResultados.length > 0 && (
            <div>
              <h3 style={{ color: TEXT_PRIMARY, marginBottom: '15px' }}>Resultados em Quarentena ({radarResultados.length})</h3>
              <div className="responsive-grid">
                {radarResultados.map(emp => (
                  <div key={emp.id_radar} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e293b' }}>{emp.nome}</h4>
                      {emp.telefone && <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><Phone size={12}/> {emp.telefone}</div>}
                      {emp.website && <div style={{ fontSize: '13px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}><Globe size={12}/> <a href={emp.website.startsWith('http') ? emp.website : `https://${emp.website}`} target="_blank" style={{ color: 'inherit' }}>Ver Website</a></div>}
                    </div>
                    <button onClick={() => moverDoRadarParaCRM(emp)} className="btn-hover" style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#3b82f6', border: '1px dashed #3b82f6', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '15px' }}>
                      <ArrowRight size={16}/> Mover para o CRM
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === ABA 1: PIPELINE CRM === */}
      {tab === 'crm' && (
        <div className="no-print">
          <form onSubmit={addEmpresa} style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="flex-wrap-mobile">
            <input type="text" placeholder="Empresa (Obrigatório)" value={nome} onChange={e => setNome(e.target.value)} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="email" placeholder="Email (Opcional)" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: '1 1 200px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <input type="text" placeholder="Telefone (Opcional)" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ flex: '1 1 120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            <div style={{ flex: '1 1 140px', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-8px', left: '10px', background: 'white', padding: '0 5px', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>Ligar a:</span>
              <input type="date" value={dataFollowup} onChange={e => setDataFollowup(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
            </div>
            <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ flex: '1 1 70px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <option value="PT">🇵🇹</option><option value="ES">🇪🇸</option>
            </select>
            <button type="submit" className="btn-hover" style={{ flex: '1 1 100%', padding: '14px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add Parceiro</button>
          </form>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }} className="flex-wrap-mobile">
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: '1 1 150px', position: 'relative' }}>
              <SortDesc size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', color: '#475569' }}>
                <option value="recentes">Mais Recentes</option>
                <option value="valor">Maior Angariação (€)</option>
                <option value="nome">Ordem Alfabética</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', flex: '1 1 100%' }}>
              {['Todos', 'Pendente', 'Em Análise', 'Aceitou', 'Recusou'].map(status => (
                <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '8px 12px', borderRadius: '20px', border: 'none', background: filterStatus === status ? PRIMARY_COLOR : '#e2e8f0', color: filterStatus === status ? 'white' : '#475569', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {status === 'Aceitou' ? '✅ Aceites' : status === 'Recusou' ? '❌ Recusados' : status === 'Em Análise' ? '🤔 Em Análise' : status === 'Pendente' ? '⏳ Pendentes' : '🌍 Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA MOBILE */}
          {empresasFiltradas.map(emp => {
            const escalao = getEscalao(emp.valor);
            const atrasado = (emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.data_followup && emp.data_followup <= hoje;
            return (
              <div key={`mobile-${emp.id}`} className="mobile-card" style={{ borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : atrasado ? '4px solid #ef4444' : '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '16px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '5px' }}>{emp.nome} {emp.status === 'Aceitou' && escalao.icon}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email || 'S/ Email'} {emp.telefone && `• ${emp.telefone}`}</div>
                  </div>
                  <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: getStatusColor(emp.status) }}>
                    <option value="Pendente">⏳ Pendente</option><option value="Em Análise">🤔 Em Análise</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                  </select>
                </div>
                {(emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.data_followup && (
                  <div style={{ fontSize: '11px', color: atrasado ? '#ef4444' : '#64748b', fontWeight: atrasado ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px', background: atrasado ? '#fee2e2' : '#f1f5f9', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                    <Calendar size={12}/> Ligar a: {safeDateStr(emp.data_followup)} {atrasado && '(Atrasado!)'}
                  </div>
                )}
                {emp.status === 'Aceitou' && (
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '2px dashed #cbd5e1', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                      <input type="number" placeholder="Valor €" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '16px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: escalao.cor }}>{escalao.nome}</div>
                    </div>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px', textTransform: 'uppercase' }}>Checklist:</div>
                      <label className="task-checkbox" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={(e) => updateCampo(emp.id, 'recibo_enviado', e.target.checked)} /> Recibo Emitido</label>
                      <label className="task-checkbox" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={(e) => updateCampo(emp.id, 'logo_recebido', e.target.checked)} /> Logo Recebido</label>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {emp.status !== 'Aceitou' && emp.email && <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ flex: '1 1 120px', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><Send size={14}/> Email Proposta</button>}
                  {emp.status !== 'Aceitou' && emp.telefone && <a onClick={() => updateCampo(emp.id, 'proposta_enviada_em', new Date().toISOString())} href={getWhatsAppPropostaLink(emp)} target="_blank" className="btn-hover" style={{ flex: '1 1 120px', padding: '10px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><MessageCircle size={14}/> WA Proposta</a>}
                  {(emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.telefone && emp.proposta_enviada_em && <a href={getWhatsAppFollowUpLink(emp)} target="_blank" className="btn-hover" style={{ flex: '1 1 120px', padding: '10px', background: '#128C7E', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><MessageCircle size={14}/> WA Follow-up</a>}
                  <button onClick={() => abrirModalEdicao(emp)} className="btn-hover" style={{ padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', flexShrink: 0 }}><PenTool size={16}/></button>
                </div>
              </div>
            );
          })}

          {/* LISTA DESKTOP */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="desktop-table">
            <table className="desktop-table">
              <thead style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', fontSize: '13px' }}>
                <tr><th style={{ padding: '15px' }}>Parceiro</th><th style={{ padding: '15px' }}>Estado</th><th style={{ padding: '15px' }}>Gestão & Entregáveis</th><th style={{ padding: '15px', textAlign: 'right' }}>Ações</th></tr>
              </thead>
              <tbody>
                {empresasFiltradas.map(emp => {
                  const escalao = getEscalao(emp.valor);
                  return (
                    <tr key={`desktop-${emp.id}`} style={{ borderTop: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '15px', borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : '4px solid transparent', width: '25%' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>{emp.nome} {emp.status === 'Aceitou' && escalao.icon}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.email || 'S/ Email'} <br/> {emp.telefone}</div>
                      </td>
                      <td style={{ padding: '15px', width: '20%' }}>
                        <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', outline: 'none', background: getStatusColor(emp.status), width: '100%' }}>
                          <option value="Pendente">⏳ Pendente</option><option value="Em Análise">🤔 Em Análise</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                        </select>
                      </td>
                      <td style={{ padding: '15px', width: '35%' }}>
                        {emp.status === 'Aceitou' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                              <input type="number" placeholder="€" value={emp.valor || ''} onChange={(e) => updateCampo(emp.id, 'valor', e.target.value)} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                              <span style={{fontSize: '12px', fontWeight: 'bold', color: escalao.cor}}>{escalao.nome}</span>
                            </div>
                            <label className="task-checkbox" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={(e) => updateCampo(emp.id, 'recibo_enviado', e.target.checked)} /> Recibo Emitido</label>
                            <label className="task-checkbox" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={(e) => updateCampo(emp.id, 'logo_recebido', e.target.checked)} /> Logo Recebido</label>
                          </div>
                        ) : <span style={{color: '#cbd5e1'}}>-</span>}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', width: '20%' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', maxWidth: '160px', marginLeft: 'auto' }}>
                          {emp.status !== 'Aceitou' && emp.email && <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Email Proposta"><Send size={16}/></button>}
                          {emp.status !== 'Aceitou' && emp.telefone && <a onClick={() => updateCampo(emp.id, 'proposta_enviada_em', new Date().toISOString())} href={getWhatsAppPropostaLink(emp)} target="_blank" className="btn-hover" style={{ padding: '10px', background: '#25D366', color: 'white', textDecoration: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="WA Proposta"><MessageCircle size={16}/></a>}
                          <button onClick={() => abrirModalEdicao(emp)} className="btn-hover" style={{ padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Editar"><PenTool size={16}/></button>
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

      {/* === ABA 2: RELATÓRIO E DASHBOARD === */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: TEXT_PRIMARY }}><BarChart3 size={24} color={PRIMARY_COLOR}/> Resumo Financeiro & Operacional</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} className="btn-hover" style={{ padding: '10px 20px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Printer size={16}/> Imprimir PDF</button>
            </div>
          </div>

          <div className="responsive-grid">
            <div className="dash-box" style={{ borderLeft: `5px solid ${PRIMARY_COLOR}` }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><Target size={16}/> Fundo Angariado</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: TEXT_PRIMARY, margin: '5px 0' }}>{isNaN(angariado) ? 0 : angariado}€</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Meta: <input type="number" value={objetivo} onChange={(e) => handleMetaChange(e.target.value)} style={{ width: '70px', padding: '2px 5px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', fontWeight: 'bold' }}/> €</span>
                <strong>{safePercent(angariado, objetivo)}%</strong>
              </div>
              <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}><div style={{ width: `${Math.min(safePercent(angariado, objetivo), 100)}%`, background: PRIMARY_COLOR, height: '100%' }}></div></div>
            </div>

            <div className="dash-box" style={{ borderLeft: '5px solid #3b82f6' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><TrendingUp size={16}/> Ticket Médio</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#3b82f6', margin: '5px 0' }}>{valorMedio}€</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Valor médio por parceiro</div>
            </div>

            <div className="dash-box" style={{ borderLeft: '5px solid #10b981', background: 'linear-gradient(to right, #ffffff, #f0fdf4)' }}>
              <div style={{ color: '#166534', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><Crown size={16}/> Top Sponsor</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d', margin: '5px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topSponsor.nome}</div>
              <div style={{ fontSize: '15px', color: '#166534', fontWeight: 'bold' }}>{topSponsor.valor > 0 ? `${topSponsor.valor}€ angariados` : '-'}</div>
            </div>
          </div>

          <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="dash-box">
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px' }}><Filter size={18} color="#64748b"/> Funil de Negociação (Fecho: {safePercent(totalAceites, empresas.length)}%)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#64748b'}}>⏳ Pendentes</span> <span>{countPendentes}</span></div><div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(countPendentes, empresas.length)}%`, background: '#cbd5e1', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#f59e0b'}}>🤔 Em Análise</span> <span>{countAnalise}</span></div><div style={{ background: '#fef3c7', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(countAnalise, empresas.length)}%`, background: '#f59e0b', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#10b981'}}>✅ Fechados</span> <span>{totalAceites}</span></div><div style={{ background: '#dcfce7', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(totalAceites, empresas.length)}%`, background: '#10b981', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#ef4444'}}>❌ Recusados</span> <span>{countRecusados}</span></div><div style={{ background: '#fee2e2', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${safePercent(countRecusados, empresas.length)}%`, background: '#ef4444', height: '100%' }}></div></div></div>
              </div>
            </div>

            <div className="dash-box">
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={18} color={PRIMARY_COLOR}/> Quadro de Medalhas</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>💎</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#3b82f6' }}>{parceirosDiamante.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>DIAMANTE</div></div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>🥇</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#eab308' }}>{parceirosOuro.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>OURO</div></div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>🥈</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#94a3b8' }}>{parceirosPrata.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>PRATA</div></div>
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}><div style={{ fontSize: '24px', marginBottom: '5px' }}>🥉</div><div style={{ fontSize: '20px', fontWeight: '900', color: '#b45309' }}>{parceirosApoiante.length}</div><div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>APOIANTE</div></div>
              </div>
            </div>
          </div>

          {(urgentesFollowup.length > 0 || tarefasPendentes.length > 0) && (
            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {urgentesFollowup.length > 0 && (
                <div className="dash-box" style={{ border: '2px solid #ef4444' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={18}/> Atrasados / Ligar Hoje ({urgentesFollowup.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {urgentesFollowup.map(emp => (
                      <div key={emp.id} style={{ padding: '10px', background: '#fee2e2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '14px' }}>{emp.nome}</div><div style={{ fontSize: '11px', color: '#ef4444' }}>Para: {safeDateStr(emp.data_followup)}</div></div>
                        <a href={getWhatsAppFollowUpLink(emp)} target="_blank" className="no-print" style={{ padding: '6px 10px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}><MessageCircle size={14}/> Falar</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tarefasPendentes.length > 0 && (
                <div className="dash-box" style={{ border: '2px solid #f59e0b' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18}/> Tarefas Pendentes ({tarefasPendentes.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tarefasPendentes.map(emp => (
                      <div key={emp.id} style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '14px' }}>{emp.nome}</div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {!emp.recibo_enviado && <span style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 'bold', border: '1px solid #fcd34d' }}>Recibo</span>}
                          {!emp.logo_recebido && <span style={{ background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#ef4444', fontWeight: 'bold', border: '1px solid #fcd34d' }}>Logo</span>}
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

      {/* === ABA 3: CAMPANHAS === */}
      {tab === 'broadcast' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: `1px solid ${PRIMARY_COLOR}` }}>
            <h2 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '24px', fontWeight: '900' }}>Campanhas de Email 🚀</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <select value={bDestinatarios} onChange={e => setBDestinatarios(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                <option value="aceites">🏆 Enviar apenas a Parceiros Oficiais</option>
                <option value="pendentes">⏳ Enviar para quem está a aguardar resposta</option>
                <option value="todos">🌍 Enviar para todos</option>
              </select>
              <input type="text" value={bAssunto} onChange={e=>setBAssunto(e.target.value)} placeholder="Assunto do Email" style={{ padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
              <textarea value={bMensagem} onChange={e=>setBMensagem(e.target.value)} rows="6" placeholder="Mensagem do email..." style={{ padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
              <button onClick={enviarBroadcast} className="btn-hover" style={{ padding: '18px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}><Send size={18} style={{ verticalAlign: 'middle' }}/> Enviar Campanha Agora</button>
            </div>
          </div>
        </div>
      )}

      {/* === ABA 4: MURAL === */}
      {tab === 'mural' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', textAlign: 'center', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
            <h2 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '28px', fontWeight: '900' }}>🏆 Mural de Honra</h2>
          </div>
          {parceirosDiamante.length > 0 && (
            <div><h3 style={{ color: '#3b82f6', textAlign: 'center' }}>💎 Parceiros Diamante</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>{parceirosDiamante.map(emp => <div key={emp.id} style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '12px', padding: '20px', width: '250px', textAlign: 'center' }}><div style={{ fontWeight: '900', fontSize: '18px', color: '#1e3a8a' }}>{emp.nome}</div></div>)}</div></div>
          )}
          {parceirosOuro.length > 0 && (
            <div><h3 style={{ color: '#eab308', textAlign: 'center' }}>🥇 Parceiros Ouro</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>{parceirosOuro.map(emp => <div key={emp.id} style={{ background: '#fefce8', border: '2px solid #fef08a', borderRadius: '12px', padding: '15px', width: '220px', textAlign: 'center' }}><div style={{ fontWeight: 'bold', fontSize: '16px', color: '#854d0e' }}>{emp.nome}</div></div>)}</div></div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
            {parceirosPrata.length > 0 && (<div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#94a3b8', textAlign: 'center' }}>🥈 Parceiros Prata</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>{parceirosPrata.map(emp => <div key={emp.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 15px' }}>{emp.nome}</div>)}</div></div>)}
            {parceirosApoiante.length > 0 && (<div style={{ flex: '1 1 300px' }}><h3 style={{ color: '#b45309', textAlign: 'center' }}>🥉 Apoiantes</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>{parceirosApoiante.map(emp => <div key={emp.id} style={{ background: 'white', border: '1px solid #ffedd5', borderRadius: '8px', padding: '10px 15px' }}>{emp.nome}</div>)}</div></div>)}
          </div>
        </div>
      )}

    </div>
  );
}
