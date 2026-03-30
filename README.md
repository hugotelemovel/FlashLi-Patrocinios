# 🏆 Flash Li CRM - Angariação DWCup 2026 (Dublin)

![Status](https://img.shields.io/badge/Status-Ativo_e_em_Produção-success)
![Versão](https://img.shields.io/badge/Versão-Ultimate_Enterprise-gold)
![Plataforma](https://img.shields.io/badge/Plataforma-Web_%26_Mobile-blue)

Uma aplicação **Full-Stack** (CRM + Sistema de Email Marketing) desenvolvida à medida para gerir a angariação de patrocínios da **Flash Li Dance School** rumo à **Dance World Cup 2026 em Dublin**.

Desenhada com uma filosofia *Mobile-First* e uma estética *Premium* (Preto e Dourado), a app permite gerir centenas de contactos, enviar propostas com 1 clique e manter os patrocinadores atualizados com um "Diário de Bordo" multimédia, usando o próprio Gmail do utilizador como motor de envio.

---

## ✨ Principais Funcionalidades

### 📊 1. Pipeline CRM Inteligente
* **Gestão de Estados:** Acompanhamento visual de empresas (⏳ Pendente, ✅ Aceitou, ❌ Recusou).
* **Escalões Mágicos Gamificados:** Atribuição automática de estatuto baseada no valor do patrocínio (🥉 Apoiante, 🥈 Prata, 🥇 Ouro, 💎 Diamante).
* **Follow-ups:** Sistema de datas para lembretes de chamadas/reuniões.
* **Filtros e Exportação:** Pesquisa em tempo real e botão de exportação de toda a base de dados para `.csv` (Excel) com um clique.

### ✅ 2. Gestão de Entregáveis (Pós-Venda)
Quando um patrocinador aceita, a app desbloqueia uma *Checklist* de marketing obrigatória:
1. Recibo Oficial Emitido?
2. Logotipo Recebido (para os equipamentos)?
3. Agradecimento nas Redes Sociais efetuado?

### 📈 3. Dashboard Analítico Avançado
* Cálculo automático do **Fundo Angariado** face ao objetivo estipulado.
* **Taxa de Conversão** (Contactos vs. Fechos).
* **Alertas Inteligentes (Vermelho/Laranja):** A app avisa ativamente se houver recibos por passar ou chamadas de follow-up atrasadas.

### 🚀 4. Motor de "Diário de Bordo" (Email Marketing)
* Envio de atualizações em massa **apenas para parceiros ativos**.
* **Upload Direto de Fotos:** Permite tirar uma foto no telemóvel e anexá-la diretamente ao corpo do email.
* **Auto-Destruição de Ficheiros (0% Cloud Storage):** A app envia a imagem para o Supabase, injeta o ficheiro via *Content-ID (CID)* dentro do email Gmail, e de seguida **apaga automaticamente a foto da nuvem** para poupar espaço, mantendo a foto visível para sempre no email do cliente!

---

## 🛠️ Stack Tecnológico

* **Frontend:** Next.js (React) / CSS Responsivo Nativo
* **Backend:** Next.js API Routes
* **Base de Dados:** Supabase (PostgreSQL)
* **Storage (Nuvem):** Supabase Storage Buckets
* **Motor de Envio (SMTP):** Nodemailer + Gmail (App Passwords)
* **Hosting:** Vercel

---

## ⚙️ Configuração e Instalação (Setup)

### 1. Variáveis de Ambiente (Vercel / `.env.local`)
Para a app funcionar, é necessário configurar as seguintes variáveis no Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=teu_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua_chave_anon_do_supabase
EMAIL_USER=o_teu_email@gmail.com
EMAIL_PASS=senha_de_app_gerada_no_gmail_de_16_letras

3. Supabase Storage (Gaveta de Fotos)
Foi criado um Bucket no Supabase com as seguintes características:

Nome: fotos

Tipo: Public (Para permitir a pré-visualização no envio)

Limpeza: Gerida automaticamente pela própria aplicação após o envio de cada Broadcast.

📱 Interface Mobile & Desktop
O design da aplicação utiliza CSS Injection Nativo para garantir uma transição perfeita:

No Desktop: Apresenta uma tabela de CRM profissional e expandida.

No Mobile (iPhone/Android): Transforma-se num sistema de Cards (Cartões) elegantes, com inputs táteis otimizados e botões fáceis de clicar em andamento.

Desenvolvido com foco total na angariação eficiente e na relação transparente com os patrocinadores. 🌍🇮🇪

By: Hugo_MOta
