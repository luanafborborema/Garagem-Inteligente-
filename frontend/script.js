// Conteúdo COMPLETO do arquivo JavaScript principal do frontend.

// --- MÓDULOS (Suas classes e funções auxiliares que serão importadas) ---
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js'; // Linha 7 corrigida
import { Bicicleta } from './Bicicleta.js';
import { Manutencao } from './Manutencao.js';
// As funções auxiliares também precisam ser importadas para uso no script principal.
import {
    mostrarFeedback,
    atualizarInfoVeiculo,
    atualizarEstadoBotoes,
} from './funcoesAuxiliares.js';


// =====================================================================================
//  *** PASSO CRÍTICO: CONFIGURAÇÃO DA URL DO SEU BACKEND! ***
//  Mude 'backendUrl' para apontar para seu servidor Render QUANDO FOR PUBLICAR.
// =====================================================================================
const backendLocalUrl = 'http://localhost:3001'; // URL para testes locais (quando seu backend está rodando no seu PC)
// SUBSTITUA A SEGUINTE URL PELA SUA URL REAL E PÚBLICA DO SEU SERVIÇO NO RENDER.
// Ex: "https://seu-nome-da-garagem.onrender.com"
const backendRenderUrl = 'https://garagem-inteligente.onrender.com'; // ESTE É UM EXEMPLO, COLOQUE A SUA AQUI!

// IMPORTANTE: Mude esta linha para 'backendRenderUrl' QUANDO FOR FAZER O DEPLOY FINAL/AVALIAÇÃO!
const backendUrl = backendLocalUrl; // Atualmente configurado para teste local


console.log(
    `[FRONTEND] O script principal foi carregado. As requisições serão enviadas para: ${backendUrl}`
);


// =====================================================================
//  *** Variáveis Globais de Controle de Veículos e Sons ***
// =====================================================================

// Este objeto irá armazenar as instâncias de objetos de seus veículos (da POO).
const veiculosInstanciados = {};

// Mapa que associa o 'tipo' de string (do formulário, por exemplo) à sua respectiva classe JavaScript.
const classesVeiculos = {
    carro: Carro,
    esportivo: CarroEsportivo,
    caminhao: Caminhao,
    moto: Moto,
    bicicleta: Bicicleta,
};

// Objeto contendo referências aos elementos <audio> para tocar os sons.
const sons = {
    ligar: new Audio('sons/ligar.mp3'),
    desligar: new Audio('sons/desligar.mp3'),
    acelerar: new Audio('sons/acelerar.mp3'),
    frear: new Audio('sons/frear.mp3'),
    buzina: new Audio('sons/buzina.mp3'),
    // Adicione aqui se tiver mais sons para suas classes de veículo:
    // campainha: new Audio('sons/campainha.mp3'),
    // freioBike: new Audio('sons/freio_bike.mp3')
};
window.sons = sons;

let veiculoAtivoId = null;

// Referência ao elemento main-content para tratamento de eventos.
// ESTA É A CORREÇÃO: DECLARANDO MAINCONTENT AQUI, GLOBALMENTE.
const mainContent = document.getElementById('main-content');

// ===========================================================================
// FUNÇÕES AUXILIARES DA APLICAÇÃO (INTEGRANDO POO E UI)
// ===========================================================================

function atualizarDisplayManutencaoUI(veiculoInstancia) {
    const prefix = veiculoInstancia.getIdPrefix();
    const historicoListaUl = document.getElementById(`${prefix}-historico-lista`);
    const agendamentosListaUl = document.getElementById(`${prefix}-agendamentos-lista`);

    if (!historicoListaUl || !agendamentosListaUl) {
        console.warn(
            `[Frontend] Listas de manutenção HTML para "${prefix}" não encontradas. Garanta que o container do veículo esteja visível.`
        );
        return;
    }

    const { historicoPassado, agendamentosFuturos } =
        veiculoInstancia.getManutencoesSeparadas();

    const popularLista = (ulElement, listaItens, mensagemVazio, formatarFn) => {
        ulElement.innerHTML = '';
        if (listaItens.length === 0) {
            ulElement.innerHTML = `<li>${mensagemVazio}</li>`;
        } else {
            listaItens.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = formatarFn(item);
                ulElement.appendChild(li);
            });
        }
    };

    popularLista(
        historicoListaUl,
        historicoPassado,
        'Nenhum registro de manutenção.',
        m => m.formatarParaHistorico()
    );
    popularLista(
        agendamentosListaUl,
        agendamentosFuturos,
        'Nenhum agendamento futuro.',
        m => m.formatarParaAgendamento()
    );
}

