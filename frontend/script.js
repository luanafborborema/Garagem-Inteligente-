// ginteligente/script.js (ou o nome do seu arquivo JS principal do Frontend)
// CONTEÚDO COMPLETO DO ARQUIVO: SUBSTITUA TUDO QUE JÁ EXISTE POR ISTO.

// ===================================================================================================
// IMPORTAÇÃO DE MÓDULOS (Suas classes JavaScript e funções auxiliares)
// IMPORTANTÍSSIMO: Ajuste os CAMINHOS DE ACORDO com a organização das suas pastas!
// Se os arquivos (ex: Carro.js, Veiculo.js) estão na mesma pasta do script.js, use './NomeDoArquivo.js'.
// Se estão em uma subpasta (ex: 'ginteligente/js/classes/'), use './js/classes/NomeDoArquivo.js'.
// ===================================================================================================
import { Carro } from './Carro.js'; 
import { CarroEsportivo } from './CarroEsportivo.js'; 
import { Caminhao } from './Caminhao.js'; 
import { Moto } from './Moto.js'; 
import { Bicicleta } from './Bicicleta.js'; 
import { Manutencao } from './Manutencao.js'; 
// As funções auxiliares também precisam ser importadas para uso neste script.
import { mostrarFeedback, atualizarInfoVeiculo, atualizarEstadoBotoes } from './funcoesAuxiliares.js'; 


// =====================================================================================
//  *** PASSO CRÍTICO: CONFIGURAÇÃO DA URL DO SEU BACKEND! ***
//  Mude 'backendUrl = backendLocalUrl' para 'backendUrl = backendRenderUrl' 
//  QUANDO FOR PUBLICAR/ENTREGAR SEU PROJETO NO RENDER!
// =====================================================================================
const backendLocalUrl = 'http://localhost:3001'; // URL para testes locais (quando seu backend está rodando no seu PC)
// SUBSTITUA A SEGUINTE URL PELA SUA URL REAL E PÚBLICA DO SEU SERVIÇO NO RENDER.
// Você pode encontrá-la no painel do Render, depois que seu backend estiver publicado.
// EX: "https://seu-nome-da-garagem-abc12.onrender.com"
const backendRenderUrl = 'https://garagem-inteligente.onrender.com'; // EXEMPLO, COLOQUE A SUA URL REAL AQUI!

// IMPORTANTE: Mude esta linha para 'backendUrl = backendRenderUrl;' QUANDO FOR FAZER O DEPLOY FINAL/AVALIAÇÃO!
const backendUrl = backendLocalUrl; // Atualmente configurado para teste local


console.log(`[FRONTEND] O script principal foi carregado. Requisições do frontend serão enviadas para: ${backendUrl}`);


// =====================================================================
//  VARIÁVEIS GLOBAIS DE CONTROLE DA APLICAÇÃO (Frontend)
// =====================================================================

// Este objeto vai armazenar todas as instâncias dos seus objetos de veículos (criados com as classes POO).
// A chave de cada item será o ID único do veículo (gerado ou salvo no localStorage).
// Ex: { "carro_meufusca_1a2b3": new Carro("Meu Fusca", "Azul", ...), ... }
const veiculosInstanciados = {}; 

// Mapa que associa o "tipo" de veículo (string, ex: 'carro', 'moto') à sua classe JavaScript correspondente.
// Isso permite que o código crie instâncias de classes dinamicamente com base no tipo selecionado.
const classesVeiculos = {
    'carro': Carro,
    'esportivo': CarroEsportivo, 
    'caminhao': Caminhao,
    'moto': Moto,
    'bicicleta': Bicicleta
};

// Objeto contendo as referências para os elementos <audio> que serão usados para tocar os sons.
// CERTIFIQUE-SE que estes arquivos MP3 (ou OGG) existem na sua pasta `sons/` (ou no caminho correto) dentro do seu frontend!
const sons = {
    ligar: new Audio('sons/ligar.mp3'),
    desligar: new Audio('sons/desligar.mp3'),
    acelerar: new Audio('sons/acelerar.mp3'),
    frear: new Audio('sons/frear.mp3'),
    buzina: new Audio('sons/buzinar.mp3'),
    // Adicione mais sons aqui se suas classes de veículo os usam e se você tem os arquivos:
    // campainha: new Audio('sons/campainha.mp3'), 
    // freioBike: new Audio('sons/freio_bike.mp3') 
};
// Torna o objeto 'sons' acessível globalmente (em `window.sons`) para que os métodos das suas classes de veículo (`Carro.js`, etc.)
// possam utilizá-lo facilmente sem precisar importá-lo em cada arquivo de classe.
window.sons = sons; 

// Variável para rastrear o ID do veículo que está atualmente visível/selecionado na interface.
let veiculoAtivoId = null; 


// ===========================================================================
// FUNÇÕES AUXILIARES DE MANIPULAÇÃO DA UI E LÓGICA DE NEGÓCIO (Usando POO)
// ===========================================================================

/**
 * Atualiza as listas de histórico e agendamentos de manutenção na interface (UI) para um veículo específico.
 * Este método é crucial para garantir que as listas de manutenção sejam renderizadas dinamicamente.
 * @param {object} veiculoInstancia - A instância do objeto de veículo (Ex: um objeto `Carro`, `Moto`, etc.).
 */
function atualizarDisplayManutencaoUI(veiculoInstancia) {
    const prefix = veiculoInstancia.getIdPrefix(); // Obtém o prefixo do ID do veículo (ex: 'carro', 'moto')
    const historicoListaUl = document.getElementById(`${prefix}-historico-lista`); // Elemento UL do histórico
    const agendamentosListaUl = document.getElementById(`${prefix}-agendamentos-lista`); // Elemento UL dos agendamentos

    // Verifica se os elementos UL foram encontrados (eles só existem quando o container do veículo é exibido na UI)
    if (!historicoListaUl || !agendamentosListaUl) {
        console.warn(`[Frontend] Listas de manutenção HTML (IDs: "${prefix}-historico-lista" ou "${prefix}-agendamentos-lista") não encontradas na página. Possivelmente o container do veículo não está visível.`);
        return; // Sai da função se os elementos HTML não existirem
    }

    // Pega os arrays de manutenções separadas (passadas e futuras) diretamente da instância do veículo.
    // Os métodos `getManutencoesSeparadas`, `formatarParaHistorico` e `formatarParaAgendamento` são métodos das suas classes `Veiculo.js` e `Manutencao.js`.
    const { historicoPassado, agendamentosFuturos } = veiculoInstancia.getManutencoesSeparadas();

    // Função auxiliar interna para preencher qualquer lista UL genérica, recebendo os itens e um formatador.
    const popularLista = (ulElement, listaItens, mensagemVazio, formatarFn) => {
        ulElement.innerHTML = ''; // Limpa o conteúdo da lista UL antes de preencher
        if (listaItens.length === 0) {
            ulElement.innerHTML = `<li>${mensagemVazio}</li>`; // Mostra uma mensagem se a lista estiver vazia
        } else {
            listaItens.forEach(item => {
                const li = document.createElement('li'); // Cria um novo item de lista HTML (`<li>`)
                li.innerHTML = formatarFn(item); // Formata o item de manutenção para HTML (pode incluir um botão de remover)
                ulElement.appendChild(li); // Adiciona o item à lista UL
            });
        }
    };

    // Popula a lista de histórico (manutenções passadas)
    popularLista(historicoListaUl, historicoPassado, "Nenhum registro de manutenção.", m => m.formatarParaHistorico());
    // Popula a lista de agendamentos (manutenções futuras)
    popularLista(agendamentosListaUl, agendamentosFuturos, "Nenhum agendamento futuro.", m => m.formatarParaAgendamento());
}

