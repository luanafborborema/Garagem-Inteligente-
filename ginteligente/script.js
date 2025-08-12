/**
 * @file script.js
 * @brief Script principal da aplicação Garagem Inteligente.
 * Gerencia a criação, exibição, interação, persistência dos veículos e previsão do tempo interativa via backend.
 */

// IMPORTAÇÕES DAS CLASSES
import { Veiculo } from './Veiculo.js';
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js';
import { Bicicleta } from './Bicicleta.js';
import { Manutencao } from './Manutencao.js';

// CONFIGURAÇÕES E CONSTANTES GLOBAIS
// A API KEY DA OPENWEATHER FOI MOVIDA PARA O BACKEND (server.js e .env)
// A URL BASE DA OPENWEATHER TAMBÉM NÃO É MAIS USADA DIRETAMENTE AQUI

let feedbackTimeoutGlobal; // Renomeado para evitar conflito se houver outra var feedbackTimeout
function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackDiv = document.getElementById('feedback-message');
    if (feedbackDiv) {
        clearTimeout(feedbackTimeoutGlobal);
        feedbackDiv.textContent = mensagem;
        feedbackDiv.className = `feedback ${tipo}`;
        feedbackDiv.style.display = 'block';
        feedbackTimeoutGlobal = setTimeout(() => { feedbackDiv.style.display = 'none'; }, 5000);
    } else {
        console.log(`Feedback (${tipo}): ${mensagem}`);
    }
}

// Estado da Aplicação
let garagem = {};
let veiculoAtual = null;
let ultimaPrevisaoProcessadaGlobal = null; // Armazena os dados da última previsão processada
let ultimaCidadePesquisadaGlobal = "";    // Armazena a cidade da última previsão

const mapaTiposClasse = {
    carro: Carro, esportivo: CarroEsportivo, caminhao: Caminhao, moto: Moto, bicicleta: Bicicleta
};

// Referências ao DOM
const sidebarMenu = document.getElementById('sidebar-menu');
const mainContent = document.getElementById('main-content');
const welcomeMessage = document.getElementById('welcome-message');
const addVeiculoFormContainer = document.getElementById('add-veiculo-form-container');
const addVeiculoForm = document.getElementById('add-veiculo-form');
const cancelAddVeiculoBtn = document.getElementById('cancel-add-veiculo');
const addTipoSelect = document.getElementById('add-tipo');
const addCaminhaoCapacidadeGroup = document.getElementById('add-caminhao-capacidade-group');
const addPlacaInput = document.getElementById('add-placa');

const sons = {
    ligar: document.getElementById('som-ligar'), desligar: document.getElementById('som-desligar'),
    acelerar: document.getElementById('som-acelerar'), frear: document.getElementById('som-frear'),
    buzina: document.getElementById('som-buzina'), campainha: document.getElementById('som-campainha')
};

// FUNÇÕES DE PERSISTÊNCIA
function salvarGaragem() {
    try {
        const garagemJSON = Object.values(garagem).map(v => v.toJSON());
        localStorage.setItem('garagemInteligente', JSON.stringify(garagemJSON));
    } catch (error) {
        console.error("Erro ao salvar garagem:", error);
        mostrarFeedback("Erro ao salvar dados da garagem.", 'error');
    }
}
window.salvarGaragem = salvarGaragem; // Expondo globalmente se necessário por outras classes

