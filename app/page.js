'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Users, Send, Trash2, Search, Download, AlertTriangle, CheckCircle, UploadCloud, Calendar, Award, Phone, Globe, MessageCircle, Mail, Edit, TrendingUp, Target, Filter, AlertCircle, X, Crown, PenTool, Printer, LayoutGrid, SortDesc } from 'lucide-react';
import { Settings } from 'lucide-react';

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

  // === MULTI-PROJETO ===
  const [projetos, setProjetos] = useState([]);
  const [projetoAtivo, setProjetoAtivo] = useState(null); // objeto projeto completo
  const [showProjetoModal, setShowProjetoModal] = useState(false);
  const [editandoProjeto, setEditandoProjeto] = useState(null); // null = novo, objeto = editar
  const [novoProj, setNovoProj] = useState({ nome:'', evento:'', ano: new Date().getFullYear()+1, cidade:'', pais:'', bandeira:'🏳️', meta_objetivo:3000, atletas:'', escola:'Flash Li Dance School', gestor:'Hugo', gestor_whatsapp:'+351 924 368 517', dossier_url:'', url_base:'https://flash-li-patrocinios.vercel.app' });

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
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [bTipoCampanha, setBTipoCampanha] = useState('novidade');
  const [bFotos, setBFotos] = useState([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [historicoExpandido, setHistoricoExpandido] = useState(null);
  const [bLinksRS, setBLinksRS] = useState([]);
  const [bLinkRSInput, setBLinkRSInput] = useState('');
  const [bLinkRSDesc, setBLinkRSDesc] = useState('');
  const [bVideos, setBVideos] = useState([]);
  const [bVideoInput, setBVideoInput] = useState('');
  const [bVideoDesc, setBVideoDesc] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // === CONFIGURAÇÕES GLOBAIS (WHATSAPP) ===
  const [showSettings, setShowSettings] = useState(false);
  
  // Funções para gerar textos padrão do WhatsApp baseados no projeto ativo
  // (definidas como funções normais, não arrow, para poderem usar projetoAtivo do closure)
  function getDefaultPropPT(p) {
    const proj = p || projetoAtivo || {};
    return `Olá! Sou o ${proj.gestor || 'Hugo'}, da ${proj.escola || 'Flash Li Dance School'}.\n\nEstamos à procura de parceiros para apoiar a nossa equipa rumo ao ${proj.nome || 'campeonato'} em ${proj.cidade || 'destino'}. ${proj.bandeira || '🩰'}\n\nDeixo aqui o nosso dossier com mais detalhes e as propostas de visibilidade para a *{nome}*:\n📄 ${proj.dossier_url || (proj.url_base || 'https://flash-li-patrocinios.vercel.app')}\n\nGostaria muito de saber a vossa opinião! Muito obrigado.`;
  }
  function getDefaultPropES(p) {
    const proj = p || projetoAtivo || {};
    return `¡Hola! Soy ${proj.gestor || 'Hugo'}, de ${proj.escola || 'Flash Li Dance School'}.\n\nEstamos buscando socios para apoyar a nuestro equipo de cara a ${proj.nome || 'la competición'} en ${proj.cidade || 'destino'}. ${proj.bandeira || '🩰'}\n\nLe dejo aquí nuestro dossier con más detalles y las propuestas de visibilidad para *{nome}*:\n📄 ${proj.dossier_url || (proj.url_base || 'https://flash-li-patrocinios.vercel.app')}\n\n¡Me gustaría mucho saber su opinión! Muchas gracias.`;
  }
  function getDefaultFollPT(p) {
    const proj = p || projetoAtivo || {};
    return `Olá! Sou o ${proj.gestor || 'Hugo'}, da ${proj.escola || 'Flash Li Dance School'}.\n\nEntrámos recentemente em contacto com a *{nome}* para uma parceria rumo ao ${proj.nome || 'campeonato'}. ${proj.bandeira || '🩰'}\n\nGostava de saber se tiveram oportunidade de analisar o nosso dossier ou se precisam de informação adicional.\n\nMuito obrigado pelo vosso tempo!`;
  }
  function getDefaultFollES(p) {
    const proj = p || projetoAtivo || {};
    return `¡Hola! Soy ${proj.gestor || 'Hugo'}, de ${proj.escola || 'Flash Li Dance School'}.\n\nRecientemente contactamos con *{nome}* para una colaboración de cara a ${proj.nome || 'la competición'}. ${proj.bandeira || '🩰'}\n\nMe gustaría saber si pudieron revisar nuestro dossier o si necesitan información adicional.\n\n¡Muchas gracias por su tiempo!`;
  }

  const [msgPropostaPT, setMsgPropostaPT] = useState('');
  const [msgPropostaES, setMsgPropostaES] = useState('');
  const [msgFollowPT, setMsgFollowPT] = useState('');
  const [msgFollowES, setMsgFollowES] = useState('');

  const PRIMARY_COLOR = '#d4af37'; 
  const TEXT_PRIMARY = '#1a1a1a'; 

  // Carregar projetos ao iniciar
  useEffect(() => {
    fetchProjetos();
    // textos WhatsApp carregados ao mudar projeto (ver useEffect de projetoAtivo)
  }, []);

  // Quando projeto muda, carregar dados e atualizar textos
  useEffect(() => {
    if (!projetoAtivo) return;
    const p = projetoAtivo; // snapshot do projeto para evitar closure stale
    setEmpresas([]);         // limpar dados anteriores imediatamente
    setHistorico([]);
    fetchEmpresas(p);
    fetchHistorico(p);
    setObjetivo(p.meta_objetivo || 3000);
    localStorage.setItem('projetoAtivoId', p.id);
    // Textos WhatsApp: guardados por projeto, ou gerar defaults dinâmicos
    const key = p.id;
    setMsgPropostaPT(localStorage.getItem('wapp_' + key + '_propPT') || getDefaultPropPT(p));
    setMsgPropostaES(localStorage.getItem('wapp_' + key + '_propES') || getDefaultPropES(p));
    setMsgFollowPT(localStorage.getItem('wapp_' + key + '_follPT') || getDefaultFollPT(p));
    setMsgFollowES(localStorage.getItem('wapp_' + key + '_follES') || getDefaultFollES(p));
  }, [projetoAtivo?.id]);

  async function fetchProjetos() {
    const { data, error } = await supabase.from('projetos').select('*').order('ano', { ascending: false });
    if (error) {
      showMessage('❌ Erro a carregar projetos: ' + error.message, 'error');
      setLoading(false);
      return;
    }
    if (data && data.length > 0) {
      setProjetos(data);
      const savedId = localStorage.getItem('projetoAtivoId');
      const saved = savedId ? data.find(p => p.id === savedId) : null;
      setProjetoAtivo(saved || data[0]);
      // setLoading(false) é chamado no useEffect de projetoAtivo → fetchEmpresas
    } else {
      setProjetos([]);
      setProjetoAtivo(null);
      setLoading(false);
    }
  }

  async function guardarProjeto(e) {
    e.preventDefault();
    const dados = { ...novoProj };
    if (!dados.nome?.trim()) return showMessage('O nome da competição é obrigatório.', 'error');
    if (!dados.cidade?.trim()) return showMessage('A cidade é obrigatória.', 'error');
    dados.nome = dados.nome.trim();
    showMessage('A guardar projeto...', 'info');
    let error, data;
    if (editandoProjeto) {
      ({ error, data } = await supabase.from('projetos').update(dados).eq('id', editandoProjeto.id).select());
    } else {
      ({ error, data } = await supabase.from('projetos').insert([dados]).select());
    }
    if (error) return showMessage('Erro: ' + error.message, 'error');
    const projetoSalvo = data?.[0];
    showMessage('✅ Projeto guardado!', 'success');
    setShowProjetoModal(false);
    setEditandoProjeto(null);
    // Definir o projeto ativo ANTES de fetchProjetos para evitar race condition
    if (projetoSalvo) {
      if (!editandoProjeto) {
        setProjetoAtivo(projetoSalvo);
      } else if (projetoAtivo?.id === editandoProjeto.id) {
        setProjetoAtivo(projetoSalvo);
      }
    }
    await fetchProjetos(); // atualizar lista de projetos depois
  }

  async function eliminarProjeto(proj) {
    if (!window.confirm(`Eliminar "${proj.nome}" e TODOS os seus patrocinadores e campanhas? Esta ação é irreversível.`)) return;
    const { error } = await supabase.from('projetos').delete().eq('id', proj.id);
    if (error) return showMessage('Erro: ' + error.message, 'error');
    showMessage('🗑️ Projeto eliminado.', 'success');
    // Limpar estado antes de recarregar para evitar flash de dados antigos
    setEmpresas([]);
    setHistorico([]);
    setProjetoAtivo(null);
    await fetchProjetos();
  }

  function abrirNovoProj() {
    setEditandoProjeto(null);
    setNovoProj({ nome:'', evento:'', ano: new Date().getFullYear()+1, cidade:'', pais:'', bandeira:'🏳️', meta_objetivo:3000, atletas:'', escola:'Flash Li Dance School', gestor:'Hugo', gestor_whatsapp:'+351 924 368 517', dossier_url:'', url_base:'https://flash-li-patrocinios.vercel.app' });
    setShowProjetoModal(true);
  }

  function abrirEditarProj(proj) {
    setEditandoProjeto(proj);
    setNovoProj({ ...proj });
    setShowProjetoModal(true);
  }

  function handleMetaChange(val) {
    const num = Number(val) || 0;
    setObjetivo(num);
    // Guardar no Supabase de forma não bloqueante (fire-and-forget com tratamento de erro)
    if (projetoAtivo) {
      supabase.from('projetos').update({ meta_objetivo: num }).eq('id', projetoAtivo.id)
        .then(({ error }) => { if (error) showMessage('❌ Erro ao guardar meta: ' + error.message, 'error'); });
    }
  }

  function guardarSettings(e) {
    e.preventDefault();
    const key = projetoAtivo?.id || 'global';
    localStorage.setItem('wapp_' + key + '_propPT', msgPropostaPT);
    localStorage.setItem('wapp_' + key + '_propES', msgPropostaES);
    localStorage.setItem('wapp_' + key + '_follPT', msgFollowPT);
    localStorage.setItem('wapp_' + key + '_follES', msgFollowES);
    setShowSettings(false);
    showMessage('✅ Textos do WhatsApp guardados com sucesso!', 'success');
  }

  function showMessage(text, type = 'info', duracao = 5000) {
    setMsg(text);
    setMsgType(type);
    if (duracao > 0) setTimeout(() => setMsg(''), duracao);
  }

  async function fetchEmpresas(proj) {
    const p = proj || projetoAtivo;
    if (!p) return;
    setLoading(true);
    const { data, error } = await supabase.from('patrocinadores').select('*').eq('projeto_id', p.id).order('created_at', { ascending: false });
    if (error) showMessage('❌ Erro ao carregar dados: ' + error.message, 'error');
    else if (data) setEmpresas(data);
    setLoading(false);
  }

  async function fetchHistorico(proj) {
    const p = proj || projetoAtivo;
    if (!p) return;
    const { data, error } = await supabase.from('historico_novidades').select('*').eq('projeto_id', p.id).order('created_at', { ascending: false });
    if (!error && data) setHistorico(data);
  }

  // --- CRM BASE ---
  async function addEmpresa(e) {
    e.preventDefault();
    if (!projetoAtivo) return showMessage('Seleciona um projeto primeiro!', 'error');
    if (!nome) return showMessage('O Nome da empresa é obrigatório!', 'error');
    if (!email && !telefone) return showMessage('Tens de colocar ou o Email ou o Telefone!', 'error');
    showMessage('A adicionar parceiro...', 'info');
    const novaEmpresa = { 
      projeto_id: projetoAtivo.id,
      nome, email: email || null, telefone: telefone || null, idioma, status: 'Pendente', data_followup: dataFollowup || null,
      valor: 0, recibo_enviado: false, logo_recebido: false, redes_sociais: false, notas: ''
    };
    const { data, error } = await supabase.from('patrocinadores').insert([novaEmpresa]).select();
    if (error) { showMessage(`❌ ERRO: ${error.message}`, 'error'); } 
    else if (data) {
      setEmpresas([data[0], ...empresas]); setNome(''); setEmail(''); setTelefone(''); setDataFollowup('');
      showMessage('✅ Parceiro adicionado!', 'success');
    }
  }

  async function updateCampo(id, campo, valor) {
    setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, [campo]: valor } : emp));
    const { error } = await supabase.from('patrocinadores').update({ [campo]: valor }).eq('id', id);
    if (error) { showMessage('❌ Erro ao guardar: ' + error.message, 'error'); fetchEmpresas(); }
  }

  function abrirModalEdicao(emp) { setEmpresaEmEdicao({ ...emp }); }
  function fecharModal() { setEmpresaEmEdicao(null); }

  async function guardarEdicaoTotal(e) {
    e.preventDefault();
    if (!empresaEmEdicao.nome) return showMessage('O nome não pode estar vazio!', 'error');
    showMessage('A guardar alterações...', 'info');
    const { id, created_at, projeto_id, ...dadosParaAtualizar } = empresaEmEdicao;
    // projeto_id não deve ser alterado ao editar — extraído mas não incluído
    dadosParaAtualizar.email = dadosParaAtualizar.email || null;
    dadosParaAtualizar.telefone = dadosParaAtualizar.telefone || null;
    dadosParaAtualizar.data_followup = dadosParaAtualizar.data_followup || null;

    const { error } = await supabase.from('patrocinadores').update(dadosParaAtualizar).eq('id', id);
    if (error) showMessage(`❌ Erro a atualizar: ${error.message}`, 'error');
    else {
      setEmpresas(empresas.map(emp => emp.id === id ? { ...emp, ...dadosParaAtualizar } : emp));
      fecharModal();
      showMessage('✅ Parceiro atualizado com sucesso!', 'success');
    }
  }

  async function eliminarEmpresa(id, nomeEmpresa) {
    if (!window.confirm(`Tens a certeza que queres eliminar permanentemente "${nomeEmpresa}"?`)) return;
    const { error } = await supabase.from('patrocinadores').delete().eq('id', id);
    if (error) showMessage('❌ Erro ao eliminar: ' + error.message, 'error');
    else { setEmpresas(empresas.filter(emp => emp.id !== id)); showMessage('🗑️ Eliminada!', 'success'); }
  }

  async function enviarProposta(empresa) {
    if (!empresa.email) return showMessage('Esta empresa não tem email guardado!', 'error');
    showMessage(`A enviar proposta por email para ${empresa.nome}...`, 'info');
    try {
      const res = await fetch('/api/send-proposal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...empresa, projeto: { bandeira: projetoAtivo?.bandeira, cidade: projetoAtivo?.cidade, pais: projetoAtivo?.pais, evento: projetoAtivo?.evento, ano: projetoAtivo?.ano, escola: projetoAtivo?.escola, gestor: projetoAtivo?.gestor, dossier_url: projetoAtivo?.dossier_url, url_base: projetoAtivo?.url_base } }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) { showMessage(`✅ Email enviado com sucesso!`, 'success'); updateCampo(empresa.id, 'proposta_enviada_em', new Date().toISOString()); }
      else showMessage(`❌ Falha no envio: ${json.error || res.statusText}`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  async function enviarBoasVindas(empresa) {
    if (!empresa.email) return showMessage('Esta empresa não tem email guardado!', 'error');
    showMessage(`A pedir dados e logo a ${empresa.nome}...`, 'info');
    try {
      const res = await fetch('/api/send-welcome', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...empresa, projeto: { bandeira: projetoAtivo?.bandeira, cidade: projetoAtivo?.cidade, evento: projetoAtivo?.evento, ano: projetoAtivo?.ano, escola: projetoAtivo?.escola, gestor: projetoAtivo?.gestor, url_base: projetoAtivo?.url_base } }) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) showMessage(`✅ Pedido enviado com sucesso!`, 'success');
      else showMessage(`❌ Falha no envio: ${json.error || res.statusText}`, 'error');
    } catch (err) { showMessage('Erro técnico.', 'error'); }
  }

  function getWhatsAppPropostaLink(empresa) {
    let numero = empresa.telefone ? String(empresa.telefone).replace(/\D/g, '') : '';
    if (numero.length === 9) numero = empresa.idioma === 'ES' ? '34' + numero : '351' + numero;
    let baseMsg = empresa.idioma === 'ES'
      ? (msgPropostaES || getDefaultPropES())
      : (msgPropostaPT || getDefaultPropPT());
    let finalMsg = baseMsg.replace(/{nome}/g, empresa.nome);
    return `https://wa.me/${numero}?text=${encodeURIComponent(finalMsg)}`;
  }

  function getWhatsAppFollowUpLink(empresa) {
    let numero = empresa.telefone ? String(empresa.telefone).replace(/\D/g, '') : '';
    if (numero.length === 9) numero = empresa.idioma === 'ES' ? '34' + numero : '351' + numero;
    let baseMsg = empresa.idioma === 'ES'
      ? (msgFollowES || getDefaultFollES())
      : (msgFollowPT || getDefaultFollPT());
    let finalMsg = baseMsg.replace(/{nome}/g, empresa.nome);
    return `https://wa.me/${numero}?text=${encodeURIComponent(finalMsg)}`;
  }

  // --- BROADCAST ---
  async function uploadFotosDiretas(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFotos(true);
    showMessage(`A carregar ${files.length} foto(s)...`, 'info');
    const novasUrls = [];
    for (const file of files) {
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('fotos').upload(fileName, file);
      if (error) { showMessage(`❌ Erro no upload de ${file.name}: ${error.message}`, 'error'); continue; }
      const { data: publicUrlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
      novasUrls.push({ url: publicUrlData.publicUrl, fileName });
    }
    setBFotos(prev => [...prev, ...novasUrls]);
    setUploadingFotos(false);
    if (novasUrls.length > 0) {
      showMessage(`📸 ${novasUrls.length} foto(s) prontas!`, 'success');
    } else {
      showMessage('❌ Nenhuma foto foi carregada com sucesso.', 'error');
    }
    e.target.value = '';
  }

  function removerFoto(idx) {
    setBFotos(prev => prev.filter((_, i) => i !== idx));
  }

  // Templates de campanha por tipo
  function aplicarTemplate(tipo) {
    if ((bAssunto.trim() || bMensagem.trim()) && tipo !== bTipoCampanha) {
      if (!window.confirm('Substituir o assunto e a mensagem atuais pelo template?')) {
        setBTipoCampanha(tipo); return;
      }
    }
    setBTipoCampanha(tipo);
    const templates = {
      novidade: { assunto: `🗞️ Novidades de ${projetoAtivo?.nome || 'Competição'} — ${projetoAtivo?.escola || 'Flash Li'}`, mensagem: `Olá!\n\nTemos novidades fresquinhas para partilhar convosco sobre a nossa preparação para ${projetoAtivo?.nome || 'a competição'}!\n\n[Descreve aqui o que aconteceu: treinos, conquistas, preparativos...]\n\nGraças ao vosso apoio, estamos cada vez mais próximos de ${projetoAtivo?.cidade || 'lá'}! ${projetoAtivo?.bandeira || '🩰'}\n\nCom os melhores cumprimentos,\n${projetoAtivo?.gestor || 'Hugo'} & Equipa ${projetoAtivo?.escola || 'Flash Li'}` },
      resultado: { assunto: `🏆 Resultado da Competição — ${projetoAtivo?.escola || 'Flash Li'}`, mensagem: `Querido(a) parceiro(a),\n\nTemos o prazer de partilhar os resultados da nossa mais recente competição!\n\n🥇 Classificação: [Posição]\n📍 Evento: [Nome do evento]\n📅 Data: [Data]\n\n[Descreve o momento, as emoções, o que correu bem...]\n\nSem o vosso apoio, nada disto seria possível. Muito obrigado!\n\n${projetoAtivo?.gestor || 'Hugo'} & Equipa ${projetoAtivo?.escola || 'Flash Li'}` },
      agradecimento: { assunto: `💛 Um obrigado especial da ${projetoAtivo?.escola || 'Flash Li'}`, mensagem: `Caro(a) parceiro(a),\n\nEste email é simplesmente para dizer: OBRIGADO.\n\nO vosso apoio faz uma diferença enorme na vida das nossas atletas. Cada treino, cada viagem, cada sonho — tudo se torna possível graças a pessoas como vocês.\n\n[Adiciona uma mensagem pessoal ou momento especial...]\n\nDo fundo do coração,\n${projetoAtivo?.gestor || 'Hugo'} e toda a ${projetoAtivo?.escola || 'Flash Li'} 🩰` },
      urgente: { assunto: `⚡ Atualização Importante — ${projetoAtivo?.nome || 'Competição'} a aproximar-se!`, mensagem: `Caro(a) parceiro(a),\n\nFaltam apenas [X dias] para ${projetoAtivo?.nome || 'a competição'} em ${projetoAtivo?.cidade || 'destino'}! ${projetoAtivo?.bandeira || '🩰'}\n\nNeste momento estamos a [descreve o estado atual da preparação].\n\n[Partilha algo urgente, uma conquista recente, ou um apelo específico...]\n\nO vosso apoio continua a ser fundamental nesta reta final!\n\nCom entusiasmo,\n${projetoAtivo?.gestor || 'Hugo'}` },
    };
    if (templates[tipo]) {
      setBAssunto(templates[tipo].assunto);
      setBMensagem(templates[tipo].mensagem);
    }
  }

  // Detectar tipo de link de rede social
  function detectarTipoRS(url) {
    if (url.includes('instagram.com')) return { icon: '📸', nome: 'Instagram' };
    if (url.includes('facebook.com') || url.includes('fb.com')) return { icon: '👥', nome: 'Facebook' };
    if (url.includes('youtube.com') || url.includes('youtu.be')) return { icon: '▶️', nome: 'YouTube' };
    if (url.includes('tiktok.com')) return { icon: '🎵', nome: 'TikTok' };
    if (url.includes('drive.google.com')) return { icon: '☁️', nome: 'Google Drive' };
    return { icon: '🔗', nome: 'Link' };
  }

  function adicionarLinkRS() {
    if (!bLinkRSInput.trim()) return;
    const tipo = detectarTipoRS(bLinkRSInput);
    setBLinksRS(prev => [...prev, { tipo, url: bLinkRSInput.trim(), descricao: bLinkRSDesc.trim() || tipo.nome }]);
    setBLinkRSInput(''); setBLinkRSDesc('');
  }

  function removerLinkRS(idx) { setBLinksRS(prev => prev.filter((_, i) => i !== idx)); }

  function adicionarVideo() {
    if (!bVideoInput.trim()) return;
    const tipo = detectarTipoRS(bVideoInput);
    setBVideos(prev => [...prev, { tipo, url: bVideoInput.trim(), descricao: bVideoDesc.trim() || 'Ver vídeo' }]);
    setBVideoInput(''); setBVideoDesc('');
  }

  function removerVideo(idx) { setBVideos(prev => prev.filter((_, i) => i !== idx)); }

  async function uploadVideoFicheiro(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Vídeos são grandes — guardar no Supabase storage
    setUploadingVideo(true);
    showMessage('A carregar vídeo... (pode demorar)', 'info');
    const fileName = `video_${Math.random().toString(36).substring(2)}_${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('fotos').upload(fileName, file, { contentType: file.type });
    if (error) { showMessage('❌ Erro no upload do vídeo: ' + error.message, 'error'); }
    else {
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(fileName);
      setBVideos(prev => [...prev, { tipo: { icon: '🎬', nome: 'Vídeo' }, url: urlData.publicUrl, descricao: file.name.replace(/\.[^/.]+$/, '') }]);
      showMessage('🎬 Vídeo pronto!', 'success');
    }
    setUploadingVideo(false);
    e.target.value = '';
  }

  async function enviarBroadcast() {
    if (!bAssunto.trim()) return showMessage('⚠️ O assunto do email é obrigatório!', 'error');
    if (!bMensagem.trim()) return showMessage('⚠️ A mensagem não pode estar vazia!', 'error');

    let alvos = [];
    if (bDestinatarios === 'aceites') alvos = empresas.filter(e => e.status === 'Aceitou');
    if (bDestinatarios === 'pendentes') alvos = empresas.filter(e => e.status === 'Pendente' || e.status === 'Em Análise');
    if (bDestinatarios === 'todos') alvos = empresas;

    const alvosComEmail = alvos.filter(e => e.email && e.email.includes('@'));
    const semEmail = alvos.length - alvosComEmail.length;

    if (alvosComEmail.length === 0) return showMessage('❌ Nenhum destinatário deste grupo tem email registado.', 'error');

    const confirmMsg = semEmail > 0
      ? `Enviar para ${alvosComEmail.length} contactos com email?\n(${semEmail} ignorados por não ter email)`
      : `Enviar para ${alvosComEmail.length} contacto(s)?`;
    if (!window.confirm(confirmMsg)) return;

    setEnviando(true);
    setResultadoEnvio(null);
    showMessage(`📨 A enviar para ${alvosComEmail.length} contacto(s)...`, 'info', 60000);

    const fotosUrls = bFotos.map(f => f.url);
    // manter compatibilidade: bFoto = primeira foto para a API antiga
    const primeiraFoto = fotosUrls[0] || bFoto || '';

    try {
      const res = await fetch('/api/send-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assunto: bAssunto, mensagem: bMensagem, fotoUrl: primeiraFoto, fotosExtras: fotosUrls.slice(1), videos: bVideos, linksRS: bLinksRS, empresas: alvosComEmail, tipoCampanha: bTipoCampanha, totalAngariado: angariado, metaObjetivo: objetivo, totalParceiros: totalAceites, projeto: { bandeira: projetoAtivo?.bandeira, cidade: projetoAtivo?.cidade, pais: projetoAtivo?.pais, evento: projetoAtivo?.evento, ano: projetoAtivo?.ano, escola: projetoAtivo?.escola, gestor: projetoAtivo?.gestor, url_base: projetoAtivo?.url_base } })
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const temFalhas = json.falhados && json.falhados.length > 0;
        setResultadoEnvio({ enviados: json.enviados, total: json.total, falhados: json.falhados || [] });
        const avisos = json.avisos && json.avisos.length > 0 ? ' ⚠️ ' + json.avisos.join(', ') : '';
        showMessage(`✅ ${json.enviados}/${json.total} emails enviados!${temFalhas ? ' (alguns falharam)' : ''}${avisos}`, temFalhas ? 'warning' : 'success');

        const { data: novoHistorico } = await supabase.from('historico_novidades').insert([{
          projeto_id: projetoAtivo?.id,
          assunto: bAssunto, mensagem: bMensagem,
          foto_url: primeiraFoto || null,
          video_url: (bVideos.length > 0 ? bVideos[0].url : bVideo) || null,
          total_destinatarios: json.total,
          total_enviados: json.enviados,
          tipo_campanha: bTipoCampanha,
          num_fotos: bFotos.length,
          num_videos: bVideos.length,
          num_links_rs: bLinksRS.length
        }]).select();
        if (novoHistorico) setHistorico([novoHistorico[0], ...historico]);

        setBAssunto(''); setBMensagem(''); setBFoto(''); setBVideo(''); setBFotos([]); setBVideos([]); setBLinksRS([]);
      } else {
        showMessage(`❌ Erro: ${json.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err) {
      showMessage(`❌ Erro técnico: ${err.message}`, 'error');
    } finally {
      setEnviando(false);
    }
  }

  function exportToCSV() {
    const headers = ['Nome', 'Email', 'Telefone', 'Idioma', 'Estado', 'Valor (€)', 'Escalão', 'Recibo Emitido', 'Logo Recebido', 'Redes Sociais', 'Data Follow-up', 'Notas'];
    const esc = v => '"' + String(v || '').replace(/"/g, '""') + '"';
    const rows = empresas.map(emp => [ esc(emp.nome), esc(emp.email || ''), esc(emp.telefone || ''), emp.idioma, emp.status, emp.valor || 0, getEscalao(emp.valor).nome, emp.recibo_enviado ? 'Sim' : 'Não', emp.logo_recebido ? 'Sim' : 'Não', emp.redes_sociais ? 'Sim' : 'Não', emp.data_followup || '', esc(emp.notas || '') ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `${(projetoAtivo?.nome || 'FlashLi').replace(/[^a-zA-Z0-9]/g,'_')}_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  // --- CÁLCULOS SEGUROS ---
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

  // Sem projetos: renderizar ecrã de boas-vindas (dentro do return para o modal funcionar)
  const semProjetos = !loading && projetos.length === 0;

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>A carregar... ⏳</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* ECRÃ DE BOAS-VINDAS (sem projetos) */}
      {semProjetos && !showProjetoModal && (
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '50px 40px', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', borderTop: '6px solid #d4af37' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🩰</div>
            <h1 style={{ color: '#1a1a1a', fontSize: '24px', fontWeight: '900', margin: '0 0 10px 0' }}>FlashLi Patrocínios</h1>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Ainda não tens nenhum projeto. Cria o primeiro para começar!</p>
            <button onClick={abrirNovoProj} style={{ background: '#1a1a1a', color: '#d4af37', padding: '16px 32px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>+ Criar Primeiro Projeto</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .responsive-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .desktop-table { display: none; }
        .mobile-card { background: white; border-radius: 12px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        
        /* Flex adaptável: Organiza bem num iPad e num PC */
        .flex-adapt { display: flex; flex-wrap: wrap; gap: 10px; }
        .flex-adapt > * { flex: 1 1 auto; }
        
        .task-checkbox { display: flex; alignItems: center; gap: 8px; font-size: 13px; cursor: pointer; padding: 6px 0; font-weight: 500;}
        .task-checkbox input { cursor: pointer; transform: scale(1.2); }
        .dash-box { background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 15px; backdrop-filter: blur(4px); }
        .modal-content { background: white; padding: 25px; border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 5px; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit; }
        .btn-hover:hover { opacity: 0.9; transform: scale(0.98); transition: 0.2s; }
        
        /* O breakpoint 768px ativa o modo Tabela (usado no iPad Portrait/Landscape e PC) */
        @media (min-width: 768px) {
          .responsive-grid { grid-template-columns: repeat(3, 1fr); }
          .desktop-table { display: table; width: 100%; border-collapse: collapse; }
          .mobile-card { display: none; }
        }

        @media print {
          body { background: white; }
          header, .no-print { display: none !important; }
          .dash-box { border: 1px solid #ccc; box-shadow: none; break-inside: avoid; }
        }
      `}} />

      {/* --- MODAL CONFIGURAÇÕES WHATSAPP --- */}
      {showSettings && (
        <div className="modal-overlay no-print" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={20}/> Textos do WhatsApp</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24}/></button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Usa a tag <b>{`{nome}`}</b> no texto para a App substituir automaticamente pelo nome da empresa.</p>
            <form onSubmit={guardarSettings}>
              <div className="form-group"><label>📄 Mensagem de Proposta (PT)</label><textarea rows="3" value={msgPropostaPT} onChange={e => setMsgPropostaPT(e.target.value)} required></textarea></div>
              <div className="form-group"><label>📄 Mensagem de Proposta (ES)</label><textarea rows="3" value={msgPropostaES} onChange={e => setMsgPropostaES(e.target.value)} required></textarea></div>
              <div className="form-group"><label>💬 Mensagem de Follow-up (PT)</label><textarea rows="3" value={msgFollowPT} onChange={e => setMsgFollowPT(e.target.value)} required></textarea></div>
              <div className="form-group"><label>💬 Mensagem de Follow-up (ES)</label><textarea rows="3" value={msgFollowES} onChange={e => setMsgFollowES(e.target.value)} required></textarea></div>
              <button type="submit" className="btn-hover" style={{ width: '100%', padding: '14px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>💾 Guardar Definições</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIÇÃO PARCEIRO --- */}
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
                  <label className="task-checkbox"><input type="checkbox" checked={empresaEmEdicao.redes_sociais} onChange={e => setEmpresaEmEdicao({...empresaEmEdicao, redes_sociais: e.target.checked})} /> Post nas Redes Sociais</label>
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

      {/* --- MODAL PROJETO (sempre renderizado) --- */}
      {showProjetoModal && (
        <div className="modal-overlay no-print" onClick={() => setShowProjetoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: TEXT_PRIMARY }}>🗂️ {editandoProjeto ? 'Editar Projeto' : 'Novo Projeto'}</h2>
              <button onClick={() => setShowProjetoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24}/></button>
            </div>
            <form onSubmit={guardarProjeto}>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 16px 0' }}>
                Cada projeto é uma competição independente. Podes ter vários ativos em paralelo — AllDance 2027, DWCup 2027, etc.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {/* NOME LIVRE — campo principal */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Nome da Competição *</label>
                  <input type="text" required placeholder="ex: AllDance 2027 Lisboa, DWCup 2026 Dublin, IDO 2027 Madrid..."
                    value={novoProj.nome}
                    onChange={e => {
                      const v = e.target.value;
                      setNovoProj({...novoProj, nome: v, evento: v.split(' ')[0] || novoProj.evento});
                    }}
                    style={{ fontSize: '15px', fontWeight: 'bold' }} />
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Escreve o nome completo como queres que apareça nos emails e relatórios.</div>
                </div>

                {/* ANO */}
                <div className="form-group">
                  <label>Ano *</label>
                  <input type="number" required value={novoProj.ano}
                    onChange={e => setNovoProj({...novoProj, ano: Number(e.target.value)})} />
                </div>

                {/* META */}
                <div className="form-group">
                  <label>Meta de Angariação (€) *</label>
                  <input type="number" required value={novoProj.meta_objetivo}
                    onChange={e => setNovoProj({...novoProj, meta_objetivo: Number(e.target.value)})} />
                </div>

                {/* CIDADE + PAIS + BANDEIRA */}
                <div className="form-group">
                  <label>Cidade do Evento *</label>
                  <input type="text" required placeholder="ex: Lisboa"
                    value={novoProj.cidade}
                    onChange={e => setNovoProj({...novoProj, cidade: e.target.value})} />
                </div>

                <div className="form-group" style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label>País</label>
                    <input type="text" placeholder="ex: Portugal"
                      value={novoProj.pais}
                      onChange={e => setNovoProj({...novoProj, pais: e.target.value})} />
                  </div>
                  <div style={{ width: '70px' }}>
                    <label>Bandeira</label>
                    <input type="text" value={novoProj.bandeira}
                      onChange={e => setNovoProj({...novoProj, bandeira: e.target.value})}
                      style={{ fontSize: '22px', textAlign: 'center', padding: '8px 4px' }} />
                  </div>
                </div>

                {/* ATLETAS */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Atletas (separadas por vírgula)</label>
                  <input type="text" placeholder="ex: Matilde Mota, Ana Silva"
                    value={novoProj.atletas}
                    onChange={e => setNovoProj({...novoProj, atletas: e.target.value})} />
                </div>

                {/* DOSSIER */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Link do Dossier PDF (opcional)</label>
                  <input type="text" placeholder="https://... (deixa em branco para usar o dossier atual)"
                    value={novoProj.dossier_url}
                    onChange={e => setNovoProj({...novoProj, dossier_url: e.target.value})} />
                </div>

              </div>

              {/* AVANÇADO: escola/gestor colapsáveis */}
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#64748b', fontWeight: 'bold', userSelect: 'none' }}>⚙️ Configurações avançadas (escola, gestor, whatsapp)</summary>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div className="form-group"><label>Escola</label><input type="text" value={novoProj.escola} onChange={e => setNovoProj({...novoProj, escola: e.target.value})} /></div>
                  <div className="form-group"><label>Gestor (assina emails)</label><input type="text" value={novoProj.gestor} onChange={e => setNovoProj({...novoProj, gestor: e.target.value})} /></div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}><label>WhatsApp do Gestor</label><input type="text" value={novoProj.gestor_whatsapp} onChange={e => setNovoProj({...novoProj, gestor_whatsapp: e.target.value})} /></div>
                </div>
              </details>

              {/* AÇÕES: eliminar projeto (só ao editar) */}
              {editandoProjeto && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px', fontWeight: 'bold' }}>⚠️ Zona de Perigo</div>
                  <button type="button" onClick={() => { setShowProjetoModal(false); eliminarProjeto(editandoProjeto); }}
                    style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                    🗑️ Eliminar este projeto e todos os seus dados
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowProjetoModal(false)} className="btn-hover"
                  style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-hover"
                  style={{ flex: 2, padding: '12px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💾 Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- APP PRINCIPAL (só quando há projetos) --- */}
      {!semProjetos && <>
      {/* --- CABEÇALHO --- */}
      <header className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px', background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '42px', lineHeight: 1 }}>{projetoAtivo?.bandeira || '🩰'}</div>
            <div>
              <h1 style={{ color: TEXT_PRIMARY, margin: 0, fontSize: '20px', fontWeight: '900' }}>ANGARIAÇÃO {(projetoAtivo?.evento || 'EVENTO').toUpperCase()} {projetoAtivo?.ano}</h1>
              <h2 style={{ color: '#64748b', margin: '3px 0 0 0', fontSize: '13px', fontWeight: '500' }}>{projetoAtivo?.escola} • {projetoAtivo?.cidade}, {projetoAtivo?.pais}</h2>
              {projetoAtivo?.atletas && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>🩰 {projetoAtivo.atletas}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* SELECTOR DE PROJETO */}
            {projetos.length > 1 && (
              <select value={projetoAtivo?.id || ''} onChange={e => { const p = projetos.find(x => x.id === e.target.value); if (p && p.id !== projetoAtivo?.id) { setProjetoAtivo(p); } }}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #d4af37', background: 'white', fontWeight: 'bold', color: TEXT_PRIMARY, fontSize: '13px', cursor: 'pointer', maxWidth: '220px' }}>
                {projetos.map(p => <option key={p.id} value={p.id}>{p.bandeira} {p.nome}</option>)}
              </select>
            )}
            {projetos.length === 1 && (
              <span style={{ padding: '8px 12px', borderRadius: '8px', border: '2px solid #d4af37', background: '#fffbeb', fontWeight: 'bold', color: TEXT_PRIMARY, fontSize: '13px' }}>
                {projetoAtivo?.bandeira} {projetoAtivo?.nome}
              </span>
            )}
            <button onClick={abrirNovoProj} className="btn-hover" title="Novo Projeto" style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>+ Projeto</button>
            {projetoAtivo && <button onClick={() => abrirEditarProj(projetoAtivo)} className="btn-hover" title="Editar Projeto Atual" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Settings size={16}/></button>}
            <button onClick={() => setShowSettings(true)} className="btn-hover" style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#475569' }} title="Textos WhatsApp"><MessageCircle size={16}/></button>
          </div>
        </div>
        
        {/* NAVEGAÇÃO COM 4 ABAS */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', marginTop: '10px' }}>
          <button onClick={() => setTab('crm')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'crm' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'crm' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><Users size={18}/> CRM</button>
          <button onClick={() => setTab('reports')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'reports' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'reports' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
            <BarChart3 size={18}/> Relatório 
            {(urgentesFollowup.length > 0 || tarefasPendentes.length > 0) && <span style={{background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px'}}>{urgentesFollowup.length + tarefasPendentes.length}</span>}
          </button>
          <button onClick={() => setTab('broadcast')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'broadcast' ? TEXT_PRIMARY : '#f1f5f9', color: tab === 'broadcast' ? PRIMARY_COLOR : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><Send size={18}/> Campanhas</button>
          <button onClick={() => setTab('mural')} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: tab === 'mural' ? '#3b82f6' : '#f1f5f9', color: tab === 'mural' ? 'white' : '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}><LayoutGrid size={18}/> Mural</button>
        </div>
      </header>

      {msg && <div className="no-print" style={{ background: msgType === 'error' ? '#fee2e2' : '#f0fdf4', color: msgType === 'error' ? '#991b1b' : '#166534', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontWeight: 'bold', border: `1px solid ${msgType === 'error' ? '#f87171' : '#4ade80'}` }}>{msg}</div>}

      {/* === ABA 1: PIPELINE CRM === */}
      {tab === 'crm' && (
        <div className="no-print">
          
          {/* O Form adaptável (flex-adapt) garante que as caixas respiram em iPads */}
          <form onSubmit={addEmpresa} style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Nova Prospecção Manual</h3>
            </div>
            
            <div className="flex-adapt">
              <input type="text" placeholder="Empresa (Obrigatório)" value={nome} onChange={e => setNome(e.target.value)} style={{ minWidth: '180px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <input type="email" placeholder="Email (Opcional)" value={email} onChange={e => setEmail(e.target.value)} style={{ minWidth: '180px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Telefone (Opcional)" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ minWidth: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              <div style={{ minWidth: '140px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '-8px', left: '10px', background: 'white', padding: '0 5px', fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>Ligar a:</span>
                <input type="date" value={dataFollowup} onChange={e => setDataFollowup(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155' }} />
              </div>
              <select value={idioma} onChange={e => setIdioma(e.target.value)} style={{ minWidth: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="PT">🇵🇹</option><option value="ES">🇪🇸</option>
              </select>
              <button type="submit" className="btn-hover" style={{ minWidth: '150px', padding: '12px 20px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Adicionar Parceiro</button>
            </div>
          </form>

          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="flex-adapt" style={{ marginBottom: '15px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ flex: '1 1 180px', position: 'relative' }}>
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
                  {status === 'Aceitou' ? '✅ Aceitou' : status === 'Recusou' ? '❌ Recusou' : status === 'Em Análise' ? '🤔 Em Análise' : status === 'Pendente' ? '⏳ Pendente' : '🌍 Todos'}
                </button>
              ))}
            </div>
          </div>

          {/* LISTA MOBILE (Só visível em telemóveis) */}
          {empresasFiltradas.map(emp => {
            const escalao = getEscalao(emp.valor);
            const atrasado = (emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.data_followup && new Date(emp.data_followup).toISOString().split('T')[0] <= hoje;
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
                    <Calendar size={12}/> Ligar a: {new Date(emp.data_followup).toLocaleDateString('pt-PT')} {atrasado && '(Atrasado!)'}
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
                      <label className="task-checkbox" style={{ color: emp.redes_sociais ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.redes_sociais} onChange={(e) => updateCampo(emp.id, 'redes_sociais', e.target.checked)} /> Post Publicado</label>
                      <button onClick={() => enviarBoasVindas(emp)} className="btn-hover" style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}><Mail size={16}/> Pedir NIF & Logo</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {emp.status !== 'Aceitou' && emp.email && <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ flex: '1 1 120px', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><Send size={14}/> Email Proposta</button>}
                  {emp.status !== 'Aceitou' && emp.telefone && <a onClick={() => updateCampo(emp.id, 'proposta_enviada_em', new Date().toISOString())} href={getWhatsAppPropostaLink(emp)} target="_blank" className="btn-hover" style={{ flex: '1 1 120px', padding: '10px', background: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><MessageCircle size={14}/> WA Proposta</a>}
                  {(emp.status === 'Pendente' || emp.status === 'Em Análise') && emp.telefone && emp.proposta_enviada_em && <a href={getWhatsAppFollowUpLink(emp)} target="_blank" className="btn-hover" style={{ flex: '1 1 120px', padding: '10px', background: '#128C7E', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}><MessageCircle size={14}/> WA Follow-up</a>}
                  <button onClick={() => abrirModalEdicao(emp)} className="btn-hover" style={{ padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', flexShrink: 0 }}><PenTool size={16}/></button>
                  <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} className="btn-hover" style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', flexShrink: 0 }}><Trash2 size={16}/></button>
                </div>
              </div>
            );
          })}

          {/* LISTA DESKTOP E IPAD (Visível de 768px para cima) */}
          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="desktop-table">
            <table className="desktop-table">
              <thead style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left', fontSize: '13px' }}>
                <tr><th style={{ padding: '15px' }}>Parceiro</th><th style={{ padding: '15px' }}>Estado</th><th style={{ padding: '15px' }}>Gestão & Entregáveis</th><th style={{ padding: '15px', textAlign: 'right' }}>Ações Rápidas</th></tr>
              </thead>
              <tbody>
                {empresasFiltradas.map(emp => {
                  const escalao = getEscalao(emp.valor);
                  return (
                    <tr key={`desktop-${emp.id}`} style={{ borderTop: '1px solid #f1f5f9', background: emp.status === 'Aceitou' ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '15px', borderLeft: emp.status === 'Aceitou' ? `4px solid ${escalao.cor}` : '4px solid transparent', width: '25%', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>{emp.nome} {emp.status === 'Aceitou' && escalao.icon}</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.email || 'S/ Email'} <br/> {emp.telefone}</div>
                        {emp.notas && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', fontStyle: 'italic' }}>{emp.notas.length > 50 ? emp.notas.substring(0, 50) + '…' : emp.notas}</div>}
                      </td>
                      <td style={{ padding: '15px', width: '20%', verticalAlign: 'top' }}>
                        <select value={emp.status} onChange={(e) => updateCampo(emp.id, 'status', e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', outline: 'none', background: getStatusColor(emp.status), width: '100%' }}>
                          <option value="Pendente">⏳ Pendente</option><option value="Em Análise">🤔 Em Análise</option><option value="Aceitou">✅ Aceitou</option><option value="Recusou">❌ Recusou</option>
                        </select>
                        {emp.proposta_enviada_em && <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '5px' }}>✓ Proposta Enviada</div>}
                      </td>
                      <td style={{ padding: '15px', width: '35%', verticalAlign: 'top' }}>
                        {emp.status === 'Aceitou' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                              <input type="number" placeholder="€" defaultValue={emp.valor || ''} onBlur={(e) => { if (e.target.value !== String(emp.valor || '')) updateCampo(emp.id, 'valor', e.target.value); }} key={emp.id + '_valor'} style={{ width: '90px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                              <span style={{fontSize: '13px', fontWeight: 'bold', color: escalao.cor}}>{escalao.nome}</span>
                            </div>
                            <label className="task-checkbox" style={{ color: emp.recibo_enviado ? '#10b981' : '#ef4444' }}><input type="checkbox" checked={emp.recibo_enviado} onChange={(e) => updateCampo(emp.id, 'recibo_enviado', e.target.checked)} /> Recibo Emitido</label>
                            <label className="task-checkbox" style={{ color: emp.logo_recebido ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.logo_recebido} onChange={(e) => updateCampo(emp.id, 'logo_recebido', e.target.checked)} /> Logo Recebido</label>
                            <label className="task-checkbox" style={{ color: emp.redes_sociais ? '#10b981' : '#64748b' }}><input type="checkbox" checked={emp.redes_sociais} onChange={(e) => updateCampo(emp.id, 'redes_sociais', e.target.checked)} /> Post Publicado</label>
                            
                            {/* ESTE ERA O BOTÃO QUE FALTAVA NO IPAD/PC! */}
                            <button onClick={() => enviarBoasVindas(emp)} className="btn-hover" style={{ width: '100%', padding: '10px', marginTop: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><Mail size={15}/> Pedir NIF & Logo</button>
                          </div>
                        ) : <span style={{color: '#cbd5e1'}}>-</span>}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', width: '20%', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', maxWidth: '160px', marginLeft: 'auto' }}>
                          {emp.status !== 'Aceitou' && emp.email && <button onClick={() => enviarProposta(emp)} className="btn-hover" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Enviar Email da Proposta"><Send size={16}/></button>}
                          {emp.status !== 'Aceitou' && emp.telefone && <a onClick={() => updateCampo(emp.id, 'proposta_enviada_em', new Date().toISOString())} href={getWhatsAppPropostaLink(emp)} target="_blank" className="btn-hover" style={{ padding: '10px', background: '#25D366', color: 'white', textDecoration: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="WhatsApp"><MessageCircle size={16}/></a>}
                          <button onClick={() => abrirModalEdicao(emp)} className="btn-hover" style={{ padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Editar Completamente"><PenTool size={16}/></button>
                          <button onClick={() => eliminarEmpresa(emp.id, emp.nome)} className="btn-hover" style={{ padding: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Eliminar"><Trash2 size={16}/></button>
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

      {/* === ABA 2: RELATÓRIOS PREMIUM === */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: TEXT_PRIMARY }}><BarChart3 size={24} color={PRIMARY_COLOR}/> Resumo Financeiro & Operacional</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={exportToCSV} className="btn-hover" style={{ padding: '10px 20px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Download size={16}/> Excel (.csv)</button>
              <button onClick={() => window.print()} className="btn-hover" style={{ padding: '10px 20px', background: TEXT_PRIMARY, color: PRIMARY_COLOR, border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}><Printer size={16}/> Salvar PDF</button>
            </div>
          </div>

          <div className="responsive-grid">
            <div className="dash-box" style={{ borderLeft: `5px solid ${PRIMARY_COLOR}` }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><Target size={16}/> Fundo Angariado</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: TEXT_PRIMARY, margin: '5px 0' }}>{angariado}€</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>Meta: <input type="number" value={objetivo} onChange={(e) => handleMetaChange(e.target.value)} style={{ width: '70px', padding: '2px 5px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc', fontWeight: 'bold' }}/> €</span>
                <strong>{((angariado/objetivo)*100 || 0).toFixed(0)}%</strong>
              </div>
              <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}><div style={{ width: `${Math.min((angariado/objetivo)*100, 100)}%`, background: PRIMARY_COLOR, height: '100%' }}></div></div>
            </div>

            <div className="dash-box" style={{ borderLeft: '5px solid #3b82f6' }}>
              <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><TrendingUp size={16}/> Ticket Médio</div>
              <div style={{ fontSize: '38px', fontWeight: '900', color: '#3b82f6', margin: '5px 0' }}>{valorMedio}€</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Valor médio recebido por parceiro</div>
            </div>

            <div className="dash-box" style={{ borderLeft: '5px solid #10b981', background: 'linear-gradient(to right, #ffffff, #f0fdf4)' }}>
              <div style={{ color: '#166534', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}><Crown size={16}/> Top Sponsor</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d', margin: '5px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topSponsor.nome !== '-' ? topSponsor.nome : 'Ainda sem apoios'}</div>
              <div style={{ fontSize: '15px', color: '#166534', fontWeight: 'bold' }}>{topSponsor.valor > 0 ? `${topSponsor.valor}€ angariados` : '-'}</div>
            </div>
          </div>

          <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="dash-box">
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: '8px' }}><Filter size={18} color="#64748b"/> Funil de Negociação (Fecho: {empresas.length > 0 ? ((totalAceites / empresas.length) * 100).toFixed(0) : 0}%)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#64748b'}}>⏳ Pendentes / Frios</span> <span>{countPendentes}</span></div><div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${(countPendentes/empresas.length)*100 || 0}%`, background: '#cbd5e1', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#f59e0b'}}>🤔 Em Análise / Quentes</span> <span>{countAnalise}</span></div><div style={{ background: '#fef3c7', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${(countAnalise/empresas.length)*100 || 0}%`, background: '#f59e0b', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#10b981'}}>✅ Fechados (Aceites)</span> <span>{totalAceites}</span></div><div style={{ background: '#dcfce7', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${(totalAceites/empresas.length)*100 || 0}%`, background: '#10b981', height: '100%' }}></div></div></div>
                <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}><span style={{color: '#ef4444'}}>❌ Recusados</span> <span>{countRecusados}</span></div><div style={{ background: '#fee2e2', height: '10px', borderRadius: '5px', overflow: 'hidden' }}><div style={{ width: `${(countRecusados/empresas.length)*100 || 0}%`, background: '#ef4444', height: '100%' }}></div></div></div>
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
                        <div><div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '14px' }}>{emp.nome}</div><div style={{ fontSize: '11px', color: '#ef4444' }}>Para: {new Date(emp.data_followup).toLocaleDateString('pt-PT')}</div></div>
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

      {/* === ABA 3: CAMPANHAS DE EMAIL === */}
      {tab === 'broadcast' && (() => {
        let alvosPreview = [];
        if (bDestinatarios === 'aceites') alvosPreview = empresas.filter(e => e.status === 'Aceitou');
        if (bDestinatarios === 'pendentes') alvosPreview = empresas.filter(e => e.status === 'Pendente' || e.status === 'Em Análise');
        if (bDestinatarios === 'todos') alvosPreview = empresas;
        const comEmail = alvosPreview.filter(e => e.email && e.email.includes('@'));
        const semEmail = alvosPreview.length - comEmail.length;

        const tipoConfig = {
          novidade:      { icon: '🗞️', label: 'Novidade',      cor: '#3b82f6', bg: '#eff6ff' },
          resultado:     { icon: '🏆', label: 'Resultado',      cor: '#eab308', bg: '#fefce8' },
          agradecimento: { icon: '💛', label: 'Agradecimento',  cor: '#10b981', bg: '#f0fdf4' },
          urgente:       { icon: '⚡', label: 'Urgente',        cor: '#ef4444', bg: '#fff1f2' },
        };
        const tc = tipoConfig[bTipoCampanha] || tipoConfig.novidade;

        return (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '860px', margin: '0 auto' }}>

          {/* ── CABEÇALHO ESTATÍSTICAS ── */}
          <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)', padding: '26px 28px', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#d4af37', display: 'flex', alignItems: 'center', gap: '10px' }}><Send size={22}/> Centro de Comunicação</h2>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Mantém os teus parceiros a par de cada passo rumo a Dublin 🇮🇪</p>
            </div>
            <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
              {[
                { val: historico.length, label: 'Campanhas' },
                { val: historico.reduce((s,h) => s+(h.total_destinatarios||0), 0), label: 'Emails Enviados' },
                { val: empresas.filter(e => e.status==='Aceitou' && e.email).length, label: 'Parceiros Ativos' },
              ].map(({val, label}) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#d4af37' }}>{val}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── PASSO 1: TIPO ── */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '12px', fontSize: '14px' }}>1️⃣ Tipo de comunicação</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {Object.entries(tipoConfig).map(([key, cfg]) => (
                <button key={key} onClick={() => aplicarTemplate(key)}
                  style={{ padding: '13px 8px', borderRadius: '10px', border: `2px solid ${bTipoCampanha===key ? cfg.cor : '#e2e8f0'}`, background: bTipoCampanha===key ? cfg.bg : 'white', cursor: 'pointer', textAlign: 'center', fontWeight: bTipoCampanha===key ? 'bold' : 'normal' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{cfg.icon}</div>
                  <div style={{ fontSize: '12px', color: bTipoCampanha===key ? cfg.cor : '#64748b', fontWeight: 'bold' }}>{cfg.label}</div>
                  {bTipoCampanha===key && <div style={{ fontSize: '10px', color: cfg.cor, marginTop: '2px' }}>● Ativo</div>}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>💡 Clica num tipo para preencher o texto automaticamente.</div>
          </div>

          {/* ── PASSO 2: TEXTO ── */}
          <div style={{ background: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `2px solid ${tc.cor}22` }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '16px', fontSize: '14px' }}>2️⃣ Assunto e mensagem</div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '7px', color: '#334155', fontSize: '13px' }}>📌 Assunto <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" value={bAssunto} onChange={e => setBAssunto(e.target.value)}
                placeholder="Ex: 🥇 Conquistámos o pódio no Nacional!"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '7px', color: '#334155', fontSize: '13px' }}>
                <span>✍️ Mensagem <span style={{ color: '#ef4444' }}>*</span></span>
                <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>{bMensagem.length} caract.</span>
              </label>
              <textarea value={bMensagem} onChange={e => setBMensagem(e.target.value)} rows="8"
                placeholder="Conta a história, partilha os resultados, agradece o apoio dos parceiros..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '9px', border: '1.5px solid #e2e8f0', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.65', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* ── PASSO 3: FOTOS ── */}
          <div style={{ background: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px', fontSize: '14px' }}>3️⃣ Fotografias</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>As tuas fotos pessoais, fotos da escola, momentos de treino e competição. Podes fazer upload ou colar um link do Google Fotos / Drive / Instagram.</div>

            {bFotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                {bFotos.map((f, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={f.url} alt={`foto ${idx+1}`} style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #d4af37' }} onError={e => e.target.style.opacity='0.3'} />
                    <button onClick={() => removerFoto(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', border: '2px solid white', borderRadius: '50%', width: '20px', height: '20px', color: 'white', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                  </div>
                ))}
                <label className="btn-hover" style={{ width: '88px', height: '88px', borderRadius: '8px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', fontSize: '11px', gap: '4px' }}>
                  <UploadCloud size={18}/> + Fotos
                  <input type="file" accept="image/*" multiple onChange={uploadFotosDiretas} style={{ display: 'none' }} disabled={uploadingFotos} />
                </label>
              </div>
            )}

            {bFotos.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="btn-hover" style={{ background: '#1a1a1a', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: uploadingFotos ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', alignSelf: 'flex-start' }}>
                  <UploadCloud size={15}/> {uploadingFotos ? 'A carregar...' : 'Upload de fotos do dispositivo'}
                  <input type="file" accept="image/*" multiple onChange={uploadFotosDiretas} style={{ display: 'none' }} disabled={uploadingFotos} />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>OU COLA UM LINK DE FOTO</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={bFoto} onChange={e => setBFoto(e.target.value)}
                    placeholder="https://... (Google Fotos, Drive, Instagram, Supabase...)"
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    onKeyDown={e => { if (e.key === 'Enter' && bFoto.trim()) { setBFotos(prev => [...prev, { url: bFoto.trim(), fileName: null }]); setBFoto(''); }}}
                  />
                  <button onClick={() => { if (bFoto.trim()) { setBFotos(prev => [...prev, { url: bFoto.trim(), fileName: null }]); setBFoto(''); }}}
                    style={{ padding: '10px 14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                    + Adicionar
                  </button>
                </div>
                {bFoto && <img src={bFoto} alt="preview" style={{ maxHeight: '140px', borderRadius: '8px', border: '2px solid #d4af37', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />}
              </div>
            )}
          </div>

          {/* ── PASSO 4: VÍDEOS ── */}
          <div style={{ background: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px', fontSize: '14px' }}>4️⃣ Vídeos</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Os teus vídeos de treino, competição ou mensagens pessoais. Podes fazer upload direto, colar um link do YouTube/Instagram/TikTok, ou um link do Google Drive.</div>

            {bVideos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {bVideos.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '20px' }}>{v.tipo.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1a1a1a' }}>{v.descricao}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.tipo.nome} • {v.url}</div>
                    </div>
                    <a href={v.url} target="_blank" style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none', flexShrink: 0 }}>Ver</a>
                    <button onClick={() => removerVideo(idx)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Upload de ficheiro de vídeo */}
              <label className="btn-hover" style={{ background: uploadingVideo ? '#94a3b8' : '#7c3aed', color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: uploadingVideo ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', alignSelf: 'flex-start' }}>
                <UploadCloud size={15}/> {uploadingVideo ? 'A carregar vídeo...' : 'Upload de vídeo do dispositivo'}
                <input type="file" accept="video/*" onChange={uploadVideoFicheiro} style={{ display: 'none' }} disabled={uploadingVideo} />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>OU COLA UM LINK</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="text" value={bVideoInput} onChange={e => setBVideoInput(e.target.value)}
                  placeholder="YouTube, Instagram, TikTok, Google Drive..."
                  style={{ flex: 2, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <input type="text" value={bVideoDesc} onChange={e => setBVideoDesc(e.target.value)}
                  placeholder="Descrição (ex: Treino de sábado)"
                  style={{ flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <button onClick={adicionarVideo}
                  style={{ padding: '10px 14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                  + Adicionar
                </button>
              </div>

              <div style={{ background: '#f0f9ff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold', marginBottom: '4px' }}>💡 Como partilhar vídeos do Google Drive</div>
                <div style={{ fontSize: '11px', color: '#0284c7', lineHeight: '1.5' }}>
                  Drive → clica no vídeo → ⋮ → "Obter link" → "Qualquer pessoa com o link pode ver" → copia o link e cola aqui.
                </div>
              </div>
            </div>
          </div>

          {/* ── PASSO 5: REDES SOCIAIS ── */}
          <div style={{ background: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px', fontSize: '14px' }}>5️⃣ Posts das Redes Sociais da Escola</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>Cola aqui links de posts do Instagram ou Facebook da Flash Li Dance School que queiras incluir no email — os patrocinadores verão o link com uma descrição.</div>

            {bLinksRS.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {bLinksRS.map((rs, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '20px' }}>{rs.tipo.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1a1a1a' }}>{rs.descricao}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rs.tipo.nome} • {rs.url}</div>
                    </div>
                    <a href={rs.url} target="_blank" style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none', flexShrink: 0 }}>Ver</a>
                    <button onClick={() => removerLinkRS(idx)} style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input type="text" value={bLinkRSInput} onChange={e => setBLinkRSInput(e.target.value)}
                placeholder="Link do post (Instagram, Facebook, YouTube...)"
                style={{ flex: 2, minWidth: '200px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <input type="text" value={bLinkRSDesc} onChange={e => setBLinkRSDesc(e.target.value)}
                placeholder="Descrição (ex: Post do pódio nacional)"
                style={{ flex: 1, minWidth: '140px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <button onClick={adicionarLinkRS}
                style={{ padding: '10px 14px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                + Adicionar
              </button>
            </div>
          </div>

          {/* ── PASSO 6: DESTINATÁRIOS E ENVIO ── */}
          <div style={{ background: 'white', padding: '22px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '2px solid #1a1a1a' }}>
            <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '14px', fontSize: '14px' }}>6️⃣ Destinatários e envio</div>
            <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
              <select value={bDestinatarios} onChange={e => { setBDestinatarios(e.target.value); setResultadoEnvio(null); }}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #86efac', background: 'white', fontWeight: 'bold', color: '#15803d', fontSize: '14px', marginBottom: '10px' }}>
                <option value="aceites">🏆 Parceiros Oficiais (Aceites) — {empresas.filter(e => e.status==='Aceitou').length} contactos</option>
                <option value="pendentes">⏳ Pendentes + Em Análise — {empresas.filter(e => e.status==='Pendente' || e.status==='Em Análise').length} contactos</option>
                <option value="todos">🌍 Todos os contactos — {empresas.length} no total</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>✉️ {comEmail.length} receberão o email</span>
                {semEmail > 0 && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>⚠️ {semEmail} sem email</span>}
                {bFotos.length > 0 && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>📸 {bFotos.length} foto(s)</span>}
                {bVideos.length > 0 && <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>🎬 {bVideos.length} vídeo(s)</span>}
                {bLinksRS.length > 0 && <span style={{ background: '#fdf4ff', color: '#a21caf', padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>📱 {bLinksRS.length} post(s)</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => setShowPreview(!showPreview)} className="btn-hover"
                style={{ flex: '1 1 130px', padding: '14px', background: '#f1f5f9', color: '#334155', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                👁️ {showPreview ? 'Fechar Preview' : 'Pré-visualizar Email'}
              </button>
              <button onClick={enviarBroadcast} disabled={enviando || comEmail.length === 0} className="btn-hover"
                style={{ flex: '2 1 220px', padding: '14px', background: enviando ? '#94a3b8' : '#1a1a1a', color: '#d4af37', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: enviando || comEmail.length===0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: comEmail.length===0 ? 0.5 : 1 }}>
                {enviando ? '⏳ A enviar...' : <><Send size={18}/> Enviar para {comEmail.length} parceiro(s)</>}
              </button>
            </div>
          </div>

          {/* ── PREVIEW DO EMAIL ── */}
          {showPreview && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `2px dashed ${tc.cor}` }}>
              <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '16px', fontSize: '14px' }}>👁️ Preview — como o parceiro verá o email</div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                {/* Header */}
                <div style={{ background: '#1a1a1a', padding: '22px', textAlign: 'center', borderBottom: '4px solid #d4af37' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Flash Li Dance School</div>
                  <div style={{ color: 'white', fontWeight: '900', fontSize: '18px' }}>Diário de Bordo 🇮🇪</div>
                  <div style={{ color: '#d4af37', fontSize: '12px', marginTop: '4px' }}>Dublin 2026 — DWCup</div>
                </div>
                {/* Badge tipo */}
                <div style={{ background: tc.bg, padding: '8px 24px', borderBottom: `1px solid ${tc.cor}22` }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: tc.cor }}>{tc.icon} {tc.label}</span>
                </div>
                {/* Corpo */}
                <div style={{ padding: '24px', background: 'white' }}>
                  <div style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '17px', marginBottom: '14px' }}>
                    {bAssunto || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>(sem assunto)</span>}
                  </div>
                  <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 8px 0' }}>Estimado(a) parceiro(a) da <strong>[Nome da Empresa]</strong>,</p>
                  <div style={{ background: '#f8fafc', borderLeft: '4px solid #d4af37', padding: '14px 16px', margin: '14px 0', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#1a1a1a', borderRadius: '0 8px 8px 0' }}>
                    {bMensagem || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(sem mensagem)</span>}
                  </div>
                  {/* Fotos preview */}
                  {bFotos.length > 0 && (
                    <div style={{ margin: '14px 0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📸 Galeria</div>
                      <div style={{ display: 'grid', gridTemplateColumns: bFotos.length===1 ? '1fr' : 'repeat(2,1fr)', gap: '6px' }}>
                        {bFotos.map((f, i) => <img key={i} src={f.url} style={{ width: '100%', borderRadius: '6px', objectFit: 'cover', maxHeight: bFotos.length===1 ? '260px' : '130px' }} onError={e => e.target.style.display='none'} />)}
                      </div>
                    </div>
                  )}
                  {/* Vídeos preview */}
                  {bVideos.length > 0 && (
                    <div style={{ margin: '16px 0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎬 Vídeos</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {bVideos.map((v, i) => (
                          <a key={i} href={v.url} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f5f3ff', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', border: '1px solid #e9d5ff' }}>
                            <span style={{ fontSize: '22px' }}>{v.tipo.icon}</span>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '14px' }}>{v.descricao}</div>
                              <div style={{ fontSize: '11px', color: '#a78bfa' }}>Clica para ver · {v.tipo.nome}</div>
                            </div>
                            <span style={{ marginLeft: 'auto', background: '#7c3aed', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>▶ Ver</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Redes sociais preview */}
                  {bLinksRS.length > 0 && (
                    <div style={{ margin: '16px 0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📱 Redes Sociais da Flash Li</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {bLinksRS.map((rs, i) => (
                          <a key={i} href={rs.url} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fdf4ff', padding: '12px 16px', borderRadius: '8px', textDecoration: 'none', border: '1px solid #f0abfc' }}>
                            <span style={{ fontSize: '22px' }}>{rs.tipo.icon}</span>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#a21caf', fontSize: '14px' }}>{rs.descricao}</div>
                              <div style={{ fontSize: '11px', color: '#c026d3' }}>{rs.tipo.nome} · Clica para ver</div>
                            </div>
                            <span style={{ marginLeft: 'auto', background: '#a21caf', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>Ver Post</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Barra de progresso */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', margin: '18px 0 14px 0', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>📊 A nossa jornada para Dublin</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>Meta de angariação</span>
                      <span style={{ fontSize: '12px', color: '#1a1a1a', fontWeight: 'bold' }}>{angariado.toLocaleString('pt-PT')}€ / {objetivo.toLocaleString('pt-PT')}€</span>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((angariado/objetivo)*100, 100)}%`, background: 'linear-gradient(90deg,#d4af37,#f0cc60)', height: '100%', borderRadius: '999px' }}></div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '5px' }}>{((angariado/objetivo)*100).toFixed(0)}% atingido • {totalAceites} parceiro(s) a bordo</div>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', color: '#64748b', fontSize: '13px' }}>
                    Com os melhores cumprimentos,<br/><strong style={{ color: '#1a1a1a' }}>Hugo Mota</strong><br/><span style={{ fontSize: '11px' }}>Gestão de Patrocínios — Flash Li Dance School</span>
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Flash Li Dance School • Dublin 2026 🇮🇪</div>
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTADO ── */}
          {resultadoEnvio && (
            <div style={{ background: resultadoEnvio.falhados.length>0 ? '#fffbeb' : '#f0fdf4', padding: '20px', borderRadius: '12px', border: `1.5px solid ${resultadoEnvio.falhados.length>0 ? '#fcd34d' : '#4ade80'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#334155', fontSize: '15px' }}>📊 Resultado do envio</h3>
                <button onClick={() => setResultadoEnvio(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '5px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>✅ {resultadoEnvio.enviados} enviados</span>
                {resultadoEnvio.falhados.length>0 && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '5px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>❌ {resultadoEnvio.falhados.length} falhados</span>}
              </div>
              {resultadoEnvio.falhados.length>0 && <div style={{ marginTop: '10px' }}>{resultadoEnvio.falhados.map((f,i) => <div key={i} style={{ fontSize: '12px', color: '#7f1d1d', background: '#fee2e2', padding: '5px 10px', borderRadius: '6px', marginBottom: '3px' }}>{f}</div>)}</div>}
            </div>
          )}

          {/* ── LINHA DO TEMPO ── */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '17px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🕰️ Histórico de Campanhas
                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'normal' }}>{historico.length}</span>
              </h3>
              {historico.length > 0 && <div style={{ fontSize: '13px', color: '#64748b' }}>Total: <strong>{historico.reduce((s,h) => s+(h.total_destinatarios||0), 0)}</strong> emails</div>}
            </div>
            {historico.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '38px', marginBottom: '10px' }}>📭</div>
                <div style={{ fontStyle: 'italic' }}>O histórico aparecerá aqui após o primeiro envio.</div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '18px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom,#d4af37,#e2e8f0)', borderRadius: '1px' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {historico.map((item, i) => (
                    <div key={item.id||i} style={{ display: 'flex', gap: '16px', paddingBottom: '14px' }}>
                      <div style={{ flexShrink: 0, width: '38px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: i===0 ? '#d4af37' : 'white', border: `3px solid ${i===0 ? '#d4af37' : '#e2e8f0'}`, marginTop: '13px', zIndex: 1 }}></div>
                      </div>
                      <div style={{ flex: 1, background: i===0 ? '#fffdf0' : '#f8fafc', borderRadius: '12px', padding: '14px', border: `1px solid ${i===0 ? '#d4af37' : '#e2e8f0'}`, cursor: 'pointer' }}
                        onClick={() => setHistoricoExpandido(historicoExpandido===item.id ? null : item.id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#1a1a1a', fontSize: '14px', marginBottom: '3px' }}>{item.assunto}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>📅 {new Date(item.created_at).toLocaleDateString('pt-PT', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>✉️ {item.total_destinatarios}</span>
                            {item.foto_url && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: '12px', fontSize: '11px' }}>📸</span>}
                            {item.video_url && <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '2px 7px', borderRadius: '12px', fontSize: '11px' }}>🎬</span>}
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{historicoExpandido===item.id ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {historicoExpandido===item.id && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                            <div style={{ background: 'white', borderLeft: '3px solid #d4af37', padding: '10px 13px', borderRadius: '0 8px 8px 0', fontSize: '13px', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                              {item.mensagem}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {item.foto_url && <a href={item.foto_url} target="_blank" style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 'bold', textDecoration: 'none' }}>📸 Ver foto</a>}
                              {item.video_url && <a href={item.video_url} target="_blank" style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 'bold', textDecoration: 'none' }}>🎬 Ver vídeo</a>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
        );
      })()}

      {/* === ABA 4: MURAL DE HONRA === */}
      {tab === 'mural' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center', borderTop: `6px solid ${PRIMARY_COLOR}` }}>
            <h2 style={{ marginTop: 0, color: TEXT_PRIMARY, fontSize: '28px', fontWeight: '900' }}>🏆 Mural de Honra</h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>Um agradecimento especial aos visionários que acreditam e apoiam o talento da nossa juventude rumo a Dublin 2026.</p>
          </div>

          {parceirosDiamante.length > 0 && (
            <div>
              <h3 style={{ color: '#3b82f6', textAlign: 'center', margin: '0 0 15px 0', fontSize: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>💎 Parceiros Diamante</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                {parceirosDiamante.map(emp => (
                  <div key={emp.id} style={{ background: 'linear-gradient(to bottom, #ffffff, #eff6ff)', border: '2px solid #bfdbfe', borderRadius: '12px', padding: '20px', width: '250px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e3a8a' }}>{emp.nome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parceirosOuro.length > 0 && (
            <div>
              <h3 style={{ color: '#eab308', textAlign: 'center', margin: '20px 0 15px 0', fontSize: '22px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>🥇 Parceiros Ouro</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
                {parceirosOuro.map(emp => (
                  <div key={emp.id} style={{ background: 'linear-gradient(to bottom, #ffffff, #fefce8)', border: '2px solid #fef08a', borderRadius: '12px', padding: '15px', width: '220px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#854d0e' }}>{emp.nome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center', marginTop: '20px' }}>
            {parceirosPrata.length > 0 && (
              <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                <h3 style={{ color: '#94a3b8', textAlign: 'center', margin: '0 0 15px 0', fontSize: '18px' }}>🥈 Parceiros Prata</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {parceirosPrata.map(emp => (
                    <div key={emp.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 15px', textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#475569' }}>{emp.nome}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {parceirosApoiante.length > 0 && (
              <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
                <h3 style={{ color: '#b45309', textAlign: 'center', margin: '0 0 15px 0', fontSize: '18px' }}>🥉 Apoiantes Oficiais</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  {parceirosApoiante.map(emp => (
                    <div key={emp.id} style={{ background: 'white', border: '1px solid #ffedd5', borderRadius: '8px', padding: '10px 15px', textAlign: 'center' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#9a3412' }}>{emp.nome}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {totalAceites === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>O Mural de Honra ganhará vida assim que registares a primeira empresa como "Aceitou".</div>}
        </div>
      )}

      </>}
    </div>
  );
}