function adicionarVeiculoAoSistema(veiculoObj) {
    veiculosInstanciados[veiculoObj.id] = veiculoObj;

    const sidebarMenu = document.getElementById('sidebar-menu');
    const btnAdd = sidebarMenu.querySelector(
        'li[data-action="mostrarFormAddVeiculo"]'
    );

    const li = document.createElement('li');
    li.dataset.veiculoId = veiculoObj.id;
    li.dataset.veiculoTipo = veiculoObj.getTipo();
    li.className = 'veiculo-item';

    const displayId = veiculoObj.placa ? `${veiculoObj.modelo} (${veiculoObj.placa})` : `${veiculoObj.modelo} (ID: ${veiculoObj.id.substring(veiculoObj.id.indexOf('_')+1)})`;
    li.innerHTML = `<a href="#" data-veiculo-id="${veiculoObj.id}">${displayId}</a>`;

    sidebarMenu.insertBefore(li, btnAdd);

    li.querySelector('a').addEventListener('click', e => {
        e.preventDefault();
        mostrarVeiculoContainer(veiculoObj.id);
    });

    veiculoObj.atualizarDisplayManutencao();
    veiculoObj.atualizarStatus();
    veiculoObj.atualizarVelocidade();
    if (veiculoObj.atualizarTurboDisplay) veiculoObj.atualizarTurboDisplay();
    if (veiculoObj.atualizarInfoCaminhao) veiculoObj.atualizarInfoCaminhao();
    veiculoObj.atualizarEstadoBotoesWrapper();
}

function mostrarVeiculoContainer(veiculoId) {
    document.getElementById('welcome-message').style.display = 'none';
    document.getElementById('add-veiculo-form-container').style.display = 'none';

    document.querySelectorAll('.veiculo-container').forEach(div => (div.style.display = 'none'));

    document.querySelectorAll('#sidebar-menu li a').forEach(a =>
        a.classList.remove('active')
    );

    const veiculoInstance = veiculosInstanciados[veiculoId];
    if (veiculoInstance) {
        const prefix = veiculoInstance.getIdPrefix();
        const container = document.getElementById(`${prefix}-container`);
        if (container) {
            container.style.display = 'block';
            veiculoAtivoId = veiculoId;

            const linkAtivo = document.querySelector(
                `#sidebar-menu li[data-veiculo-id="${veiculoId}"] a`
            );
            if (linkAtivo) linkAtivo.classList.add('active');

            container.querySelector(`#${prefix}-modelo`).textContent = veiculoInstance.modelo;
            container.querySelector(`#${prefix}-cor`).textContent = veiculoInstance.cor;
            const placaSpan = container.querySelector(`#${prefix}-placa`);
            if (placaSpan) placaSpan.textContent = veiculoInstance.placa || '---';
            
            veiculoInstance.atualizarStatus();
            veiculoInstance.atualizarVelocidade();
            veiculoInstance.atualizarDisplayManutencao();
            if (veiculoInstance.atualizarTurboDisplay) veiculoInstance.atualizarTurboDisplay();
            if (veiculoInstance.atualizarInfoCaminhao) veiculoInstance.atualizarInfoCaminhao();
            veiculoInstance.atualizarEstadoBotoesWrapper();

            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.error(
                `[Frontend] ERRO: O elemento container HTML com ID "${prefix}-container" não foi encontrado na página para o veículo ID: ${veiculoId}.`
            );
            mostrarFeedback(
                'Erro: O layout do veículo não pôde ser carregado na página. Verifique o HTML.',
                'error'
            );
        }
    } else {
        console.error(
            `[Frontend] ERRO: A instância do veículo com ID "${veiculoId}" não foi encontrada no mapa global "veiculosInstanciados".`
        );
        mostrarFeedback(
            'Erro: Não foi possível encontrar os dados do veículo para exibir.',
            'error'
        );
    }
}

