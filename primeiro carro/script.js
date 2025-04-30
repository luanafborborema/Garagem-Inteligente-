/**
 * @file script.js
 * @brief Script principal da aplicação Garagem Inteligente.
 * Gerencia a criação, exibição, interação e persistência dos veículos.
 */

// Imports das Classes de Veículos e Manutenção
import { Veiculo } from './Veiculo.js'; // Classe base (embora não instanciada diretamente)
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js';
import { Bicicleta } from './Bicicleta.js';
import { Manutencao } from './Manutencao.js';

// Imports das Funções Auxiliares (algumas podem ser usadas diretamente pelas classes)
import { mostrarFeedback, atualizarEstadoBotoes, atualizarInfoVeiculo } from './funcoesAuxiliares.js';

// --- Estado da Aplicação ---
let garagem = {}; // Objeto para armazenar veículos por ID { idVeiculo: objetoVeiculo }
let veiculoAtual = null; // ID do veículo sendo exibido no momento

// --- Mapeamento Tipo -> Classe ---
const mapaTiposClasse = {
    carro: Carro,
    esportivo: CarroEsportivo,
    caminhao: Caminhao,
    moto: Moto,
    bicicleta: Bicicleta
};

// --- Referências aos Elementos do DOM ---
const sidebarMenu = document.getElementById('sidebar-menu');
const mainContent = document.getElementById('main-content');
const welcomeMessage = document.getElementById('welcome-message');
const addVeiculoFormContainer = document.getElementById('add-veiculo-form-container');
const addVeiculoForm = document.getElementById('add-veiculo-form');
const cancelAddVeiculoBtn = document.getElementById('cancel-add-veiculo');
const addTipoSelect = document.getElementById('add-tipo');
const addCaminhaoCapacidadeGroup = document.getElementById('add-caminhao-capacidade-group');

// --- Elementos de Som ---
const sons = {
    ligar: document.getElementById('som-ligar'),
    desligar: document.getElementById('som-desligar'),
    acelerar: document.getElementById('som-acelerar'),
    frear: document.getElementById('som-frear'),
    buzina: document.getElementById('som-buzina'),
    campainha: document.getElementById('som-campainha')
    // Adicione outros sons se necessário (ex: turbo, freio de bike)
};

// --- Funções de Persistência (localStorage) ---

/** @description Salva o estado atual da garagem no localStorage. */
function salvarGaragem() {
    try {
        // Converte cada objeto Veiculo para JSON usando o método toJSON da classe
        const garagemJSON = Object.values(garagem).map(v => v.toJSON());
        localStorage.setItem('garagemInteligente', JSON.stringify(garagemJSON));
        console.log("Garagem salva no localStorage.");
    } catch (error) {
        console.error("Erro ao salvar garagem:", error);
        mostrarFeedback("Erro ao salvar dados da garagem.", 'error');
    }
}
// Disponibiliza globalmente para ser chamada de Veiculo.js (solução rápida)
window.salvarGaragem = salvarGaragem;

