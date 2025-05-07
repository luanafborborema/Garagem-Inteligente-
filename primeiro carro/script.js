/**
 * @file script.js
 * @brief Script principal da aplicação Garagem Inteligente.
 * Gerencia a criação, exibição, interação, persistência dos veículos e previsão do tempo.
 */

// ================================================================
// IMPORTAÇÕES DAS CLASSES
// ================================================================
import { Veiculo } from './Veiculo.js';
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js';
import { Bicicleta } from './Bicicleta.js';
import { Manutencao } from './Manutencao.js';

// ================================================================
// CONFIGURAÇÕES E CONSTANTES GLOBAIS
// ================================================================

// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.
const apiKeyOpenWeather = "bd5e378503939ddaee76f12ad7a97608";
const openWeatherMapApiBaseUrl = "https://api.openweathermap.org/data/2.5/";

// --- Função auxiliar simples para feedback (definida localmente como no seu original) ---
let feedbackTimeout; // Variável para controlar o timeout do feedback
function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackDiv = document.getElementById('feedback-message');
    if (feedbackDiv) {
        clearTimeout(feedbackTimeout); // Limpa timeout anterior, se houver

        feedbackDiv.textContent = mensagem;
        feedbackDiv.className = `feedback ${tipo}`; // Define a classe correta (ex: feedback info, feedback error)
        feedbackDiv.style.display = 'block'; // Mostra a mensagem

        // Define um novo timeout para esconder a mensagem
        feedbackTimeout = setTimeout(() => {
            feedbackDiv.style.display = 'none';
        }, 5000); // Esconde após 5 segundos
    } else {
        console.log(`Feedback (${tipo}): ${mensagem}`); // Fallback para console
    }
}

// --- Estado da Aplicação ---
let garagem = {}; // Objeto para armazenar veículos { chaveUnica: objetoVeiculo }
let veiculoAtual = null; // Chave única (placa ou ID) do veículo sendo exibido

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
const addPlacaInput = document.getElementById('add-placa');

// --- Elementos de Som ---
const sons = {
    ligar: document.getElementById('som-ligar'),
    desligar: document.getElementById('som-desligar'),
    acelerar: document.getElementById('som-acelerar'),
    frear: document.getElementById('som-frear'),
    buzina: document.getElementById('som-buzina'),
    campainha: document.getElementById('som-campainha')
};

// ================================================================
// FUNÇÕES DE PERSISTÊNCIA (localStorage)
// ================================================================
/** @description Salva o estado atual da garagem no localStorage. */
function salvarGaragem() {
    try {
        const garagemJSON = Object.values(garagem).map(v => v.toJSON());
        localStorage.setItem('garagemInteligente', JSON.stringify(garagemJSON));
        console.log("Garagem salva no localStorage.");
    } catch (error) {
        console.error("Erro ao salvar garagem:", error);
        mostrarFeedback("Erro ao salvar dados da garagem.", 'error');
    }
}
window.salvarGaragem = salvarGaragem; // Tornar acessível globalmente para as classes

/** @description Carrega a garagem do localStorage e recria os objetos Veiculo. */
function carregarGaragem() {
    const garagemSalva = localStorage.getItem('garagemInteligente');
    if (garagemSalva) {
        try {
            const garagemArrayJSON = JSON.parse(garagemSalva);
            garagem = {}; // Reset antes de carregar
            garagemArrayJSON.forEach(veiculoData => {
                const ClasseVeiculo = mapaTiposClasse[veiculoData.tipo];
                if (ClasseVeiculo) {
                    // As classes devem tratar a placa corretamente nos seus construtores
                    // e o método toJSON deve incluir a placa e outros dados específicos
                    const veiculo = new ClasseVeiculo(
                        veiculoData.modelo,
                        veiculoData.cor,
                        veiculoData.placa, // Passando a placa
                        veiculoData.id,
                        // Recria Manutencoes a partir do JSON
                        veiculoData.historicoManutencao ? veiculoData.historicoManutencao.map(m => Manutencao.fromJSON(m)).filter(m => m) : [],
                        // Dados específicos de subclasses (a ordem e presença devem ser tratadas nos construtores das classes)
                        veiculoData.capacidadeCarga, // Para Caminhao
                        veiculoData.cargaAtual,       // Para Caminhao
                        veiculoData.turboAtivado      // Para CarroEsportivo
                    );

                    // A classe Veiculo deve definir this.placa. Se não, ajuste.
                    const chaveGaragem = veiculo.placa || veiculo.id; // Prioriza placa
                    if (chaveGaragem) {
                       garagem[chaveGaragem] = veiculo;
                    } else {
                        console.warn("Veículo sem placa ou ID válido não pode ser carregado:", veiculoData);
                    }
                } else {
                    console.warn(`Tipo de veículo desconhecido no localStorage: ${veiculoData.tipo}`);
                }
            });
            console.log("Garagem carregada:", garagem);
        } catch (error) {
            console.error("Erro ao carregar garagem do localStorage:", error);
            garagem = {}; // Reseta se houver erro
            localStorage.removeItem('garagemInteligente'); // Limpa localStorage problemático
            mostrarFeedback("Erro ao carregar dados salvos. Garagem resetada.", 'error');
        }
    } else {
        garagem = {}; // Inicia garagem vazia se não houver nada salvo
        console.log("Nenhuma garagem salva encontrada. Iniciando com garagem vazia.");
    }
}