function carregarGaragem() {
    const garagemSalva = localStorage.getItem('garagemInteligente');
    if (garagemSalva) {
        try {
            const garagemArrayJSON = JSON.parse(garagemSalva);
            garagem = {}; // Limpa a garagem atual antes de carregar
            garagemArrayJSON.forEach(veiculoData => {
                const ClasseVeiculo = mapaTiposClasse[veiculoData.tipo];
                if (ClasseVeiculo) {
                    let veiculo;
                    // Lógica de reconstrução do veículo baseada nos dados salvos
                    if (veiculoData.tipo === 'caminhao') {
                        veiculo = new Caminhao(
                            veiculoData.modelo, veiculoData.cor,
                            veiculoData.capacidadeCarga, // Note a ordem aqui, placa vem depois se existir
                            veiculoData.id, // id que era placa antes?
                            veiculoData.historicoManutencao ? veiculoData.historicoManutencao.map(m => Manutencao.fromJSON(m)).filter(m => m) : [],
                            veiculoData.cargaAtual // cargaAtual
                        );
                        // A placa pode estar no veiculoData.id se for o identificador único, ou precisa ser um campo separado
                        // Se 'placa' for um campo separado em toJSON, use veiculoData.placa
                        if(veiculoData.placa) veiculo.placa = veiculoData.placa;


                    } else if (veiculoData.tipo === 'esportivo') {
                        veiculo = new CarroEsportivo(
                            veiculoData.modelo, veiculoData.cor,
                            veiculoData.id, // id
                            veiculoData.historicoManutencao ? veiculoData.historicoManutencao.map(m => Manutencao.fromJSON(m)).filter(m => m) : [],
                            veiculoData.turboAtivado
                        );
                         if(veiculoData.placa) veiculo.placa = veiculoData.placa;
                    } else { // Carro, Moto, Bicicleta
                         veiculo = new ClasseVeiculo(
                            veiculoData.modelo, veiculoData.cor,
                            veiculoData.id, // id
                            veiculoData.historicoManutencao ? veiculoData.historicoManutencao.map(m => Manutencao.fromJSON(m)).filter(m => m) : []
                        );
                         if(veiculoData.placa) veiculo.placa = veiculoData.placa;
                    }
                    // A chave da garagem deve ser consistente. Se placa é usada, garanta que ela exista.
                    // Para bicicleta, o ID gerado automaticamente é usado se não houver placa.
                    const chaveGaragem = veiculoData.placa || veiculo.id; // Usa placa se existir, senão o ID do veículo
                    if (chaveGaragem) {
                        garagem[chaveGaragem] = veiculo;
                    } else {
                        console.warn("Veículo carregado sem chave identificadora:", veiculoData);
                    }
                }
            });
        } catch (error) {
            console.error("Erro ao carregar garagem:", error);
            garagem = {}; // Reseta a garagem em caso de erro
            // localStorage.removeItem('garagemInteligente'); // Opcional: remover dados corrompidos
            mostrarFeedback("Erro ao carregar dados. Garagem pode estar incompleta ou resetada.", 'error');
        }
    }
}


// FUNÇÕES DA API DE PREVISÃO DO TEMPO (AGORA CHAMAM O BACKEND)
// A função buscarPrevisaoDetalhada(cidade) foi movida para dentro do event listener de click,
// e sua lógica interna foi alterada para chamar o backend.

/** @description Processa os dados brutos da API (retornados pelo backend) para um formato diário. ESTA FUNÇÃO NÃO MUDA. */
function processarDadosForecast(dataApi) {
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) {
        console.warn("[Frontend] Dados da API inválidos ou vazios para processarForecast:", dataApi);
        return null;
    }
    const previsoesAgrupadas = {};
    dataApi.list.forEach(item => {
        const dia = item.dt_txt.split(' ')[0];
        if (!previsoesAgrupadas[dia]) {
            previsoesAgrupadas[dia] = { temps: [], weatherDetails: [], condicoes: [] };
        }
        previsoesAgrupadas[dia].temps.push(item.main.temp);
        previsoesAgrupadas[dia].weatherDetails.push({ description: item.weather[0].description, icon: item.weather[0].icon });
        previsoesAgrupadas[dia].condicoes.push(item.weather[0].main.toLowerCase());
    });

    const previsaoDiariaFinal = [];
    for (const diaKey in previsoesAgrupadas) {
        const dadosDia = previsoesAgrupadas[diaKey];
        const temp_min = Math.min(...dadosDia.temps);
        const temp_max = Math.max(...dadosDia.temps);
        const detalheCentral = dadosDia.weatherDetails[Math.floor(dadosDia.weatherDetails.length / 2)] || dadosDia.weatherDetails[0];
        let descricaoRep = detalheCentral ? detalheCentral.description : "N/D";
        descricaoRep = descricaoRep.charAt(0).toUpperCase() + descricaoRep.slice(1);

        const temChuva = dadosDia.condicoes.some(c => ["rain", "drizzle", "thunderstorm"].includes(c));

        previsaoDiariaFinal.push({
            data: diaKey, temp_min: parseFloat(temp_min.toFixed(1)), temp_max: parseFloat(temp_max.toFixed(1)),
            descricao: descricaoRep, icon: detalheCentral ? detalheCentral.icon : "01d", temChuva
        });
    }
    return previsaoDiariaFinal.slice(0, 5); // Retorna os primeiros 5 dias
}