/** @description Carrega a garagem do localStorage e recria os objetos Veiculo. */
function carregarGaragem() {
    const garagemSalva = localStorage.getItem('garagemInteligente');
    if (garagemSalva) {
        try {
            const garagemArrayJSON = JSON.parse(garagemSalva);
            garagem = {}; // Limpa a garagem atual antes de carregar
            garagemArrayJSON.forEach(veiculoData => {
                const ClasseVeiculo = mapaTiposClasse[veiculoData.tipo];
                if (ClasseVeiculo) {
                    // Cria a instância correta passando os dados salvos
                    // Nota: O construtor de cada classe deve ser capaz de lidar com esses dados
                     const veiculo = new ClasseVeiculo(
                        veiculoData.modelo,
                        veiculoData.cor,
                        veiculoData.id, // Passa o ID salvo
                        veiculoData.historicoManutencao, // Passa o histórico salvo
                        // Passa dados específicos da subclasse, se existirem
                        veiculoData.capacidadeCarga, // Para Caminhao (será undefined para outros)
                        veiculoData.cargaAtual,       // Para Caminhao
                        veiculoData.turboAtivado      // Para CarroEsportivo
                    );

                    // Re-ajusta carga/capacidade se for caminhão, pois construtor pode ter padrões
                     if (veiculo instanceof Caminhao && veiculoData.capacidadeCarga !== undefined) {
                        veiculo.capacidadeCarga = veiculoData.capacidadeCarga;
                        veiculo.cargaAtual = veiculoData.cargaAtual !== undefined ? veiculoData.cargaAtual : 0;
                     }

                    garagem[veiculo.id] = veiculo; // Adiciona ao objeto garagem usando o ID
                } else {
                    console.warn(`Tipo de veículo desconhecido encontrado no localStorage: ${veiculoData.tipo}`);
                }
            });
            console.log("Garagem carregada:", garagem);
        } catch (error) {
            console.error("Erro ao carregar ou parsear garagem do localStorage:", error);
            garagem = {}; // Reseta a garagem em caso de erro
            localStorage.removeItem('garagemInteligente'); // Remove dados corrompidos
            mostrarFeedback("Erro ao carregar dados salvos. Começando com garagem vazia.", 'error');
        }
    } else {
        garagem = {}; // Garagem vazia se não houver nada salvo
        console.log("Nenhuma garagem salva encontrada. Começando do zero.");
    }
}

// --- Funções de Interface e Lógica ---

/** @description Atualiza a lista de veículos na barra lateral. */
function popularSidebar() {
    // Limpa itens antigos (exceto o botão de adicionar)
    const itensVeiculo = sidebarMenu.querySelectorAll('li.veiculo-item');
    itensVeiculo.forEach(item => item.remove());

    // Encontra o item de ação 'Adicionar Veículo' para inserir antes dele
    const addActionItem = sidebarMenu.querySelector('li.sidebar-action');

    // Adiciona cada veículo da garagem à lista
    Object.values(garagem).sort((a, b) => a.modelo.localeCompare(b.modelo)).forEach(veiculo => {
        const li = document.createElement('li');
        li.classList.add('veiculo-item');
        li.innerHTML = `<a href="#" data-id="${veiculo.id}">${veiculo.modelo} (${veiculo.getTipo()})</a>`;

        // Adiciona listener para mostrar o veículo ao clicar no link
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVeiculo(veiculo.id);
        });

        // Insere o novo item ANTES do botão 'Adicionar Veículo'
        if (addActionItem) {
            sidebarMenu.insertBefore(li, addActionItem);
        } else {
            sidebarMenu.appendChild(li); // Fallback caso o botão não seja encontrado
        }
    });
}

/**
 * @description Esconde todos os conteúdos principais e mostra o container do veículo selecionado.
 * @param {string} idVeiculo - O ID do veículo a ser exibido.
 */
function mostrarVeiculo(idVeiculo) {
    const veiculo = garagem[idVeiculo];
    if (!veiculo) {
        console.error(`Veículo com ID ${idVeiculo} não encontrado na garagem.`);
        mostrarFeedback("Erro: Veículo não encontrado.", 'error');
        // Volta para a tela de boas-vindas se não encontrar
        mostrarWelcome();
        return;
    }

    veiculoAtual = idVeiculo; // Define o veículo atual

    // Esconde tudo (welcome, form, todos os containers)
    welcomeMessage.style.display = 'none';
    addVeiculoFormContainer.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(container => {
        container.style.display = 'none';
        container.classList.remove('active');
    });

    // Encontra e mostra o container correto
    const prefix = veiculo.getIdPrefix();
    const container = document.getElementById(`${prefix}-container`);
    if (container) {
        // Atualiza as informações estáticas (modelo, cor) e dinâmicas
        atualizarInfoVeiculo(prefix, { modelo: veiculo.modelo, cor: veiculo.cor });
        veiculo.atualizarVelocidade();
        veiculo.atualizarStatus();
        // Atualiza informações específicas se existirem
        if (veiculo instanceof Caminhao) veiculo.atualizarInfoCaminhao();
        if (veiculo instanceof CarroEsportivo) veiculo.atualizarTurboDisplay();

        // Atualiza o display de manutenção
        veiculo.atualizarDisplayManutencao();

        // Atualiza o estado dos botões
        atualizarEstadoBotoes(veiculo);

        // Mostra o container
        container.style.display = 'block';
        container.classList.add('active');

        // Atualiza a seleção na sidebar
        document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
        const linkSidebar = document.querySelector(`#sidebar-menu a[data-id="${idVeiculo}"]`);
        if (linkSidebar) linkSidebar.classList.add('active');

        mainContent.classList.add('content-visible'); // Sinaliza que algo está visível

    } else {
        console.error(`Container #${prefix}-container não encontrado para o veículo ${veiculo.modelo}`);
        mostrarFeedback("Erro ao exibir o veículo. Container não encontrado.", 'error');
        mostrarWelcome(); // Volta para welcome em caso de erro
    }
}