// ================================================================
// FUNÇÕES DA API (DETALHES VEÍCULO SIMULADA & PREVISÃO DO TEMPO)
// ================================================================

/**
 * @async
 * @function buscarDetalhesVeiculoAPI
 * @param {string} placa - A placa do veículo a ser buscado.
 * @returns {Promise<object|null>} Promise com detalhes ou null.
 * @description Busca detalhes adicionais de um veículo na API simulada (arquivo JSON local).
 */
async function buscarDetalhesVeiculoAPI(placa) {
    if (!placa || placa === 'N/A') {
        return null;
    }
    console.log(`Buscando API simulada para placa: ${placa}`);
    try {
        const response = await fetch('./dados_veiculos_api.json'); // Certifique-se que o arquivo está na raiz
        if (!response.ok) {
            throw new Error(`Erro ${response.status} ao buscar ${response.url}`);
        }
        const dadosVeiculos = await response.json();
        const detalhes = dadosVeiculos.find(v => v.placa && v.placa.toUpperCase() === placa.toUpperCase());
        return detalhes || null;
    } catch (error) {
        console.error("Erro na função buscarDetalhesVeiculoAPI:", error);
        mostrarFeedback("Não foi possível buscar detalhes extras do veículo.", 'error');
        return null;
    }
}

/**
 * @async
 * @function buscarPrevisaoDetalhada
 * @param {string} cidade - O nome da cidade para buscar a previsão.
 * @returns {Promise<object|null>} Uma promise que resolve com os dados da previsão ou lança um erro.
 * @description Busca a previsão do tempo detalhada (5 dias / 3 horas) para uma cidade.
 */
async function buscarPrevisaoDetalhada(cidade) {
    if (!cidade) {
        const erroMsg = "Nome da cidade não fornecido para previsão.";
        console.error(erroMsg);
        // mostrarFeedback("Por favor, informe o nome da cidade.", "warning"); // Feedback é dado pelo chamador
        throw new Error(erroMsg);
    }

    const url = `${openWeatherMapApiBaseUrl}forecast?q=${encodeURIComponent(cidade)}&appid=${apiKeyOpenWeather}&units=metric&lang=pt_br`;
    console.log("Buscando previsão em:", url);

    const response = await fetch(url);
    const data = await response.json(); // Tenta parsear JSON mesmo se não for ok, para pegar a mensagem de erro da API

    if (!response.ok) {
        const mensagemErroAPI = data.message || `Erro ${response.status} ao buscar previsão. Tente novamente.`;
        console.error("Erro da API OpenWeatherMap:", mensagemErroAPI, data);
        throw new Error(mensagemErroAPI); // Lança o erro para ser pego pelo catch do chamador
    }
    console.log("Dados brutos da previsão:", data);
    return data;
}

/**
 * @function processarDadosForecast
 * @param {object} dataApi - Os dados brutos da API OpenWeatherMap (endpoint forecast).
 * @returns {Array<object>|null} Um array de objetos, cada um representando a previsão resumida para um dia, ou null se os dados forem inválidos.
 * Formato de cada objeto no array: { data: 'AAAA-MM-DD', temp_min: X, temp_max: Y, descricao: '...', icone: '...' }
 */
