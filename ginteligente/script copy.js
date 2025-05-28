/**
 * @file script.js
 * @brief Script principal da aplicação Garagem Inteligente.
 * Gerencia a criação, exibição, interação, persistência dos veículos e previsão do tempo interativa.
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
// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
const apiKeyOpenWeather = "bd5e378503939ddaee76f12ad7a97608";
const openWeatherMapApiBaseUrl = "https://api.openweathermap.org/data/2.5/";

let feedbackTimeout;
function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackDiv = document.getElementById('feedback-message');
    if (feedbackDiv) {
        clearTimeout(feedbackTimeout);
        feedbackDiv.textContent = mensagem;
        feedbackDiv.className = `feedback ${tipo}`;
        feedbackDiv.style.display = 'block';
        feedbackTimeout = setTimeout(() => { feedbackDiv.style.display = 'none'; }, 5000);
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
window.salvarGaragem = salvarGaragem;

function carregarGaragem() {
    const garagemSalva = localStorage.getItem('garagemInteligente');
    if (garagemSalva) {
        try {
            const garagemArrayJSON = JSON.parse(garagemSalva);
            garagem = {};
            garagemArrayJSON.forEach(veiculoData => {
                const ClasseVeiculo = mapaTiposClasse[veiculoData.tipo];
                if (ClasseVeiculo) {
                    const veiculo = new ClasseVeiculo(
                        veiculoData.modelo, veiculoData.cor, veiculoData.placa,
                        veiculoData.id,
                        veiculoData.historicoManutencao ? veiculoData.historicoManutencao.map(m => Manutencao.fromJSON(m)).filter(m => m) : [],
                        veiculoData.capacidadeCarga, veiculoData.cargaAtual, veiculoData.turboAtivado
                    );
                    const chaveGaragem = veiculo.placa || veiculo.id;
                    if (chaveGaragem) garagem[chaveGaragem] = veiculo;
                }
            });
        } catch (error) {
            console.error("Erro ao carregar garagem:", error); garagem = {};
            localStorage.removeItem('garagemInteligente');
            mostrarFeedback("Erro ao carregar dados. Garagem resetada.", 'error');
        }
    }
}

// FUNÇÕES DA API DE PREVISÃO DO TEMPO
/** @description Busca a previsão do tempo detalhada. */
async function buscarPrevisaoDetalhada(cidade) {
    if (!cidade) throw new Error("Nome da cidade não fornecido.");
    const url = `${openWeatherMapApiBaseUrl}forecast?q=${encodeURIComponent(cidade)}&appid=${apiKeyOpenWeather}&units=metric&lang=pt_br`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Erro ${response.status}.`);
    return data;
}

/** @description Processa os dados brutos da API para um formato diário. */
function processarDadosForecast(dataApi) {
    if (!dataApi || !dataApi.list || !Array.isArray(dataApi.list) || dataApi.list.length === 0) return null;
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
    return previsaoDiariaFinal.slice(0, 5);
}

/** @description Formata data "AAAA-MM-DD" para "DD/MM". */
function formatarDataPtBr(dataString) {
    const partes = dataString.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}` : dataString;
}

/** @description Exibe a previsão detalhada na UI. */
function exibirPrevisaoDetalhada(previsaoDiariaProcessada, nomeCidade, elementoResultadoId, diasParaExibir = 5, opcoesDestaque = { chuva: false }) {
    const resultadoDiv = document.getElementById(elementoResultadoId);
    const tipoVeiculo = elementoResultadoId.split('-').pop();
    const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);

    if (!resultadoDiv) return;
    resultadoDiv.innerHTML = '';
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
    Object.values(garagem).sort((a,b) => a.modelo.localeCompare(b.modelo)).forEach(v => {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        const idHtml = v.placa || v.id;
        li.innerHTML = `<a href="#" data-id="${idHtml}">${v.modelo} (${v.placa || 'Sem Placa'})</a>`;
        li.querySelector('a').addEventListener('click', e => { e.preventDefault(); mostrarVeiculo(idHtml); });
        if (addActionItem) sidebarMenu.insertBefore(li, addActionItem); else sidebarMenu.appendChild(li);
    });
}

