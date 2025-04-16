/**
 * @file script.js
 * @brief Arquivo principal que controla a lógica da Garagem Inteligente Unificada.
 */

// Importa as classes dos veículos
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js';
import { Bicicleta } from './Bicicleta.js';
import { Manutencao } from './Manutencao.js';

// Importa funções auxiliares
import { tocarSom, atualizarInfoVeiculo, atualizarStatusVeiculo, animarVeiculo, atualizarEstadoBotoes, mostrarFeedback } from './funcoesAuxiliares.js';

/**
 * @function DOMContentLoaded
 * @description Garante que o DOM esteja pronto antes de executar o código.
 */
document.addEventListener('DOMContentLoaded', function() {

    /**
     * @const {string} LOCAL_STORAGE_KEY - Chave para salvar os dados no LocalStorage.
     */
    const LOCAL_STORAGE_KEY = 'garagemVirtualData_v3';
    /**
     * @type {object} garagem - Objeto para armazenar instâncias dos veículos.
     */
    let garagem = {};

    // Elementos da UI
    /** @const {HTMLElement} sidebarMenu - Menu da barra lateral. */
    const sidebarMenu = document.getElementById('sidebar-menu');
    /** @const {HTMLElement} mainContent = Área de conteúdo principal. */
    const mainContent = document.getElementById('main-content');
    /** @const {HTMLElement} welcomeMessage - Mensagem de boas-vindas. */
    const welcomeMessage = document.getElementById('welcome-message');
    /** @const {HTMLElement} appContainer - Container principal da aplicação. */
    const appContainer = document.getElementById('app-container');
    /** @const {HTMLElement} feedbackMessageDiv - Div para exibir mensagens de feedback. */
    const feedbackMessageDiv = document.getElementById('feedback-message');
    /** @const {HTMLElement} addVeiculoFormContainer - Container do formulário de adição de veículo. */
    const addVeiculoFormContainer = document.getElementById('add-veiculo-form-container');
    /** @const {HTMLFormElement} addVeiculoForm - Formulário de adição de veículo. */
    const addVeiculoForm = document.getElementById('add-veiculo-form');
    /** @const {HTMLSelectElement} addTipoSelect - Select de tipo de veículo no formulário de adição. */
    const addTipoSelect = document.getElementById('add-tipo');
    /** @const {HTMLElement} addCapacidadeGroup - Div para o campo de capacidade do caminhão. */
    const addCapacidadeGroup = document.getElementById('add-caminhao-capacidade-group');
    /** @const {HTMLButtonElement} cancelAddVeiculoBtn - Botão para cancelar a adição de veículo. */
    const cancelAddVeiculoBtn = document.getElementById('cancel-add-veiculo');

    /**
     * @type {NodeListOf<HTMLElement>} veiculoContainers - Containers de veículos existentes.
     */
    let veiculoContainers = mainContent.querySelectorAll('.veiculo-container');

    /**
     * @type {object} sons - Objeto contendo os elementos de áudio.
     * @property {HTMLAudioElement} buzina
     * @property {HTMLAudioElement} acelerar
     * @property {HTMLAudioElement} frear
     * @property {HTMLAudioElement} ligar
     * @property {HTMLAudioElement} desligar
     */
    const sons = {
        buzina: new Audio('sons/buzina.mp3'),
        acelerar: new Audio('sons/acelerar.mp3'),
        frear: new Audio('sons/frear.mp3'),
        ligar: new Audio('sons/ligar.mp3'),
        desligar: new Audio('sons/desligar.mp3')
    };

    /**
     * @type {number} feedbackTimeout - ID do timeout para esconder a mensagem de feedback.
     */
    let feedbackTimeout;


    /**
     * @function esconderTodosConteudos
     * @description Esconde todos os conteúdos da página.
     */
    function esconderTodosConteudos() {
        if (welcomeMessage) welcomeMessage.style.display = 'none';
        if (addVeiculoFormContainer) addVeiculoFormContainer.style.display = 'none';
        veiculoContainers = mainContent.querySelectorAll('.veiculo-container');
        veiculoContainers.forEach(c => c.classList.remove('active'));
        if (mainContent) mainContent.classList.remove('content-visible');
    }

    /**
     * @function mostrarConteudo
     * @param {string} tipo - Tipo de conteúdo a ser exibido ('veiculo', 'formAdd').
     * @param {string} elementoId - ID do elemento a ser exibido.
     * @description Exibe o conteúdo especificado e esconde os outros.
     */
    function mostrarConteudo(tipo, elementoId) {
        esconderTodosConteudos();
        const el = document.getElementById(elementoId);
        if (el) {
            el.style.display = 'block';
            if (mainContent) mainContent.classList.add('content-visible');

            if (tipo === 'veiculo') {
                const tipoVeiculo = elementoId.replace('-container', '');
                const v = garagem[tipoVeiculo];
                if (v) {
                    animarVeiculo(v.getIdPrefix(), '');
                    atualizarEstadoBotoes(v);
                }
                const linkAtivo = sidebarMenu.querySelector(`a[data-veiculo="${tipoVeiculo}"]`);
                atualizarLinkAtivo(linkAtivo);
            } else if (tipo === 'formAdd') {
                atualizarLinkAtivo(null);
            }
        } else {
            console.warn(`Elemento ${elementoId} não encontrado para mostrar.`);
            if (welcomeMessage) welcomeMessage.style.display = 'block';
        }
    }

    /**
     * @function atualizarLinkAtivo
     * @param {HTMLElement} linkClicado - Link clicado na sidebar.
     * @description Atualiza o link ativo na sidebar.
     */
    function atualizarLinkAtivo(linkClicado) {
        sidebarMenu.querySelectorAll('a').forEach(l => l.classList.remove('active'));
        if (linkClicado) {
            linkClicado.classList.add('active');
        }
    }

    /**
     * @function atualizarListaSidebar
     * @description Atualiza a lista de veículos na sidebar.
     */
    function atualizarListaSidebar() {
        if (!sidebarMenu) return;

        const itensVeiculo = sidebarMenu.querySelectorAll('li.veiculo-item');
        itensVeiculo.forEach(item => item.remove());

        const addItem = sidebarMenu.querySelector('li.sidebar-action');

        Object.keys(garagem).sort().forEach(tipo => {
            const veiculo = garagem[tipo];
            const li = document.createElement('li');
            li.className = 'veiculo-item';
            const a = document.createElement('a');
            a.href = "#";
            a.dataset.veiculo = tipo;
            a.textContent = `${veiculo.modelo} (${tipo.charAt(0).toUpperCase() + tipo.slice(1)})`;

            if (addItem) {
                sidebarMenu.insertBefore(li, addItem);
            } else {
                sidebarMenu.appendChild(li);
            }
            li.appendChild(a);
        });
    }

    /**
     * @function salvarGaragem
     * @description Salva os dados da garagem no LocalStorage.
     */
    function salvarGaragem() {
        const gPS = {};
        for (const t in garagem) {
            const v = garagem[t];
            gPS[t] = {
                modelo: v.modelo,
                cor: v.cor,
                capacidadeCarga: (v instanceof Caminhao) ? v.capacidadeCarga : undefined,
                cargaAtual: (v instanceof Caminhao) ? v.cargaAtual : undefined,
                historicoManutencao: Array.isArray(v.historicoManutencao) ? v.historicoManutencao.map(m => m.toJSON()) : []
            };
        }
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gPS));
        } catch (e) {
            console.error("Erro CRÍTICO ao salvar LS:", e);
            mostrarFeedback("ERRO: Não foi possível salvar os dados!", 'error');
        }
    }

    /**
     * @function carregarGaragem
     * @description Carrega os dados da garagem do LocalStorage.
     */
    function carregarGaragem() {
        const dS = localStorage.getItem(LOCAL_STORAGE_KEY);
        garagem = {};
        if (!dS) {
            console.log("LS vazio. Criando padrões.");
            garagem = {
                carro: new Carro("Sedan", "Prata"),
                esportivo: new CarroEsportivo("GT", "Vermelho"),
                caminhao: new Caminhao("Truck", "Branco", 5000),
                moto: new Moto("Roadster", "Preto"),
                bicicleta: new Bicicleta("MTB", "Azul")
            };
            salvarGaragem();
        } else {
            console.log("Carregando do LS.");
            try {
                const gR = JSON.parse(dS);
                for (const t in gR) {
                    const d = gR[t];
                    let vI = null;
                    switch (t) {
                        case 'carro': vI = new Carro(d.modelo, d.cor); break;
                        case 'esportivo': vI = new CarroEsportivo(d.modelo, d.cor); break;
                        case 'caminhao': vI = new Caminhao(d.modelo, d.cor, d.capacidadeCarga); break;
                        case 'moto': vI = new Moto(d.modelo, d.cor); break;
                        case 'bicicleta': vI = new Bicicleta(d.modelo, d.cor); break;
                        default: continue;
                    }
                    if (vI instanceof Caminhao) {
                        vI.cargaAtual = d.cargaAtual || 0;
                    }
                    if (Array.isArray(d.historicoManutencao)) {
                        vI.historicoManutencao = d.historicoManutencao
                            .map(mJ => Manutencao.fromJSON(mJ))
                            .filter(m => m instanceof Manutencao && m.data && !isNaN(m.data.getTime()))
                            .sort((a, b) => b.data.getTime() - a.data.getTime());
                    } else {
                        vI.historicoManutencao = [];
                    }
                    garagem[t] = vI;
                }
            } catch (e) {
                console.error("Erro CRÍTICO ao carregar/parsear LS:", e);
                mostrarFeedback("ERRO: Dados salvos corrompidos. Resetando garagem.", 'error');
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                return carregarGaragem();
            }
        }
    }

    /**
     * @function atualizarInterfaceCompleta
     * @description Atualiza toda a interface com os dados da garagem.
     */
    function atualizarInterfaceCompleta() {
        atualizarListaSidebar();
        for (const t in garagem) {
            const v = garagem[t], p = v.getIdPrefix();
            const container = document.getElementById(`${p}-container`);
            if (container) {
                atualizarInfoVeiculo(p, { modelo: v.modelo, cor: v.cor });
                v.ligado = false; v.velocidade = 0;
                v.atualizarStatus(); v.atualizarVelocidade();
                if (v instanceof CarroEsportivo) { v.turboAtivado = false; v.atualizarTurbo(); }
                if (v instanceof Caminhao) { v.atualizarInfoCaminhao(); }
                v.atualizarDisplayManutencao();
                atualizarEstadoBotoes(v);
            } else {
                console.warn(`Container HTML para ${p} não encontrado durante atualização completa.`);
            }
        }
    }

    /**
     * @function verificarAgendamentosProximos
     * @description Verifica se há agendamentos de manutenção próximos e exibe um alerta.
     */
    function verificarAgendamentosProximos() {
        // Implemente a lógica para verificar agendamentos próximos aqui
    }

    // --- EVENT LISTENERS ---

    // Listener da Sidebar (Navegação e Ações)
    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            e.preventDefault();

            if (link.dataset.veiculo) {
                const tipoVeiculo = link.dataset.veiculo;
                mostrarConteudo('veiculo', `${tipoVeiculo}-container`);
            } else if (link.dataset.action) {
                const acao = link.dataset.action;
                if (acao === 'mostrarFormAddVeiculo') {
                    mostrarConteudo('formAdd', 'add-veiculo-form-container');
                    addVeiculoForm.reset();
                    addCapacidadeGroup.style.display = 'none';
                }
            }
        });
    } else {
        console.error("#sidebar-menu não encontrado!");
    }

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

            if (!v) {
                console.error(`Veículo ${t} não encontrado!`);
                return;
            }
            const p = v.getIdPrefix();

            if (a === 'agendarManutencao') {
                const dI = document.getElementById(`${p}-manutencao-data`),
                    tI = document.getElementById(`${p}-manutencao-tipo`),
                    cI = document.getElementById(`${p}-manutencao-custo`),
                    dsI = document.getElementById(`${p}-manutencao-descricao`);
                if (!dI || !tI || !cI || !dsI) {
                    console.error(`Campos form manut. não encontrados p/ ${p}`);
                    return;
                }
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
                        if (cI) {
                            const q = parseInt(cI.value, 10) || 0;
                            if (v.carregar(q)) {
                                cI.value = '';
                            }
                        } // carregar já mostra feedback
                        else {
                            console.error("Input carga caminhão não achado.");
                        }
                    } else {
                        v[a](); // Chama o método (ligar, acelerar, etc.) - eles mostram feedback se necessário
                    }
                } else {
                    console.warn(`Método '${a}' não encontrado no veículo tipo '${t}'.`);
                    mostrarFeedback(`Ação ${a} não disponível para ${t}.`, 'warning');
                }
            }
        });
    } else {
        console.error("ERRO CRÍTICO: #app-container não encontrado!");
    }

    // Listener Input Carga Caminhão (Enter)
    const cIC = document.getElementById('caminhao-carga-input');
    const cBC = document.querySelector('#caminhao-container button[data-acao="carregar"]');
    if (cIC && cBC) {
        cIC.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                cBC.click();
            }
        });
    }

    // --- INICIALIZAÇÃO ---
    console.log("Inicializando Garagem...");
    carregarGaragem(); // Carrega/Cria dados
    atualizarInterfaceCompleta(); // Preenche a UI e a Sidebar
    esconderTodosConteudos(); // Garante que só welcome apareça
    if (welcomeMessage) {
        welcomeMessage.style.display = 'block';
    } // Mostra msg inicial
    atualizarLinkAtivo(null); // Nenhum link ativo
    console.log("Garagem pronta!");

}); // Fim do DOMContentLoaded