function processarDadosForecast(dataApi) {
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) {
        console.warn("Dados da API de previsão inválidos ou lista de previsão vazia.", dataApi);
        return null;
    }

    const previsoesAgrupadasPorDia = {};

    dataApi.list.forEach(item => {
        const dataHoraTexto = item.dt_txt;
        const dia = dataHoraTexto.split(' ')[0];

        if (!previsoesAgrupadasPorDia[dia]) {
            previsoesAgrupadasPorDia[dia] = {
                temps: [],
                weatherDetails: []
            };
        }
        previsoesAgrupadasPorDia[dia].temps.push(item.main.temp);
        previsoesAgrupadasPorDia[dia].weatherDetails.push({
            description: item.weather[0].description,
            icon: item.weather[0].icon,
            main: item.weather[0].main
        });
    });

    const previsaoDiariaFinal = [];
    for (const diaKey in previsoesAgrupadasPorDia) {
        const dadosDoDia = previsoesAgrupadasPorDia[diaKey];
        const temp_min = Math.min(...dadosDoDia.temps);
        const temp_max = Math.max(...dadosDoDia.temps);

        let descricaoRep = "Não disponível";
        let iconeRep = "01d"; // Ícone padrão (sol)

        const indiceMeioDia = Math.floor(dadosDoDia.weatherDetails.length / 2);
        if (dadosDoDia.weatherDetails[indiceMeioDia]) {
            descricaoRep = dadosDoDia.weatherDetails[indiceMeioDia].description;
            iconeRep = dadosDoDia.weatherDetails[indiceMeioDia].icon;
        } else if (dadosDoDia.weatherDetails.length > 0) { // Fallback para o primeiro item
            descricaoRep = dadosDoDia.weatherDetails[0].description;
            iconeRep = dadosDoDia.weatherDetails[0].icon;
        }
        
        descricaoRep = descricaoRep.charAt(0).toUpperCase() + descricaoRep.slice(1);

        previsaoDiariaFinal.push({
            data: diaKey,
            temp_min: parseFloat(temp_min.toFixed(1)),
            temp_max: parseFloat(temp_max.toFixed(1)),
            descricao: descricaoRep,
            icone: iconeRep
        });
    }
    
    console.log("Previsão diária processada:", previsaoDiariaFinal.slice(0, 5));
    return previsaoDiariaFinal.slice(0, 5); // Retorna os primeiros 5 dias
}

/**
 * @function formatarDataPtBr
 * @param {string} dataStringAAAAMMDD - Data no formato "AAAA-MM-DD".
 * @returns {string} Data formatada como "DD/MM".
 */
function formatarDataPtBr(dataStringAAAAMMDD) {
    const partes = dataStringAAAAMMDD.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}`;
    }
    return dataStringAAAAMMDD;
}

/**
 * @function exibirPrevisaoDetalhada
 * @param {Array<object>} previsaoDiariaProcessada - Array de objetos com a previsão diária processada.
 * @param {string} nomeCidade - O nome da cidade para exibição.
 * @param {string} elementoResultadoId - O ID do elemento HTML onde a previsão será renderizada.
 */
function exibirPrevisaoDetalhada(previsaoDiariaProcessada, nomeCidade, elementoResultadoId) {
    const resultadoDiv = document.getElementById(elementoResultadoId);
    // Tenta encontrar o span para o nome da cidade, pode ser um pouco complexo se o ID variar muito
    // Vamos supor um padrão simples: `nome-cidade-previsao-${tipo}`
    const tipoVeiculo = elementoResultadoId.split('-').pop(); // Pega a última parte do ID, ex: 'carro'
    const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);


    if (!resultadoDiv) {
        console.error(`Elemento de resultado #${elementoResultadoId} não encontrado para exibir previsão.`);
        return;
    }
    resultadoDiv.innerHTML = ''; // Limpa

    if (nomeCidadeSpan) {
        nomeCidadeSpan.textContent = nomeCidade;
    } else {
        // console.warn(`Span para nome da cidade da previsão não encontrado para ${elementoResultadoId}`);
    }

    if (!previsaoDiariaProcessada || previsaoDiariaProcessada.length === 0) {
        resultadoDiv.innerHTML = `<p class="text-warning">Não há dados de previsão para exibir para ${nomeCidade}.</p>`;
        return;
    }

    const diasContainer = document.createElement('div');
    diasContainer.className = 'previsao-dias-container';

    previsaoDiariaProcessada.forEach(diaObj => {
        const diaDiv = document.createElement('div');
        diaDiv.className = 'dia-previsao';
        const dataFormatada = formatarDataPtBr(diaObj.data);

        diaDiv.innerHTML = `
            <h6>${dataFormatada}</h6>
            <img src="https://openweathermap.org/img/wn/${diaObj.icone}@2x.png" alt="${diaObj.descricao}" title="${diaObj.descricao}">
            <p class="temperaturas">
                <span class="temp-max" title="Máxima">${diaObj.temp_max}°C</span> / 
                <span class="temp-min" title="Mínima">${diaObj.temp_min}°C</span>
            </p>
            <p class="descricao-tempo">${diaObj.descricao}</p>
        `;
        diasContainer.appendChild(diaDiv);
    });
    resultadoDiv.appendChild(diasContainer);
}


