// Garante que o DOM esteja pronto
document.addEventListener('DOMContentLoaded', function() {

    // --- CONSTANTES E ELEMENTOS GLOBAIS ---
    const LOCAL_STORAGE_KEY = 'garagemVirtualData_v3';
    let garagem = {}; // Objeto para armazenar instâncias

    // Elementos da UI
    const sidebarMenu = document.getElementById('sidebar-menu');
    const mainContent = document.getElementById('main-content');
    const welcomeMessage = document.getElementById('welcome-message');
    const appContainer = document.getElementById('app-container');
    const feedbackMessageDiv = document.getElementById('feedback-message'); // Div para feedback
    const addVeiculoFormContainer = document.getElementById('add-veiculo-form-container'); // Div do form de adição
    const addVeiculoForm = document.getElementById('add-veiculo-form'); // O formulário em si
    const addTipoSelect = document.getElementById('add-tipo'); // Select tipo no form add
    const addCapacidadeGroup = document.getElementById('add-caminhao-capacidade-group'); // Div capacidade
    const cancelAddVeiculoBtn = document.getElementById('cancel-add-veiculo'); // Botão cancelar

    // Seleciona containers de veículo existentes (pode ser vazio inicialmente se não houver HTML pré-definido)
    let veiculoContainers = mainContent.querySelectorAll('.veiculo-container');

    // Sons
    const sons = { buzina: new Audio('sons/buzina.mp3'), acelerar: new Audio('sons/acelerar.mp3'), frear: new Audio('sons/frear.mp3'), ligar: new Audio('sons/ligar.mp3'), desligar: new Audio('sons/desligar.mp3') };

    // --- FUNÇÕES DE FEEDBACK (Substitui alert) ---
    let feedbackTimeout;
    function mostrarFeedback(mensagem, tipo = 'info') { // tipos: info, success, warning, error
        if (!feedbackMessageDiv) return; // Sai se a div não existe

        clearTimeout(feedbackTimeout); // Limpa timeout anterior se houver

        feedbackMessageDiv.textContent = mensagem;
        // Define a classe baseado no tipo (controla a cor via CSS)
        feedbackMessageDiv.className = `feedback ${tipo}`; // Remove classes antigas e adiciona a nova
        feedbackMessageDiv.style.display = 'block'; // Garante visibilidade

        // Esconde a mensagem após 5 segundos (5000 ms)
        feedbackTimeout = setTimeout(() => {
            feedbackMessageDiv.style.display = 'none';
            feedbackMessageDiv.textContent = '';
            feedbackMessageDiv.className = 'feedback'; // Limpa classes
        }, 5000);
    }

    // --- FUNÇÕES AUXILIARES (Manter as anteriores) ---
    function tocarSom(audioElement, volume = 0.5) { if (audioElement && typeof audioElement.play === 'function') { audioElement.currentTime = 0; audioElement.volume = volume; audioElement.play().catch(error => console.error("Erro som:", error)); } }
    function atualizarInfoVeiculo(idPrefix, dados) { for (const key in dados) { const elId = `${idPrefix}-${key}`; const el = document.getElementById(elId); if (el) { if (el.tagName === 'INPUT') el.value = dados[key]; else el.textContent = dados[key]; } } }
    function atualizarStatusVeiculo(idPrefix, ligado, velocidade = 0) { const elId = `${idPrefix}-status`; const el = document.getElementById(elId); if (el) { let txt = 'Desligado'; let cls = 'status-desligado'; if (idPrefix === 'bicicleta') { txt = velocidade > 0 ? "Pedalando" : "Parada"; cls = 'status-parada'; } else { if (ligado) { txt = "Ligado"; cls = 'status-ligado'; } } el.className = ''; el.classList.add(cls); el.textContent = txt; } }
    function animarVeiculo(idPrefix, acaoCss) { const imgId = `${idPrefix}-img`; const img = document.getElementById(imgId); if (img) { img.classList.remove('acelerando', 'freando'); if (acaoCss) { img.classList.add(acaoCss); setTimeout(() => { if (img) img.classList.remove(acaoCss); }, 300); } } }
    function atualizarEstadoBotoes(veiculo) { if (!veiculo) return; const p = veiculo.getIdPrefix(); const c = document.getElementById(`${p}-container`); if (!c) return; const bL = c.querySelector(`button[data-acao="ligar"]`), bD = c.querySelector(`button[data-acao="desligar"]`), bA = c.querySelector(`button[data-acao="acelerar"]`), bP = c.querySelector(`button[data-acao="pedalar"]`), bF = c.querySelector(`button[data-acao="frear"]`), bAT = c.querySelector(`button[data-acao="ativarTurbo"]`), bDT = c.querySelector(`button[data-acao="desativarTurbo"]`); const li = veiculo.ligado, pa = veiculo.velocidade === 0; if (bL) bL.disabled = (p === 'bicicleta') ? true : li; if (bD) bD.disabled = (p === 'bicicleta') ? true : (!li || !pa); if (bA) bA.disabled = !li; if (bP) bP.disabled = false; if (bF) bF.disabled = pa; if (veiculo instanceof CarroEsportivo) { const tA = veiculo.turboAtivado; if (bAT) bAT.disabled = !li || tA; if (bDT) bDT.disabled = !tA; } }

    // --- CLASSES (Manter todas como estavam antes) ---
    class Manutencao { constructor(d, t, c, ds = '') { this.data = d ? new Date(d.replace('T', ' ')) : new Date('invalid'); this.tipo = t ? t.trim() : ''; this.custo = parseFloat(c); if (isNaN(this.custo) || this.custo < 0) this.custo = 0; this.descricao = ds ? ds.trim() : ''; this.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5); } validar() { const e = []; if (isNaN(this.data.getTime())) e.push("Data/Hora inválida."); if (!this.tipo) e.push("Tipo obrigatório."); if (isNaN(this.custo) || this.custo < 0) e.push("Custo inválido."); return { valido: e.length === 0, erros: e }; } formatarParaHistorico() { const dF = !isNaN(this.data.getTime()) ? this.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data Inv.'; const cF = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); let t = `${this.tipo} em ${dF} - ${cF}`; if (this.descricao) t += ` (${this.descricao})`; return t; } formatarParaAgendamento() { const dhF = !isNaN(this.data.getTime()) ? this.data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data/Hora Inv.'; const cF = this.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); let t = `${this.tipo} p/ ${dhF} - ${cF}`; if (this.descricao) t += ` (${this.descricao})`; return t; } toJSON() { return { data: !isNaN(this.data.getTime()) ? this.data.toISOString() : null, tipo: this.tipo, custo: this.custo, descricao: this.descricao, id: this.id }; } static fromJSON(j) { if (!j || !j.tipo) return null; const m = new Manutencao(j.data, j.tipo, j.custo, j.descricao); m.id = j.id || m.id; return m; } }
    class Veiculo { constructor(m, c) { if (this.constructor === Veiculo) throw new Error("Classe abstrata."); this.modelo = m; this.cor = c; this.ligado = false; this.velocidade = 0; this.historicoManutencao = []; this._setTipoEIdPrefix(m); } _setTipoEIdPrefix(m) { const c = this.constructor.name.toLowerCase(); switch (c) { case 'carro': this.tipo = 'carro'; this.idPrefix = 'carro'; break; case 'carroesportivo': this.tipo = 'esportivo'; this.idPrefix = 'esportivo'; break; case 'caminhao': this.tipo = 'caminhao'; this.idPrefix = 'caminhao'; break; case 'moto': this.tipo = 'moto'; this.idPrefix = 'moto'; break; case 'bicicleta': this.tipo = 'bicicleta'; this.idPrefix = 'bicicleta'; break; default: this.tipo = c; this.idPrefix = c; } this.id = `${this.tipo}_${(m || '').replace(/\s+/g, '_').toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`; } getTipo() { return this.tipo; } getIdPrefix() { return this.idPrefix; } atualizarEstadoBotoesWrapper() { atualizarEstadoBotoes(this); } ligar() { if (!this.ligado) { this.ligado = true; tocarSom(sons.ligar); this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } else { mostrarFeedback(`${this.modelo} já ligado!`, 'warning'); } } desligar() { if (this.ligado) { if (this.velocidade > 0) { mostrarFeedback(`${this.modelo} precisa parar!`, 'warning'); return; } this.ligado = false; this.velocidade = 0; tocarSom(sons.desligar); this.atualizarStatus(); this.atualizarVelocidade(); this.atualizarEstadoBotoesWrapper(); } else { mostrarFeedback(`${this.modelo} já desligado!`, 'warning'); } } acelerarBase() { if (!this.ligado) { mostrarFeedback(`Ligue ${this.modelo} antes!`, 'warning'); return false; } return true; } frearBase() { if (this.velocidade <= 0) return false; return true; } acelerar() { } frear() { } atualizarVelocidade() { atualizarInfoVeiculo(this.getIdPrefix(), { velocidade: this.velocidade }); } atualizarStatus() { atualizarStatusVeiculo(this.getIdPrefix(), this.ligado, this.velocidade); } buzinar() { tocarSom(sons.buzina); } adicionarManutencao(mO) { if (!(mO instanceof Manutencao)) { mostrarFeedback("Erro interno: Obj manut. inválido.", 'error'); return false; } const v = mO.validar(); if (!v.valido) { mostrarFeedback(`Erro dados manutenção:\n- ${v.erros.join('\n- ')}`, 'error'); return false; } this.historicoManutencao.push(mO); this.historicoManutencao.sort((a, b) => b.data.getTime() - a.data.getTime()); salvarGaragem(); this.atualizarDisplayManutencao(); return true; } getManutencoesSeparadas() { const a = new Date(); const h = [], g = []; if (!Array.isArray(this.historicoManutencao)) this.historicoManutencao = []; this.historicoManutencao.forEach(m => { if (m instanceof Manutencao && m.data && !isNaN(m.data.getTime())) { if (m.data <= a) h.push(m); else g.push(m); } }); g.sort((x, y) => x.data.getTime() - y.data.getTime()); return { historicoPassado: h, agendamentosFuturos: g }; } atualizarDisplayManutencao() { const p = this.getIdPrefix(); const hL = document.getElementById(`${p}-historico-lista`); const aL = document.getElementById(`${p}-agendamentos-lista`); if (!hL || !aL) return; const { historicoPassado, agendamentosFuturos } = this.getManutencoesSeparadas(); const pop = (ul, li, msg, fn) => { ul.innerHTML = ''; if (li.length === 0) ul.innerHTML = `<li>${msg}</li>`; else li.forEach(i => { const l = document.createElement('li'); l.textContent = fn(i); ul.appendChild(l); }); }; pop(hL, historicoPassado, "Nenhum registro.", m => m.formatarParaHistorico()); pop(aL, agendamentosFuturos, "Nenhum agendamento.", m => m.formatarParaAgendamento()); } removerManutencao(id) { const i = this.historicoManutencao.findIndex(m => m.id === id); if (i > -1) { this.historicoManutencao.splice(i, 1); salvarGaragem(); this.atualizarDisplayManutencao(); return true; } return false; } }
    class Carro extends Veiculo { acelerar() { if (!this.acelerarBase()) return; this.velocidade += 10; tocarSom(sons.acelerar, 0.5); animarVeiculo(this.getIdPrefix(), 'acelerando'); this.atualizarVelocidade(); this.atualizarEstadoBotoesWrapper(); } frear() { if (!this.frearBase()) return; this.velocidade = Math.max(0, this.velocidade - 10); tocarSom(sons.frear, 0.5); animarVeiculo(this.getIdPrefix(), 'freando'); this.atualizarVelocidade(); if (this.velocidade === 0) this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } }
    class CarroEsportivo extends Carro { constructor(m, c) { super(m, c); this.turboAtivado = false; } ativarTurbo() { if (!this.ligado) { mostrarFeedback("Ligue o carro!", 'warning'); return; } if (!this.turboAtivado) { this.turboAtivado = true; this.atualizarTurbo(); mostrarFeedback("Turbo ATIVADO!", 'info'); this.atualizarEstadoBotoesWrapper(); } else { mostrarFeedback("Turbo já ativado!", 'warning'); } } desativarTurbo() { if (this.turboAtivado) { this.turboAtivado = false; this.atualizarTurbo(); mostrarFeedback("Turbo desativado.", 'info'); this.atualizarEstadoBotoesWrapper(); } else { mostrarFeedback("Turbo já desativado!", 'warning'); } } acelerar() { if (!this.acelerarBase()) return; const i = 15 + (this.turboAtivado ? 35 : 0); this.velocidade += i; tocarSom(sons.acelerar, this.turboAtivado ? 0.8 : 0.6); animarVeiculo(this.getIdPrefix(), 'acelerando'); this.atualizarVelocidade(); this.atualizarEstadoBotoesWrapper(); } frear() { if (!this.frearBase()) return; this.velocidade = Math.max(0, this.velocidade - 15); tocarSom(sons.frear, 0.6); animarVeiculo(this.getIdPrefix(), 'freando'); this.atualizarVelocidade(); if (this.velocidade === 0) this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } atualizarTurbo() { atualizarInfoVeiculo(this.getIdPrefix(), { turbo: this.turboAtivado ? "Ativado" : "Desativado" }); } desligar() { super.desligar(); if (this.turboAtivado) this.desativarTurbo(); } buzinar() { tocarSom(sons.buzina, 0.7); } }
    class Caminhao extends Carro { constructor(m, c, cap = 5000) { super(m, c); this.capacidadeCarga = cap; this.cargaAtual = 0; } carregar(q) { if (isNaN(q) || q <= 0) { mostrarFeedback("Carga inválida (> 0).", 'error'); return false; } if (this.cargaAtual + q <= this.capacidadeCarga) { this.cargaAtual += q; this.atualizarInfoCaminhao(); mostrarFeedback(`Carga atual: ${this.cargaAtual}kg.`, 'success'); salvarGaragem(); return true; } else { mostrarFeedback(`Capacidade ${this.capacidadeCarga}kg excedida!`, 'error'); return false; } } descarregar(q) { /* TODO */ return false; } atualizarInfoCaminhao() { atualizarInfoVeiculo(this.getIdPrefix(), { carga: this.cargaAtual, capacidade: this.capacidadeCarga }); } acelerar() { if (!this.acelerarBase()) return; const f = 1 - (this.cargaAtual / (this.capacidadeCarga * 2)); this.velocidade += Math.max(2, 5 * f); tocarSom(sons.acelerar, 0.4); animarVeiculo(this.getIdPrefix(), 'acelerando'); this.atualizarVelocidade(); this.atualizarEstadoBotoesWrapper(); } frear() { if (!this.frearBase()) return; const f = 1 + (this.cargaAtual / (this.capacidadeCarga * 2)); this.velocidade = Math.max(0, this.velocidade - Math.max(3, 7 / f)); tocarSom(sons.frear, 0.6); animarVeiculo(this.getIdPrefix(), 'freando'); this.atualizarVelocidade(); if (this.velocidade === 0) this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } buzinar() { tocarSom(sons.buzina, 0.9); } }
    class Moto extends Veiculo { acelerar() { if (!this.acelerarBase()) return; this.velocidade += 15; tocarSom(sons.acelerar, 0.6); animarVeiculo(this.getIdPrefix(), 'acelerando'); this.atualizarVelocidade(); this.atualizarEstadoBotoesWrapper(); } frear() { if (!this.frearBase()) return; this.velocidade = Math.max(0, this.velocidade - 12); tocarSom(sons.frear, 0.7); animarVeiculo(this.getIdPrefix(), 'freando'); this.atualizarVelocidade(); if (this.velocidade === 0) this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } buzinar() { tocarSom(sons.buzina, 0.6); } }
    class Bicicleta extends Veiculo { constructor(m, c) { super(m, c); this.ligado = true; this.velocidade = 0; } ligar() { mostrarFeedback("Bicicleta pronta!", 'info'); } desligar() { mostrarFeedback(this.velocidade > 0 ? "Use o freio!" : "Bicicleta parada.", 'info'); } pedalar() { this.velocidade += 2; animarVeiculo(this.getIdPrefix(), 'acelerando'); this.atualizarVelocidade(); this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } frear() { if (this.velocidade > 0) { this.velocidade = Math.max(0, this.velocidade - 1.5); animarVeiculo(this.getIdPrefix(), 'freando'); this.atualizarVelocidade(); if (this.velocidade === 0) this.atualizarStatus(); this.atualizarEstadoBotoesWrapper(); } } acelerar() { this.pedalar(); } buzinar() { tocarSom(sons.buzina, 0.3); console.log(`${this.modelo} campainha!`); } atualizarStatus() { atualizarStatusVeiculo(this.getIdPrefix(), this.ligado, this.velocidade); } }

    // --- PERSISTÊNCIA (LocalStorage) ---
    function salvarGaragem() { const gPS = {}; for (const t in garagem) { const v = garagem[t]; gPS[t] = { modelo: v.modelo, cor: v.cor, capacidadeCarga: (v instanceof Caminhao) ? v.capacidadeCarga : undefined, cargaAtual: (v instanceof Caminhao) ? v.cargaAtual : undefined, historicoManutencao: Array.isArray(v.historicoManutencao) ? v.historicoManutencao.map(m => m.toJSON()) : [] }; } try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gPS)); } catch (e) { console.error("Erro CRÍTICO ao salvar LS:", e); mostrarFeedback("ERRO: Não foi possível salvar os dados!", 'error'); } }
    function carregarGaragem() { const dS = localStorage.getItem(LOCAL_STORAGE_KEY); garagem = {}; if (!dS) { console.log("LS vazio. Criando padrões."); garagem = { carro: new Carro("Sedan", "Prata"), esportivo: new CarroEsportivo("GT", "Vermelho"), caminhao: new Caminhao("Truck", "Branco", 5000), moto: new Moto("Roadster", "Preto"), bicicleta: new Bicicleta("MTB", "Azul") }; salvarGaragem(); } else { console.log("Carregando do LS."); try { const gR = JSON.parse(dS); for (const t in gR) { const d = gR[t]; let vI = null; switch (t) { case 'carro': vI = new Carro(d.modelo, d.cor); break; case 'esportivo': vI = new CarroEsportivo(d.modelo, d.cor); break; case 'caminhao': vI = new Caminhao(d.modelo, d.cor, d.capacidadeCarga); break; case 'moto': vI = new Moto(d.modelo, d.cor); break; case 'bicicleta': vI = new Bicicleta(d.modelo, d.cor); break; default: continue; } if (vI instanceof Caminhao) { vI.cargaAtual = d.cargaAtual || 0; } if (Array.isArray(d.historicoManutencao)) { vI.historicoManutencao = d.historicoManutencao .map(mJ => Manutencao.fromJSON(mJ)) .filter(m => m instanceof Manutencao && m.data && !isNaN(m.data.getTime())) .sort((a, b) => b.data.getTime() - a.data.getTime()); } else { vI.historicoManutencao = []; } garagem[t] = vI; } } catch (e) { console.error("Erro CRÍTICO ao carregar/parsear LS:", e); mostrarFeedback("ERRO: Dados salvos corrompidos. Resetando garagem.", 'error'); localStorage.removeItem(LOCAL_STORAGE_KEY); return carregarGaragem(); } } /* Atualizar UI e Lembretes é feito fora do try/catch */ }

    // --- ATUALIZAÇÃO DA INTERFACE ---
    function atualizarInterfaceCompleta() {
        atualizarListaSidebar(); // Atualiza a lista de veículos na sidebar
        for (const t in garagem) {
             const v = garagem[t], p = v.getIdPrefix();
             // Verifica se o container HTML para este veículo existe antes de atualizar
             const container = document.getElementById(`${p}-container`);
             if (container) {
                 atualizarInfoVeiculo(p, { modelo: v.modelo, cor: v.cor });
                 v.ligado = false; v.velocidade = 0; // Reseta estado volátil na UI
                 v.atualizarStatus(); v.atualizarVelocidade();
                 if (v instanceof CarroEsportivo) { v.turboAtivado = false; v.atualizarTurbo(); }
                 if (v instanceof Caminhao) { v.atualizarInfoCaminhao(); }
                 v.atualizarDisplayManutencao();
                 // Atualiza estado dos botões para o estado inicial resetado
                 atualizarEstadoBotoes(v);
             } else {
                 console.warn(`Container HTML para ${p} não encontrado durante atualização completa.`);
                 // Se adicionamos veículos dinamicamente, precisamos criar o HTML também.
                 // Por ora, vamos assumir que o HTML base existe para os tipos padrão.
             }
        }
    }
    function verificarAgendamentosProximos() { /* ... (código mantido como antes) ... */ }

    // --- LÓGICA DE NAVEGAÇÃO E EXIBIÇÃO ---
    function esconderTodosConteudos() {
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (addVeiculoFormContainer) addVeiculoFormContainer.style.display = 'none';
        // Re-seleciona os containers caso novos tenham sido adicionados (não implementado ainda)
        veiculoContainers = mainContent.querySelectorAll('.veiculo-container');
        veiculoContainers.forEach(c => c.classList.remove('active'));
        if (mainContent) mainContent.classList.remove('content-visible');
    }

    function mostrarConteudo(tipo, elementoId) {
        esconderTodosConteudos();
        const el = document.getElementById(elementoId);
        if (el) {
            el.style.display = 'block'; // Ou .classList.add('active') se usar CSS
            if (mainContent) mainContent.classList.add('content-visible'); // Para esconder welcome via CSS

            if (tipo === 'veiculo') {
                const tipoVeiculo = elementoId.replace('-container', '');
                const v = garagem[tipoVeiculo];
                if(v) {
                     animarVeiculo(v.getIdPrefix(), '');
                     atualizarEstadoBotoes(v);
                }
                // Marca o link da sidebar como ativo
                const linkAtivo = sidebarMenu.querySelector(`a[data-veiculo="${tipoVeiculo}"]`);
                atualizarLinkAtivo(linkAtivo);
            } else if (tipo === 'formAdd') {
                 // Limpa seleção da sidebar ao mostrar form
                 atualizarLinkAtivo(null);
            }
        } else {
            console.warn(`Elemento ${elementoId} não encontrado para mostrar.`);
            if (welcomeMessage) welcomeMessage.style.display = 'block'; // Mostra welcome se falhar
        }
    }

    function atualizarLinkAtivo(linkClicado) {
        sidebarMenu.querySelectorAll('a').forEach(l => l.classList.remove('active'));
        if (linkClicado) { linkClicado.classList.add('active'); }
    }

    // --- Atualiza a lista de veículos na Sidebar ---
    function atualizarListaSidebar() {
        if (!sidebarMenu) return;

        // Limpa itens de veículo existentes (mantém o botão Adicionar)
        const itensVeiculo = sidebarMenu.querySelectorAll('li.veiculo-item');
        itensVeiculo.forEach(item => item.remove());

        // Pega o item 'Adicionar Veículo' para inserir antes dele
        const addItem = sidebarMenu.querySelector('li.sidebar-action');

        // Adiciona cada veículo da garagem à lista
        Object.keys(garagem).sort().forEach(tipo => { // Ordena por tipo/nome
            const veiculo = garagem[tipo];
            const li = document.createElement('li');
            li.className = 'veiculo-item'; // Adiciona classe para identificar
            const a = document.createElement('a');
            a.href = "#";
            a.dataset.veiculo = tipo; // Usa a chave da garagem como identificador
            a.textContent = `${veiculo.modelo} (${tipo.charAt(0).toUpperCase() + tipo.slice(1)})`; // Ex: "Sedan (Carro)"

            // Insere o novo item ANTES do botão 'Adicionar'
            if (addItem) {
                sidebarMenu.insertBefore(li, addItem);
            } else {
                sidebarMenu.appendChild(li); // Adiciona no final se 'Adicionar' não existir
            }
            li.appendChild(a);
        });
    }


    // --- EVENT LISTENERS ---

    // Listener da Sidebar (Navegação e Ações)
    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            e.preventDefault(); // Previne ação padrão do link

            // Verifica se é um link de veículo
            if (link.dataset.veiculo) {
                const tipoVeiculo = link.dataset.veiculo;
                mostrarConteudo('veiculo', `${tipoVeiculo}-container`); // Mostra container do veículo
            }
            // Verifica se é uma ação (ex: mostrar form)
            else if (link.dataset.action) {
                const acao = link.dataset.action;
                if (acao === 'mostrarFormAddVeiculo') {
                    mostrarConteudo('formAdd', 'add-veiculo-form-container'); // Mostra formulário
                    addVeiculoForm.reset(); // Limpa o formulário
                    addCapacidadeGroup.style.display = 'none'; // Esconde campo capacidade
                }
                // Outras ações da sidebar poderiam ser adicionadas aqui
            }
        });
    } else { console.error("#sidebar-menu não encontrado!"); }

    // Listener do Formulário de Adição de Veículo
    if (addVeiculoForm) {
        // Mostrar/Esconder campo Capacidade ao mudar tipo
        addTipoSelect.addEventListener('change', function() {
            addCapacidadeGroup.style.display = (this.value === 'caminhao') ? 'block' : 'none';
        });

        // Submissão do formulário
        addVeiculoForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Impede envio real do form

            const tipo = document.getElementById('add-tipo').value;
            const modelo = document.getElementById('add-modelo').value.trim();
            const cor = document.getElementById('add-cor').value.trim();
            const capacidade = (tipo === 'caminhao') ? parseInt(document.getElementById('add-capacidade').value, 10) || 0 : undefined;

            // Validações básicas
            if (!tipo || !modelo || !cor) {
                mostrarFeedback('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }
            if (tipo === 'caminhao' && isNaN(capacidade)) {
                 mostrarFeedback('Por favor, insira uma capacidade válida para o caminhão.', 'error');
                 return;
            }

            // Cria a chave para o novo veículo (ex: 'carro_fusca_azul') - pode precisar de ajuste se quiser nomes repetidos
             // Usaremos o 'tipo' como chave para simplificar, assumindo um de cada tipo padrão por enquanto.
             // *** PARA ADIÇÃO REAL, PRECISA GERAR UMA CHAVE ÚNICA ***
             // Ex: const novaChave = tipo + "_" + Date.now(); // Chave única simples
             // Por enquanto, vamos SOBRESCREVER o veículo do mesmo tipo se já existir um padrão
             const novaChave = tipo; // ATENÇÃO: ISSO SOBRESCREVE!

             if (garagem[novaChave] && !confirm(`Já existe um veículo do tipo '${tipo}'. Deseja substituí-lo?`)) {
                 return; // Cancela se o usuário não quiser sobrescrever
             }


            // Cria a instância correta
            let novoVeiculo;
            try {
                switch (tipo) {
                    case 'carro': novoVeiculo = new Carro(modelo, cor); break;
                    case 'esportivo': novoVeiculo = new CarroEsportivo(modelo, cor); break;
                    case 'caminhao': novoVeiculo = new Caminhao(modelo, cor, capacidade); break;
                    case 'moto': novoVeiculo = new Moto(modelo, cor); break;
                    case 'bicicleta': novoVeiculo = new Bicicleta(modelo, cor); break;
                    default: throw new Error("Tipo de veículo inválido selecionado.");
                }

                // Adiciona à garagem (usando a chave/tipo - CUIDADO: sobrescreve)
                garagem[novaChave] = novoVeiculo;
                salvarGaragem();
                atualizarListaSidebar(); // Atualiza a lista na sidebar
                addVeiculoForm.reset(); // Limpa o form
                addVeiculoFormContainer.style.display = 'none'; // Esconde o form
                mostrarFeedback(`Veículo '${modelo}' (${tipo}) adicionado/atualizado com sucesso!`, 'success');
                mostrarConteudo('veiculo', `${novaChave}-container`); // Mostra o veículo recém adicionado/atualizado

            } catch (error) {
                 console.error("Erro ao criar veículo:", error);
                 mostrarFeedback(`Erro ao adicionar veículo: ${error.message}`, 'error');
            }
        });

        // Botão Cancelar do form de adição
        cancelAddVeiculoBtn.addEventListener('click', () => {
             addVeiculoFormContainer.style.display = 'none';
             if (welcomeMessage) welcomeMessage.style.display = 'block'; // Mostra welcome de volta
             if (mainContent) mainContent.classList.remove('content-visible');
             atualizarLinkAtivo(null); // Desmarca sidebar
        });

    }

    // Listener Principal de Ações (Botões dentro dos containers de veículo)
    if (appContainer) {
        appContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-acao][data-tipo]');
            if (!btn || btn.disabled) return; // Ignora se não for botão de ação ou estiver desabilitado

            const a = btn.dataset.acao;
            const t = btn.dataset.tipo;
            const v = garagem[t];

            if (!v) { console.error(`Veículo ${t} não encontrado!`); return; }
            const p = v.getIdPrefix();

            if (a === 'agendarManutencao') {
                const dI = document.getElementById(`${p}-manutencao-data`), tI = document.getElementById(`${p}-manutencao-tipo`), cI = document.getElementById(`${p}-manutencao-custo`), dsI = document.getElementById(`${p}-manutencao-descricao`);
                if (!dI || !tI || !cI || !dsI) { console.error(`Campos form manut. não encontrados p/ ${p}`); return; }
                const nM = new Manutencao(dI.value, tI.value, cI.value, dsI.value);
                if (v.adicionarManutencao(nM)) { // adicionarManutencao já salva e atualiza display
                    mostrarFeedback(`Serviço "${nM.tipo}" adicionado/agendado!`, 'success');
                    dI.value = tI.value = cI.value = dsI.value = ''; // Limpa form
                    verificarAgendamentosProximos();
                } // Se falhar, adicionarManutencao já mostrou feedback de erro
            } else {
                if (typeof v[a] === 'function') {
                    if (a === 'carregar' && v instanceof Caminhao) {
                        const cI = document.getElementById('caminhao-carga-input');
                        if (cI) { const q = parseInt(cI.value, 10) || 0; if (v.carregar(q)) { cI.value = ''; } } // carregar já mostra feedback
                        else { console.error("Input carga caminhão não achado."); }
                    } else {
                         v[a](); // Chama o método (ligar, acelerar, etc.) - eles mostram feedback se necessário
                    }
                } else {
                     console.warn(`Método '${a}' não encontrado no veículo tipo '${t}'.`);
                     mostrarFeedback(`Ação ${a} não disponível para ${t}.`, 'warning');
                }
            }
        });
    } else { console.error("ERRO CRÍTICO: #app-container não encontrado!"); }

    // Listener Input Carga Caminhão (Enter)
    const cIC = document.getElementById('caminhao-carga-input'); const cBC = document.querySelector('#caminhao-container button[data-acao="carregar"]'); if (cIC && cBC) { cIC.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); cBC.click(); }}); }

    // --- INICIALIZAÇÃO ---
    console.log("Inicializando Garagem...");
    carregarGaragem(); // Carrega/Cria dados
    atualizarInterfaceCompleta(); // Preenche a UI e a Sidebar
    esconderTodosConteudos(); // Garante que só welcome apareça
    if (welcomeMessage) { welcomeMessage.style.display = 'block'; } // Mostra msg inicial
    atualizarLinkAtivo(null); // Nenhum link ativo
    console.log("Garagem pronta!");

}); // Fim do DOMContentLoaded