/** @description Formata data "AAAA-MM-DD" para "DD/MM". ESTA FUNÇÃO NÃO MUDA. */
function formatarDataPtBr(dataString) {
    const partes = dataString.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}` : dataString;
}

/** @description Exibe a previsão detalhada na UI. ESTA FUNÇÃO NÃO MUDA. */
function exibirPrevisaoDetalhada(previsaoDiariaProcessada, nomeCidade, elementoResultadoId, diasParaExibir = 5, opcoesDestaque = { chuva: false }) {
    const resultadoDiv = document.getElementById(elementoResultadoId);
    // Pega o tipo de veículo do ID do elemento de resultado para o span do nome da cidade
    const tipoVeiculoMatch = elementoResultadoId.match(/previsao-tempo-resultado-(.+)/);
    const tipoVeiculo = tipoVeiculoMatch ? tipoVeiculoMatch[1] : null;
    const nomeCidadeSpan = tipoVeiculo ? document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`) : null;


    if (!resultadoDiv) {
        console.error(`[Frontend] Elemento de resultado da previsão #${elementoResultadoId} não encontrado.`);
        return;
    }
    resultadoDiv.innerHTML = ''; // Limpa resultados anteriores
    if (nomeCidadeSpan) nomeCidadeSpan.textContent = nomeCidade;

    if (!previsaoDiariaProcessada || previsaoDiariaProcessada.length === 0) {
        resultadoDiv.innerHTML = `<p class="text-warning">Não há dados de previsão para ${nomeCidade}.</p>`;
        return;
    }

    const diasASeremExibidos = previsaoDiariaProcessada.slice(0, diasParaExibir);
    if (diasASeremExibidos.length === 0) {
        resultadoDiv.innerHTML = `<p class="text-info">Nenhuma previsão para o período selecionado.</p>`;
        return;
    }

    const diasContainer = document.createElement('div');
    diasContainer.className = 'previsao-dias-container';
    diasASeremExibidos.forEach(diaObj => {
        const diaDiv = document.createElement('div');
        diaDiv.className = 'dia-previsao';
        if (opcoesDestaque.chuva && diaObj.temChuva) {
            diaDiv.classList.add('dia-chuvoso');
        }
        diaDiv.innerHTML = `
            <h6>${formatarDataPtBr(diaObj.data)}</h6>
            <img src="https://openweathermap.org/img/wn/${diaObj.icon}@2x.png" alt="${diaObj.descricao}" title="${diaObj.descricao}">
            <p class="temperaturas"><span class="temp-max">${diaObj.temp_max}°C</span> / <span class="temp-min">${diaObj.temp_min}°C</span></p>
            <p class="descricao-tempo">${diaObj.descricao}</p>
        `;
        diasContainer.appendChild(diaDiv);
    });
    resultadoDiv.appendChild(diasContainer);
}

// FUNÇÕES DE INTERFACE E LÓGICA PRINCIPAL
function popularSidebar() {
    sidebarMenu.querySelectorAll('li.veiculo-item').forEach(item => item.remove());
    const addActionItem = sidebarMenu.querySelector('li.sidebar-action');
    Object.values(garagem).sort((a, b) => a.modelo.localeCompare(b.modelo)).forEach(v => {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        const idHtml = v.placa || v.id; // Usa placa se existir, senão o ID do veículo
        li.innerHTML = `<a href="#" data-id="${idHtml}">${v.modelo} (${v.placa || 'Sem Placa'})</a>`;
        li.querySelector('a').addEventListener('click', e => { e.preventDefault(); mostrarVeiculo(idHtml); });
        if (addActionItem) sidebarMenu.insertBefore(li, addActionItem); else sidebarMenu.appendChild(li);
    });
}