// ================================================================
// FUNÇÕES DE INTERFACE E LÓGICA PRINCIPAL
// ================================================================

/** @description Atualiza a lista na barra lateral. */
function popularSidebar() {
    sidebarMenu.querySelectorAll('li.veiculo-item').forEach(item => item.remove());
    const addActionItem = sidebarMenu.querySelector('li.sidebar-action');

    Object.values(garagem).sort((a, b) => a.modelo.localeCompare(b.modelo)).forEach(veiculo => {
        const li = document.createElement('li');
        li.classList.add('veiculo-item');
        const idHtml = veiculo.placa || veiculo.id;
        li.innerHTML = `<a href="#" data-id="${idHtml}">${veiculo.modelo} (${veiculo.placa || 'Sem Placa'})</a>`;

        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVeiculo(idHtml);
        });

        if (addActionItem) {
            sidebarMenu.insertBefore(li, addActionItem);
        } else {
            sidebarMenu.appendChild(li);
        }
    });
}

/**
 * @description Mostra os detalhes do veículo selecionado.
 * @param {string} chaveVeiculo - A chave (placa ou ID) do veículo.
 */
function mostrarVeiculo(chaveVeiculo) {
    const veiculo = garagem[chaveVeiculo];
    if (!veiculo) {
        console.error(`Veículo com chave ${chaveVeiculo} não encontrado na garagem.`);
        mostrarFeedback("Erro: Veículo não encontrado.", 'error');
        mostrarWelcome();
        return;
    }

    veiculoAtual = chaveVeiculo;

    welcomeMessage.style.display = 'none';
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(container => {
        container.style.display = 'none';
        container.classList.remove('active');
    });

    const tipoVeiculo = veiculo.getTipo(); // Usar o getter da classe Veiculo
    const containerId = `${tipoVeiculo}-container`; // Ex: 'carro-container', 'esportivo-container'
    const container = document.getElementById(containerId);

    if (container) {
        // Atualiza informações básicas (modelo, cor, PLACA)
        container.querySelector(`#${tipoVeiculo}-modelo`).textContent = veiculo.modelo;
        container.querySelector(`#${tipoVeiculo}-cor`).textContent = veiculo.cor;
        const placaSpan = container.querySelector(`#${tipoVeiculo}-placa`);
        if (placaSpan) {
            placaSpan.textContent = veiculo.placa || 'N/A';
        }

        // Chama métodos de atualização do próprio objeto veículo
        if (typeof veiculo.atualizarStatus === 'function') veiculo.atualizarStatus();
        if (typeof veiculo.atualizarVelocidade === 'function') veiculo.atualizarVelocidade();
        if (veiculo instanceof Caminhao && typeof veiculo.atualizarInfoCaminhao === 'function') veiculo.atualizarInfoCaminhao();
        if (veiculo instanceof CarroEsportivo && typeof veiculo.atualizarTurboDisplay === 'function') veiculo.atualizarTurboDisplay();
        if (typeof veiculo.atualizarDisplayManutencao === 'function') veiculo.atualizarDisplayManutencao();
        if (typeof veiculo.atualizarEstadoBotoesWrapper === 'function') veiculo.atualizarEstadoBotoesWrapper();


        // Limpa a área de detalhes da API SIMULADA ao mostrar (se ainda existir)
        const apiSimuladaResultDiv = container.querySelector('.api-details-result:not(.previsao-tempo-resultado)'); // Seleciona apenas a div da API simulada
        if (apiSimuladaResultDiv) {
            apiSimuladaResultDiv.innerHTML = '<p class="text-muted">Clique no botão "Ver Detalhes Extras (API)" para buscar.</p>';
        }

        // Limpa a área de previsão do tempo ao mostrar um novo veículo
        const previsaoTempoResultDiv = container.querySelector(`#previsao-tempo-resultado-${tipoVeiculo}`);
        if (previsaoTempoResultDiv) {
            previsaoTempoResultDiv.innerHTML = '<p class="text-muted">Digite uma cidade e clique em "Ver Previsão".</p>';
        }
        const cidadePrevisaoInput = container.querySelector(`#cidade-previsao-input-${tipoVeiculo}`);
        if (cidadePrevisaoInput) cidadePrevisaoInput.value = ''; // Limpa input de cidade
        const nomeCidadeSpan = container.querySelector(`#nome-cidade-previsao-${tipoVeiculo}`);
        if(nomeCidadeSpan) nomeCidadeSpan.textContent = "[Cidade]";


        container.style.display = 'block';
        container.classList.add('active');

        document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
        const linkSidebar = document.querySelector(`#sidebar-menu a[data-id="${chaveVeiculo}"]`);
        if (linkSidebar) linkSidebar.classList.add('active');

        mainContent.classList.add('content-visible');
    } else {
        console.error(`Container HTML #${containerId} não encontrado para o tipo ${tipoVeiculo}.`);
        mostrarFeedback("Erro ao exibir veículo: interface não encontrada.", 'error');
        mostrarWelcome();
    }
}

