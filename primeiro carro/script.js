/**
 * @file script.js
 * @brief Script principal da aplicação Garagem Inteligente.
 * Gerencia a criação, exibição, interação e persistência dos veículos.
 */

// ================================================================
// !!! IMPORTANTE: ARQUIVOS DAS CLASSES NA RAIZ !!!
// Certifique-se que os arquivos .js das classes estão na mesma pasta
// que este script.js e index.html.
// ================================================================
import { Veiculo } from './Veiculo.js';
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js';
import { Bicicleta } from './Bicicleta.js';
import { Manutencao } from './Manutencao.js';

// Função auxiliar simples para feedback
function mostrarFeedback(mensagem, tipo = 'info') {
    const feedbackDiv = document.getElementById('feedback-message');
    if (feedbackDiv) {
        feedbackDiv.textContent = mensagem;
        feedbackDiv.className = `feedback feedback-${tipo}`;
        feedbackDiv.style.display = 'block';
        setTimeout(() => { feedbackDiv.style.display = 'none'; }, 5000);
    } else {
        console.log(`Feedback (${tipo}): ${mensagem}`);
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
const addPlacaInput = document.getElementById('add-placa'); // Input da placa no form

// --- Elementos de Som (Ignorando erros 404 por enquanto) ---
const sons = {
    ligar: document.getElementById('som-ligar'),
    desligar: document.getElementById('som-desligar'),
    acelerar: document.getElementById('som-acelerar'),
    frear: document.getElementById('som-frear'),
    buzina: document.getElementById('som-buzina'),
    campainha: document.getElementById('som-campainha')
};

// --- Funções de Persistência (localStorage) ---

/** @description Salva o estado atual da garagem no localStorage. */
function salvarGaragem() {
    try {
        // ================================================================
        // !!! AÇÃO NECESSÁRIA NAS CLASSES .JS !!!
        // Garanta que cada classe (Veiculo, Carro, etc.) tenha um método
        // toJSON() que RETORNA um objeto incluindo a 'placa'.
        // Exemplo em Veiculo.js:
        // toJSON() {
        //   return {
        //     id: this.id, // Se tiver id
        //     tipo: this.getTipo(), // Ou como pegar o tipo
        //     modelo: this.modelo,
        //     cor: this.cor,
        //     placa: this.placa, // ESSENCIAL!
        //     historicoManutencao: this.historicoManutencao.map(m => m.toJSON()),
        //     // ... outros dados específicos (carga, turbo, etc)
        //   };
        // }
        // ================================================================
        const garagemJSON = Object.values(garagem).map(v => v.toJSON());
        localStorage.setItem('garagemInteligente', JSON.stringify(garagemJSON));
        console.log("Garagem salva no localStorage.");
    } catch (error) {
        console.error("Erro ao salvar garagem (verifique toJSON nas classes):", error);
        mostrarFeedback("Erro ao salvar dados da garagem.", 'error');
    }
}

/** @description Carrega a garagem do localStorage e recria os objetos Veiculo. */
function carregarGaragem() {
    const garagemSalva = localStorage.getItem('garagemInteligente');
    if (garagemSalva) {
        try {
            const garagemArrayJSON = JSON.parse(garagemSalva);
            garagem = {};
            garagemArrayJSON.forEach(veiculoData => {
                const ClasseVeiculo = mapaTiposClasse[veiculoData.tipo];
                if (ClasseVeiculo) {
                    // ================================================================
                    // !!! AÇÃO NECESSÁRIA NAS CLASSES .JS !!!
                    // Garanta que o CONSTRUTOR de cada classe aceite 'placa'
                    // como parâmetro e a armazene (this.placa = placa).
                    // A ORDEM dos parâmetros aqui DEVE BATER com o construtor!
                    // Exemplo de construtor em Carro.js:
                    // constructor(modelo, cor, placa, id = null, historico = [], /* outros */) {
                    //   super(modelo, cor, placa, id, historico); // Chama construtor de Veiculo
                    //   this.placa = placa; // Armazena placa
                    //   // ... resto do construtor ...
                    // }
                    // ================================================================
                    const veiculo = new ClasseVeiculo(
                        veiculoData.modelo,
                        veiculoData.cor,
                        veiculoData.placa, // <--- Passando a placa
                        veiculoData.id, // Passando ID (se houver)
                        veiculoData.historicoManutencao ? veiculoData.historicoManutencao.map(m => Manutencao.fromJSON(m)) : [], // Recria Manutencoes
                        // Dados específicos (ajuste a ordem conforme seu construtor!)
                        veiculoData.capacidadeCarga, // Para Caminhao
                        veiculoData.cargaAtual,       // Para Caminhao
                        veiculoData.turboAtivado      // Para CarroEsportivo
                    );

                    // Usa a PLACA como chave principal se existir, senão o ID
                    const chaveGaragem = veiculoData.placa || veiculoData.id;
                    if (chaveGaragem) {
                       garagem[chaveGaragem] = veiculo;
                    } else {
                        console.warn("Veículo sem placa ou ID não pode ser carregado:", veiculoData);
                    }

                } else {
                    console.warn(`Tipo de veículo desconhecido no localStorage: ${veiculoData.tipo}`);
                }
            });
            console.log("Garagem carregada:", garagem);
        } catch (error) {
            console.error("Erro ao carregar garagem (verifique construtores e formato JSON):", error);
            garagem = {};
            localStorage.removeItem('garagemInteligente');
            mostrarFeedback("Erro ao carregar dados salvos. Garagem resetada.", 'error');
        }
    } else {
        garagem = {};
        console.log("Nenhuma garagem salva encontrada.");
    }
}


// --- Função da API Simulada ---
/**
 * Busca detalhes adicionais de um veículo na API simulada (arquivo JSON local).
 * @param {string} placa - A placa do veículo a ser buscado.
 * @returns {Promise<object|null>} Promise com detalhes ou null.
 */
async function buscarDetalhesVeiculoAPI(placa) {
    if (!placa || placa === 'N/A') {
        return null;
    }
    console.log(`Buscando API para placa: ${placa}`);
    try {
        // Certifique-se que 'dados_veiculos_api.json' está na raiz do projeto
        const response = await fetch('./dados_veiculos_api.json');
        if (!response.ok) {
            // Se o ARQUIVO não for encontrado, o fetch falha aqui
            throw new Error(`Erro ${response.status} ao buscar ${response.url}`);
        }
        const dadosVeiculos = await response.json(); // Pode dar erro se JSON for inválido

        // Procura ignorando maiúsculas/minúsculas
        const detalhes = dadosVeiculos.find(v => v.placa && v.placa.toUpperCase() === placa.toUpperCase());

        return detalhes || null; // Retorna o objeto encontrado ou null

    } catch (error) {
        console.error("Erro na função buscarDetalhesVeiculoAPI:", error);
        mostrarFeedback("Não foi possível buscar detalhes extras.", 'error');
        return null; // Indica erro retornando null
    }
}


// --- Funções de Interface e Lógica ---

/** @description Atualiza a lista na barra lateral. */
function popularSidebar() {
    sidebarMenu.querySelectorAll('li.veiculo-item').forEach(item => item.remove());
    const addActionItem = sidebarMenu.querySelector('li.sidebar-action');

    Object.values(garagem).sort((a, b) => a.modelo.localeCompare(b.modelo)).forEach(veiculo => {
        const li = document.createElement('li');
        li.classList.add('veiculo-item');
        // Usa a PLACA como ID no HTML se existir, senão o ID interno
        const idHtml = veiculo.placa || veiculo.id;
        li.innerHTML = `<a href="#" data-id="${idHtml}">${veiculo.modelo} (${veiculo.placa || 'Sem Placa'})</a>`;

        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            mostrarVeiculo(idHtml); // Mostra usando a chave (placa ou id)
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

    veiculoAtual = chaveVeiculo; // Armazena a chave do veículo atual

    // Esconde tudo antes de mostrar o certo
    welcomeMessage.style.display = 'none';
    addVeiculoFormContainer.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(container => {
        container.style.display = 'none';
        container.classList.remove('active');
    });

    // Pega o tipo e monta o ID do container (ex: #carro-container)
    const tipoVeiculo = veiculo.getTipo ? veiculo.getTipo() : (veiculo.constructor.name.toLowerCase());
    const containerId = `${tipoVeiculo}-container`;
    const container = document.getElementById(containerId);

    if (container) {
        // Atualiza informações básicas (modelo, cor, PLACA)
        container.querySelector(`#${tipoVeiculo}-modelo`).textContent = veiculo.modelo;
        container.querySelector(`#${tipoVeiculo}-cor`).textContent = veiculo.cor;
        const placaSpan = container.querySelector(`#${tipoVeiculo}-placa`);
        if (placaSpan) {
             // !!! Garanta que o objeto 'veiculo' TENHA a propriedade 'placa' !!!
            placaSpan.textContent = veiculo.placa || 'N/A';
        } else {
             console.warn(`Span para placa #${tipoVeiculo}-placa não encontrado no HTML.`);
        }


        // Chama métodos de atualização do próprio objeto veículo (se existirem)
        if (typeof veiculo.atualizarStatus === 'function') veiculo.atualizarStatus(); else console.warn("Método atualizarStatus não encontrado em", veiculo);
        if (typeof veiculo.atualizarVelocidade === 'function') veiculo.atualizarVelocidade(); else console.warn("Método atualizarVelocidade não encontrado em", veiculo);
        if (veiculo instanceof Caminhao && typeof veiculo.atualizarInfoCaminhao === 'function') veiculo.atualizarInfoCaminhao();
        if (veiculo instanceof CarroEsportivo && typeof veiculo.atualizarTurboDisplay === 'function') veiculo.atualizarTurboDisplay();
        if (typeof veiculo.atualizarDisplayManutencao === 'function') veiculo.atualizarDisplayManutencao(); else console.warn("Método atualizarDisplayManutencao não encontrado em", veiculo);


        // Limpa a área de detalhes da API ao mostrar
        const apiResultDiv = container.querySelector('.api-details-result');
        if (apiResultDiv) {
            apiResultDiv.innerHTML = '<p class="text-muted">Clique no botão para buscar detalhes.</p>';
        } else {
             console.warn("Div .api-details-result não encontrada no container:", containerId);
        }

        // Mostra o container correto e marca como ativo
        container.style.display = 'block';
        container.classList.add('active');

        // Marca o item correto na sidebar
        document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
        const linkSidebar = document.querySelector(`#sidebar-menu a[data-id="${chaveVeiculo}"]`);
        if (linkSidebar) linkSidebar.classList.add('active');

        mainContent.classList.add('content-visible');

    } else {
        console.error(`Container HTML #${containerId} não encontrado.`);
        mostrarFeedback("Erro ao exibir veículo: interface não encontrada.", 'error');
        mostrarWelcome();
    }
}

/** @description Mostra o formulário para adicionar veículo. */
function mostrarFormAddVeiculo() {
    veiculoAtual = null;
    welcomeMessage.style.display = 'none';
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });

    addVeiculoForm.reset(); // Limpa o formulário
    addCaminhaoCapacidadeGroup.style.display = 'none'; // Esconde campo de caminhão
    // Garante que campo placa esteja visível inicialmente (será escondido se selecionar bike)
    if(addPlacaInput) {
        const placaGroup = addPlacaInput.closest('.form-group');
        if(placaGroup) placaGroup.style.display = 'block';
        addPlacaInput.required = true; // Começa como obrigatório (exceto bike)
        addPlacaInput.disabled = false; // Garante que não está desabilitado
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
    document.querySelectorAll('.veiculo-container').forEach(c => { c.style.display = 'none'; c.classList.remove('active'); });
    welcomeMessage.style.display = 'block';
    document.querySelectorAll('#sidebar-menu a').forEach(a => a.classList.remove('active'));
    mainContent.classList.remove('content-visible');
}

// --- Tratamento de Eventos ---

// Evento: Submissão do Formulário de Adicionar Veículo
addVeiculoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(addVeiculoForm);
    const tipo = formData.get('tipo');
    const modelo = formData.get('modelo').trim();
    const cor = formData.get('cor').trim();
    const placaInput = formData.get('placa'); // Pega do form
    const placa = placaInput ? placaInput.trim().toUpperCase() : null; // Limpa e capitaliza
    const capacidade = formData.get('capacidade');

    if (!tipo || !modelo || !cor) {
        mostrarFeedback("Preencha tipo, modelo e cor.", 'warning');
        return;
    }

    // Validação da placa (obrigatória exceto para bicicleta)
    if (tipo !== 'bicicleta') {
        if (!placa) {
            mostrarFeedback("Placa é obrigatória para este tipo de veículo.", 'warning');
            return;
        }
        if (placa.length < 5) { // Validação mínima de exemplo
             mostrarFeedback("Placa inválida (mínimo 5 caracteres).", 'warning');
             return;
        }
         // Verifica se placa já existe
        if (garagem[placa]) {
            mostrarFeedback(`Veículo com placa ${placa} já existe!`, 'error');
            return;
        }
    }

    const ClasseVeiculo = mapaTiposClasse[tipo];
    if (ClasseVeiculo) {
        let novoVeiculo;
        try {
            // ================================================================
            // !!! ATENÇÃO À ORDEM DOS PARÂMETROS DO CONSTRUTOR !!!
            // A ordem aqui DEVE corresponder EXATAMENTE ao construtor
            // da sua classe JS (Veiculo, Carro, Caminhao...).
            // Inclua 'placa' na posição correta.
            // ================================================================
            if (tipo === 'caminhao') {
                // Exemplo: new Caminhao(modelo, cor, placa, id?, hist?, capacidade?, carga?)
                novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, [], parseInt(capacidade) || 5000, 0);
            } else if (tipo === 'bicicleta') {
                 // Exemplo: new Bicicleta(modelo, cor, placa=null, id?, hist?)
                 novoVeiculo = new ClasseVeiculo(modelo, cor, null, null, []);
            }
            // Adicione 'else if' para outros tipos com construtores diferentes (Esportivo?)
             else {
                 // Exemplo: new Carro(modelo, cor, placa, id?, hist?)
                novoVeiculo = new ClasseVeiculo(modelo, cor, placa, null, []);
            }

            // Usa a PLACA como chave se existir, senão o ID (se for gerado pela classe)
            const chaveGaragem = novoVeiculo.placa || novoVeiculo.id;
            if (!chaveGaragem) {
                 throw new Error("Veículo criado sem placa ou ID válido.");
            }
            if (garagem[chaveGaragem]) {
                 mostrarFeedback(`Erro: Identificador ${chaveGaragem} já existe.`, 'error');
                 return; // Evita sobrescrever
            }

            garagem[chaveGaragem] = novoVeiculo;
            salvarGaragem();
            popularSidebar();
            mostrarVeiculo(chaveGaragem); // Mostra o novo veículo
            mostrarFeedback(`'${modelo}' adicionado com sucesso!`, 'success');
            addVeiculoForm.reset(); // Limpa o formulário
            // Esconde form e volta para o veículo (ou welcome se for o primeiro)
            addVeiculoFormContainer.style.display = 'none';

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
    // Decide se volta para welcome ou para o veículo que estava antes (se houver)
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

    // Controle Caminhão
    if (tipoSelecionado === 'caminhao') {
        addCaminhaoCapacidadeGroup.style.display = 'block';
    } else {
        addCaminhaoCapacidadeGroup.style.display = 'none';
    }

    // Controle Placa
    if (tipoSelecionado === 'bicicleta') {
        if (placaGroup) placaGroup.style.display = 'none'; // Esconde
        if (addPlacaInput) {
            addPlacaInput.required = false; // Não obrigatória
            addPlacaInput.value = ''; // Limpa
            addPlacaInput.disabled = true; // Desabilita para bike
        }
    } else {
        if (placaGroup) placaGroup.style.display = 'block'; // Mostra
         if (addPlacaInput) {
             addPlacaInput.required = true; // Obrigatória
             addPlacaInput.disabled = false; // Habilita
         }
    }
});

// Evento: Cliques Gerais no Conteúdo Principal (Delegação)
mainContent.addEventListener('click', (e) => {
    const target = e.target;

    // --- Ações do Veículo (botões com data-acao dentro de .actions) ---
    if (target.tagName === 'BUTTON' && target.dataset.acao && target.closest('.actions')) {
        // A lógica para ações como ligar, acelerar, etc. parece OK no código anterior.
        // Mantenha essa parte como estava, garantindo que 'veiculoAtual' e 'garagem[veiculoAtual]' são válidos.
        const acao = target.dataset.acao;
        if (!veiculoAtual || !garagem[veiculoAtual]) {
            mostrarFeedback("Nenhum veículo selecionado.", 'warning'); return;
        }
        const veiculo = garagem[veiculoAtual];
        try {
            // Seu mapeamento de ações para métodos aqui... (mantenha o seu)
             const acoesMetodos = { /* ... seu mapeamento ... */ };
             // Exemplo básico:
             if (typeof veiculo[acao] === 'function') {
                 // Passa sons se o método precisar (adapte conforme suas classes)
                 if (['ligar', 'desligar', 'acelerar', 'frear', 'buzinar'].includes(acao)) {
                    veiculo[acao](sons);
                 } else {
                     veiculo[acao]();
                 }
                 // A classe deve cuidar de atualizar a UI e salvar se necessário.
                 // Se não, faça aqui: salvarGaragem(); mostrarVeiculo(veiculoAtual);
             } else if (acao === 'pedalar' && typeof veiculo.acelerar === 'function') { // Caso especial bike
                  veiculo.acelerar(sons);
             } else if (acao === 'carregar' || acao === 'descarregar') { // Caso especial caminhão
                 const cargaInput = document.getElementById('caminhao-carga-input');
                 const quantidade = cargaInput ? parseInt(cargaInput.value) : 0;
                 if (quantidade > 0) {
                     if (veiculo instanceof Caminhao && typeof veiculo[acao] === 'function') {
                         veiculo[acao](quantidade);
                         cargaInput.value = '';
                         // veiculo[acao] deve salvar e atualizar UI
                     }
                 } else {
                    mostrarFeedback("Informe quantidade válida.", "warning");
                 }
             } else if (acao === 'ativarTurbo' || acao === 'desativarTurbo') { // Caso especial Esportivo
                  if (veiculo instanceof CarroEsportivo && typeof veiculo[acao] === 'function') {
                         veiculo[acao]();
                         // veiculo[acao] deve salvar e atualizar UI
                     }
             }
             else { console.warn(`Ação/Método ${acao} não encontrada no veículo.`); }

        } catch (error) {
             console.error(`Erro na ação '${acao}':`, error); mostrarFeedback(`Erro: ${error.message}`, 'error');
        }
    }

    // --- Remover Manutenção ---
    if (target.tagName === 'BUTTON' && target.classList.contains('remover-manutencao-btn')) {
        // Sua lógica de remover manutenção aqui... (mantenha a sua)
         const idManutencao = target.dataset.id;
         if (veiculoAtual && garagem[veiculoAtual] && idManutencao) {
             const veiculo = garagem[veiculoAtual];
             if (confirm("Remover este registro de manutenção?")) {
                 if (typeof veiculo.removerManutencao === 'function') {
                    veiculo.removerManutencao(idManutencao); // Método deve salvar e atualizar UI
                 }
             }
         }
    }

    // --- Buscar Detalhes da API Simulada ---
    // Usando a versão robusta que verifica os elementos
    if (target.classList.contains('details-api-btn')) {
        if (!veiculoAtual || !garagem[veiculoAtual]) {
          mostrarFeedback("Selecione um veículo.", 'warning'); return;
        }
        const veiculo = garagem[veiculoAtual];
        // !!! Garanta que veiculo.placa existe e está correto !!!
        const placa = veiculo.placa;

        const veiculoContainer = target.closest('.veiculo-container');
        if (!veiculoContainer) {
            console.error("FATAL: Container pai .veiculo-container não encontrado."); return;
        }
        const resultDiv = veiculoContainer.querySelector('.api-details-result');
        if (!resultDiv) {
            console.error("FATAL: Div .api-details-result não encontrada no container."); return;
        }

        if (!placa || placa === 'N/A') {
            resultDiv.innerHTML = '<p class="text-secondary">Veículo sem placa para consulta.</p>'; return;
        }

        resultDiv.innerHTML = '<p class="text-info">Buscando detalhes...</p>';

        buscarDetalhesVeiculoAPI(placa) // Chama a função async
          .then(detalhes => { // Executa quando a promise resolver
            if (!resultDiv) return; // Segurança se o usuário mudou de tela rápido

            if (detalhes) { // Encontrou dados!
              let htmlResult = `<h5>Detalhes Extras (Placa: ${placa})</h5>`;
              htmlResult += '<ul class="list-unstyled">';
              for (const key in detalhes) {
                  if (key.toLowerCase() !== 'placa') {
                       const titulo = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                       htmlResult += `<li><strong>${titulo}:</strong> ${detalhes[key]}</li>`;
                  }
              }
              htmlResult += '</ul>';
              resultDiv.innerHTML = htmlResult;
            } else { // Não encontrou ou buscarDetalhesVeiculoAPI retornou null (erro)
              resultDiv.innerHTML = `<p class="text-warning">Detalhes não encontrados para a placa ${placa}.</p>`;
            }
          })
          .catch(error => { // Pega erros inesperados na promise (raro aqui)
             console.error("Erro no .then ou .catch da busca API:", error);
             if (resultDiv) resultDiv.innerHTML = `<p class="text-danger">Erro ao exibir detalhes.</p>`;
          });
      }
});


// Evento: Submissão do Formulário de Manutenção (Delegação)
mainContent.addEventListener('submit', (e) => {
    if (e.target.classList.contains('manutencao-form')) {
        e.preventDefault();
        // Sua lógica de adicionar manutenção aqui... (mantenha a sua)
         const form = e.target;
         if (!veiculoAtual || !garagem[veiculoAtual]) {
             mostrarFeedback("Selecione um veículo.", 'error'); return;
         }
         const veiculo = garagem[veiculoAtual];
         // ... (pegar dados do form) ...
         const data = form.querySelector('input[type="datetime-local"]').value;
         const tipo = form.querySelector('input[placeholder="Tipo"]').value.trim();
         const custo = form.querySelector('input[type="number"]').value;
         const descricao = form.querySelector('textarea').value.trim();

         const novaManutencao = new Manutencao(data, tipo, custo, descricao);
         const validacao = novaManutencao.validar();

         if (validacao.valido) {
             if (typeof veiculo.adicionarManutencao === 'function') {
                if (veiculo.adicionarManutencao(novaManutencao)) { // Método deve salvar e atualizar UI
                    form.reset();
                }
             } else {
                  mostrarFeedback("Função adicionarManutencao não encontrada no veículo.", 'error');
             }
         } else {
            mostrarFeedback(`Dados inválidos:\n- ${validacao.erros.join('\n- ')}`, 'error');
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
    carregarGaragem(); // Carrega dados salvos
    popularSidebar(); // Monta menu lateral

    // Decide o que mostrar primeiro
    if (Object.keys(garagem).length > 0) {
        // Pega a chave do primeiro veículo ordenado por modelo
        const primeiraChave = Object.keys(garagem).sort((a, b) => garagem[a].modelo.localeCompare(garagem[b].modelo))[0];
        mostrarVeiculo(primeiraChave);
    } else {
        mostrarWelcome(); // Mostra boas-vindas se garagem vazia
    }

    // Garante estado inicial correto do campo placa no form (escondido e não obrigatório)
    const placaGroup = addPlacaInput ? addPlacaInput.closest('.form-group') : null;
     if(placaGroup) placaGroup.style.display = 'none';
     if (addPlacaInput) {
         addPlacaInput.required = false;
         addPlacaInput.disabled = true; // Começa desabilitado
     }


    console.log("Garagem Inteligente pronta!");
}

// Dispara a inicialização quando o HTML estiver pronto
document.addEventListener('DOMContentLoaded', init);