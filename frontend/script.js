<<<<<<< HEAD
// Conteúdo COMPLETO do arquivo JavaScript principal do frontend.

// --- MÓDULOS (Suas classes e funções auxiliares que serão importadas) ---
// Estes caminhos devem APONTAR CORRETAMENTE para onde seus arquivos estão.
// Ex: se Carro.js estiver em 'js/classes/Carro.js', use './js/classes/Carro.js'.
// No seu caso, pela sua estrutura, parece que estão na mesma pasta (ou numa subpasta) do script.js
import { Carro } from './Carro.js';
import { CarroEsportivo } from './CarroEsportivo.js';
import { Caminhao } from './Caminhao.js';
import { Moto } from './Moto.js';
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
// Ex: { "carro_meufusca_1a2b3": new Carro("Meu Fusca", "Azul", ...), ... }
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
// Certifique-se de que os arquivos de som existam na pasta 'sons/' (ou no caminho correto).
const sons = {
    ligar: document.getElementById('ligar-audio'),
    desligar: document.getElementById('desligar-audio'),
    acelerar: document.getElementById('acelerar-audio'),
    frear: document.getElementById('frear-audio'),
    buzina: document.getElementById('buzinar-audio'),
    // Se você tiver sons específicos adicionados em CarroEsportivo, Bicicleta, Caminhao etc., adicione-os aqui:
    // campainha: document.getElementById('campainha-audio'),
    // freioBike: document.getElementById('freioBike-audio')
};
// Tornamos o objeto 'sons' acessível globalmente através de 'window.sons' para que os métodos das classes de veículo (Carro.js, etc.) possam utilizá-lo.
window.sons = sons;

// Variável para rastrear o ID do veículo atualmente selecionado/ativo na interface.
let veiculoAtivoId = null;


// ===========================================================================
// FUNÇÕES AUXILIARES DA APLICAÇÃO (INTEGRANDO POO E UI)
// ===========================================================================

/**
 * Atualiza a exibição do histórico e agendamentos de manutenção de um veículo específico na UI.
 * Este método é crucial para garantir que as listas de manutenção sejam renderizadas dinamicamente.
 * @param {object} veiculoInstancia - A instância do objeto de veículo (Carro, Moto, etc.).
 */
function atualizarDisplayManutencaoUI(veiculoInstancia) {
    const prefix = veiculoInstancia.getIdPrefix(); // Obtém o prefixo do ID do veículo (ex: 'carro', 'moto')
    const historicoListaUl = document.getElementById(`${prefix}-historico-lista`); // Elemento UL do histórico
    const agendamentosListaUl = document.getElementById(`${prefix}-agendamentos-lista`); // Elemento UL dos agendamentos

    // Verifica se os elementos UL foram encontrados (eles só existem quando o container do veículo é exibido)
    if (!historicoListaUl || !agendamentosListaUl) {
        console.warn(
            `[Frontend] Listas de manutenção HTML para "${prefix}" não encontradas. Garanta que o container do veículo esteja visível.`
        );
        return; // Sai da função se os elementos HTML não existirem
    }

    // Pega os arrays de manutenções separadas (passadas e futuras) diretamente da instância do veículo
    // As funções `getManutencoesSeparadas`, `formatarParaHistorico` e `formatarParaAgendamento` são métodos da classe `Veiculo` (ou `Manutencao.js`)
    const { historicoPassado, agendamentosFuturos } =
        veiculoInstancia.getManutencoesSeparadas();

    // Função interna auxiliar para popular qualquer lista UL genérica
    const popularLista = (ulElement, listaItens, mensagemVazio, formatarFn) => {
        ulElement.innerHTML = ''; // Limpa o conteúdo da lista UL antes de preencher
        if (listaItens.length === 0) {
            ulElement.innerHTML = `<li>${mensagemVazio}</li>`; // Mostra mensagem se a lista estiver vazia
        } else {
            listaItens.forEach(item => {
                const li = document.createElement('li'); // Cria um novo item de lista HTML
                li.innerHTML = formatarFn(item); // Formata o item (que pode incluir um botão de remover)
                ulElement.appendChild(li); // Adiciona o item à lista UL
            });
        }
    };

    // Popula a lista de histórico (manutenções passadas)
    popularLista(
        historicoListaUl,
        historicoPassado,
        'Nenhum registro de manutenção.',
        m => m.formatarParaHistorico()
    );
    // Popula a lista de agendamentos (manutenções futuras)
    popularLista(
        agendamentosListaUl,
        agendamentosFuturos,
        'Nenhum agendamento futuro.',
        m => m.formatarParaAgendamento()
    );
}

/**
 * Adiciona um objeto de veículo instanciado ao sistema da garagem (mapa de instâncias)
 * e o inclui no menu lateral da UI para seleção.
 * @param {object} veiculoObj - A instância do objeto de veículo (new Carro(...), new Moto(...), etc.).
 */