/** @description Mostra o formulário para adicionar veículo. */
function mostrarFormAddVeiculo() {
    veiculoAtual = null;
    welcomeMessage.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });

    addVeiculoForm.reset();
    addCaminhaoCapacidadeGroup.style.display = 'none';
    const placaGroup = addPlacaInput ? addPlacaInput.closest('.form-group') : null;
    if(placaGroup) placaGroup.style.display = 'block';
    if(addPlacaInput) {
        addPlacaInput.required = true;
        addPlacaInput.disabled = false;
    }

    addVeiculoFormContainer.style.display = 'block';
    addVeiculoFormContainer.classList.add('active');

    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    const addLink = document.querySelector('#sidebar-menu a[data-action="mostrarFormAddVeiculo"]');
    if (addLink) addLink.classList.add('active');
    mainContent.classList.add('content-visible');
}

/** @description Mostra a tela de boas-vindas. */
function mostrarWelcome() {
    veiculoAtual = null;
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
    welcomeMessage.style.display = 'block';
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    mainContent.classList.remove('content-visible');
}

// ================================================================
// TRATAMENTO DE EVENTOS
// ================================================================

// Evento: Submissão do Formulário de Adicionar Veículo
addVeiculoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addVeiculoForm);
    const tipo = formData.get('tipo');
    const modelo = formData.get('modelo').trim();
    const cor = formData.get('cor').trim();
    let placa = formData.get('placa'); // Pode ser null se o campo estiver desabilitado
    if (placa) placa = placa.trim().toUpperCase();
    const capacidade = formData.get('capacidade');

    if (!tipo || !modelo || !cor) {
        mostrarFeedback("Preencha tipo, modelo e cor.", 'warning');
        return;
    }

    if (tipo !== 'bicicleta') {
        if (!placa) {
            mostrarFeedback("Placa é obrigatória para este tipo de veículo.", 'warning');
            return;
        }
        if (placa.length < 5) {
             mostrarFeedback("Placa inválida (mínimo 5 caracteres).", 'warning');
             return;
        }
        if (garagem[placa]) {
            mostrarFeedback(`Veículo com placa ${placa} já existe!`, 'error');
            return;
        }
    }

    const ClasseVeiculo = mapaTiposClasse[tipo];
    if (ClasseVeiculo) {
        let novoVeiculo;
        try {
            // Os construtores das classes devem ser capazes de lidar com 'placa'
            // e outros parâmetros específicos corretamente (incluindo opcionais como id, historico).
            if (tipo === 'caminhao') {
                novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, [], parseInt(capacidade) || 5000, 0);
            } else if (tipo === 'esportivo') {
                novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, [], false); // turboAtivado = false
            }
            // Para Carro, Moto, Bicicleta, os construtores padrão devem incluir placa
            else {
                novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, []);
            }

            const chaveGaragem = novoVeiculo.placa || novoVeiculo.id; // Bicicleta usará ID se placa for null
            if (!chaveGaragem) {
                 throw new Error("Veículo criado sem placa ou ID válido.");
            }
            if (garagem[chaveGaragem] && tipo !== 'bicicleta') { // Permite ID duplicado para bike se placa for nula, mas é improvável
                 mostrarFeedback(`Erro: Identificador ${chaveGaragem} já existe.`, 'error');
                 return;
            }

            garagem[chaveGaragem] = novoVeiculo;
            salvarGaragem();
            popularSidebar();
            mostrarVeiculo(chaveGaragem);
            mostrarFeedback(`'${modelo}' adicionado com sucesso!`, 'success');
            addVeiculoForm.reset();
            addVeiculoFormContainer.style.display = 'none';
            addVeiculoFormContainer.classList.remove('active');
        } catch (error) {
            console.error("Erro ao instanciar ou adicionar veículo:", error);
            mostrarFeedback(`Erro ao criar ${tipo}: ${error.message}`, 'error');
        }
    } else {
        mostrarFeedback(`Tipo de veículo inválido: ${tipo}`, 'error');
    }
});