function mostrarVeiculo(chaveVeiculo) {
    const veiculo = garagem[chaveVeiculo];
    if (!veiculo) { mostrarFeedback("Erro: Veículo não encontrado.", 'error'); mostrarWelcome(); return; }
    veiculoAtual = chaveVeiculo;

    welcomeMessage.style.display = 'none';
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });

    const tipoVeiculo = veiculo.getTipo();
    const containerId = `${tipoVeiculo}-container`;
    const container = document.getElementById(containerId);

    if (container) {
        container.querySelector(`#${tipoVeiculo}-modelo`).textContent = veiculo.modelo;
        container.querySelector(`#${tipoVeiculo}-cor`).textContent = veiculo.cor;
        const placaSpan = container.querySelector(`#${tipoVeiculo}-placa`);
        if (placaSpan) placaSpan.textContent = veiculo.placa || 'N/A';

        if (typeof veiculo.atualizarStatus === 'function') veiculo.atualizarStatus();
        if (typeof veiculo.atualizarVelocidade === 'function') veiculo.atualizarVelocidade();
        if (veiculo instanceof Caminhao) veiculo.atualizarInfoCaminhao();
        if (veiculo instanceof CarroEsportivo) veiculo.atualizarTurboDisplay();
        if (typeof veiculo.atualizarDisplayManutencao === 'function') veiculo.atualizarDisplayManutencao();
        if (typeof veiculo.atualizarEstadoBotoesWrapper === 'function') veiculo.atualizarEstadoBotoesWrapper();

        // Reset da UI de previsão
        const previsaoResultDiv = container.querySelector(`#previsao-tempo-resultado-${tipoVeiculo}`);
        if (previsaoResultDiv) previsaoResultDiv.innerHTML = '<p class="text-muted">Digite uma cidade e clique em "Ver Previsão".</p>';
        const cidadeInput = container.querySelector(`#cidade-previsao-input-${tipoVeiculo}`);
        if (cidadeInput) cidadeInput.value = '';
        const nomeCidadeSpan = container.querySelector(`#nome-cidade-previsao-${tipoVeiculo}`);
        if (nomeCidadeSpan) nomeCidadeSpan.textContent = "[Cidade]";
        
        // Reset dos filtros para o padrão (5 dias, destaque chuva desmarcado)
        container.querySelectorAll(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"]`).forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.dias === "5") btn.classList.add('active');
        });
        const destaqueChuvaCheck = container.querySelector(`#destaque-chuva-${tipoVeiculo}`);
        if(destaqueChuvaCheck) destaqueChuvaCheck.checked = false;


        container.style.display = 'block';
        container.classList.add('active');
        document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
        const linkSidebar = document.querySelector(`#sidebar-menu a[data-id="${chaveVeiculo}"]`);
        if (linkSidebar) linkSidebar.classList.add('active');
        mainContent.classList.add('content-visible');
    } else {
        mostrarFeedback(`Erro: Container #${containerId} não encontrado.`, 'error');
        mostrarWelcome();
    }
}

function mostrarFormAddVeiculo() {
    veiculoAtual = null;
    welcomeMessage.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(c => {c.style.display='none'; c.classList.remove('active');});
    addVeiculoForm.reset();
    addCaminhaoCapacidadeGroup.style.display = 'none';
    const placaGroup = addPlacaInput.closest('.form-group');
    placaGroup.style.display = 'block'; addPlacaInput.required = true; addPlacaInput.disabled = false;
    addVeiculoFormContainer.style.display = 'block';
    addVeiculoFormContainer.classList.add('active');
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    const addLink = document.querySelector('#sidebar-menu a[data-action="mostrarFormAddVeiculo"]');
    if(addLink) addLink.classList.add('active');
    mainContent.classList.add('content-visible');
}