/**
 * Adiciona um objeto de veículo instanciado ao mapa global da garagem (`veiculosInstanciados`)
 * e cria um link para ele no menu lateral da UI para que o usuário possa selecioná-lo.
 * @param {object} veiculoObj - A instância do objeto de veículo (ex: um objeto `Carro` criado com `new Carro(...)`).
 */
function adicionarVeiculoAoSistema(veiculoObj) {
    // Adiciona o veículo ao mapa global `veiculosInstanciados` usando o ID único do veículo como chave.
    veiculosInstanciados[veiculoObj.id] = veiculoObj;

    const sidebarMenu = document.getElementById('sidebar-menu'); // Referência ao menu lateral da aplicação
    // Pega a referência do botão "➕ Adicionar Veículo" no menu para poder inserir os novos links de veículos antes dele.
    const btnAdd = sidebarMenu.querySelector('li[data-action="mostrarFormAddVeiculo"]');

    const li = document.createElement('li'); // Cria um novo item de lista HTML (`<li>`) para o menu.
    li.dataset.veiculoId = veiculoObj.id; // Armazena o ID único do veículo como um atributo de dados no HTML (`data-veiculo-id`).
    li.dataset.veiculoTipo = veiculoObj.getTipo(); // Armazena o tipo do veículo (ex: 'carro', 'esportivo').
    li.className = 'veiculo-item'; // Aplica uma classe CSS para estilização (definida no `style.css`).
    
    // Define o conteúdo HTML do link do menu: Exemplo "Meu Fusca (carro)".
    li.innerHTML = `<a href="#" data-veiculo-id="${veiculoObj.id}">${veiculoObj.modelo} (${veiculoObj.getTipo()})</a>`;
    // Insere o novo item na barra lateral antes do botão "Adicionar Veículo".
    sidebarMenu.insertBefore(li, btnAdd); 

    // Adiciona um evento de clique ao link do novo item do menu: quando clicado, ele chamará a função `mostrarVeiculoContainer`.
    li.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault(); // Impede o comportamento padrão de navegação do link (`href="#"`).
        mostrarVeiculoContainer(veiculoObj.id); // Chama a função para exibir o container do veículo correspondente.
    });

    // Após adicionar/recuperar um veículo, atualiza imediatamente todos os displays relacionados a ele na UI.
    // Isso garante que todas as informações (status, velocidade, manutenções etc.) sejam exibidas corretamente ao usuário.
    veiculoObj.atualizarDisplayManutencao(); 
    veiculoObj.atualizarStatus();
    veiculoObj.atualizarVelocidade();
    // Verifica se os métodos específicos da subclasse existem antes de chamá-los, para evitar erros.
    if (veiculoObj.atualizarTurboDisplay) veiculoObj.atualizarTurboDisplay();
    if (veiculoObj.atualizarInfoCaminhao) veiculoObj.atualizarInfoCaminhao();
    veiculoObj.atualizarEstadoBotoesWrapper(); // Habilita/desabilita os botões corretamente com base no estado do veículo.

    salvarGaragem(); // Salva o estado atual da garagem na localStorage (persistência de dados).
}

/**
 * Exibe o container HTML específico de um veículo (escondendo todos os outros containers e mensagens de boas-vindas/formulários na área principal da UI).
 * Também ativa o link correspondente na sidebar.
 * @param {string} veiculoId - O ID único da instância do veículo a ser exibido.
 */
function mostrarVeiculoContainer(veiculoId) {
    // Esconde elementos da tela principal que não devem aparecer quando um veículo é selecionado.
    document.getElementById('welcome-message').style.display = 'none';
    document.getElementById('add-veiculo-form-container').style.display = 'none';

    // Esconde todos os containers de veículos primeiro, para garantir que apenas um fique visível.
    document.querySelectorAll('.veiculo-container').forEach(div => div.style.display = 'none');
    
    // Remove o estilo "ativo" (classe 'active') de todos os links do menu lateral, limpando a seleção anterior.
    document.querySelectorAll('#sidebar-menu li a').forEach(a => a.classList.remove('active'));

    // Tenta recuperar a instância do objeto de veículo do nosso mapa global `veiculosInstanciados` usando o ID fornecido.
    const veiculoInstance = veiculosInstanciados[veiculoId];
    if (veiculoInstance) {
        const prefix = veiculoInstance.getIdPrefix(); // Obtém o prefixo de ID do veículo (ex: 'carro', 'esportivo', 'bicicleta')
        const container = document.getElementById(`${prefix}-container`); // Pega o elemento HTML do container do veículo correspondente ao prefixo.
        if (container) {
            container.style.display = 'block'; // Torna o container do veículo visível.
            veiculoAtivoId = veiculoId; // Atualiza a variável global com o ID do veículo atualmente ativo na UI.
            
            // Adiciona a classe 'active' ao link correspondente na sidebar para destacar a seleção atual.
            const linkAtivo = document.querySelector(`#sidebar-menu li[data-veiculo-id="${veiculoId}"] a`);
            if (linkAtivo) linkAtivo.classList.add('active');

            // Garante que todas as informações visuais e os estados dos botões do veículo estejam atualizados ao mostrá-lo.
            veiculoInstance.atualizarStatus();
            veiculoInstance.atualizarVelocidade();
            veiculoInstance.atualizarDisplayManutencao(); 
            if (veiculoInstance.atualizarTurboDisplay) veiculoInstance.atualizarTurboDisplay();
            if (veiculoInstance.atualizarInfoCaminhao) veiculoInstance.atualizarInfoCaminhao();
            veiculoInstance.atualizarEstadoBotoesWrapper();

            // Rola a página suavemente para que o container do veículo fique visível na parte superior da janela.
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } else {
            console.error(`[Frontend] ERRO: O elemento container HTML com ID "${prefix}-container" não foi encontrado na página para o veículo ID: ${veiculoId}. Por favor, verifique seu "index.html" para garantir que os IDs HTML dos containers de veículos estão corretos e correspondem aos prefixos definidos nas suas classes JavaScript.`);
            mostrarFeedback("Erro ao carregar o layout do veículo. Verifique o console para mais detalhes ou tente recarregar a página.", 'error');
        }
    } else {
        console.error(`[Frontend] ERRO: A instância do veículo com ID "${veiculoId}" não foi encontrada no registro global de veículos ("veiculosInstanciados").`);
        mostrarFeedback("Erro: Os dados do veículo selecionado não puderam ser encontrados para exibir.", 'error');
    }
}