async function carregarGaragem() {
    try {
        console.log('[FRONTEND] Buscando veículos do backend para carregar a garagem...');
        const response = await fetch(`${backendUrl}/api/veiculos`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro (${response.status}): Falha ao carregar veículos do backend.`);
        }
        
        const veiculosDoBackend = await response.json();

        Object.keys(veiculosInstanciados).forEach(key => delete veiculosInstanciados[key]);
        const sidebarMenu = document.getElementById('sidebar-menu');
        sidebarMenu.querySelectorAll('li.veiculo-item').forEach(item => item.remove());

        if (veiculosDoBackend.length > 0) {
            veiculosDoBackend.forEach(dadosVeiculo => {
                // Adapte para instanciar o tipo correto.
                let ClasseVeiculoConstructor; // Definir o construtor da classe correta

                // Se seu backend **não está salvando o `tipo` do veículo (carro, moto etc.)** no banco,
                // precisamos tentar "adivinhar" ou usar um padrão.
                // Como a A1 não pediu para salvar o tipo, faremos uma lógica para tentar identificar.
                // A solução "correta" em uma aplicação real seria persistir o `tipo` no banco de dados.
                // Isso é uma *solução paliativa* para continuar com a atividade A1.
                const modeloLowerCase = dadosVeiculo.modelo.toLowerCase();

                if (modeloLowerCase.includes('cybertruck') || modeloLowerCase.includes('porsche taycan') || modeloLowerCase.includes('ferrari')) {
                    ClasseVeiculoConstructor = CarroEsportivo;
                } else if (modeloLowerCase.includes('scania') || modeloLowerCase.includes('caminhao') || modeloLowerCase.includes('ford cargo')) {
                    ClasseVeiculoConstructor = Caminhao;
                } else if (modeloLowerCase.includes('moto') || modeloLowerCase.includes('honda cb')) {
                    ClasseVeiculoConstructor = Moto;
                } else if (modeloLowerCase.includes('bicicleta') || modeloLowerCase.includes('caloi')) {
                    ClasseVeiculoConstructor = Bicicleta;
                } else {
                    ClasseVeiculoConstructor = Carro; // Padrão
                }
                
                let novaInstancia;
                const modeloVeiculoFront = dadosVeiculo.modelo || 'Modelo Desconhecido';
                const corVeiculoFront = dadosVeiculo.cor || 'Cor Indefinida';
                const idVeiculoFront = dadosVeiculo.placa || dadosVeiculo._id; 
                
                // Construa a instância passando os parâmetros necessários ao construtor da classe identificada
                if (ClasseVeiculoConstructor === CarroEsportivo) {
                    novaInstancia = new ClasseVeiculoConstructor(
                        modeloVeiculoFront,
                        corVeiculoFront,
                        idVeiculoFront,
                        [], // historico
                        dadosVeiculo.turboAtivado // Esperado se vier do banco, senão false
                    );
                } else if (ClasseVeiculoConstructor === Caminhao) {
                    novaInstancia = new ClasseVeiculoConstructor(
                        modeloVeiculoFront,
                        corVeiculoFront,
                        dadosVeiculo.capacidadeCarga || 5000, // Capacidade se vier, senão 5000
                        idVeiculoFront,
                        [], // historico
                        dadosVeiculo.cargaAtual || 0 // Carga atual se vier, senão 0
                    );
                } else {
                    novaInstancia = new ClasseVeiculoConstructor(
                        modeloVeiculoFront,
                        corVeiculoFront,
                        idVeiculoFront,
                        [] // historico
                    );
                }

                // Definir a placa, marca e ano na instância (que agora vêm do backend)
                novaInstancia.placa = dadosVeiculo.placa;
                novaInstancia.marca = dadosVeiculo.marca;
                novaInstancia.ano = dadosVeiculo.ano;

                adicionarVeiculoAoSistema(novaInstancia);
            });
            mostrarFeedback("Garagem carregada do Backend com sucesso!", 'success');
            
            if (Object.keys(veiculosInstanciados).length > 0) {
                 const primeiroVeiculoId = Object.keys(veiculosInstanciados)[0];
                 mostrarVeiculoContainer(primeiroVeiculoId); 
            } else {
                document.getElementById('welcome-message').style.display = 'block';
            }

        } else {
            console.log('[FRONTEND] Nenhum veículo encontrado no backend. Garagem vazia para iniciar.');
            document.getElementById('welcome-message').style.display = 'block';
        }

    } catch (error) {
        console.error("[FRONTEND] Erro ao carregar garagem do backend:", error);
        mostrarFeedback(`Erro ao carregar garagem: ${error.message}. Verifique a conexão com o backend e o console.`, 'error');
        document.getElementById('welcome-message').style.display = 'block';
    }
}


function popularSidebar() {
    sidebarMenu.querySelectorAll('li.veiculo-item').forEach(item => item.remove());
    const addActionItem = sidebarMenu.querySelector('li.sidebar-action');
    Object.values(veiculosInstanciados).sort((a,b) => (a.modelo || '').localeCompare(b.modelo || '')).forEach(v => {
        const li = document.createElement('li');
        li.className = 'veiculo-item';
        const idParaExibir = v.placa || v.id;
        const displayModel = v.modelo;
        li.innerHTML = `<a href="#" data-veiculo-id="${idParaExibir}">${displayModel} (${v.placa ? v.placa : (v.tipo === 'bicicleta' ? 'Bike' : 'Sem Placa')})</a>`;
        li.querySelector('a').addEventListener('click', e => { e.preventDefault(); mostrarVeiculoContainer(idParaExibir); });
        if (addActionItem) sidebarMenu.insertBefore(li, addActionItem); else sidebarMenu.appendChild(li);
    });
}

function mostrarFormAddVeiculo() {
    veiculoAtivoId = null;
    document.getElementById('welcome-message').style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(c => {c.style.display='none'; c.classList.remove('active');});
    
    // Assegura que o container do formulário está visível e ativo
    const addFormContainer = document.getElementById('add-veiculo-form-container');
    addFormContainer.style.display = 'block'; // Essa linha agora é essencial.
    addFormContainer.classList.add('active');

    document.getElementById('add-veiculo-form').reset();
    document.getElementById('add-caminhao-capacidade-group').style.display = 'none';
    const placaInput = document.getElementById('add-placa');
    const placaGroup = placaInput.closest('.mb-3');
    
    placaGroup.style.display = 'block'; 
    placaInput.required = true;
    placaInput.disabled = false;
    placaInput.value = '';

    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    const addLink = document.querySelector('#sidebar-menu a[data-action="mostrarFormAddVeiculo"]');
    if(addLink) addLink.classList.add('active');
}

function mostrarWelcome() {
    veiculoAtivoId = null;
    document.getElementById('add-veiculo-form-container').style.display = 'none';
    document.getElementById('add-veiculo-form-container').classList.remove('active');
    document.querySelectorAll('.veiculo-container').forEach(c => {c.style.display='none';c.classList.remove('active');});
    document.getElementById('welcome-message').style.display = 'block';
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
}

// TRATAMENTO DE EVENTOS

document.getElementById('add-veiculo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tipo = document.getElementById('add-tipo').value;
    const modelo = document.getElementById('add-modelo').value.trim();
    const cor = document.getElementById('add-cor').value.trim();
    let placa = document.getElementById('add-placa').value.trim();
    const capacidadeCarga = (tipo === 'caminhao' ? Number(document.getElementById('add-capacidade').value) : null);
    
    if (tipo !== 'bicicleta' && (!placa || placa.length === 0)) {
        mostrarFeedback("Para carros, esportivos, caminhões e motos, a placa é obrigatória.", 'warning');
        return;
    }
    placa = placa.toUpperCase().replace(/\s/g, '');


    if (!modelo || !cor) {
        mostrarFeedback("Modelo e cor são campos obrigatórios!", 'error');
        return;
    }
    if (tipo === 'caminhao' && (isNaN(capacidadeCarga) || capacidadeCarga <= 0)) {
        mostrarFeedback("Para Caminhões, a Capacidade de Carga é obrigatória e deve ser um número positivo.", 'error');
        return;
    }

    try {
        const dadosParaBackend = {
            placa: placa,
            marca: modelo.split(' ')[0], // Simplificação: primeira palavra do modelo
            modelo: modelo,
            ano: new Date().getFullYear(), // Simplificação: ano atual
            cor: cor
        };
        
        if (tipo === 'bicicleta') {
            dadosParaBackend.placa = `BIKE-${Math.random().toString(36).substring(2,7).toUpperCase()}`; // Placa fake para bike
            dadosParaBackend.marca = 'Bicicleta'; // Marca fixa para bike
        }


        console.log('[FRONTEND] Enviando novo veículo para o backend (POST):', dadosParaBackend);
        
        const response = await fetch(`${backendUrl}/api/veiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaBackend)
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.error || 'Erro desconhecido ao adicionar veículo no backend.';
            throw new Error(errorMessage);
        }
        
        console.log('[FRONTEND] Veículo adicionado no backend:', data);
        
        const ClasseVeiculo = classesVeiculos[tipo];
        if (ClasseVeiculo) {
            let novoVeiculoFront;
            const idParaInstancia = data.placa;
            
            if (tipo === 'caminhao') {
                novoVeiculoFront = new ClasseVeiculo(data.modelo, data.cor, capacidadeCarga || 5000, idParaInstancia, [], 0); 
            } else if (tipo === 'esportivo') {
                 novoVeiculoFront = new ClasseVeiculo(data.modelo, data.cor, idParaInstancia, [], false);
            } else if (tipo === 'bicicleta') {
                 novoVeiculoFront = new ClasseVeiculo(data.modelo, data.cor, idParaInstancia || data._id, []);
            }
            else { // Carro, Moto
                 novoVeiculoFront = new ClasseVeiculo(data.modelo, data.cor, idParaInstancia, []);
            }
            
            novoVeiculoFront.placa = data.placa;
            novoVeiculoFront.marca = data.marca;
            novoVeiculoFront.ano = data.ano;
            if (novoVeiculoFront.tipo === 'caminhao') {
                 novoVeiculoFront.capacidadeCarga = data.capacidadeCarga || capacidadeCarga || 5000;
                 novoVeiculoFront.cargaAtual = data.cargaAtual || 0;
            } else if (novoVeiculoFront.tipo === 'esportivo') {
                 novoVeiculoFront.turboAtivado = data.turboAtivado || false;
            }

            adicionarVeiculoAoSistema(novoVeiculoFront);

            mostrarFeedback(`"${modelo}" (Placa: ${data.placa}) adicionado e salvo!`, 'success');
            await carregarGaragem(); 
            mostrarVeiculoContainer(idParaInstancia);
            
            document.getElementById('add-veiculo-form').reset();
            document.getElementById('add-caminhao-capacidade-group').style.display = 'none';

        } else {
            console.error(`[FRONTEND] Erro: Tipo de veículo '${tipo}' do formulário não mapeado para uma classe frontend.`);
            mostrarFeedback('Erro interno ao criar a representação do veículo no frontend.', 'error');
        }

    } catch (error) {
        console.error("[FRONTEND] Erro ao adicionar veículo no backend:", error);
        mostrarFeedback(`Falha ao adicionar veículo: ${error.message}`, 'error');
    }
});