function mostrarVeiculo(chaveVeiculo) {
    const veiculo = garagem[chaveVeiculo];
    if (!veiculo) { mostrarFeedback("Erro: Veículo não encontrado.", 'error'); mostrarWelcome(); return; }
    veiculoAtual = chaveVeiculo; // Atualiza o veículo atual com a chave correta

    welcomeMessage.style.display = 'none';
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });

    const tipoVeiculo = veiculo.getTipo(); // Ex: 'carro', 'esportivo'
    const containerId = `${tipoVeiculo}-container`; // Ex: 'carro-container'
    const container = document.getElementById(containerId);

    if (container) {
        container.querySelector(`#${tipoVeiculo}-modelo`).textContent = veiculo.modelo;
        container.querySelector(`#${tipoVeiculo}-cor`).textContent = veiculo.cor;
        const placaSpan = container.querySelector(`#${tipoVeiculo}-placa`);
        if (placaSpan) placaSpan.textContent = veiculo.placa || (tipoVeiculo === 'bicicleta' ? 'N/A' : 'Não informada');


        if (typeof veiculo.atualizarStatus === 'function') veiculo.atualizarStatus();
        if (typeof veiculo.atualizarVelocidade === 'function') veiculo.atualizarVelocidade();
        if (veiculo instanceof Caminhao && typeof veiculo.atualizarInfoCaminhao === 'function') veiculo.atualizarInfoCaminhao();
        if (veiculo instanceof CarroEsportivo && typeof veiculo.atualizarTurboDisplay === 'function') veiculo.atualizarTurboDisplay();
        if (typeof veiculo.atualizarDisplayManutencao === 'function') veiculo.atualizarDisplayManutencao();
        if (typeof veiculo.atualizarEstadoBotoesWrapper === 'function') veiculo.atualizarEstadoBotoesWrapper();

        // Reset da UI de previsão para o veículo atual
        const previsaoResultDiv = container.querySelector(`#previsao-tempo-resultado-${tipoVeiculo}`);
        if (previsaoResultDiv) previsaoResultDiv.innerHTML = '<p class="text-muted">Digite uma cidade e clique em "Ver Previsão".</p>';
        const cidadeInput = container.querySelector(`#cidade-previsao-input-${tipoVeiculo}`);
        if (cidadeInput) cidadeInput.value = ultimaCidadePesquisadaGlobal === "" && veiculoAtual === chaveVeiculo ? "" : ultimaCidadePesquisadaGlobal; // Mantém cidade se for a mesma global ou limpa
        const nomeCidadeSpan = container.querySelector(`#nome-cidade-previsao-${tipoVeiculo}`);
        if (nomeCidadeSpan) nomeCidadeSpan.textContent = ultimaCidadePesquisadaGlobal === "" && veiculoAtual === chaveVeiculo ? "[Cidade]" : ultimaCidadePesquisadaGlobal;

        // Atualiza os filtros para o estado global ou padrão
        container.querySelectorAll(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"]`).forEach(btn => {
            btn.classList.remove('active');
            // Se houver uma previsão global, tenta aplicar o filtro ativo dela, senão padrão 5 dias
            // Isso precisa de uma lógica mais elaborada para sincronizar estado dos filtros entre veículos
            // Por simplicidade, resetamos para 5 dias ou o filtro que estiver ativo na ultimaPrevisao...
            if (btn.dataset.dias === "5") btn.classList.add('active'); // Padrão
        });
        const destaqueChuvaCheck = container.querySelector(`#destaque-chuva-${tipoVeiculo}`);
        // if(destaqueChuvaCheck) destaqueChuvaCheck.checked = false; // Padrão ou manter estado global

        // Se já existe uma previsão global, exibe-a
        if (ultimaPrevisaoProcessadaGlobal && ultimaCidadePesquisadaGlobal && veiculoAtual === chaveVeiculo) {
             const diasAtivosBtn = document.querySelector(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"].active`);
             const diasParaExibir = diasAtivosBtn ? parseInt(diasAtivosBtn.dataset.dias) : 5;
             const destacarChuva = destaqueChuvaCheck ? destaqueChuvaCheck.checked : false;
             exibirPrevisaoDetalhada(ultimaPrevisaoProcessadaGlobal, ultimaCidadePesquisadaGlobal, `previsao-tempo-resultado-${tipoVeiculo}`, diasParaExibir, { chuva: destacarChuva });
        }


        container.style.display = 'block';
        container.classList.add('active');
        document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
        const linkSidebar = document.querySelector(`#sidebar-menu a[data-id="${chaveVeiculo}"]`);
        if (linkSidebar) linkSidebar.classList.add('active');
        mainContent.classList.add('content-visible');
    } else {
        mostrarFeedback(`Erro: Container #${containerId} não encontrado para tipo ${tipoVeiculo}.`, 'error');
        mostrarWelcome();
    }
}