function mostrarWelcome() {
    veiculoAtual = null;
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(c => {c.style.display='none';c.classList.remove('active');});
    welcomeMessage.style.display = 'block';
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    mainContent.classList.remove('content-visible');
}

// TRATAMENTO DE EVENTOS
addVeiculoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addVeiculoForm);
    const tipo = formData.get('tipo'), modelo = formData.get('modelo').trim(), cor = formData.get('cor').trim();
    let placa = formData.get('placa');
    if(placa) placa = placa.trim().toUpperCase();
    const capacidade = formData.get('capacidade');

    if (!tipo || !modelo || !cor) return mostrarFeedback("Tipo, modelo e cor são obrigatórios.", 'warning');
    if (tipo !== 'bicicleta' && (!placa || placa.length < 5)) return mostrarFeedback("Placa inválida ou obrigatória.", 'warning');
    if (tipo !== 'bicicleta' && garagem[placa]) return mostrarFeedback(`Veículo com placa ${placa} já existe.`, 'error');

    const ClasseVeiculo = mapaTiposClasse[tipo];
    if (ClasseVeiculo) {
        try {
            let novoVeiculo;
            if (tipo === 'caminhao') novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, [], parseInt(capacidade) || 5000, 0);
            else if (tipo === 'esportivo') novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, [], false);
            else novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, []);
            
            const chaveGaragem = novoVeiculo.placa || novoVeiculo.id;
            if (!chaveGaragem || (garagem[chaveGaragem] && tipo !== 'bicicleta')) throw new Error("Identificador de veículo inválido ou duplicado.");
            
            garagem[chaveGaragem] = novoVeiculo;
            salvarGaragem(); popularSidebar(); mostrarVeiculo(chaveGaragem);
            mostrarFeedback(`'${modelo}' adicionado!`, 'success');
            addVeiculoFormContainer.style.display = 'none';
            addVeiculoFormContainer.classList.remove('active');
        } catch (error) {
            mostrarFeedback(`Erro ao criar ${tipo}: ${error.message}`, 'error');
        }
    }
});

cancelAddVeiculoBtn.addEventListener('click', () => {
    addVeiculoFormContainer.style.display = 'none';
    addVeiculoFormContainer.classList.remove('active');
    if (veiculoAtual && garagem[veiculoAtual]) mostrarVeiculo(veiculoAtual); else mostrarWelcome();
});

addTipoSelect.addEventListener('change', (e) => {
    const tipo = e.target.value;
    addCaminhaoCapacidadeGroup.style.display = (tipo === 'caminhao') ? 'block' : 'none';
    const placaGroup = addPlacaInput.closest('.form-group');
    if (tipo === 'bicicleta') {
        placaGroup.style.display = 'none'; addPlacaInput.required = false; addPlacaInput.disabled = true; addPlacaInput.value = '';
    } else {
        placaGroup.style.display = 'block'; addPlacaInput.required = true; addPlacaInput.disabled = false;
    }
});