/** @description Mostra o formulário para adicionar um novo veículo. */
function mostrarFormAddVeiculo() {
    veiculoAtual = null; // Nenhum veículo selecionado
    // Esconde tudo
    welcomeMessage.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(container => {
        container.style.display = 'none';
        container.classList.remove('active');
    });
    // Reseta e mostra o formulário
    addVeiculoForm.reset();
    addCaminhaoCapacidadeGroup.style.display = 'none'; // Esconde campo de capacidade
    addVeiculoFormContainer.style.display = 'block';
    addVeiculoFormContainer.classList.add('active'); // Usa classe se o CSS depender dela

    // Remove seleção da sidebar
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
     // Marca o link 'Adicionar' como ativo (opcional)
     const addLink = document.querySelector('#sidebar-menu a[data-action="mostrarFormAddVeiculo"]');
     if (addLink) addLink.classList.add('active');

    mainContent.classList.add('content-visible');
}

/** @description Mostra a mensagem de boas-vindas e esconde outros conteúdos. */
function mostrarWelcome() {
    veiculoAtual = null;
     // Esconde form e containers
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(container => {
        container.style.display = 'none';
        container.classList.remove('active');
    });
    // Mostra welcome
    welcomeMessage.style.display = 'block';
    // Remove seleção da sidebar
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    mainContent.classList.remove('content-visible'); // Sinaliza que só welcome está visível
}

// --- Tratamento de Eventos ---

// Evento: Submissão do Formulário de Adicionar Veículo
addVeiculoForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Impede recarregamento da página
    const formData = new FormData(addVeiculoForm);
    const tipo = formData.get('tipo');
    const modelo = formData.get('modelo').trim();
    const cor = formData.get('cor').trim();
    const capacidade = formData.get('capacidade'); // Pode ser null se não for caminhão

    if (!tipo || !modelo || !cor) {
        mostrarFeedback("Por favor, preencha tipo, modelo e cor.", 'warning');
        return;
    }

    const ClasseVeiculo = mapaTiposClasse[tipo];
    if (ClasseVeiculo) {
        let novoVeiculo;
        try {
            // Instancia o veículo correto
            if (tipo === 'caminhao') {
                novoVeiculo = new ClasseVeiculo(modelo, cor, parseInt(capacidade) || 5000); // Passa capacidade
            } else {
                novoVeiculo = new ClasseVeiculo(modelo, cor);
            }

            // Verifica se já existe um veículo com mesmo ID (improvável, mas seguro)
            if (garagem[novoVeiculo.id]) {
                 mostrarFeedback(`Um veículo com ID ${novoVeiculo.id} já existe.`, 'error');
                 return;
            }

            garagem[novoVeiculo.id] = novoVeiculo; // Adiciona à garagem
            salvarGaragem(); // Salva no localStorage
            popularSidebar(); // Atualiza a sidebar
            mostrarVeiculo(novoVeiculo.id); // Mostra o veículo recém-criado
            mostrarFeedback(`Veículo '${modelo}' adicionado com sucesso!`, 'success');
            addVeiculoForm.reset(); // Limpa o formulário

        } catch (error) {
            console.error("Erro ao criar veículo:", error);
            mostrarFeedback(`Erro ao criar ${tipo}: ${error.message}`, 'error');
        }
    } else {
        mostrarFeedback(`Tipo de veículo inválido: ${tipo}`, 'error');
    }
});