// Evento: Cancelar Adição de Veículo
cancelAddVeiculoBtn.addEventListener('click', () => {
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    if (veiculoAtual && garagem[veiculoAtual]) {
        mostrarVeiculo(veiculoAtual);
    } else {
        mostrarWelcome();
    }
});

// Evento: Mudar o tipo no formulário (controla visibilidade de campos)
addTipoSelect.addEventListener('change', (e) => {
    const tipoSelecionado = e.target.value;
    const placaGroup = addPlacaInput ? addPlacaInput.closest('.form-group') : null;

    addCaminhaoCapacidadeGroup.style.display = (tipoSelecionado === 'caminhao') ? 'block' : 'none';

    if (tipoSelecionado === 'bicicleta') {
        if (placaGroup) placaGroup.style.display = 'none';
        if (addPlacaInput) {
            addPlacaInput.required = false;
            addPlacaInput.value = '';
            addPlacaInput.disabled = true;
        }
    } else {
        if (placaGroup) placaGroup.style.display = 'block';
         if (addPlacaInput) {
             addPlacaInput.required = true;
             addPlacaInput.disabled = false;
         }
    }
});

// Evento: Cliques Gerais no Conteúdo Principal (Delegação)
mainContent.addEventListener('click', async (e) => { // Adicionado async aqui por causa da API de previsão
    const target = e.target;

    // --- Ações do Veículo ---
    if (target.tagName === 'BUTTON' && target.dataset.acao && target.closest('.actions')) {
        const acao = target.dataset.acao;
        if (!veiculoAtual || !garagem[veiculoAtual]) {
            mostrarFeedback("Nenhum veículo selecionado para ação.", 'warning'); return;
        }
        const veiculo = garagem[veiculoAtual];
        try {
            const metodosComSom = ['ligar', 'desligar', 'acelerar', 'frear', 'buzinar', 'pedalar'];
            if (typeof veiculo[acao] === 'function') {
                if (metodosComSom.includes(acao) || (acao === 'pedalar' && veiculo instanceof Bicicleta)) {
                   veiculo[acao](sons); // Passa o objeto de sons
                } else {
                    // Lógica para carregar/descarregar caminhão
                    if ((acao === 'carregar' || acao === 'descarregar') && veiculo instanceof Caminhao) {
                        const cargaInput = document.getElementById('caminhao-carga-input'); // Assume ID fixo para o input de carga
                        const quantidade = cargaInput ? parseInt(cargaInput.value) : 0;
                        if (quantidade > 0 || acao === 'descarregar') { // Permite descarregar mesmo com input 0 se tiver algo para descarregar tudo
                           veiculo[acao](quantidade); // Método da classe deve validar
                           if(cargaInput) cargaInput.value = '';
                        } else {
                           mostrarFeedback("Informe uma quantidade válida para carregar.", "warning");
                        }
                    } else {
                        veiculo[acao](); // Para métodos sem som ou sem input extra (ex: ativarTurbo)
                    }
                }
                // As classes de veículo já devem chamar salvarGaragem() e atualizar a UI (inclusive botões)
            } else {
                console.warn(`Ação/Método ${acao} não implementado no veículo ${veiculo.constructor.name}.`);
            }
        } catch (error) {
             console.error(`Erro na ação '${acao}' do veículo:`, error);
             mostrarFeedback(`Erro ao executar ação: ${error.message}`, 'error');
        }
    }

    // --- Remover Manutenção ---
    if (target.tagName === 'BUTTON' && target.classList.contains('remover-manutencao-btn')) {
         const idManutencao = target.dataset.id;
         if (veiculoAtual && garagem[veiculoAtual] && idManutencao) {
             const veiculo = garagem[veiculoAtual];
             if (confirm("Tem certeza que deseja remover este registro de manutenção?")) {
                 if (typeof veiculo.removerManutencao === 'function') {
                    veiculo.removerManutencao(idManutencao); // Método deve salvar e atualizar UI
                    mostrarFeedback("Registro de manutenção removido.", 'info');
                 } else {
                    mostrarFeedback("Erro: Função de remover manutenção não encontrada.", 'error');
                 }
             }
         }
    }

    // --- Buscar Detalhes da API Simulada (para dados do veículo) ---
    if (target.classList.contains('details-api-btn')) {
        if (!veiculoAtual || !garagem[veiculoAtual]) {
          mostrarFeedback("Selecione um veículo para ver detalhes extras.", 'warning'); return;
        }
        const veiculo = garagem[veiculoAtual];
        const placa = veiculo.placa;

        const veiculoContainer = target.closest('.veiculo-container');
        if (!veiculoContainer) { console.error("Container do veículo não encontrado para API simulada."); return; }
        // Seleciona a div de resultado que NÃO é a da previsão do tempo
        const resultDiv = veiculoContainer.querySelector('.api-details-result:not(.previsao-tempo-resultado)');
        if (!resultDiv) { console.error("Div de resultado da API simulada não encontrada."); return; }

        if (!placa || placa === 'N/A') {
            resultDiv.innerHTML = '<p class="text-secondary">Veículo sem placa para consulta de detalhes.</p>'; return;
        }

        resultDiv.innerHTML = '<p class="text-info">Buscando detalhes extras do veículo...</p>';
        target.disabled = true;

        try {
            const detalhes = await buscarDetalhesVeiculoAPI(placa);
            if (detalhes) {
              let htmlResult = `<h5>Detalhes Extras (Placa: ${placa})</h5><ul class="list-unstyled">`;
              for (const key in detalhes) {
                  if (key.toLowerCase() !== 'placa') {
                       const titulo = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                       htmlResult += `<li><strong>${titulo}:</strong> ${detalhes[key]}</li>`;
                  }
              }
              htmlResult += '</ul>';
              resultDiv.innerHTML = htmlResult;
            } else {
              resultDiv.innerHTML = `<p class="text-warning">Detalhes extras não encontrados para a placa ${placa}.</p>`;
            }
        } catch (error) {
             resultDiv.innerHTML = `<p class="text-danger">Erro ao buscar detalhes extras.</p>`;
        } finally {
            target.disabled = false;
        }
    }

    // --- Buscar Previsão do Tempo (OpenWeatherMap) ---
    if (target.classList.contains('verificar-clima-btn-veiculo')) {
        // e.preventDefault(); // O async no listener de mainContent já trata isso se necessário
        const botaoClicado = target;
        const tipoVeiculo = botaoClicado.dataset.veiculoTipo;

        const cidadeInputId = `cidade-previsao-input-${tipoVeiculo}`;
        const resultadoDivId = `previsao-tempo-resultado-${tipoVeiculo}`;
        
        const cidadeInput = document.getElementById(cidadeInputId);
        const resultadoDiv = document.getElementById(resultadoDivId);
        
        if (!cidadeInput || !resultadoDiv) {
            console.error("Elementos de input/resultado da previsão do tempo não encontrados para:", tipoVeiculo);
            mostrarFeedback("Erro na interface de previsão do tempo.", "error");
            return;
        }
        
        const cidade = cidadeInput.value.trim();

        if (!cidade) {
            mostrarFeedback("Por favor, digite o nome de uma cidade para a previsão.", "warning");
            resultadoDiv.innerHTML = `<p class="text-muted">Digite uma cidade e clique em "Ver Previsão".</p>`;
            const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);
            if(nomeCidadeSpan) nomeCidadeSpan.textContent = "[Cidade]";
            return;
        }

        resultadoDiv.innerHTML = `<p class="text-info">Buscando previsão para ${cidade}...</p>`;
        botaoClicado.disabled = true;

        try {
            const dadosBrutos = await buscarPrevisaoDetalhada(cidade); // Pode lançar erro
            const previsaoProcessada = processarDadosForecast(dadosBrutos); // Pode retornar null

            if (previsaoProcessada && previsaoProcessada.length > 0) {
                exibirPrevisaoDetalhada(previsaoProcessada, cidade, resultadoDivId);
            } else {
                // Se processarDadosForecast retornou null ou array vazio
                resultadoDiv.innerHTML = `<p class="text-warning">Não foi possível processar os dados da previsão para ${cidade}. Verifique o console.</p>`;
                 const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);
                 if(nomeCidadeSpan) nomeCidadeSpan.textContent = cidade; // Mantém a cidade pesquisada
            }
        } catch (error) { // Pega erros de buscarPrevisaoDetalhada ou outros erros inesperados
            console.error("Erro no fluxo de busca de previsão do tempo:", error);
            resultadoDiv.innerHTML = `<p class="text-danger">Erro: ${error.message}</p>`;
            const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);
            if(nomeCidadeSpan) nomeCidadeSpan.textContent = cidade; // Mantém a cidade pesquisada
        } finally {
            botaoClicado.disabled = false;
        }
    }
});