document.getElementById('cancel-add-veiculo').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('add-veiculo-form-container').style.display = 'none';
    mostrarWelcome();
});

document.getElementById('add-tipo').addEventListener('change', e => {
    const tipo = e.target.value;
    document.getElementById('add-caminhao-capacidade-group').style.display = (tipo === 'caminhao') ? 'block' : 'none';
    const placaInput = document.getElementById('add-placa');
    const placaGroup = placaInput.closest('.mb-3');
    
    if (tipo === 'bicicleta') {
        placaGroup.style.display = 'none';
        placaInput.required = false;
        placaInput.disabled = true;
        placaInput.value = '';
    } else {
        placaGroup.style.display = 'block';
        placaInput.required = true;
        placaInput.disabled = false;
        placaInput.value = '';
    }
});

mainContent.addEventListener('click', async (e) => { // AGORA `mainContent` está definida!
    const target = e.target;

    if (target.tagName === 'BUTTON' && target.dataset.acao && target.closest('.actions')) {
        if (!veiculoAtivoId || !veiculosInstanciados[veiculoAtivoId]) return mostrarFeedback("Nenhum veículo selecionado para esta ação.", 'warning');
        const veiculo = veiculosInstanciados[veiculoAtivoId];
        const acao = target.dataset.acao;
        try {
            if (typeof veiculo[acao] === 'function') {
                if (['ligar', 'desligar', 'acelerar', 'frear', 'buzinar', 'pedalar'].includes(acao)) {
                    veiculo[acao](window.sons);
                } else if ((acao === 'carregar' || acao === 'descarregar') && veiculo instanceof Caminhao) {
                    const cargaInput = document.getElementById('caminhao-carga-input');
                    veiculo[acao](cargaInput ? parseFloat(cargaInput.value) : 0);
                    if(cargaInput) cargaInput.value = '';
                } else {
                    veiculo[acao]();
                }
                veiculo.atualizarEstadoBotoesWrapper();
            }
        } catch (error) { mostrarFeedback(`Erro na ação '${acao}': ${error.message}`, 'error'); }
    }

    if (target.classList.contains('verificar-clima-btn-veiculo')) {
        e.preventDefault();
        const botao = target; const tipoVeiculo = botao.dataset.veiculoTipo;
        const cidadeInput = document.getElementById(`cidade-previsao-input-${tipoVeiculo}`);
        const resultadoDiv = document.getElementById(`previsao-tempo-resultado-${tipoVeiculo}`);
        const cidade = cidadeInput ? cidadeInput.value.trim() : "";

        if (!cidade) return mostrarFeedback("Digite uma cidade para a previsão.", "warning");
        if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-info">Buscando previsão para ${cidade}...</p>`;
        botao.disabled = true;

        try {
            const response = await fetch(`${backendUrl}/api/previsao/${encodeURIComponent(cidade)}`);
            const dados = await response.json();
            
            if (!response.ok) {
                 throw new Error(dados.error || "Erro ao buscar previsão do tempo do backend.");
            }
            
            const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);
            if(nomeCidadeSpan) nomeCidadeSpan.textContent = `${dados.nomeCidade}, ${dados.pais}`;
            
            if (resultadoDiv) {
                 resultadoDiv.innerHTML = `
                    <div class="previsao-atual-card">
                        <h5>${dados.descricaoClima}</h5>
                        <img src="https://openweathermap.org/img/wn/${dados.iconeClima}@2x.png" alt="${dados.descricaoClima}" style="width:70px; height:auto;">
                        <p>Temp: ${dados.temperaturaAtual.toFixed(1)}°C (Sensação: ${dados.sensacaoTermica.toFixed(1)}°C)</p>
                        <p>Máx: ${dados.temperaturaMax.toFixed(1)}°C / Mín: ${dados.temperaturaMin.toFixed(1)}°C</p>
                        <p>Vento: ${dados.velocidadeVento} m/s</p>
                    </div>
                    <p style="margin-top: 15px; font-style: italic; color: #777;">
                        Previsão atual para a cidade. Para vários dias, seria necessário processamento adicional no backend.
                    </p>
                 `;
            }
        } catch (error) {
            if (resultadoDiv) resultadoDiv.innerHTML = `<p class="text-danger">Erro: ${error.message}</p>`;
            const nomeCidadeSpan = document.getElementById(`nome-cidade-previsao-${tipoVeiculo}`);
            if(nomeCidadeSpan) nomeCidadeSpan.textContent = "[Cidade]";
        } finally {
            botao.disabled = false;
        }
    }

    if (target.classList.contains('filtro-dias-btn')) {
        e.preventDefault();
        const botaoFiltro = target; const tipoVeiculo = botaoFiltro.dataset.veiculoTipo;
        document.querySelectorAll(`.filtros-previsao .btn[data-veiculo-tipo="${tipoVeiculo}"]`).forEach(b => b.classList.remove('active'));
        botaoFiltro.classList.add('active');

        const inputCidade = document.getElementById(`cidade-previsao-input-${tipoVeiculo}`);
        if (inputCidade && inputCidade.value.trim()) {
            document.getElementById(`verificar-clima-btn-${tipoVeiculo}`).click();
        }
    }

    if (target.classList.contains('remover-manutencao-btn')) {
        const idManut = target.dataset.id;
        if (veiculoAtivoId && veiculosInstanciados[veiculoAtivoId] && idManut && confirm("Tem certeza que deseja remover este registro de manutenção?")) {
            veiculosInstanciados[veiculoAtivoId].removerManutencao(idManut);
        }
    }
});