function mostrarFormAddVeiculo() {
    veiculoAtual = null; // Limpa veículo atual ao mostrar form
    welcomeMessage.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
    addVeiculoForm.reset();
    addCaminhaoCapacidadeGroup.style.display = 'none';
    const placaGroup = addPlacaInput.closest('.form-group');
    // Configuração inicial do campo placa ao abrir o form (considera tipo não selecionado)
    placaGroup.style.display = 'block'; addPlacaInput.required = true; addPlacaInput.disabled = false;
    addVeiculoFormContainer.style.display = 'block';
    addVeiculoFormContainer.classList.add('active');
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    const addLink = document.querySelector('#sidebar-menu a[data-action="mostrarFormAddVeiculo"]');
    if (addLink) addLink.classList.add('active');
    mainContent.classList.add('content-visible');
}

function mostrarWelcome() {
    veiculoAtual = null;
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
    welcomeMessage.style.display = 'block';
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    mainContent.classList.remove('content-visible');
}

// TRATAMENTO DE EVENTOS
addVeiculoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addVeiculoForm);
    const tipo = formData.get('tipo');
    const modelo = formData.get('modelo').trim();
    const cor = formData.get('cor').trim();
    let placa = formData.get('placa'); // Placa pode ser null se o campo estiver desabilitado
    if(placa) placa = placa.trim().toUpperCase();


    if (!tipo || !modelo || !cor) {
        return mostrarFeedback("Tipo, modelo e cor são obrigatórios.", 'warning');
    }
    if (tipo !== 'bicicleta' && (!placa || placa.length < 5)) { // Validação de placa para não bicicletas
        return mostrarFeedback("Placa inválida ou obrigatória para este tipo de veículo (mínimo 5 caracteres).", 'warning');
    }
    if (tipo !== 'bicicleta' && garagem[placa]) { // Verifica duplicidade de placa para não bicicletas
        return mostrarFeedback(`Veículo com placa ${placa} já existe.`, 'error');
    }

    const ClasseVeiculo = mapaTiposClasse[tipo];
    if (ClasseVeiculo) {
        try {
            let novoVeiculo;
            const idParaNovoVeiculo = tipo === 'bicicleta' ? null : placa; // Bicicleta usa ID gerado, outros usam placa como ID inicial se fornecida

            if (tipo === 'caminhao') {
                const capacidade = formData.get('capacidade');
                novoVeiculo = new ClasseVeiculo(modelo, cor, parseInt(capacidade) || 5000, idParaNovoVeiculo, [], 0); // Modelo, Cor, Capacidade, ID(Placa), Histórico, CargaAtual
                if(placa && tipo !== 'bicicleta') novoVeiculo.placa = placa;
            } else if (tipo === 'esportivo') {
                novoVeiculo = new ClasseVeiculo(modelo, cor, idParaNovoVeiculo, [], false); // Modelo, Cor, ID(Placa), Histórico, Turbo
                if(placa && tipo !== 'bicicleta') novoVeiculo.placa = placa;
            } else { // Carro, Moto, Bicicleta
                novoVeiculo = new ClasseVeiculo(modelo, cor, idParaNovoVeiculo, []); // Modelo, Cor, ID(Placa ou null), Histórico
                if(placa && tipo !== 'bicicleta') novoVeiculo.placa = placa;
            }

            // Chave para o objeto garagem: placa para veículos motorizados, ID interno para bicicleta
            const chaveGaragem = (tipo !== 'bicicleta' && placa) ? placa : novoVeiculo.id;

            if (garagem[chaveGaragem]) { // Checagem final de duplicidade (importante para bicicleta com ID gerado)
                 mostrarFeedback(`Veículo com identificador ${chaveGaragem} já existe.`, 'error');
                 return; // Evita sobrescrever
            }

            garagem[chaveGaragem] = novoVeiculo;
            salvarGaragem();
            popularSidebar();
            mostrarVeiculo(chaveGaragem); // Mostra o veículo recém-adicionado
            mostrarFeedback(`'${modelo}' adicionado com sucesso!`, 'success');
            addVeiculoFormContainer.style.display = 'none';
            addVeiculoFormContainer.classList.remove('active');
        } catch (error) {
            console.error(`Erro ao criar ${tipo}:`, error);
            mostrarFeedback(`Erro ao criar ${tipo}: ${error.message}`, 'error');
        }
    } else {
        mostrarFeedback("Tipo de veículo inválido selecionado.", "error");
    }
});