// Evento: Cancelar Adição de Veículo
cancelAddVeiculoBtn.addEventListener('click', () => {
    addVeiculoFormContainer.style.display = 'none'; // Esconde o formulário
    addVeiculoFormContainer.classList.remove('active');
    mostrarWelcome(); // Volta para a tela inicial
});

// Evento: Mudar o tipo no formulário de adição (para mostrar/esconder capacidade do caminhão)
addTipoSelect.addEventListener('change', (e) => {
    if (e.target.value === 'caminhao') {
        addCaminhaoCapacidadeGroup.style.display = 'block';
    } else {
        addCaminhaoCapacidadeGroup.style.display = 'none';
    }
});

// Evento: Cliques nos botões de Ação dos Veículos e Manutenção (Usando Event Delegation)
mainContent.addEventListener('click', (e) => {
    const target = e.target;

    // --- Ações do Veículo ---
    // Verifica se o clique foi em um botão com data-acao e dentro de .actions
    if (target.tagName === 'BUTTON' && target.dataset.acao && target.closest('.actions')) {
        const acao = target.dataset.acao;
        // const tipo = target.dataset.tipo; // Não precisamos mais do tipo, usamos veiculoAtual

        if (!veiculoAtual || !garagem[veiculoAtual]) {
            mostrarFeedback("Nenhum veículo selecionado para realizar a ação.", 'warning');
            return;
        }
        const veiculo = garagem[veiculoAtual];

        // Executa a ação correspondente no objeto do veículo
        try {
            switch (acao) {
                case 'ligar':
                    veiculo.ligar(sons); // Passa o objeto sons
                    break;
                case 'desligar':
                    veiculo.desligar(sons);
                    break;
                case 'acelerar':
                case 'pedalar': // Trata pedalar como acelerar aqui
                    veiculo.acelerar(sons);
                    break;
                case 'frear':
                    veiculo.frear(sons);
                    break;
                case 'buzinar':
                    veiculo.buzinar(sons);
                    break;
                // Ações específicas
                case 'ativarTurbo':
                    if (veiculo instanceof CarroEsportivo) veiculo.ativarTurbo();
                    break;
                case 'desativarTurbo':
                    if (veiculo instanceof CarroEsportivo) veiculo.desativarTurbo();
                    break;
                case 'carregar':
                    if (veiculo instanceof Caminhao) {
                        const cargaInput = document.getElementById('caminhao-carga-input');
                        const quantidade = cargaInput ? cargaInput.value : null;
                        if (quantidade) {
                            veiculo.carregar(quantidade);
                            cargaInput.value = ''; // Limpa o input após carregar
                        } else {
                            mostrarFeedback("Informe a quantidade a carregar.", "warning");
                        }
                    }
                    break;
                case 'descarregar':
                     if (veiculo instanceof Caminhao) {
                        const cargaInput = document.getElementById('caminhao-carga-input');
                        const quantidade = cargaInput ? cargaInput.value : null;
                        if (quantidade) {
                            veiculo.descarregar(quantidade);
                            cargaInput.value = ''; // Limpa o input após descarregar
                        } else {
                            // Permite descarregar sem input se houver carga? Não, força input.
                            // Se quisesse descarregar tudo sem input, a lógica seria diferente.
                             mostrarFeedback("Informe a quantidade a descarregar.", "warning");
                        }
                    }
                    break;
                default:
                    console.warn(`Ação desconhecida: ${acao}`);
            }
            // Após qualquer ação, atualiza os botões (exceto para ligar/desligar que já fazem isso)
            // if (!['ligar', 'desligar'].includes(acao)) {
            //    atualizarEstadoBotoes(veiculo);
            // }
        } catch (error) {
             console.error(`Erro ao executar ação '${acao}' no veículo ${veiculo.id}:`, error);
             mostrarFeedback(`Erro: ${error.message}`, 'error');
        }
    }

    // --- Remover Manutenção ---
    // Verifica se o clique foi no botão de remover manutenção
     if (target.tagName === 'BUTTON' && target.classList.contains('remover-manutencao-btn')) {
        const idManutencao = target.dataset.id;
         if (veiculoAtual && garagem[veiculoAtual] && idManutencao) {
             const veiculo = garagem[veiculoAtual];
             // Pede confirmação
             if (confirm("Tem certeza que deseja remover este registro de manutenção?")) {
                 veiculo.removerManutencao(idManutencao);
                 // A função removerManutencao já salva e atualiza o display
             }
         }
    }
});