/**
 * Salva o estado de todos os objetos de veículo na `localStorage` do navegador.
 * Isso é feito convertendo cada instância de veículo para um objeto JSON simples, garantindo a persistência dos dados entre sessões do navegador.
 */
function salvarGaragem() {
    // Mapeia todas as instâncias de veículo armazenadas em `veiculosInstanciados` para um formato JSON serializável.
    // O método `toJSON()` de cada classe (`Veiculo.js`, `Carro.js`, etc.) é chamado automaticamente para converter o objeto completo em um objeto simples para persistência.
    const dadosParaSalvar = Object.values(veiculosInstanciados).map(veiculo => veiculo.toJSON());
    // Converte o array de objetos JSON em uma string JSON e a armazena na `localStorage` com a chave 'garagemInteligente'.
    localStorage.setItem('garagemInteligente', JSON.stringify(dadosParaSalvar));
    console.log("[Garagem] Dados salvos com sucesso na LocalStorage:", dadosParaSalvar);
}

/**
 * Carrega os dados dos veículos salvos na `localStorage` do navegador ao iniciar a aplicação.
 * Este processo envolve recriar as instâncias dos objetos de veículo a partir dos dados JSON salvos e populá-los no menu lateral da UI.
 */
function carregarGaragem() {
    const dadosSalvos = localStorage.getItem('garagemInteligente'); // Tenta recuperar a string JSON dos dados da garagem da localStorage.
    if (dadosSalvos) { // Se houver dados salvos na localStorage
        try {
            const veiculosSalvos = JSON.parse(dadosSalvos); // Converte a string JSON de volta para um array de objetos JavaScript.

            // Itera sobre cada objeto de dados de veículo recuperado (JSON simples)
            veiculosSalvos.forEach(dadosVeiculo => {
                // Tenta encontrar a classe de veículo correta (`Carro`, `CarroEsportivo`, etc.) 
                // no nosso mapa `classesVeiculos` usando o `tipo` salvo no JSON.
                const ClasseVeiculo = classesVeiculos[dadosVeiculo.tipo];

                if (ClasseVeiculo) { // Se a classe do veículo correspondente ao 'tipo' for encontrada
                    let novaInstancia; // Variável para a nova instância do objeto de veículo.

                    // Diferencia a forma como a instância da classe é criada com base no 'tipo' do veículo.
                    // Isso é necessário porque construtores de diferentes tipos de veículo podem ter parâmetros específicos adicionais (ex: `turboAtivado` para esportivos, `capacidadeCarga` para caminhões).
                    if (dadosVeiculo.tipo === 'esportivo') {
                        // Construtor para CarroEsportivo, passando o atributo `turboAtivado`
                        novaInstancia = new ClasseVeiculo(dadosVeiculo.modelo, dadosVeiculo.cor, dadosVeiculo.id, dadosVeiculo.historicoManutencao, dadosVeiculo.turboAtivado);
                    } else if (dadosVeiculo.tipo === 'caminhao') {
                        // Construtor para Caminhão, passando `capacidadeCarga` e `cargaAtual`
                        novaInstancia = new ClasseVeiculo(dadosVeiculo.modelo, dadosVeiculo.cor, dadosVeiculo.capacidadeCarga, dadosVeiculo.id, dadosVeiculo.historicoManutencao, dadosVeiculo.cargaAtual);
                    } else {
                        // Construtor padrão para os outros tipos de veículo (Carro comum, Moto, Bicicleta)
                        novaInstancia = new ClasseVeiculo(dadosVeiculo.modelo, dadosVeiculo.cor, dadosVeiculo.id, dadosVeiculo.historicoManutencao);
                    }
                    
                    // Adiciona a nova instância de veículo (objeto POO) ao sistema da garagem.
                    // Isso o inclui no mapa `veiculosInstanciados` e cria seu link na sidebar.
                    adicionarVeiculoAoSistema(novaInstancia);

                    // ATUALIZA A INTERFACE HTML COM OS DADOS RECUPERADOS
                    // Assegura que os spans de informação no HTML (`<span id="carro-modelo">...</span>`, etc.) exibam os dados corretos carregados da localStorage.
                    const prefix = novaInstancia.getIdPrefix(); // Obtém o prefixo de ID do veículo (ex: 'carro', 'moto')
                    // Atualiza as informações básicas do veículo (modelo, cor) na UI.
                    atualizarInfoVeiculo(prefix, { modelo: novaInstancia.modelo, cor: novaInstancia.cor });
                    
                    // Atualiza o display da placa se o elemento HTML existe e se a placa estava salva nos dados.
                    if (document.getElementById(`${prefix}-placa`)) {
                        document.getElementById(`${prefix}-placa`).textContent = dadosVeiculo.placa || '---';
                    }
                    // Atualiza o display do turbo para carros esportivos.
                    if (prefix === 'esportivo' && novaInstancia.turboAtivado !== undefined) {
                         document.getElementById(`${prefix}-turbo`).textContent = novaInstancia.turboAtivado ? 'Ativado' : 'Desativado';
                    }
                    // Atualiza o display de carga e capacidade para caminhões.
                    if (prefix === 'caminhao' && novaInstancia.capacidadeCarga !== undefined) {
                         document.getElementById(`${prefix}-capacidade`).textContent = novaInstancia.capacidadeCarga;
                         document.getElementById(`${prefix}-carga`).textContent = novaInstancia.cargaAtual;
                    }
                } else {
                    console.warn(`[Frontend] Tipo de veículo desconhecido ('${dadosVeiculo.tipo}') encontrado nos dados salvos da localStorage. Este item foi ignorado durante o carregamento.`);
                }
            });
            mostrarFeedback("Garagem carregada do LocalStorage com sucesso!", 'success');
            
            // Após carregar todos os veículos, o primeiro veículo salvo será automaticamente exibido na interface.
            if (Object.keys(veiculosInstanciados).length > 0) {
                 const primeiroVeiculoId = Object.keys(veiculosInstanciados)[0];
                 mostrarVeiculoContainer(primeiroVeiculoId); 
            } else {
                // Se nenhum veículo foi carregado (por exemplo, localStorage vazia ou dados corrompidos que foram limpos), exibe a mensagem de boas-vindas inicial.
                document.getElementById('welcome-message').style.display = 'block';
            }

        } catch (e) {
            console.error("[Frontend] ERRO FATAL ao carregar dados da LocalStorage (dados JSON inválidos ou corrompidos):", e);
            localStorage.removeItem('garagemInteligente'); // Limpa os dados corrompidos para evitar que o erro persista em futuras recargas.
            mostrarFeedback("Erro ao carregar garagem. Os dados salvos podem estar corrompidos e foram removidos para evitar novos erros. Inicie com uma garagem vazia.", 'error');
            document.getElementById('welcome-message').style.display = 'block'; 
        }
    } else {
        // Se não houver dados salvos na localStorage, exibe a mensagem de boas-vindas para começar a usar a aplicação.
        document.getElementById('welcome-message').style.display = 'block'; 
    }
}