cancelAddVeiculoBtn.addEventListener('click', () => {
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    if (veiculoAtual && garagem[veiculoAtual]) {
        mostrarVeiculo(veiculoAtual);
    } else {
        mostrarWelcome();
    }
});

addTipoSelect.addEventListener('change', (e) => {
    const tipo = e.target.value;
    addCaminhaoCapacidadeGroup.style.display = (tipo === 'caminhao') ? 'block' : 'none';
    const placaGroup = addPlacaInput.closest('.form-group');
    if (tipo === 'bicicleta') {
        placaGroup.style.display = 'none';
        addPlacaInput.required = false;
        addPlacaInput.disabled = true;
        addPlacaInput.value = ''; // Limpa valor da placa para bicicleta
    } else {
        placaGroup.style.display = 'block';
        addPlacaInput.required = true;
        addPlacaInput.disabled = false;
    }
});

mainContent.addEventListener('click', async (e) => {
    const target = e.target;

    // Ações do Veículo
    if (target.tagName === 'BUTTON' && target.dataset.acao && target.closest('.actions')) {
        if (!veiculoAtual || !garagem[veiculoAtual]) {
            return mostrarFeedback("Nenhum veículo selecionado para realizar a ação.", 'warning');
        }
        const veiculo = garagem[veiculoAtual];
        const acao = target.dataset.acao;
        try {
            if (typeof veiculo[acao] === 'function') {
                if (['ligar', 'desligar', 'acelerar', 'frear', 'buzinar', 'pedalar'].includes(acao)) {
                    veiculo[acao](sons); // Passa o objeto de sons para estas ações
                } else if ((acao === 'carregar' || acao === 'descarregar') && veiculo instanceof Caminhao) {
                    const cargaInput = document.getElementById('caminhao-carga-input'); // ID Fixo do input de carga
                    veiculo[acao](cargaInput ? parseFloat(cargaInput.value) : 0); // Converte para número
                    if (cargaInput) cargaInput.value = ''; // Limpa o input após a ação
                } else {
                    veiculo[acao](); // Para outras ações como ativar/desativar turbo
                }
            } else {
                console.warn(`Ação '${acao}' não encontrada no veículo ${veiculo.modelo}`);
            }
        } catch (error) {
            console.error(`Erro na ação '${acao}' do veículo ${veiculo.modelo}:`, error);
            mostrarFeedback(`Erro ao executar '${acao}': ${error.message}`, 'error');
        }
    }

    // Buscar Previsão do Tempo (CHAMANDO O BACKEND)
    if (target.classList.contains('verificar-clima-btn-veiculo')) {
        e.preventDefault();
        const botao = target;
        const tipoVeiculo = botao.dataset.veiculoTipo;
        const cidadeInput = document.getElementById(`cidade-previsao-input-${tipoVeiculo}`);
        const resultadoDiv = document.getElementById(`previsao-tempo-resultado-${tipoVeiculo}`);
        const cidade = cidadeInput ? cidadeInput.value.trim() : "";

        if (!cidade) {
            mostrarFeedback("Digite uma cidade para ver a previsão.", "warning");
            return;
        }
        if (!resultadoDiv) {
            console.error(`Elemento de resultado da previsão para ${tipoVeiculo} não encontrado.`);
            mostrarFeedback("Erro interno: não foi possível exibir a previsão.", "error");
            return;
        }

        resultadoDiv.innerHTML = `<p class="text-info">Buscando previsão para ${cidade}...</p>`;
        botao.disabled = true;

        try {
            // A URL agora aponta para o seu servidor backend
            const apiUrl = `http://localhost:3001/api/previsao/${encodeURIComponent(cidade)}`;
            console.log(`[Frontend] Chamando backend em: ${apiUrl}`);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Tenta pegar erro JSON, senão objeto vazio
                // Usa a mensagem de erro do backend, se disponível
                throw new Error(errorData.error || `Erro ${response.status} do backend ao buscar previsão.`);
            }

            const dataApi = await response.json(); // dataApi contém os dados da OpenWeatherMap, repassados pelo backend
            console.log("[Frontend] Dados da previsão recebidos do backend:", dataApi);

            const previsaoProcessada = processarDadosForecast(dataApi); // Sua função existente

            if (previsaoProcessada && previsaoProcessada.length > 0) {
                ultimaPrevisaoProcessadaGlobal = [...previsaoProcessada]; // Atualiza o cache global
                ultimaCidadePesquisadaGlobal = cidade; // Atualiza a cidade global

                const diasAtivosBtn = container.querySelector(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"].active`);
                const diasParaExibir = diasAtivosBtn ? parseInt(diasAtivosBtn.dataset.dias) : 5;
                const destaqueChuvaCheck = container.querySelector(`#destaque-chuva-${tipoVeiculo}`);
                const destacarChuva = destaqueChuvaCheck ? destaqueChuvaCheck.checked : false;
                
                exibirPrevisaoDetalhada(previsaoProcessada, cidade, resultadoDiv.id, diasParaExibir, { chuva: destacarChuva });
            } else {
                if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-warning">Não foi possível processar a previsão para ${cidade} a partir dos dados do backend.</p>`;
                ultimaPrevisaoProcessadaGlobal = null;
                ultimaCidadePesquisadaGlobal = "";
            }

        } catch (error) {
            console.error("[Frontend] Erro ao buscar previsão via backend:", error);
            if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-danger">Falha: ${error.message}</p>`;
            mostrarFeedback(`Falha ao buscar previsão: ${error.message}`, 'error');
            ultimaPrevisaoProcessadaGlobal = null;
            ultimaCidadePesquisadaGlobal = "";
        } finally {
            botao.disabled = false;
        }
    }

    // Filtro de Dias da Previsão
    if (target.classList.contains('filtro-dias-btn')) {
        e.preventDefault();
        const botaoFiltro = target;
        const tipoVeiculo = botaoFiltro.dataset.veiculoTipo; // Pega o tipo do botão
        const dias = parseInt(botaoFiltro.dataset.dias);

        // Remove 'active' de todos os botões de filtro para este tipo de veículo
        document.querySelectorAll(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"]`).forEach(b => b.classList.remove('active'));
        botaoFiltro.classList.add('active'); // Adiciona 'active' ao botão clicado

        if (ultimaPrevisaoProcessadaGlobal && ultimaCidadePesquisadaGlobal) {
            const destaqueChuvaCheck = document.getElementById(`destaque-chuva-${tipoVeiculo}`);
            const destacarChuva = destaqueChuvaCheck ? destaqueChuvaCheck.checked : false;
            exibirPrevisaoDetalhada(ultimaPrevisaoProcessadaGlobal, ultimaCidadePesquisadaGlobal, `previsao-tempo-resultado-${tipoVeiculo}`, dias, { chuva: destacarChuva });
        } else {
            const resultadoDiv = document.getElementById(`previsao-tempo-resultado-${tipoVeiculo}`);
            if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-muted">Busque uma cidade primeiro para aplicar filtros.</p>`;
        }
    }

    // Remover Manutenção
    if (target.classList.contains('remover-manutencao-btn')) {
        const idManut = target.dataset.id;
        if (veiculoAtual && garagem[veiculoAtual] && idManut) {
            if (confirm("Tem certeza que deseja remover este registro de manutenção?")) {
                garagem[veiculoAtual].removerManutencao(idManut); // A classe Veiculo já deve salvar e atualizar a UI
            }
        } else {
            mostrarFeedback("Não foi possível identificar o veículo ou o registro de manutenção para remoção.", 'warning');
        }
    }
});

function inicializarListenersDeToggleChuva() {
    document.querySelectorAll('.toggle-destaque-chuva').forEach(checkbox => {
        checkbox.addEventListener('change', function() { // Usando 'function' para ter o 'this' correto
            const tipoVeiculo = this.dataset.veiculoTipo;
            const destacarChuva = this.checked;
            const resultadoDivId = `previsao-tempo-resultado-${tipoVeiculo}`;

            const diasAtivosBtn = document.querySelector(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"].active`);
            const diasParaExibir = diasAtivosBtn ? parseInt(diasAtivosBtn.dataset.dias) : 5;

            if (ultimaPrevisaoProcessadaGlobal && ultimaCidadePesquisadaGlobal) {
                exibirPrevisaoDetalhada(ultimaPrevisaoProcessadaGlobal, ultimaCidadePesquisadaGlobal, resultadoDivId, diasParaExibir, { chuva: destacarChuva });
            } else {
                 // Opcional: pode mostrar um feedback se não houver previsão para aplicar o toggle
                 // console.log("Nenhuma previsão carregada para aplicar o destaque de chuva.");
            }
        });
    });
}

mainContent.addEventListener('submit', (e) => { // Formulário de Manutenção
    if (e.target.classList.contains('manutencao-form')) {
        e.preventDefault();
        if (!veiculoAtual || !garagem[veiculoAtual]) {
            return mostrarFeedback("Selecione um veículo para adicionar manutenção.", 'error');
        }
        const veiculo = garagem[veiculoAtual];
        const form = e.target;
        const dataInput = form.querySelector('input[type="datetime-local"]');
        const tipoManutInput = form.querySelector('input[placeholder="Tipo"]'); // Assume que o placeholder é "Tipo"
        const custoInput = form.querySelector('input[type="number"]');
        const descInput = form.querySelector('textarea');

        // Validação simples dos inputs
        if (!dataInput || !tipoManutInput || !custoInput || !descInput) {
            return mostrarFeedback("Erro: Formulário de manutenção incompleto.", 'error');
        }
        if (!dataInput.value || !tipoManutInput.value.trim() || !custoInput.value) {
            return mostrarFeedback("Data, Tipo e Custo da manutenção são obrigatórios.", 'warning');
        }

        const data = dataInput.value;
        const tipoManut = tipoManutInput.value.trim();
        const custo = parseFloat(custoInput.value);
        const desc = descInput.value.trim();

        const novaManut = new Manutencao(data, tipoManut, custo, desc);
        const validacao = novaManut.validar();

        if (validacao.valido) {
            if (veiculo.adicionarManutencao(novaManut)) {
                form.reset(); // Limpa o formulário se adicionado com sucesso
                mostrarFeedback("Manutenção adicionada com sucesso!", 'success'); // Feedback já está em adicionarManutencao
            } else {
                // A função adicionarManutencao já deve mostrar feedback de erro interno se necessário
            }
        } else {
            mostrarFeedback(`Dados da manutenção inválidos: ${validacao.erros.join(', ')}`, 'error');
        }
    }
});

sidebarMenu.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'mostrarFormAddVeiculo' && e.target.closest('li.sidebar-action a')) {
        e.preventDefault();
        mostrarFormAddVeiculo();
    }
});