// Evento: Submissão do Formulário de Manutenção (Usando Event Delegation)
mainContent.addEventListener('submit', (e) => {
    // Verifica se a submissão veio de um formulário de manutenção
    if (e.target.classList.contains('manutencao-form')) {
        e.preventDefault(); // Impede recarregamento
        const form = e.target;
        const tipoVeiculo = form.dataset.tipo; // Pega o tipo do data attribute do form

        if (!veiculoAtual || !garagem[veiculoAtual] || garagem[veiculoAtual].getTipo() !== tipoVeiculo) {
            mostrarFeedback("Erro: Veículo atual não corresponde ao formulário de manutenção.", 'error');
            return;
        }
        const veiculo = garagem[veiculoAtual];

        // Pega os dados do formulário específico do veículo atual
        const prefix = veiculo.getIdPrefix();
        const dataInput = document.getElementById(`${prefix}-manutencao-data`);
        const tipoInput = document.getElementById(`${prefix}-manutencao-tipo`);
        const custoInput = document.getElementById(`${prefix}-manutencao-custo`);
        const descInput = document.getElementById(`${prefix}-manutencao-descricao`);

        if (!dataInput || !tipoInput || !custoInput || !descInput) {
             mostrarFeedback("Erro: Campos do formulário de manutenção não encontrados.", 'error');
             return;
        }

        const data = dataInput.value;
        const tipo = tipoInput.value.trim();
        const custo = custoInput.value;
        const descricao = descInput.value.trim();

        // Cria e valida o objeto Manutencao
        const novaManutencao = new Manutencao(data, tipo, custo, descricao);
        const validacao = novaManutencao.validar();

        if (validacao.valido) {
            // Adiciona a manutenção ao veículo (a função já salva e atualiza o display)
            if (veiculo.adicionarManutencao(novaManutencao)) {
                 // Limpa o formulário após adicionar com sucesso
                 form.reset();
            }
        } else {
            mostrarFeedback(`Erro nos dados da manutenção:\n- ${validacao.erros.join('\n- ')}`, 'error');
        }
    }
});


// Evento: Clique no link "Adicionar Veículo" na Sidebar
sidebarMenu.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'mostrarFormAddVeiculo') {
        e.preventDefault();
        mostrarFormAddVeiculo();
    }
});


// --- Inicialização ---
function init() {
    console.log("Iniciando Garagem Inteligente...");
    carregarGaragem();
    popularSidebar();

    // Decide o que mostrar inicialmente
    if (Object.keys(garagem).length > 0) {
        // Se houver veículos, mostra o primeiro da lista ordenada
        const primeiroId = Object.keys(garagem).sort((a, b) => garagem[a].modelo.localeCompare(garagem[b].modelo))[0];
         mostrarVeiculo(primeiroId);
       // mostrarWelcome(); // Ou começa sempre com welcome?
    } else {
        // Se a garagem estiver vazia, mostra a mensagem de boas-vindas
        mostrarWelcome();
    }
     console.log("Garagem Inteligente pronta!");
}

// Inicia a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);