function adicionarVeiculoAoSistema(veiculoObj) {
    // Adiciona o veículo ao mapa global `veiculosInstanciados` usando o ID único do veículo como chave
    veiculosInstanciados[veiculoObj.id] = veiculoObj;

    const sidebarMenu = document.getElementById('sidebar-menu'); // Referência ao menu lateral
    // Pega a referência do botão "Adicionar Veículo" no menu para inserir os novos itens antes dele
    const btnAdd = sidebarMenu.querySelector(
        'li[data-action="mostrarFormAddVeiculo"]'
    );

    const li = document.createElement('li'); // Cria um novo item de lista (li) para o menu
    li.dataset.veiculoId = veiculoObj.id; // Armazena o ID único do veículo no HTML (para usar em cliques)
    li.dataset.veiculoTipo = veiculoObj.getTipo(); // Armazena o tipo do veículo (ex: 'carro')
    li.className = 'veiculo-item'; // Aplica uma classe CSS para estilização (veja `style.css`)

    // Define o conteúdo HTML do link do menu: Modelo (Tipo do Veículo)
    li.innerHTML = `<a href="#" data-veiculo-id="${veiculoObj.id}">${veiculoObj.modelo} (${veiculoObj.getTipo()})</a>`;
    // Insere o novo item na barra lateral antes do botão "Adicionar Veículo"
    sidebarMenu.insertBefore(li, btnAdd);

    // Adiciona um evento de clique ao link do novo item do menu: quando clicado, mostra o container do veículo.
    li.querySelector('a').addEventListener('click', e => {
        e.preventDefault(); // Impede o comportamento padrão de navegação do link
        mostrarVeiculoContainer(veiculoObj.id); // Chama a função para exibir o veículo pelo seu ID único
    });

    // Ao adicionar um veículo (especialmente se for carregado do localStorage),
    // atualizamos imediatamente todos os displays relacionados a ele.
    veiculoObj.atualizarDisplayManutencao();
    veiculoObj.atualizarStatus();
    veiculoObj.atualizarVelocidade();
    // Verifica se os métodos específicos da subclasse existem antes de chamá-los
    if (veiculoObj.atualizarTurboDisplay) veiculoObj.atualizarTurboDisplay();
    if (veiculoObj.atualizarInfoCaminhao) veiculoObj.atualizarInfoCaminhao();
    veiculoObj.atualizarEstadoBotoesWrapper();

    salvarGaragem(); // Salva o estado da garagem na localStorage sempre que um veículo é adicionado/removido
}

/**
 * Exibe o container HTML correspondente a um veículo específico e esconde todos os outros containers
 * e mensagens de boas-vindas/formulários na área de conteúdo principal.
 * @param {string} veiculoId - O ID único da instância do veículo a ser exibido.
 */