// ===========================================================================
// FUNÇÕES DE INTEGRAÇÃO COM O BACKEND (Para APIs Externas e Internas da Garagem)
// ===========================================================================

/**
 * Busca a previsão do tempo para uma cidade específica, enviando a requisição para o NOSSO BACKEND (que atua como proxy seguro para a API OpenWeatherMap).
 * Esta funcionalidade é crucial para a Atividade B2.P1.A8 (Segurança de API Keys) e A10 (Testes e Qualidade).
 * @param {string} veiculoPrefix - O prefixo do ID do veículo (ex: 'carro', 'bicicleta') para identificar a seção de clima na UI que será atualizada.
 * @param {string} cidade - O nome da cidade para buscar a previsão do tempo.
 * @param {number} [dias=1] - Número de dias para a previsão. (Nota: Atualmente, o backend proxy padrão que te dei foca no clima ATUAL (1 dia), mas o parâmetro 'dias' está presente caso você expanda seu backend para a previsão de 5 dias).
 */
async function buscarPrevisaoTempoBackend(veiculoPrefix, cidade, dias = 1) { 
    if (!cidade) {
        mostrarFeedback('Por favor, digite o nome de uma cidade para verificar a previsão do tempo.', 'warning');
        return; // Sai se a cidade estiver vazia.
    }
    const resultadoContainer = document.getElementById(`previsao-tempo-resultado-${veiculoPrefix}`); // Onde a previsão será exibida.
    const nomeCidadeDisplay = document.getElementById(`nome-cidade-previsao-${veiculoPrefix}`); // Onde o nome da cidade pesquisada será mostrado.
    // Este checkbox e a lógica de `destaqueChuva` seriam mais relevantes se o backend retornasse dados de vários dias com chances de chuva.
    const destaqueChuvaCheckbox = document.getElementById(`destaque-chuva-${veiculoPrefix}`);
    const destaqueChuva = destaqueChuvaCheckbox ? destaqueChuvaCheckbox.checked : false;

    resultadoContainer.innerHTML = '<p>Carregando previsão do tempo...</p>'; // Feedback visual de carregamento.
    nomeCidadeDisplay.textContent = `[${cidade}]`; // Feedback temporário rápido: mostra a cidade que está sendo buscada.

    try {
        // PONTO ESSENCIAL PARA SEGURANÇA E PONTUAÇÃO MÁXIMA: CHAME SEMPRE O SEU PRÓPRIO BACKEND (que atua como proxy para a API externa)!
        // A chave da API externa está segura no backend, não aqui no frontend.
        const urlParaChamarBackend = `${backendUrl}/api/previsao/${encodeURIComponent(cidade)}`;
        console.log(`[FRONTEND] Enviando requisição GET para o backend (proxy de previsão do tempo): ${urlParaChamarBackend}`);

        const response = await fetch(urlParaChamarBackend); // Faz a requisição HTTP GET para o seu próprio backend.
        if (!response.ok) { // Se a resposta do seu backend não for um status HTTP 2xx (ou seja, se for 4xx ou 5xx)
            const errorData = await response.json().catch(() => ({})); // Tenta ler a mensagem de erro que o backend retornou (se for JSON).
            throw new Error(errorData.error || `Erro (${response.status}): Falha ao carregar previsão do tempo. Verifique a cidade ou a conexão.`);
        }
        const dados = await response.json(); // Pega os dados formatados (JSON) que vieram do seu backend!

        nomeCidadeDisplay.textContent = `${dados.nomeCidade}, ${dados.pais}`; // Atualiza o nome da cidade com dados exatos vindos do backend.

        // Constrói o HTML para exibir a previsão do tempo usando os dados que foram processados pelo seu backend.
        // O backend padrão que te dei retorna o clima atual da cidade.
        resultadoContainer.innerHTML = `
            <div class="previsao-atual-card">
                <h5>${dados.descricaoClima}</h5>
                <img src="https://openweathermap.org/img/wn/${dados.iconeClima}@2x.png" alt="${dados.descricaoClima}" style="width:70px; height:auto;">
                <p>Temp: ${dados.temperaturaAtual.toFixed(1)}°C (Sensação: ${dados.sensacaoTermica.toFixed(1)}°C)</p>
                <p>Máx: ${dados.temperaturaMax.toFixed(1)}°C / Mín: ${dados.temperaturaMin.toFixed(1)}°C</p>
                <p>Vento: ${dados.velocidadeVento} m/s</p>
            </div>
            <p style="margin-top: 15px; font-style: italic; color: #777;">
                Nota: Esta seção exibe a previsão do tempo atual. Para a previsão de múltiplos dias (3 ou 5 dias), seu backend precisaria ser expandido para buscar e processar esses dados da API externa.
            </p>
        `;
        
    } catch (error) {
        // Em caso de erro durante a requisição (problema de rede, backend retornou erro, etc.), exibe a mensagem de erro para o usuário.
        console.error("[Frontend] Erro ao buscar previsão do tempo via backend (proxy):", error);
        resultadoContainer.innerHTML = `<p style="color:red;">Erro ao buscar previsão: ${error.message}</p>`;
        nomeCidadeDisplay.textContent = "[Cidade]"; // Reseta o display da cidade.
    }
}

// ===========================================================================
// FUNÇÕES PARA ATIVIDADE B2.P1.A9: CONSUMINDO OS NOVOS ENDPOINTS GET DO SEU BACKEND
// (Endpoint GET para "Veículos em Destaque", "Serviços Oferecidos" e "Ferramentas Essenciais por ID")
// ===========================================================================

/**
 * Carrega a lista de "Veículos em Destaque" do backend e a exibe na seção HTML correspondente da UI.
 */