mainContent.addEventListener('click', async (e) => {
    const target = e.target;

    // Ações do Veículo
    if (target.tagName === 'BUTTON' && target.dataset.acao && target.closest('.actions')) {
        if (!veiculoAtual || !garagem[veiculoAtual]) return mostrarFeedback("Nenhum veículo selecionado.", 'warning');
        const veiculo = garagem[veiculoAtual]; const acao = target.dataset.acao;
        try {
            if (typeof veiculo[acao] === 'function') {
                if (['ligar', 'desligar', 'acelerar', 'frear', 'buzinar', 'pedalar'].includes(acao)) {
                    veiculo[acao](sons);
                } else if ((acao === 'carregar' || acao === 'descarregar') && veiculo instanceof Caminhao) {
                    const cargaInput = document.getElementById('caminhao-carga-input'); // ID Fixo
                    veiculo[acao](cargaInput ? parseInt(cargaInput.value) : 0);
                    if(cargaInput) cargaInput.value = '';
                } else {
                    veiculo[acao]();
                }
            }
        } catch (error) { mostrarFeedback(`Erro na ação '${acao}': ${error.message}`, 'error'); }
    }

    // Buscar Previsão do Tempo
    if (target.classList.contains('verificar-clima-btn-veiculo')) {
        e.preventDefault();
        const botao = target; const tipoVeiculo = botao.dataset.veiculoTipo;
        const cidadeInput = document.getElementById(`cidade-previsao-input-${tipoVeiculo}`);
        const resultadoDiv = document.getElementById(`previsao-tempo-resultado-${tipoVeiculo}`);
        const cidade = cidadeInput ? cidadeInput.value.trim() : "";

        if (!cidade) return mostrarFeedback("Digite uma cidade.", "warning");
        if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-info">Buscando previsão para ${cidade}...</p>`;
        botao.disabled = true;

        try {
            const dadosBrutos = await buscarPrevisaoDetalhada(cidade);
            const previsaoProcessada = processarDadosForecast(dadosBrutos);
            if (previsaoProcessada && previsaoProcessada.length > 0) {
                ultimaPrevisaoProcessadaGlobal = [...previsaoProcessada];
                ultimaCidadePesquisadaGlobal = cidade;
                
                const diasAtivosBtn = document.querySelector(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"].active`);
                const diasParaExibir = diasAtivosBtn ? parseInt(diasAtivosBtn.dataset.dias) : 5;
                const destaqueChuvaCheck = document.getElementById(`destaque-chuva-${tipoVeiculo}`);
                const destacarChuva = destaqueChuvaCheck ? destaqueChuvaCheck.checked : false;

                exibirPrevisaoDetalhada(previsaoProcessada, cidade, resultadoDiv.id, diasParaExibir, { chuva: destacarChuva });
                // Resetar filtros para o padrão após nova busca
                document.querySelectorAll(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"]`).forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.dias === "5") btn.classList.add('active');
                });
                // Manter o estado do checkbox de chuva ou resetar? Por ora, mantém.
            } else {
                if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-warning">Não foi possível processar previsão para ${cidade}.</p>`;
                ultimaPrevisaoProcessadaGlobal = null; ultimaCidadePesquisadaGlobal = "";
            }
        } catch (error) {
            if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-danger">Erro: ${error.message}</p>`;
            ultimaPrevisaoProcessadaGlobal = null; ultimaCidadePesquisadaGlobal = "";
        } finally {
            botao.disabled = false;
        }
    }

    // Filtro de Dias da Previsão
    if (target.classList.contains('filtro-dias-btn')) {
        e.preventDefault();
        const botaoFiltro = target; const tipoVeiculo = botaoFiltro.dataset.veiculoTipo;
        const dias = parseInt(botaoFiltro.dataset.dias);
        document.querySelectorAll(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"]`).forEach(b => b.classList.remove('active'));
        botaoFiltro.classList.add('active');

        if (ultimaPrevisaoProcessadaGlobal && ultimaCidadePesquisadaGlobal) {
            const destaqueChuvaCheck = document.getElementById(`destaque-chuva-${tipoVeiculo}`);
            const destacarChuva = destaqueChuvaCheck ? destaqueChuvaCheck.checked : false;
            exibirPrevisaoDetalhada(ultimaPrevisaoProcessadaGlobal, ultimaCidadePesquisadaGlobal, `previsao-tempo-resultado-${tipoVeiculo}`, dias, { chuva: destacarChuva });
        } else {
            const resultadoDiv = document.getElementById(`previsao-tempo-resultado-${tipoVeiculo}`);
            if(resultadoDiv) resultadoDiv.innerHTML = `<p class="text-muted">Busque uma cidade primeiro.</p>`;
        }
    }

    // Remover Manutenção
    if (target.classList.contains('remover-manutencao-btn')) {
        const idManut = target.dataset.id;
        if (veiculoAtual && garagem[veiculoAtual] && idManut && confirm("Remover este registro?")) {
            garagem[veiculoAtual].removerManutencao(idManut); // Classe deve salvar e atualizar UI
        }
    }
});

// Listener para o toggle de destacar chuva (usando 'change' é mais apropriado)
// Como mainContent ouve 'click', vamos adicionar listeners separados para 'change' nos checkboxes
// Isso deve ser feito após o DOM estar carregado, idealmente no init ou após a criação dos elementos
// Para simplificar, vamos adicionar aqui, mas uma solução mais robusta seria delegar 'change' se os elementos fossem dinâmicos
// No entanto, como eles estão no HTML estático (embora dentro de divs que aparecem/desaparecem), podemos fazer no init.

function inicializarListenersDeToggleChuva() {
    document.querySelectorAll('.toggle-destaque-chuva').forEach(checkbox => {
        checkbox.addEventListener('change', function() { // O 'this' aqui é o checkbox
            const tipoVeiculo = this.dataset.veiculoTipo;
            const destacarChuva = this.checked;
            const resultadoDivId = `previsao-tempo-resultado-${tipoVeiculo}`;

            const diasAtivosBtn = document.querySelector(`.filtro-dias-btn[data-veiculo-tipo="${tipoVeiculo}"].active`);
            const diasParaExibir = diasAtivosBtn ? parseInt(diasAtivosBtn.dataset.dias) : 5;

            if (ultimaPrevisaoProcessadaGlobal && ultimaCidadePesquisadaGlobal) {
                exibirPrevisaoDetalhada(ultimaPrevisaoProcessadaGlobal, ultimaCidadePesquisadaGlobal, resultadoDivId, diasParaExibir, { chuva: destacarChuva });
            }
        });
    });
}


mainContent.addEventListener('submit', (e) => { // Formulário de Manutenção
    if (e.target.classList.contains('manutencao-form')) {
        e.preventDefault();
        if (!veiculoAtual || !garagem[veiculoAtual]) return mostrarFeedback("Selecione um veículo.", 'error');
        const veiculo = garagem[veiculoAtual]; const form = e.target;
        const data = form.querySelector('input[type="datetime-local"]').value;
        const tipoManut = form.querySelector('input[placeholder="Tipo"]').value.trim();
        const custo = form.querySelector('input[type="number"]').value;
        const desc = form.querySelector('textarea').value.trim();
        const novaManut = new Manutencao(data, tipoManut, custo, desc);
        if (novaManut.validar().valido) {
            if (veiculo.adicionarManutencao(novaManut)) form.reset();
        } else {
            mostrarFeedback(`Dados inválidos: ${novaManut.validar().erros.join(', ')}`, 'error');
        }
    }
});

sidebarMenu.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'mostrarFormAddVeiculo' && e.target.closest('li.sidebar-action a')) {
        e.preventDefault(); mostrarFormAddVeiculo();
    }
});

// INICIALIZAÇÃO
function init() {
    console.log("Iniciando Garagem Inteligente Interativa...");
    carregarGaragem();
    popularSidebar();
    inicializarListenersDeToggleChuva(); // Adiciona listeners aos checkboxes

    if (Object.keys(garagem).length > 0) {
        const primeiraChave = Object.keys(garagem).sort((a,b) => garagem[a].modelo.localeCompare(garagem[b].modelo))[0];
        mostrarVeiculo(primeiraChave);
    } else {
        mostrarWelcome();
    }

    const placaGroup = addPlacaInput.closest('.form-group');
    if (addTipoSelect.value !== 'bicicleta') {
        placaGroup.style.display = 'block'; addPlacaInput.required = true; addPlacaInput.disabled = false;
    } else {
        placaGroup.style.display = 'none'; addPlacaInput.required = false; addPlacaInput.disabled = true;
    }
    console.log("Garagem Inteligente pronta!");
}

document.addEventListener('DOMContentLoaded', init);