function mostrarVeiculoContainer(veiculoId) {
    // Esconde a mensagem de boas-vindas e o formulário de adicionar veículo
    document.getElementById('welcome-message').style.display = 'none';
    document.getElementById('add-veiculo-form-container').style.display = 'none';

    // Esconde todos os containers de veículos primeiro, para garantir que apenas um fique visível
    document.querySelectorAll('.veiculo-container').forEach(div => (div.style.display = 'none'));

    // Remove a classe 'active' (de "selecionado") de todos os links no menu lateral
    document.querySelectorAll('#sidebar-menu li a').forEach(a =>
        a.classList.remove('active')
    );

    // Recupera a instância do objeto de veículo do nosso mapa global usando o ID fornecido
    const veiculoInstance = veiculosInstanciados[veiculoId];
    if (veiculoInstance) {
        const prefix = veiculoInstance.getIdPrefix(); // Obtém o prefixo de ID do veículo (ex: 'carro', 'bicicleta')
        const container = document.getElementById(`${prefix}-container`); // Pega o elemento HTML do container do veículo
        if (container) {
            container.style.display = 'block'; // Torna o container do veículo visível
            veiculoAtivoId = veiculoId; // Atualiza o ID do veículo atualmente ativo na UI

            // Adiciona a classe 'active' ao link correspondente no menu lateral
            const linkAtivo = document.querySelector(
                `#sidebar-menu li[data-veiculo-id="${veiculoId}"] a`
            );
            if (linkAtivo) linkAtivo.classList.add('active');

            // Ao mostrar o veículo, garante que todas as suas informações visuais e estados de botões estejam atualizados.
            veiculoInstance.atualizarStatus();
            veiculoInstance.atualizarVelocidade();
            veiculoInstance.atualizarDisplayManutencao(); // Recarrega histórico/agendamentos na UI
            if (veiculoInstance.atualizarTurboDisplay)
                veiculoInstance.atualizarTurboDisplay();
            if (veiculoInstance.atualizarInfoCaminhao)
                veiculoInstance.atualizarInfoCaminhao();
            veiculoInstance.atualizarEstadoBotoesWrapper();

            // Rola a página para que o container do veículo fique visível (efeito suave)
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

/**
 * Salva o estado atual de todos os veículos instanciados (incluindo modelo, cor, manutenções, etc.)
 * na `localStorage` do navegador para persistência de dados.
 */
function salvarGaragem() {
    // Mapeia todas as instâncias de veículo para o formato JSON serializável
    // (usando o método `toJSON()` definido em cada classe de veículo)
    const dadosParaSalvar = Object.values(veiculosInstanciados).map(veiculo =>
        veiculo.toJSON()
    );
    // Converte o array de objetos JSON para uma string JSON e armazena na localStorage
    localStorage.setItem('garagemInteligente', JSON.stringify(dadosParaSalvar));
    console.log('[Garagem] Dados salvos com sucesso na LocalStorage:', dadosParaSalvar);
}

/**
 * Carrega os dados da garagem da `localStorage` do navegador ao iniciar a aplicação.
 * Recria as instâncias dos objetos de veículos a partir dos dados salvos e popula o menu lateral da UI.
 */
function carregarGaragem() {
    const dadosSalvos = localStorage.getItem('garagemInteligente'); // Tenta recuperar a string JSON da localStorage
    if (dadosSalvos) {
        // Se existirem dados salvos
        try {
            const veiculosSalvos = JSON.parse(dadosSalvos); // Converte a string JSON de volta para um array de objetos JavaScript

            // Itera sobre cada objeto de dados de veículo recuperado
            veiculosSalvos.forEach(dadosVeiculo => {
                // Tenta encontrar a classe de veículo correta (`Carro`, `CarroEsportivo`, etc.)
                // no nosso mapa `classesVeiculos` usando o `tipo` salvo no JSON
                const ClasseVeiculo = classesVeiculos[dadosVeiculo.tipo];

                if (ClasseVeiculo) {
                    // Se a classe do veículo for encontrada
                    let novaInstancia; // Variável para a nova instância do veículo

                    // Diferencia a instanciação com base no tipo do veículo, para passar os parâmetros corretos para o construtor.
                    // Isso é importante porque cada tipo de veículo pode ter atributos extras para serem restaurados.
                    if (dadosVeiculo.tipo === 'esportivo') {
                        // O CarroEsportivo tem um atributo 'turboAtivado' extra
                        novaInstancia = new ClasseVeiculo(
                            dadosVeiculo.modelo,
                            dadosVeiculo.cor,
                            dadosVeiculo.id,
                            dadosVeiculo.historicoManutencao,
                            dadosVeiculo.turboAtivado
                        );
                    } else if (dadosVeiculo.tipo === 'caminhao') {
                        // O Caminhao tem atributos 'capacidadeCarga' e 'cargaAtual' extras
                        novaInstancia = new ClasseVeiculo(
                            dadosVeiculo.modelo,
                            dadosVeiculo.cor,
                            dadosVeiculo.capacidadeCarga,
                            dadosVeiculo.id,
                            dadosVeiculo.historicoManutencao,
                            dadosVeiculo.cargaAtual
                        );
                    } else {
                        // Construtor padrão para os outros tipos de veículo (Carro, Moto, Bicicleta)
                        novaInstancia = new ClasseVeiculo(
                            dadosVeiculo.modelo,
                            dadosVeiculo.cor,
                            dadosVeiculo.id,
                            dadosVeiculo.historicoManutencao
                        );
                    }

                    // Adiciona a instância de veículo recém-criada ao sistema (o que a inclui no menu lateral)
                    adicionarVeiculoAoSistema(novaInstancia);

                    // ATUALIZA A INTERFACE HTML COM DADOS CARREGADOS
                    // Seus spans no HTML (`<span id="carro-modelo">...</span>`) serão preenchidos
                    const prefix = novaInstancia.getIdPrefix(); // Obtém o prefixo de ID do veículo (ex: 'carro', 'moto')
                    // Atualiza as informações básicas do veículo no HTML (modelo, cor)
                    atualizarInfoVeiculo(prefix, {
                        modelo: novaInstancia.modelo,
                        cor: novaInstancia.cor,
                    });

                    // Se houver campo de placa, preenche-o
                    if (document.getElementById(`${prefix}-placa`)) {
                        document.getElementById(`${prefix}-placa`).textContent =
                            dadosVeiculo.placa || '---';
                    }

                    // Atualiza o display do turbo para carros esportivos
                    if (prefix === 'esportivo' && novaInstancia.turboAtivado !== undefined) {
                        document.getElementById(`${prefix}-turbo`).textContent =
                            novaInstancia.turboAtivado ? 'Ativado' : 'Desativado';
                    }
                    // Atualiza o display de carga e capacidade para caminhões
                    if (
                        prefix === 'caminhao' &&
                        novaInstancia.capacidadeCarga !== undefined
                    ) {
                        document.getElementById(`${prefix}-capacidade`).textContent =
                            novaInstancia.capacidadeCarga;
                        document.getElementById(`${prefix}-carga`).textContent =
                            novaInstancia.cargaAtual;
                    }
                }
            });

            mostrarFeedback('Garagem carregada do LocalStorage com sucesso!', 'success');

            // Após carregar todos os veículos, automaticamente mostra o primeiro veículo na interface
            if (Object.keys(veiculosInstanciados).length > 0) {
                const primeiroVeiculoId = Object.keys(veiculosInstanciados)[0];
                mostrarVeiculoContainer(primeiroVeiculoId); // Exibe o primeiro veículo carregado
            } else {
                // Se nenhum veículo foi carregado (por exemplo, localStorage vazia ou dados inválidos)
                document.getElementById('welcome-message').style.display = 'block'; // Mostra a mensagem de boas-vindas inicial
            }
        } catch (e) {
            console.error(
                '[Frontend] Erro ao carregar dados do LocalStorage (JSON inválido ou corrompido):',
                e
            );
            localStorage.removeItem('garagemInteligente'); // Em caso de erro, limpa os dados corrompidos para evitar futuros problemas
            mostrarFeedback(
                'Erro ao carregar garagem. Dados salvos corrompidos, iniciando com garagem vazia.',
                'error'
            );
            document.getElementById('welcome-message').style.display = 'block'; // Volta para a mensagem de boas-vindas
        }
    } else {
        // Se não há dados salvos na localStorage, exibe a mensagem de boas-vindas inicial
        document.getElementById('welcome-message').style.display = 'block';
    }
}


// ===========================================================================
// FUNÇÃO PARA BUSCAR PREVISÃO DO TEMPO (CHAMANDO SEU BACKEND - SEGURO!)
// (Funcionalidade principal da Atividade B2.P1.A8)
// ===========================================================================

/**
 * Busca a previsão do tempo para uma cidade específica, enviando a requisição para o nosso próprio backend (que atua como proxy seguro).
 * @param {string} veiculoPrefix - O prefixo do ID do veículo (ex: 'carro', 'bicicleta') para saber qual seção HTML atualizar.
 * @param {string} cidade - O nome da cidade para buscar a previsão.
 * @param {number} [dias=1] - Quantidade de dias para filtrar a previsão. (Atualmente, o backend proxy padrão que te dei foca no clima atual de 1 dia, mas o parâmetro 'dias' pode ser usado se você expandir seu backend para a previsão de 5 dias).
 */
async function buscarPrevisaoTempoBackend(veiculoPrefix, cidade, dias = 1) {
    if (!cidade) {
        mostrarFeedback(
            'Por favor, informe uma cidade para buscar a previsão do tempo.',
            'warning'
        );
        return; // Sai se a cidade estiver vazia
    }
    const resultadoContainer = document.getElementById(
        `previsao-tempo-resultado-${veiculoPrefix}`
    );
    const nomeCidadeDisplay = document.getElementById(
        `nome-cidade-previsao-${veiculoPrefix}`
    );
    // Este checkbox e a lógica de destaque de chuva só seriam relevantes se o backend retornasse dados de vários dias
    const destaqueChuvaCheckbox = document.getElementById(
        `destaque-chuva-${veiculoPrefix}`
    );
    const destaqueChuva = destaqueChuvaCheckbox ? destaqueChuvaCheckbox.checked : false;

    resultadoContainer.innerHTML = '<p>Carregando previsão do tempo...</p>'; // Feedback visual para o usuário
    nomeCidadeDisplay.textContent = `[${cidade}]`; // Temporariamente mostra a cidade sendo buscada

    try {
        // ESSENCIAL PARA SEGURANÇA E NOTA MÁXIMA: CHAME SEU PRÓPRIO BACKEND AQUI!
        // NÃO MAIS A API DIRETA DO OpenWeatherMap!
        const urlParaChamarBackend = `${backendUrl}/api/previsao/${encodeURIComponent(
            cidade
        )}`;
        console.log(
            `[FRONTEND] Requisição GET para o backend (previsão): ${urlParaChamarBackend}`
        );

        const response = await fetch(urlParaChamarBackend); // Faz a requisição HTTP GET para o seu backend
        if (!response.ok) {
            // Se a resposta do seu backend não for um status 2xx (ex: 400, 404, 500)
            const errorData = await response.json().catch(() => ({})); // Tenta ler a mensagem de erro do backend (se for JSON)
            throw new Error(
                errorData.error ||
                    `Erro (${response.status}): Falha ao carregar previsão do tempo.`
            );
        }
        const dados = await response.json(); // Pega os dados formatados (JSON) que vieram do seu backend!

        // Atualiza o display da cidade com o nome completo e país vindo do backend
        nomeCidadeDisplay.textContent = `${dados.nomeCidade}, ${dados.pais}`;

        // Constrói o HTML para exibir a previsão usando os dados recebidos do seu backend
        // (que já foram processados lá)
        resultadoContainer.innerHTML = `
            <div class="previsao-atual-card">
                <h5>${dados.descricaoClima}</h5>
                <img src="https://openweathermap.org/img/wn/${dados.iconeClima}@2x.png" alt="${dados.descricaoClima}" style="width:70px; height:auto;">
                <p>Temp: ${dados.temperaturaAtual.toFixed(1)}°C (Sensação: ${dados.sensacaoTermica.toFixed(1)}°C)</p>
                <p>Máx: ${dados.temperaturaMax.toFixed(1)}°C / Mín: ${dados.temperaturaMin.toFixed(1)}°C</p>
                <p>Vento: ${dados.velocidadeVento} m/s</p>
            </div>
            <p style="margin-top: 15px; font-style: italic; color: #777;">
                Esta seção exibe a previsão atual do momento da consulta.
                Para previsão de vários dias (3/5 dias), seu backend precisaria buscar e processar esses dados.
            </p>
        `;
    } catch (error) {
        // Em caso de erro na requisição (rede, servidor retornou erro, etc.), exibe mensagem para o usuário
        console.error('[Frontend] Erro ao buscar previsão do tempo via backend:', error);
        resultadoContainer.innerHTML = `<p style="color:red;">Erro ao buscar previsão: ${error.message}</p>`;
        nomeCidadeDisplay.textContent = '[Cidade]'; // Reseta o display da cidade
    }
}


// ===========================================================================
// NOVAS FUNÇÕES PARA ATIVIDADE B2.P1.A9: CONSUMINDO OS MÚLTIPLOS ENDPOINTS GET
// ===========================================================================

/**
 * Carrega a lista de "Veículos em Destaque" do backend e a exibe na seção HTML correspondente.
 */
async function carregarVeiculosDestaque() {
    const container = document.getElementById('cards-veiculos-destaque'); // Onde os cards serão exibidos
    if (!container) {
        console.warn(
            "[Frontend] Elemento HTML para 'cards-veiculos-destaque' não encontrado. Não é possível exibir os veículos em destaque."
        );
        return;
    }
    container.innerHTML = '<p>Carregando veículos destaque...</p>'; // Feedback inicial de carregamento
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`); // Chama o endpoint do backend
        if (!response.ok) {
            // Verifica se a requisição foi bem-sucedida
            const errorData = await response
                .json()
                .catch(() => ({ error: 'Erro desconhecido ao carregar veículos destaque.' }));
            throw new Error(
                `Falha HTTP! Status: ${response.status} - ${
                    errorData.error || response.statusText
                }`
            );
        }
        const veiculos = await response.json(); // Pega o array de veículos em destaque do backend

        container.innerHTML = ''; // Limpa a mensagem de carregamento
        if (veiculos.length === 0) {
            container.innerHTML = '<p>Nenhum veículo em destaque no momento.</p>';
            return; // Se o array estiver vazio, exibe mensagem
        }

        // Itera sobre o array de veículos e cria um card HTML para cada um
        veiculos.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'veiculo-card-destaque'; // Classe CSS para estilizar o card (definida no style.css)
            // Define o conteúdo HTML do card com as informações do veículo
            card.innerHTML = `
                <img src="${
                    veiculo.imagemUrl || 'https://via.placeholder.com/200x120?text=Sem+Imagem'
                }" alt="${veiculo.modelo}" 
                     style="width:100%; height:auto; max-height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                <h3 style="margin: 0 0 5px; font-size: 1.1em; color: #333;">${
                    veiculo.modelo
                } (${veiculo.ano})</h3>
                <p style="font-size: 0.85em; color: #666; margin: 0;"><strong>Destaque:</strong> ${
                    veiculo.destaque
                }</p>
            `;
            container.appendChild(card); // Adiciona o card ao container HTML
        });
    } catch (error) {
        console.error('[Frontend] Erro ao carregar veículos em destaque:', error);
        container.innerHTML = `<p style="color:red;">Falha ao carregar veículos destaque: ${error.message}</p>`;
    }
}

/**
 * Carrega a lista de "Nossos Serviços de Oficina" do backend e a exibe na seção HTML correspondente.
 */
async function carregarServicosGaragem() {
    const lista = document.getElementById('lista-servicos-oferecidos'); // Onde os serviços serão exibidos
    if (!lista) {
        console.warn(
            "[Frontend] Elemento HTML para 'lista-servicos-oferecidos' não encontrado. Não é possível exibir os serviços."
        );
        return;
    }
    lista.innerHTML = '<p>Carregando serviços...</p>'; // Feedback inicial
    try {
        const response = await fetch(`${backendUrl}/api/garagem/servicos-oferecidos`); // Chama o endpoint de serviços
        if (!response.ok) {
            const errorData = await response
                .json()
                .catch(() => ({ error: 'Erro desconhecido ao carregar serviços.' }));
            throw new Error(
                `Falha HTTP! Status: ${response.status} - ${
                    errorData.error || response.statusText
                }`
            );
        }
        const servicos = await response.json(); // Pega o array de serviços do backend

        lista.innerHTML = ''; // Limpa a mensagem de carregamento
        if (servicos.length === 0) {
            lista.innerHTML = '<p>Nenhum serviço disponível no momento.</p>';
            return;
        }

        // Itera sobre o array de serviços e cria um item de lista HTML para cada um
        servicos.forEach(servico => {
            const listItem = document.createElement('li');
            // Define o conteúdo HTML do item de lista com as informações do serviço
            listItem.innerHTML = `
                <h4 style="margin-top: 0; color: #333; font-size: 1.1em;">${servico.nome}</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${servico.descricao}</p>
                <p style="font-weight: bold; color: #007bff; font-size: 0.9em;">Preço Estimado: ${servico.precoEstimado}</p>
            `;
            lista.appendChild(listItem); // Adiciona o item à lista UL
        });
    } catch (error) {
        console.error('[Frontend] Erro ao carregar serviços da garagem:', error);
        lista.innerHTML = `<p style="color:red;">Falha ao carregar serviços: ${error.message}</p>`;
    }
}

/**
 * Configura os botões na seção "Ferramentas Essenciais" para que cada um busque os detalhes
 * de uma ferramenta específica por ID (usando o endpoint parametrizado do backend).
 */
async function configurarBotoesFerramentas() {
    const botoesContainer = document.getElementById('botoes-ferramentas'); // Onde os botões serão colocados
    if (!botoesContainer) {
        console.warn(
            "[Frontend] Elemento HTML para 'botoes-ferramentas' não encontrado. Não é possível configurar botões."
        );
        return;
    }

    // Lista das ferramentas que terão um botão, com IDs que correspondem aos do backend (server.js)
    const ferramentasParaBotao = [
        { id: 'F01', nome: 'Chaves Combinadas' },
        { id: 'F02', nome: 'Macaco Hidráulico' },
        { id: 'F03', nome: 'Chave de Impacto' },
    ];

    botoesContainer.innerHTML = ''; // Limpa o container de botões antes de preencher
    // Cria um botão para cada ferramenta da lista
    ferramentasParaBotao.forEach(ferramenta => {
        const button = document.createElement('button');
        button.textContent = `Detalhes: ${ferramenta.nome}`;
        // Define a ação ao clicar: chamar 'buscarDetalheFerramenta' com o ID específico
        button.onclick = () => buscarDetalheFerramenta(ferramenta.id);
        button.className = 'btn btn-outline-success btn-sm me-2 mb-2'; // Estilos Bootstrap
        botoesContainer.appendChild(button);
    });

    // Cria um botão extra para testar um ID inválido, o que deve gerar um erro 404 do backend
    const buttonInvalido = document.createElement('button');
    buttonInvalido.textContent = `Testar ID INVÁLIDO`;
    buttonInvalido.onclick = () => buscarDetalheFerramenta('ID_INVALIDO'); // ID que não existe
    buttonInvalido.className = 'btn btn-outline-danger btn-sm mb-2'; // Estilos Bootstrap para um botão de erro
    botoesContainer.appendChild(buttonInvalido);
}

/**
 * Busca e exibe os detalhes de uma ferramenta específica por seu ID, usando o endpoint
 * parametrizado do backend (`/api/garagem/ferramentas-essenciais/:idFerramenta`).
 * @param {string} idFerramenta - O ID da ferramenta a ser buscada.
 */
async function buscarDetalheFerramenta(idFerramenta) {
    const detalheContainer = document.getElementById('detalhe-ferramenta'); // Onde os detalhes da ferramenta serão exibidos
    if (!detalheContainer) {
        console.warn(
            "[Frontend] Elemento HTML para 'detalhe-ferramenta' não encontrado. Não é possível exibir detalhes."
        );
        return;
    }
    detalheContainer.innerHTML = `<p>Buscando detalhe da ferramenta '${idFerramenta}'...</p>`; // Feedback de carregamento
    detalheContainer.style.backgroundColor = '#f0f8ff'; // Cor de fundo neutra durante carregamento
    try {
        // Chama o endpoint do backend passando o ID da ferramenta na URL
        const response = await fetch(
            `${backendUrl}/api/garagem/ferramentas-essenciais/${idFerramenta}`
        );
        if (!response.ok) {
            // Se a resposta não for OK (ex: 404 para ID inválido, 500 para erro interno)
            const errorData = await response.json().catch(() => ({})); // Tenta ler a mensagem de erro do backend
            throw new Error(
                `Falha ao buscar ferramenta: ${
                    errorData.error || `Status HTTP ${response.status}`
                }`
            );
        }
        const ferramenta = await response.json(); // Pega o objeto da ferramenta do backend

        detalheContainer.style.backgroundColor = '#eaf8f4'; // Cor de fundo verde claro para sucesso
        // Exibe os detalhes da ferramenta no HTML
        detalheContainer.innerHTML = `
            <h4 style="margin-top: 0; color: #007bff; font-size: 1.1em;">Ferramenta: ${ferramenta.nome} (ID: ${ferramenta.id})</h4>
            <p style="font-size: 0.9em; margin-bottom: 5px;"><strong>Utilidade:</strong> ${ferramenta.utilidade}</p>
            <p style="font-size: 0.9em; margin: 0;"><strong>Categoria:</strong> ${ferramenta.categoria}</p>
        `;
    } catch (error) {
        // Em caso de erro na busca ou resposta, exibe a mensagem de erro e muda a cor de fundo
        console.error('[Frontend] Erro ao buscar detalhe da ferramenta:', error);
        detalheContainer.style.backgroundColor = '#ffe9ec'; // Cor de fundo vermelho claro para erro
        detalheContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}


// ===========================================================================
// FUNÇÃO CENTRAL: CONFIGURAÇÃO DE TODOS OS EVENTOS DO UI
// (Esta função é chamada uma única vez ao carregar a página)
// ===========================================================================

/**
 * Configura todos os ouvintes de eventos para as interações na interface,
 * cobrindo desde o menu lateral e formulários, até os botões de ação dos veículos
 * e as funcionalidades de integração com API/Backend.
 */
function configurarTodosOsEventos() {
    // === 1. Eventos do Menu Lateral para Navegação ===
    document.getElementById('sidebar-menu').addEventListener('click', e => {
        // Lógica para o botão "Adicionar Veículo"
        if (e.target.dataset.action === 'mostrarFormAddVeiculo') {
            e.preventDefault();
            document
                .querySelectorAll('.veiculo-container')
                .forEach(div => (div.style.display = 'none'));
            document.getElementById('welcome-message').style.display = 'none';
            document.getElementById('add-veiculo-form-container').style.display =
                'block';
            veiculoAtivoId = null; // Nenhum veículo está ativo
            // Desativa visualmente todos os links da sidebar e ativa o de adicionar veículo
            document
                .querySelectorAll('#sidebar-menu li a')
                .forEach(a => a.classList.remove('active'));
            e.target.classList.add('active');
        }
        // Lógica para cliques nos itens de veículo no menu lateral
        else if (e.target.closest('li.veiculo-item a')) {
            // Verifica se o clique foi em um link dentro de um item de veículo
            e.preventDefault();
            const veiculoId = e.target.closest('li.veiculo-item a').dataset.veiculoId;
            if (veiculoId) {
                mostrarVeiculoContainer(veiculoId); // Exibe o container do veículo selecionado
            }
        }
    });

    // Botão "Cancelar" do formulário de adição de veículo
    document.getElementById('cancel-add-veiculo').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('add-veiculo-form-container').style.display = 'none'; // Esconde o formulário
        document.getElementById('welcome-message').style.display = 'block'; // Mostra a mensagem de boas-vindas
        document
            .querySelectorAll('#sidebar-menu li a')
            .forEach(a => a.classList.remove('active')); // Limpa seleção no menu
    });

    // === 2. Lógica do Formulário para Adicionar Novo Veículo ===
    // Exibir/esconder o campo de capacidade de carga para o Caminhão
    document.getElementById('add-tipo').addEventListener('change', e => {
        document.getElementById('add-caminhao-capacidade-group').style.display =
            e.target.value === 'caminhao' ? 'block' : 'none';
    });

    // Submissão do formulário de adição de veículo
    document.getElementById('add-veiculo-form').addEventListener('submit', e => {
        e.preventDefault();

        const tipo = document.getElementById('add-tipo').value;
        const modelo = document.getElementById('add-modelo').value.trim();
        const cor = document.getElementById('add-cor').value.trim();
        let placa = document.getElementById('add-placa').value.trim();
        const capacidadeCarga =
            tipo === 'caminhao' ? Number(document.getElementById('add-capacidade').value) : null;

        // Validações básicas (pode ser mais robusto com mensagens específicas)
        if (!modelo || !cor) {
            mostrarFeedback(
                'Modelo e cor são obrigatórios para qualquer veículo!',
                'error'
            );
            return;
        }
        if (tipo === 'caminhao' && (isNaN(capacidadeCarga) || capacidadeCarga <= 0)) {
            mostrarFeedback(
                'Para Caminhões, a Capacidade de Carga é obrigatória e deve ser um número positivo.',
                'error'
            );
            return;
        }

        const ClasseVeiculo = classesVeiculos[tipo]; // Pega a classe JS correta do mapa
        if (!ClasseVeiculo) {
            mostrarFeedback(
                'Tipo de veículo selecionado inválido. Por favor, selecione uma opção válida.',
                'error'
            );
            return;
        }

        let novoVeiculo;
        try {
            // Instancia o novo objeto de veículo, usando o construtor da classe POO correta.
            if (tipo === 'caminhao') {
                novoVeiculo = new ClasseVeiculo(modelo, cor, capacidadeCarga);
            } else {
                novoVeiculo = new ClasseVeiculo(modelo, cor);
            }

            const prefix = novoVeiculo.getIdPrefix(); // Pega o prefixo (ex: 'carro', 'esportivo')
            // Atualiza os spans no HTML com os dados iniciais do novo veículo
            atualizarInfoVeiculo(prefix, {
                modelo: novoVeiculo.modelo,
                cor: novoVeiculo.cor,
            });
            // Se houver campo de placa, preenche-o
            if (placa && document.getElementById(`${prefix}-placa`)) {
                document.getElementById(`${prefix}-placa`).textContent = placa;
            }
            // Se for caminhão e tiver capacidade, garante que o display dela está certo
            if (tipo === 'caminhao' && capacidadeCarga) {
                novoVeiculo.capacidadeCarga = capacidadeCarga;
                atualizarInfoVeiculo(prefix, {
                    capacidade: novoVeiculo.capacidadeCarga,
                    carga: novoVeiculo.cargaAtual,
                });
            }

            adicionarVeiculoAoSistema(novoVeiculo); // Adiciona a instância ao sistema (sidebar e mapa global)
            mostrarFeedback(
                `Veículo "${novoVeiculo.modelo}" (${novoVeiculo.getTipo()}) foi adicionado com sucesso!`,
                'success'
            );
            mostrarVeiculoContainer(novoVeiculo.id); // Exibe o container do veículo recém-adicionado
            document.getElementById('add-veiculo-form').reset(); // Limpa o formulário
            document.getElementById('add-caminhao-capacidade-group').style.display =
                'none'; // Esconde campo de capacidade
        } catch (error) {
            console.error('[Frontend] Erro ao instanciar ou adicionar novo veículo:', error);
            mostrarFeedback(
                `Erro ao adicionar veículo: ${error.message}. Verifique o console para mais detalhes.`,
                'error'
            );
        }
    });

    // === 3. Eventos dos Botões de Ação dos Veículos (Ligar, Acelerar, Frear, etc.) ===
    // Percorre todos os DIVs com a classe 'actions' para configurar eventos nos botões internos
    document.querySelectorAll('.actions').forEach(actionsDiv => {
        actionsDiv.addEventListener('click', e => {
            // Usa 'closest' para encontrar o botão com 'data-acao' mesmo que o clique seja em um span/ícone dentro do botão
            const button = e.target.closest('button[data-acao]');
            if (!button) return; // Se o clique não foi em um botão de ação, sai

            e.preventDefault();

            const tipoPrefix = button.dataset.tipo; // Ex: 'carro', 'esportivo', 'bicicleta'
            const acao = button.dataset.acao; // Ex: 'ligar', 'acelerar', 'ativarTurbo'

            // Encontra a instância do veículo POO no nosso mapa global `veiculosInstanciados`
            // baseado no prefixo do tipo.
            // NOTA: Para cenários com múltiplos carros CASUAIS, precisaríamos de uma forma de saber qual ID
            // do veículo específico que está ativo, não apenas o TIPO. Para este projeto, como temos um container por TIPO,
            // pegar a primeira instância do tipo já funciona, ou podemos refinar pelo 'veiculoAtivoId'.
            const veiculo = Object.values(veiculosInstanciados).find(
                v => v.getIdPrefix() === tipoPrefix
            );

            if (!veiculo) {
                mostrarFeedback(
                    `Nenhum veículo do tipo "${tipoPrefix}" foi encontrado no sistema para esta ação. Adicione um primeiro!`,
                    'warning'
                );
                return;
            }

            // A essência da POO: chamar o método da instância do objeto de veículo!
            // O objeto 'window.sons' é passado para que os métodos das classes possam tocar sons.
            switch (acao) {
                case 'ligar':
                    veiculo.ligar(window.sons);
                    break;
                case 'desligar':
                    veiculo.desligar(window.sons);
                    break;
                case 'acelerar':
                case 'pedalar':
                    veiculo.acelerar(window.sons);
                    break;
                case 'frear':
                    veiculo.frear(window.sons);
                    break;
                case 'buzinar':
                    veiculo.buzinar(window.sons);
                    break;
                case 'ativarTurbo':
                    // Verifica se o método 'ativarTurbo' existe na instância (somente CarroEsportivo)
                    if (veiculo.ativarTurbo) veiculo.ativarTurbo();
                    break;
                case 'desativarTurbo':
                    // Verifica se o método 'desativarTurbo' existe
                    if (veiculo.desativarTurbo) veiculo.desativarTurbo();
                    break;
                case 'carregar':
                    // Pega o valor do input de carga (específico para Caminhão)
                    const cargaInputCarregar = document.getElementById(
                        `${tipoPrefix}-carga-input`
                    );
                    const cargaValor = parseFloat(cargaInputCarregar.value);
                    // Verifica se o método 'carregar' existe e o valor é válido
                    if (veiculo.carregar && !isNaN(cargaValor) && cargaValor > 0) {
                        veiculo.carregar(cargaValor);
                    } else {
                        mostrarFeedback(
                            'Para carregar, informe uma quantidade válida e positiva (em kg).',
                            'warning'
                        );
                    }
                    if (cargaInputCarregar) cargaInputCarregar.value = ''; // Limpa o input
                    break;
                case 'descarregar':
                    // Pega o valor do input de carga para descarregar
                    const cargaInputDescarregar = document.getElementById(
                        `${tipoPrefix}-carga-input`
                    );
                    const descarregarValor = parseFloat(cargaInputDescarregar.value);
                    // Verifica se o método 'descarregar' existe e o valor é válido
                    if (
                        veiculo.descarregar &&
                        !isNaN(descarregarValor) &&
                        descarregarValor > 0
                    ) {
                        veiculo.descarregar(descarregarValor);
                    } else {
                        mostrarFeedback(
                            'Para descarregar, informe uma quantidade válida e positiva (em kg).',
                            'warning'
                        );
                    }
                    if (cargaInputDescarregar) cargaInputDescarregar.value = ''; // Limpa o input
                    break;
                default:
                    console.warn(
                        `[Frontend] Ação desconhecida ou não implementada para o veículo "${tipoPrefix}": "${acao}".`
                    );
            }
        });
    });


    // === 4. Eventos para a funcionalidade de Previsão do Tempo (chama seu BACKEND) ===
    document.querySelectorAll('.verificar-clima-btn-veiculo').forEach(btn => {
        btn.addEventListener('click', () => {
            const veiculoPrefix = btn.dataset.veiculoTipo; // ex: 'carro', 'bicicleta'
            const inputCidade = document.getElementById(
                `cidade-previsao-input-${veiculoPrefix}`
            );
            const cidade = inputCidade.value.trim();

            // As próximas linhas relacionadas a 'dias' são para manter compatibilidade com HTML/contexto
            // mas o proxy padrão neste `server.js` foca no clima *atual* (1 dia).
            const diasSelecionadosBtn = document.querySelector(
                `.filtros-previsao .btn.active[data-veiculo-tipo="${veiculoPrefix}"]`
            );
            const dias = diasSelecionadosBtn ? Number(diasSelecionadosBtn.dataset.dias) : 1;

            // Chama a função que enviará a requisição para o seu próprio backend
            buscarPrevisaoTempoBackend(veiculoPrefix, cidade, dias);
        });
    });

    // Configura os botões de filtro de dias para a previsão do tempo (ativa/desativa classe 'active')
    document.querySelectorAll('.filtros-previsao .btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const veiculoPrefix = this.dataset.veiculoTipo;
            // Remove 'active' de todos os botões do mesmo grupo (para garantir que apenas um está ativo)
            document
                .querySelectorAll(
                    `.filtros-previsao .btn[data-veiculo-tipo="${veiculoPrefix}"]`
                )
                .forEach(b => b.classList.remove('active'));
            this.classList.add('active'); // Adiciona 'active' ao botão que foi clicado

            // Se já há uma cidade digitada, dispara a busca de clima novamente para aplicar o filtro visual (se relevante)
            const inputCidade = document.getElementById(
                `cidade-previsao-input-${veiculoPrefix}`
            );
            if (inputCidade && inputCidade.value.trim()) {
                document.getElementById(`verificar-clima-btn-${veiculoPrefix}`).click();
            }
        });
    });

    // Configura o checkbox de "Destacar Chuva"
    document.querySelectorAll('.toggle-destaque-chuva').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const veiculoPrefix = this.dataset.veiculoTipo;
            // Dispara a busca de clima novamente ao mudar o checkbox
            const inputCidade = document.getElementById(
                `cidade-previsao-input-${veiculoPrefix}`
            );
            if (inputCidade && inputCidade.value.trim()) {
                document.getElementById(`verificar-clima-btn-${veiculoPrefix}`).click();
            }
        });
    });

    // === 6. Formulários de Manutenção ===
    // Configura o evento de submissão para todos os formulários de manutenção.
    document.querySelectorAll('.manutencao-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const tipoVeiculoForm = form.dataset.tipo; // Pega o tipo do veículo associado a este formulário

            // Encontra a instância real do objeto de veículo ao qual esta manutenção será adicionada.
            const veiculoAlvo = Object.values(veiculosInstanciados).find(
                v => v.getTipo() === tipoVeiculoForm
            );

            if (!veiculoAlvo) {
                mostrarFeedback(
                    `Nenhum veículo do tipo "${tipoVeiculoForm}" foi adicionado. Adicione um para registrar manutenções.`,
                    'warning'
                );
                return;
            }

            // Coleta os valores dos campos do formulário
            const dataVal = form.querySelector(`[id$="-manutencao-data"]`).value; // ex: `carro-manutencao-data`
            const tipoVal = form.querySelector(`[id$="-manutencao-tipo"]`).value.trim();
            const custoVal = parseFloat(form.querySelector(`[id$="-manutencao-custo"]`).value);
            const descricaoVal = form.querySelector(
                `[id$="-manutencao-descricao"]`
            ).value.trim();

            // Cria uma nova instância da classe `Manutencao` com os dados do formulário
            const novaManutencao = new Manutencao(
                dataVal,
                tipoVal,
                custoVal,
                descricaoVal
            );

            // Adiciona a manutenção diretamente na instância do veículo (método POO).
            // O método `adicionarManutencao` da classe Veiculo lida com a validação e persistência.
            if (veiculoAlvo.adicionarManutencao(novaManutencao)) {
                form.reset(); // Limpa os campos do formulário se a adição for bem-sucedida
            }
        });
    });

    // Delegar eventos de clique para os botões de remover manutenção
    // Este padrão é usado para botões que são criados dinamicamente no HTML pelo JS.
    document.querySelectorAll('.manutencao-display ul').forEach(ul => {
        ul.addEventListener('click', e => {
            // Verifica se o clique foi em um elemento com a classe 'remover-manutencao-btn'
            if (e.target.classList.contains('remover-manutencao-btn')) {
                e.preventDefault();
                const idParaRemover = e.target.dataset.id; // Pega o ID da manutenção armazenado no botão

                // Descobre o prefixo do veículo a partir do ID da lista UL (ex: 'carro' de 'carro-historico-lista')
                const prefixoUl = ul.id.split('-')[0];
                // Encontra a instância do objeto de veículo associado
                const veiculoAlvo = Object.values(veiculosInstanciados).find(
                    v => v.getIdPrefix() === prefixoUl
                );

                if (veiculoAlvo) {
                    veiculoAlvo.removerManutencao(idParaRemover); // Chama o método de remover na instância do veículo
                } else {
                    console.error(
                        '[Frontend] O veículo associado à manutenção não foi encontrado para remoção!'
                    );
                    mostrarFeedback(
                        'Erro: Não foi possível identificar o veículo para remover esta manutenção.',
                        'error'
                    );
                }
            }
        });
    });
} // Fim da função configurarTodosOsEventos


// ===========================================================================
// PONTO DE ENTRADA DA APLICAÇÃO: Executado quando todo o HTML está carregado
// ===========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Primeiro, configura todos os ouvintes de eventos da UI.
    // Isso garante que os botões, formulários etc. estejam prontos para interação.
    configurarTodosOsEventos();

    // 2. Em seguida, tenta carregar quaisquer veículos que foram salvos na localStorage em uma sessão anterior.
    // Isso popula o mapa `veiculosInstanciados` e o menu lateral da sidebar.
    carregarGaragem();

    // 3. Carrega os dados para as novas seções da Atividade 09 (Veículos Destaque, Serviços, Ferramentas)
    // As chamadas para o backend serão feitas aqui.
    carregarVeiculosDestaque();
    carregarServicosGaragem();
    configurarBotoesFerramentas();

    // 4. Exibe uma mensagem inicial de boas-vindas para o usuário.
    mostrarFeedback(
        'Sistema Garagem Inteligente carregado! Selecione ou adicione um veículo para começar.',
        'info'
    );
});

// Fim de script.js
=======
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
>>>>>>> e6b4cfe7b3daa0b8532778724f7576f605c1a068