document.querySelectorAll('.toggle-destaque-chuva').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const tipoVeiculo = this.dataset.veiculoTipo;
        const inputCidade = document.getElementById(`cidade-previsao-input-${tipoVeiculo}`);
        if (inputCidade && inputCidade.value.trim()) {
            document.getElementById(`verificar-clima-btn-${tipoVeiculo}`).click();
        }
    });
});


document.getElementById('main-content').addEventListener('submit', async (e) => {
    if (e.target.classList.contains('manutencao-form')) {
        e.preventDefault();
        if (!veiculoAtivoId || !veiculosInstanciados[veiculoAtivoId]) {
            mostrarFeedback("Selecione um veículo para adicionar a manutenção.", 'error');
            return;
        }
        const veiculo = veiculosInstanciados[veiculoAtivoId];
        const form = e.target;
        const data = form.querySelector('input[type="datetime-local"]').value;
        const tipoManut = form.querySelector('input[placeholder="Tipo"]').value.trim();
        const custo = form.querySelector('input[type="number"]').value;
        const desc = form.querySelector('textarea').value.trim();
        const novaManut = new Manutencao(data, tipoManut, custo, desc);

        if (novaManut.validar().valido) {
            if (veiculo.adicionarManutencao(novaManut)) {
                form.reset();
            }
        } else {
            mostrarFeedback(`Dados inválidos: ${novaManut.validar().erros.join(' ')}`, 'error');
        }
    }
});