async function carregarVeiculosDestaque() {
    const container = document.getElementById('cards-veiculos-destaque'); // Onde os cards de veículos serão exibidos.
    if (!container) {
        console.warn("[Frontend] Elemento HTML para 'cards-veiculos-destaque' não encontrado (ID: #cards-veiculos-destaque). Não é possível exibir os veículos em destaque. Verifique seu HTML.");
        return; 
    }
    container.innerHTML = '<p>Carregando veículos destaque...</p>'; // Feedback inicial de carregamento.
    try {
        const response = await fetch(`${backendUrl}/api/garagem/veiculos-destaque`); // Faz a requisição GET ao endpoint no seu backend.
        if (!response.ok) { // Verifica se a requisição foi bem-sucedida (status 2xx).
            // Tenta ler a mensagem de erro que o backend pode ter retornado em JSON.
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao carregar veículos destaque.' }));
            throw new Error(`Falha HTTP! Status: ${response.status} - ${errorData.error || response.statusText}`);
        }
        const veiculos = await response.json(); // Pega o array de veículos em destaque (objetos JS) do backend.

        container.innerHTML = ''; // Limpa a mensagem de carregamento.
        if (veiculos.length === 0) {
            container.innerHTML = '<p>Nenhum veículo em destaque no momento.</p>';
            return; // Se o array de veículos estiver vazio, exibe esta mensagem e sai.
        }

        // Itera sobre cada objeto de veículo no array recebido e cria um "card" HTML correspondente.
        veiculos.forEach(veiculo => {
            const card = document.createElement('div');
            card.className = 'veiculo-card-destaque'; // Aplica a classe CSS para estilizar o card (definida no `style.css`).
            // Define o conteúdo HTML do card, preenchendo com os dados do veículo.
            card.innerHTML = `
                <img src="${veiculo.imagemUrl || 'https://via.placeholder.com/200x120?text=Sem+Imagem'}" alt="Imagem de ${veiculo.modelo}" 
                     style="width:100%; height:auto; max-height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                <h3 style="margin: 0 0 5px; font-size: 1.1em; color: #333;">${veiculo.modelo} (${veiculo.ano})</h3>
                <p style="font-size: 0.85em; color: #666; margin: 0;"><strong>Destaque:</strong> ${veiculo.destaque}</p>
            `;
            container.appendChild(card); // Adiciona o card HTML ao container na página.
        });
    } catch (error) {
        // Em caso de qualquer erro durante a requisição ou processamento, exibe uma mensagem de erro para o usuário.
        console.error("[Frontend] Erro ao carregar veículos em destaque:", error);
        container.innerHTML = `<p style="color:red;">Falha ao carregar veículos destaque: ${error.message}</p>`;
    }
}

/**
 * Carrega a lista de "Nossos Serviços de Oficina" do backend e a exibe na seção HTML correspondente da UI.
 */
async function carregarServicosGaragem() {
    const lista = document.getElementById('lista-servicos-oferecidos'); // Onde a lista de serviços será exibida.
    if (!lista) {
        console.warn("[Frontend] Elemento HTML para 'lista-servicos-oferecidos' não encontrado (ID: #lista-servicos-oferecidos). Não é possível exibir os serviços da garagem. Verifique seu HTML.");
        return;
    }
    lista.innerHTML = '<p>Carregando serviços...</p>'; // Feedback inicial de carregamento.
    try {
        const response = await fetch(`${backendUrl}/api/garagem/servicos-oferecidos`); // Faz a requisição GET ao endpoint de serviços no seu backend.
        if (!response.ok) { // Verifica se a requisição foi bem-sucedida.
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao carregar serviços.' }));
            throw new Error(`Falha HTTP! Status: ${response.status} - ${errorData.error || response.statusText}`);
        }
        const servicos = await response.json(); // Pega o array de serviços (objetos JS) do backend.

        lista.innerHTML = ''; // Limpa a mensagem de carregamento.
        if (servicos.length === 0) {
            lista.innerHTML = '<p>Nenhum serviço disponível no momento.</p>';
            return; // Se o array estiver vazio, exibe esta mensagem e sai.
        }

        // Itera sobre o array de serviços e cria um item de lista (`<li>`) para cada um.
        servicos.forEach(servico => {
            const listItem = document.createElement('li');
            // Define o conteúdo HTML do item de lista com as informações do serviço.
            listItem.innerHTML = `
                <h4 style="margin-top: 0; color: #333; font-size: 1.1em;">${servico.nome}</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 5px;">${servico.descricao}</p>
                <p style="font-weight: bold; color: #007bff; font-size: 0.9em;">Preço Estimado: ${servico.precoEstimado}</p>
            `;
            lista.appendChild(listItem); // Adiciona o item à lista UL.
        });
    } catch (error) {
        console.error("[Frontend] Erro ao carregar serviços da garagem:", error);
        lista.innerHTML = `<p style="color:red;">Falha ao carregar serviços: ${error.message}</p>`;
    }
}

/**
 * Configura os botões na seção "Ferramentas Essenciais" para que cada um, ao ser clicado, busque os detalhes
 * de uma ferramenta específica por ID, utilizando o endpoint parametrizado do backend.
 */
async function configurarBotoesFerramentas() {
    const botoesContainer = document.getElementById('botoes-ferramentas'); // Onde os botões de ferramentas serão colocados.
    if (!botoesContainer) {
        console.warn("[Frontend] Elemento HTML para 'botoes-ferramentas' não encontrado (ID: #botoes-ferramentas). Não é possível configurar os botões das ferramentas. Verifique seu HTML.");
        return;
    }

    // Lista das ferramentas que terão um botão. Os IDs nesta lista DEVEM corresponder aos IDs dos objetos no array `ferramentasEssenciais` no seu `server.js`.
    const ferramentasParaBotao = [ 
        { id: "F01", nome: "Chaves Combinadas" },
        { id: "F02", nome: "Macaco Hidráulico" },
        { id: "F03", nome: "Chave de Impacto" }
    ];

    botoesContainer.innerHTML = ''; // Limpa o conteúdo atual do container de botões antes de preencher.
    // Itera sobre a lista de ferramentas para criar um botão para cada uma.
    ferramentasParaBotao.forEach(ferramenta => {
        const button = document.createElement('button');
        button.textContent = `Detalhes: ${ferramenta.nome}`;
        // Define a função a ser executada quando o botão é clicado: chamar `buscarDetalheFerramenta` com o ID da ferramenta.
        button.onclick = () => buscarDetalheFerramenta(ferramenta.id);
        button.className = 'btn btn-outline-success btn-sm me-2 mb-2'; // Aplica estilos do Bootstrap.
        botoesContainer.appendChild(button); // Adiciona o botão ao container.
    });

    // Adiciona um botão extra para testar o cenário de "ID inválido".
    // Ao clicar, ele chamará `buscarDetalheFerramenta` com um ID que não existe no backend,
    // o que deve resultar em uma resposta 404 (Not Found).
    const buttonInvalido = document.createElement('button');
    buttonInvalido.textContent = `Testar ID INVÁLIDO`;
    buttonInvalido.onclick = () => buscarDetalheFerramenta('ID_INVALIDO'); // ID que, propositalmente, não existe no `server.js`.
    buttonInvalido.className = 'btn btn-outline-danger btn-sm mb-2'; // Aplica estilos do Bootstrap (cor vermelha para indicar teste de erro).
    botoesContainer.appendChild(buttonInvalido);
}

/**
 * Busca e exibe os detalhes de uma ferramenta específica por seu ID, enviando a requisição para o endpoint parametrizado do backend (`/api/garagem/ferramentas-essenciais/:idFerramenta`).
 * @param {string} idFerramenta - O ID da ferramenta a ser buscada.
 */