// Evento: Submissão do Formulário de Manutenção (Delegação)
mainContent.addEventListener('submit', (e) => {
    if (e.target.classList.contains('manutencao-form')) {
        e.preventDefault();
        const form = e.target;
        if (!veiculoAtual || !garagem[veiculoAtual]) {
             mostrarFeedback("Selecione um veículo para adicionar manutenção.", 'error'); return;
        }
        const veiculo = garagem[veiculoAtual];
        
        const dataInput = form.querySelector('input[type="datetime-local"]');
        const tipoInput = form.querySelector('input[placeholder="Tipo"]'); // Assumindo placeholder único
        const custoInput = form.querySelector('input[type="number"]');
        const descricaoTextarea = form.querySelector('textarea');

        if(!dataInput || !tipoInput || !custoInput || !descricaoTextarea){
            mostrarFeedback("Erro: Campos do formulário de manutenção não encontrados.", 'error');
            return;
        }

        const data = dataInput.value;
        const tipoManutencao = tipoInput.value.trim();
        const custo = custoInput.value;
        const descricao = descricaoTextarea.value.trim();

        const novaManutencao = new Manutencao(data, tipoManutencao, custo, descricao);
        const validacao = novaManutencao.validar();

        if (validacao.valido) {
            if (typeof veiculo.adicionarManutencao === 'function') {
               if (veiculo.adicionarManutencao(novaManutencao)) { // Método deve salvar e atualizar UI
                   form.reset();
                   // mostrarFeedback já é chamado dentro de adicionarManutencao
               }
            } else {
                 mostrarFeedback("Erro: Função de adicionar manutenção não encontrada no veículo.", 'error');
            }
        } else {
           mostrarFeedback(`Dados de manutenção inválidos:\n- ${validacao.erros.join('\n- ')}`, 'error');
        }
    }
});