document.getElementById('sidebar-menu').addEventListener('click', (e) => {
    const addVeiculoLink = e.target.closest('li.sidebar-action a[data-action="mostrarFormAddVeiculo"]');
    if (addVeiculoLink) {
        e.preventDefault();
        mostrarFormAddVeiculo();
    }
    const veiculoLink = e.target.closest('li.veiculo-item a[data-veiculo-id]');
    if (veiculoLink) {
        e.preventDefault();
        const veiculoId = veiculoLink.dataset.veiculoId;
        if (veiculosInstanciados[veiculoId]) {
            mostrarVeiculoContainer(veiculoId);
        } else {
            console.warn(`[FRONTEND] Link para veículo ID '${veiculoId}' clicado, mas instância não encontrada.`);
            mostrarFeedback('Veículo não encontrado. Recarregando garagem...', 'warning');
            carregarGaragem();
        }
    }
});


// FUNÇÕES DA ATIVIDADE B2.P1.A9: CONSUMINDO NOVOS ENDPOINTS DO BACKEND

async function carregarVeiculosDestaque() {
    const container = document.getElementById('cards-veiculos-destaque');
    if (!container) { console.warn("[Frontend] Elemento HTML para 'cards-veiculos-destaque' não encontrado."); return; }
    container.innerHTML = '<p>Carregando veículos destaque...</p>';
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`);
        if (!response.ok) { throw new Error(`HTTP status ${response.status}`); }
        const veiculos = await response.json();
        container.innerHTML = '';
        if (veiculos.length === 0) { container.innerHTML = '<p>Nenhum veículo em destaque no momento.</p>'; return; }
        veiculos.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'veiculo-card-destaque';
            card.innerHTML = `
                <img src="${veiculo.imagemUrl || 'https://via.placeholder.com/200x120?text=Sem+Imagem'}" alt="Imagem de ${veiculo.modelo}">
                <h3>${veiculo.modelo} (${veiculo.ano})</h3>
                <p><strong>Destaque:</strong> ${veiculo.destaque}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error("[Frontend] Erro ao carregar veículos em destaque:", error);
        container.innerHTML = `<p style="color:red;">Falha ao carregar veículos destaque: ${error.message}</p>`;
    }
}