async function buscarDetalheFerramenta(idFerramenta) {
    const detalheContainer = document.getElementById('detalhe-ferramenta'); // Onde os detalhes da ferramenta serão exibidos.
    if (!detalheContainer) {
        console.warn("[Frontend] Elemento HTML para 'detalhe-ferramenta' não encontrado (ID: #detalhe-ferramenta). Não é possível exibir os detalhes das ferramentas. Verifique seu HTML.");
        return;
    }
    detalheContainer.innerHTML = `<p>Buscando detalhe da ferramenta '${idFerramenta}'...</p>`; // Feedback visual de carregamento.
    detalheContainer.style.backgroundColor = '#f0f8ff'; // Cor de fundo neutra durante o carregamento.
    try {
        // Faz a requisição GET para o endpoint do backend, passando o ID da ferramenta na URL.
        const response = await fetch(`${backendUrl}/api/garagem/ferramentas-essenciais/${idFerramenta}`);
        if (!response.ok) { // Se a resposta não for OK (ex: 404 para ID inválido, 500 para erro interno do servidor).
            // Tenta ler a mensagem de erro que o backend pode ter retornado em JSON.
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Falha ao buscar ferramenta: ${errorData.error || `Status HTTP ${response.status}`}.`);
        }
        const ferramenta = await response.json(); // Pega o objeto da ferramenta do backend (JSON).

        detalheContainer.style.backgroundColor = '#eaf8f4'; // Muda a cor de fundo para indicar sucesso.
        // Define o conteúdo HTML para exibir os detalhes da ferramenta.
        detalheContainer.innerHTML = `
            <h4 style="margin-top: 0; color: #007bff; font-size: 1.1em;">Ferramenta: ${ferramenta.nome} (ID: ${ferramenta.id})</h4>
            <p style="font-size: 0.9em; margin-bottom: 5px;"><strong>Utilidade:</strong> ${ferramenta.utilidade}</p>
            <p style="font-size: 0.9em; margin: 0;"><strong>Categoria:</strong> ${ferramenta.categoria}</p>
        `;
    } catch (error) {
        // Em caso de erro na busca ou resposta do backend, exibe uma mensagem de erro e muda a cor de fundo.
        console.error("[Frontend] Erro ao buscar detalhe da ferramenta:", error);
        detalheContainer.style.backgroundColor = '#ffe9ec'; // Muda a cor de fundo para indicar erro.
        detalheContainer.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}


// ===========================================================================
// FUNÇÃO CENTRAL: CONFIGURAÇÃO DE TODOS OS EVENTOS DA INTERFACE (UI)
// Esta função é executada UMA ÚNICA VEZ quando a página termina de carregar.
// ===========================================================================

/**
 * Configura todos os ouvintes de eventos para as interações do usuário na interface.
 * Inclui desde a navegação na sidebar, a submissão de formulários, cliques nos botões de ação dos veículos,
 * e interações com as funcionalidades de API/Backend (previsão do tempo, novos endpoints da Garagem).
 */
function configurarTodosOsEventos() {
    // === 1. Eventos do Menu Lateral para Navegação ===
    // Adiciona um único ouvinte de eventos ao elemento pai `sidebar-menu` para usar delegação de eventos.
    document.getElementById('sidebar-menu').addEventListener('click', (e) => {
        // Verifica se o clique foi no link "➕ Adicionar Veículo" (usando `dataset.action`)
        if (e.target.dataset.action === 'mostrarFormAddVeiculo') {
            e.preventDefault(); // Previne o comportamento padrão do link.
            document.querySelectorAll('.veiculo-container').forEach(div => div.style.display = 'none'); // Esconde todos os containers de veículos.
            document.getElementById('welcome-message').style.display = 'none'; // Esconde a mensagem de boas-vindas.
            document.getElementById('add-veiculo-form-container').style.display = 'block'; // Mostra o formulário para adicionar veículo.
            veiculoAtivoId = null; // Reinicia a seleção de veículo ativo, já que o formulário está visível.
            document.querySelectorAll('#sidebar-menu li a').forEach(a => a.classList.remove('active')); // Remove a classe 'active' de todos os links na sidebar.
            e.target.classList.add('active'); // Adiciona a classe 'active' ao link "Adicionar Veículo".
        } 
        // Verifica se o clique foi em um link de veículo no menu (procura pelo elemento `li.veiculo-item a`)
        else if (e.target.closest('li.veiculo-item a')) { 
            e.preventDefault(); // Previne o comportamento padrão do link.
            const veiculoId = e.target.closest('li.veiculo-item a').dataset.veiculoId; // Pega o ID único do veículo do atributo `data-veiculo-id`.
            if (veiculoId) {
                mostrarVeiculoContainer(veiculoId); // Chama a função para exibir o container do veículo selecionado.
            }
        }
    });

    // Botão "Cancelar" do formulário de adição de veículo.
    document.getElementById('cancel-add-veiculo').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('add-veiculo-form-container').style.display = 'none'; // Esconde o formulário.
        document.getElementById('welcome-message').style.display = 'block'; // Volta a exibir a mensagem de boas-vindas.
        document.querySelectorAll('#sidebar-menu li a').forEach(a => a.classList.remove('active')); // Remove qualquer seleção de link no menu.
    });

    // === 2. Lógica do Formulário para Adicionar Novo Veículo ===
    // Controla a visibilidade do campo "Capacidade Carga" para Caminhões.
    document.getElementById('add-tipo').addEventListener('change', (e) => {
        document.getElementById('add-caminhao-capacidade-group').style.display = e.target.value === 'caminhao' ? 'block' : 'none';
    });

    // Adiciona o ouvinte para a submissão do formulário de adição de veículo.
    document.getElementById('add-veiculo-form').addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário e o recarregamento da página.
        
        // Coleta os valores dos campos do formulário.
        const tipo = document.getElementById('add-tipo').value;
        const modelo = document.getElementById('add-modelo').value.trim();
        const cor = document.getElementById('add-cor').value.trim();
        let placa = document.getElementById('add-placa').value.trim(); // Assume placa como opcional ou "---" se não fornecida.
        const capacidadeCarga = tipo === 'caminhao' ? Number(document.getElementById('add-capacidade').value) : null;

        // Validações básicas (você pode adicionar validações mais robustas aqui com feedback específico ao usuário).
        if (!modelo || !cor) {
            mostrarFeedback("Erro: Modelo e cor são campos obrigatórios para qualquer veículo!", 'error');
            return;
        }
        if (tipo === 'caminhao' && (isNaN(capacidadeCarga) || capacidadeCarga <= 0)) {
            mostrarFeedback("Erro: Para Caminhões, a Capacidade de Carga é obrigatória e deve ser um número positivo.", 'error');
            return;
        }

        // Obtém a classe JavaScript correta (ex: `Carro`, `Bicicleta`) a partir do mapa `classesVeiculos`.
        const ClasseVeiculo = classesVeiculos[tipo];
        if (!ClasseVeiculo) {
            mostrarFeedback("Erro interno: Tipo de veículo selecionado inválido. Por favor, selecione uma opção válida.", 'error');
            return;
        }

        let novoVeiculo; // Variável para a nova instância do objeto de veículo.
        try {
            // Instancia (cria) o novo objeto de veículo, usando o construtor da classe POO correta e passando os parâmetros necessários.
            if (tipo === 'caminhao') {
                novoVeiculo = new ClasseVeiculo(modelo, cor, capacidadeCarga);
            } else {
                novoVeiculo = new ClasseVeiculo(modelo, cor);
            }

            const prefix = novoVeiculo.getIdPrefix(); // Pega o prefixo de ID do veículo (ex: 'carro', 'esportivo').
            // Atualiza os spans no HTML com os dados iniciais do novo veículo (modelo, cor).
            atualizarInfoVeiculo(prefix, { modelo: novoVeiculo.modelo, cor: novoVeiculo.cor });
            // Se houver um campo para placa no HTML e uma placa foi fornecida, atualiza o span correspondente.
            if (placa && document.getElementById(`${prefix}-placa`)) {
                 document.getElementById(`${prefix}-placa`).textContent = placa;
            }
            // Para caminhões, atualiza o display de capacidade e carga.
            if (tipo === 'caminhao' && capacidadeCarga) {
                 novoVeiculo.capacidadeCarga = capacidadeCarga; // Garante que a instância do objeto tenha a capacidade definida.
                 atualizarInfoVeiculo(prefix, { capacidade: novoVeiculo.capacidadeCarga, carga: novoVeiculo.cargaAtual });
            }

            adicionarVeiculoAoSistema(novoVeiculo); // Adiciona a instância do novo veículo ao sistema (sidebar e mapa global).
            mostrarFeedback(`Veículo "${novoVeiculo.modelo}" (${novoVeiculo.getTipo()}) adicionado com sucesso!`, 'success');
            mostrarVeiculoContainer(novoVeiculo.id); // Exibe o container do veículo recém-adicionado na UI.
            document.getElementById('add-veiculo-form').reset(); // Limpa os campos do formulário de adição.
            document.getElementById('add-caminhao-capacidade-group').style.display = 'none'; // Esconde o campo de capacidade (se visível).
        } catch (error) {
            console.error("[Frontend] Erro ao instanciar ou adicionar novo veículo:", error);
            mostrarFeedback(`Erro ao adicionar veículo: ${error.message}. Por favor, verifique o console para mais detalhes.`, 'error');
        }
    });

    // === 3. Eventos dos Botões de Ação dos Veículos (Ligar, Acelerar, Frear, Buzinar, Turbo, Carga) ===
    // Utiliza delegação de eventos: um único ouvinte de clique no elemento pai (`.actions`) para capturar cliques nos botões.
    document.querySelectorAll('.actions').forEach(actionsDiv => {
        actionsDiv.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-acao]'); // Encontra o botão com o atributo `data-acao` que foi clicado.
            if (!button) return; // Se o clique não foi em um botão de ação, sai da função.
            
            e.preventDefault(); // Previne o comportamento padrão de qualquer botão (ex: envio de formulário).

            const tipoPrefix = button.dataset.tipo; // Pega o prefixo do tipo de veículo (ex: 'carro', 'esportivo').
            const acao = button.dataset.acao; // Pega a ação que o botão deve executar (ex: 'ligar', 'acelerar', 'ativarTurbo').

            // Encontra a instância do objeto de veículo no nosso mapa global `veiculosInstanciados` que corresponde ao tipo do botão.
            // Para este projeto, como cada TIPO de veículo tem seu próprio contêiner, pegamos a primeira instância desse TIPO.
            const veiculo = Object.values(veiculosInstanciados).find(v => v.getIdPrefix() === tipoPrefix);

            if (!veiculo) {
                mostrarFeedback(`Nenhum veículo do tipo "${tipoPrefix}" foi adicionado ao sistema ainda. Por favor, adicione um antes de usar as ações.`, 'warning');
                return; // Sai se não encontrar o veículo.
            }

            // ESSÊNCIA DA PROGRAMAÇÃO ORIENTADA A OBJETOS: Chamar o MÉTODO APROPRIADO na instância do OBJETO DE VEÍCULO!
            // Os métodos recebem o objeto `window.sons` para que possam tocar sons.
            switch (acao) {
                case 'ligar':
                    veiculo.ligar(window.sons); // Chama o método `ligar` do objeto `veiculo`.
                    break;
                case 'desligar':
                    veiculo.desligar(window.sons); // Chama o método `desligar`.
                    break;
                case 'acelerar':
                case 'pedalar': // Para bicicletas, o "pedalar" do HTML é traduzido para o método `acelerar`.
                    veiculo.acelerar(window.sons);
                    break;
                case 'frear':
                    veiculo.frear(window.sons);
                    break;
                case 'buzinar':
                    veiculo.buzinar(window.sons);
                    break;
                case 'ativarTurbo':
                    // Verifica se o método `ativarTurbo` existe na instância do objeto (ele só existe na classe CarroEsportivo).
                    if (veiculo.ativarTurbo) veiculo.ativarTurbo(); 
                    break;
                case 'desativarTurbo':
                    // Verifica se o método `desativarTurbo` existe.
                    if (veiculo.desativarTurbo) veiculo.desativarTurbo();
                    break;
                case 'carregar':
                    // Coleta o valor do input de carga (específico para Caminhão).
                    const cargaInputCarregar = document.getElementById(`${tipoPrefix}-carga-input`);
                    const cargaValor = parseFloat(cargaInputCarregar.value);
                    // Verifica se o método `carregar` existe no objeto (Caminhão) e se o valor da carga é válido.
                    if (veiculo.carregar && !isNaN(cargaValor) && cargaValor > 0) {
                        veiculo.carregar(cargaValor); // Chama o método `carregar()` do objeto Caminhão.
                    } else {
                        mostrarFeedback("Para carregar, por favor, informe uma quantidade válida e positiva (em kg).", 'warning');
                    }
                    if (cargaInputCarregar) cargaInputCarregar.value = ''; // Limpa o input após a ação.
                    break;
                case 'descarregar':
                    // Coleta o valor do input de carga para descarregar.
                    const cargaInputDescarregar = document.getElementById(`${tipoPrefix}-carga-input`);
                    const descarregarValor = parseFloat(cargaInputDescarregar.value);
                    // Verifica se o método `descarregar` existe e se o valor da descarga é válido.
                    if (veiculo.descarregar && !isNaN(descarregarValor) && descarregarValor > 0) {
                        veiculo.descarregar(descarregarValor); // Chama o método `descarregar()` do objeto Caminhão.
                    } else {
                        mostrarFeedback("Para descarregar, por favor, informe uma quantidade válida e positiva (em kg).", 'warning');
                    }
                    if (cargaInputDescarregar) cargaInputDescarregar.value = ''; // Limpa o input após a ação.
                    break;
                default:
                    console.warn(`[Frontend] Ação desconhecida ou não implementada para o veículo do tipo "${tipoPrefix}": "${acao}".`);
            }
        });
    });


    // === 4. Eventos para a funcionalidade de Previsão do Tempo (integração com SEU BACKEND PROXY) ===
    // Adiciona evento de clique a todos os botões "Ver Previsão".
    document.querySelectorAll('.verificar-clima-btn-veiculo').forEach(btn => {
        btn.addEventListener('click', () => {
            const veiculoPrefix = btn.dataset.veiculoTipo; // Obtém o prefixo do tipo de veículo (ex: 'carro', 'bicicleta').
            const inputCidade = document.getElementById(`cidade-previsao-input-${veiculoPrefix}`); // Pega o input de cidade específico do veículo.
            const cidade = inputCidade.value.trim(); // Pega o valor da cidade.
            
            // As próximas linhas relacionadas a 'dias' são para manter compatibilidade com o HTML/contexto,
            // mas no momento, o backend padrão que te dei foca no clima *atual* (1 dia).
            const diasSelecionadosBtn = document.querySelector(`.filtros-previsao .btn.active[data-veiculo-tipo="${veiculoPrefix}"]`);
            const dias = diasSelecionadosBtn ? Number(diasSelecionadosBtn.dataset.dias) : 1; 
            
            buscarPrevisaoTempoBackend(veiculoPrefix, cidade, dias); // Chama a função que enviará a requisição para o seu BACKEND.
        });
    });

    // Configura os botões de filtro de dias para a previsão do tempo (ex: "Hoje", "3 Dias", "5 Dias").
    // Eles controlam a classe 'active' para indicar qual filtro está selecionado.
    document.querySelectorAll('.filtros-previsao .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const veiculoPrefix = this.dataset.veiculoTipo;
            // Remove a classe 'active' de todos os botões de filtro do mesmo grupo.
            document.querySelectorAll(`.filtros-previsao .btn[data-veiculo-tipo="${veiculoPrefix}"]`).forEach(b => b.classList.remove('active'));
            this.classList.add('active'); // Adiciona a classe 'active' ao botão clicado.

            // Se uma cidade já foi digitada no input, dispara a busca de clima novamente para aplicar o filtro visual.
            const inputCidade = document.getElementById(`cidade-previsao-input-${veiculoPrefix}`);
            if (inputCidade && inputCidade.value.trim()) {
                document.getElementById(`verificar-clima-btn-${veiculoPrefix}`).click();
            }
        });
    });

    // Configura o checkbox de "Destacar Chuva".
    document.querySelectorAll('.toggle-destaque-chuva').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const veiculoPrefix = this.dataset.veiculoTipo;
             // Se uma cidade já está no input, dispara a busca de clima novamente para atualizar o destaque.
            const inputCidade = document.getElementById(`cidade-previsao-input-${veiculoPrefix}`);
            if (inputCidade && inputCidade.value.trim()) {
                document.getElementById(`verificar-clima-btn-${veiculoPrefix}`).click();
            }
        });
    });

    // === 5. Formulários de Manutenção ===
    // Configura o evento de submissão para todos os formulários de manutenção.
    document.querySelectorAll('.manutencao-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const tipoVeiculoForm = form.dataset.tipo; // Pega o tipo de veículo associado a este formulário (ex: 'carro', 'moto').
            
            // Encontra a instância real do objeto de veículo (`Carro`, `Moto`, etc.) ao qual esta manutenção será adicionada.
            const veiculoAlvo = Object.values(veiculosInstanciados).find(v => v.getTipo() === tipoVeiculoForm);

            if (!veiculoAlvo) {
                 mostrarFeedback(`Nenhum veículo do tipo "${tipoVeiculoForm}" foi encontrado para registrar esta manutenção. Por favor, adicione um.`, 'warning');
                 return;
            }

            // Coleta os valores dos campos do formulário de manutenção.
            const dataVal = form.querySelector(`[id$="-manutencao-data"]`).value; // Pega o campo de data específico pelo ID dinâmico (ex: `carro-manutencao-data`).
            const tipoVal = form.querySelector(`[id$="-manutencao-tipo"]`).value.trim();
            const custoVal = parseFloat(form.querySelector(`[id$="-manutencao-custo"]`).value);
            const descricaoVal = form.querySelector(`[id$="-manutencao-descricao"]`).value.trim();
            
            // Cria uma nova instância da classe `Manutencao` com os dados coletados.
            const novaManutencao = new Manutencao(dataVal, tipoVal, custoVal, descricaoVal);
            
            // Adiciona a manutenção diretamente na instância do objeto de veículo (`veiculoAlvo`).
            // O método `adicionarManutencao` da classe Veiculo (definida em `Veiculo.js`) lida com a validação interna e o salvamento na localStorage.
            if (veiculoAlvo.adicionarManutencao(novaManutencao)) {
                form.reset(); // Limpa os campos do formulário se a adição for bem-sucedida.
            }
        });
    });

    // Delegar eventos de clique para os botões de remover manutenção (útil para botões criados dinamicamente no HTML).
    document.querySelectorAll('.manutencao-display ul').forEach(ul => {
        ul.addEventListener('click', (e) => {
            // Verifica se o clique ocorreu em um elemento com a classe `remover-manutencao-btn`.
            if (e.target.classList.contains('remover-manutencao-btn')) {
                e.preventDefault();
                const idParaRemover = e.target.dataset.id; // Pega o ID da manutenção do atributo `data-id` do botão.

                // Identifica qual veículo é o "dono" desta lista de manutenção através do prefixo do ID da lista UL (ex: "carro" de "carro-historico-lista").
                const prefixoUl = ul.id.split('-')[0]; 
                // Encontra a instância do objeto de veículo associado.
                const veiculoAlvo = Object.values(veiculosInstanciados).find(v => v.getIdPrefix() === prefixoUl);

                if (veiculoAlvo) {
                    veiculoAlvo.removerManutencao(idParaRemover); // Chama o método de remoção na instância do objeto de veículo.
                } else {
                    console.error("[Frontend] O veículo associado à manutenção não foi encontrado para a remoção! Isso é um erro de lógica.");
                    mostrarFeedback("Erro: Não foi possível identificar o veículo para remover a manutenção. Tente recarregar a página.", 'error');
                }
            }
        });
    });

} // Fim da função `configurarTodosOsEventos`


// ===========================================================================
// PONTO DE ENTRADA PRINCIPAL DA APLICAÇÃO: Executado quando todo o DOM (HTML) está completamente carregado.
// ===========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Primeiramente, configura todos os ouvintes de eventos da UI.
    // Isso garante que os botões, formulários, e interações na página estejam prontos para serem usados.
    configurarTodosOsEventos();

    // 2. Em seguida, tenta carregar quaisquer veículos que foram salvos na localStorage em uma sessão anterior do navegador.
    // Este passo vai popular o mapa `veiculosInstanciados` e o menu lateral da sidebar.
    carregarGaragem(); 

    // 3. Carrega os dados para as novas seções da Atividade B2.P1.A9 (Veículos em Destaque, Serviços de Oficina, Ferramentas Essenciais).
    // As chamadas para os endpoints GET do seu backend serão feitas aqui.
    carregarVeiculosDestaque();
    carregarServicosGaragem();
    configurarBotoesFerramentas(); 
    
    // 4. Exibe uma mensagem inicial de boas-vindas para o usuário, indicando que o sistema está pronto.
    mostrarFeedback('Sistema Garagem Inteligente carregado! Selecione ou adicione um veículo para começar a gerenciar sua garagem.', 'info');
});