// INICIALIZAÇÃO
function init() {
    console.log("Iniciando Garagem Inteligente Interativa...");
    carregarGaragem();
    popularSidebar();
    inicializarListenersDeToggleChuva();

    if (Object.keys(garagem).length > 0) {
        // Seleciona o primeiro veículo da lista ordenada por modelo para exibir inicialmente
        const primeiraChave = Object.keys(garagem).sort((a, b) => {
            const veiculoA = garagem[a];
            const veiculoB = garagem[b];
            if (veiculoA && veiculoB && veiculoA.modelo && veiculoB.modelo) {
                return veiculoA.modelo.localeCompare(veiculoB.modelo);
            }
            return 0; // Fallback se modelo não existir
        })[0];
        if (primeiraChave) mostrarVeiculo(primeiraChave);
        else mostrarWelcome(); // Caso não haja chaves válidas
    } else {
        mostrarWelcome();
    }

    // Ajusta a visibilidade do campo placa no formulário de adicionar, baseado no tipo selecionado inicialmente (nenhum)
    const placaGroup = addPlacaInput.closest('.form-group');
    if (addTipoSelect.value === 'bicicleta') { // Verifica o valor atual do select
        placaGroup.style.display = 'none';
        addPlacaInput.required = false;
        addPlacaInput.disabled = true;
    } else {
        placaGroup.style.display = 'block';
        addPlacaInput.required = true;
        addPlacaInput.disabled = false;
    }
    console.log("Garagem Inteligente pronta!");
}

document.addEventListener('DOMContentLoaded', init);