async function carregarServicosGaragem() {
    const lista = document.getElementById('lista-servicos-oferecidos');
    if (!lista) { console.warn("[Frontend] Elemento HTML para 'lista-servicos-oferecidos' não encontrado."); return; }
    lista.innerHTML = '<p>Carregando serviços...</p>';
    try {
        const response = await fetch(`${backendUrl}/api/garagem/servicos-oferecidos`);
        if (!response.ok) { throw new Error(`HTTP status ${response.status}`); }
        const servicos = await response.json();
        lista.innerHTML = '';
        if (servicos.length === 0) { lista.innerHTML = '<p>Nenhum serviço disponível no momento.</p>'; return; }
        servicos.forEach(servico => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <h4>${servico.nome}</h4>
                <p>${servico.descricao}</p>
                <p><strong>Preço Estimado:</strong> ${servico.precoEstimado}</p>
            `;
            lista.appendChild(listItem);
        });
    } catch (error) {
        console.error("[Frontend] Erro ao carregar serviços da garagem:", error);
        lista.innerHTML = `<p style="color:red;">Falha ao carregar serviços: ${error.message}</p>`;
    }
}

async function configurarBotoesFerramentas() {
    const botoesContainer = document.getElementById('botoes-ferramentas');
    if (!botoesContainer) { console.warn("[Frontend] Elemento HTML para 'botoes-ferramentas' não encontrado."); return; }
    const ferramentasParaBotao = [
        { id: 'F01', nome: 'Chaves Combinadas' },
        { id: 'F02', nome: 'Macaco Hidráulico' },
        { id: 'F03', nome: 'Chave de Impacto' },
    ];
    botoesContainer.innerHTML = '';
    ferramentasParaBotao.forEach(ferramenta => {
        const button = document.createElement('button');
        button.textContent = `Detalhes: ${ferramenta.nome}`;
        button.onclick = () => buscarDetalheFerramenta(ferramenta.id);
        button.className = 'btn btn-outline-success btn-sm me-2 mb-2';
        botoesContainer.appendChild(button);
    });
    const buttonInvalido = document.createElement('button');
    buttonInvalido.textContent = `Testar ID INVÁLIDO`;
    buttonInvalido.onclick = () => buscarDetalheFerramenta('ID_INVALIDO');
    buttonInvalido.className = 'btn btn-outline-danger btn-sm mb-2';
    botoesContainer.appendChild(buttonInvalido);
}

async function buscarDetalheFerramenta(idFerramenta) {
    const detalheContainer = document.getElementById('detalhe-ferramenta');
    if (!detalheContainer) { console.warn("[Frontend] Elemento HTML para 'detalhe-ferramenta' não encontrado."); return; }
    detalheContainer.innerHTML = `<p>Buscando detalhe da ferramenta '${idFerramenta}'...</p>`;
    detalheContainer.style.backgroundColor = '#f0f8ff';
    try {
        const response = await fetch(`${backendUrl}/api/garagem/ferramentas-essenciais/${idFerramenta}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Falha ao buscar ferramenta: ${errorData.error || `Status HTTP ${response.status}`}.`);
        }
        const ferramenta = await response.json();
        detalheContainer.style.backgroundColor = '#eaf8f4';
        detalheContainer.innerHTML = `
            <h4>Ferramenta: ${ferramenta.nome} (ID: ${ferramenta.id})</h4>
            <p><strong>Utilidade:</strong> ${ferramenta.utilidade}</p>
            <p><strong>Categoria:</strong> ${ferramenta.categoria}</p>
        `;
    } catch (error) {
        console.error("[Frontend] Erro ao buscar detalhe da ferramenta:", error);
        detalheContainer.style.backgroundColor = '#ffe9ec';
        detalheContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}


// INICIALIZAÇÃO DA APLICAÇÃO: Executado quando todo o DOM (HTML) está carregado
document.addEventListener('DOMContentLoaded', () => {
    configurarTodosOsEventos();

    carregarGaragem();

    carregarVeiculosDestaque();
    carregarServicosGaragem();
    configurarBotoesFerramentas(); 
    
    mostrarFeedback(
        'Sistema Garagem Inteligente carregado! Selecione ou adicione um veículo para começar.',
        'info'
    );
});