// Evento: Clique no link "Adicionar Veículo" na Sidebar
sidebarMenu.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'mostrarFormAddVeiculo' && e.target.closest('li.sidebar-action a')) {
        e.preventDefault();
        mostrarFormAddVeiculo();
    }
});

// ================================================================
// INICIALIZAÇÃO
// ================================================================
/** @description Inicializa a aplicação. */
function init() {
    console.log("Iniciando Garagem Inteligente Unificada...");
    carregarGaragem();
    popularSidebar();

    if (Object.keys(garagem).length > 0) {
        const primeiraChave = Object.keys(garagem).sort((a, b) => garagem[a].modelo.localeCompare(garagem[b].modelo))[0];
        mostrarVeiculo(primeiraChave);
    } else {
        mostrarWelcome();
    }

    // Estado inicial do campo placa no formulário de adição
    const placaGroup = addPlacaInput ? addPlacaInput.closest('.form-group') : null;
    // Se o select de tipo não estiver pré-selecionado para 'bicicleta', a placa deve estar visível e obrigatória.
    // A lógica no 'change' do addTipoSelect cuidará disso depois.
    if (addTipoSelect && addTipoSelect.value !== 'bicicleta') {
        if(placaGroup) placaGroup.style.display = 'block';
        if (addPlacaInput) {
            addPlacaInput.required = true;
            addPlacaInput.disabled = false;
        }
    } else { // Se for bicicleta ou nenhum tipo selecionado, trata como se fosse esconder
        if(placaGroup) placaGroup.style.display = 'none';
        if (addPlacaInput) {
            addPlacaInput.required = false;
            addPlacaInput.disabled = true;
        }
    }
    console.log("Garagem Inteligente pronta!");
}

// Dispara a inicialização quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', init);