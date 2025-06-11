// NOME DO ARQUIVO JS DO SEU FRONTEND (Pode ser client.js, script.js, etc.)
// Este código roda no navegador (frontend) e fala com o nosso backend.
// Ele NÃO deve ter a chave API secreta do clima.

// =====================================================================================
//  *** PASSO MAIS IMPORTANTE NESTE ARQUIVO! DEFINA A URL DO SEU BACKEND! ***
//  Troque "COLOQUE_AQUI_A_URL_REAL..." pela URL do seu serviço no Render.
//  Copie a URL EXATA que o Render te deu após o deploy do backend.
//  Ex: const backendUrl = "https://nome-do-meu-backend-12345.onrender.com";
//  Se testando NO SEU COMPUTADOR e o backend também rodando localmente: use "http://localhost:3001"
// =====================================================================================
const backendUrl = "COLOQUE_AQUI_A_URL_REAL_DO_SEU_BACKEND_PUBLICADO_NO_RENDER"; // <--- !!! TROQUE ESTA STRING INTEIRA PELO SEU ENDEREÇO DO RENDER !!!
// =====================================================================================


console.log(`[FRONTEND] Configurado para chamar backend em: ${backendUrl}`); // Mensagem de debug inicial no console do navegador

// === OBTÉM REFERÊNCIAS DOS ELEMENTOS HTML DA PÁGINA ===
// Usamos `document.getElementById()` para encontrar os elementos na sua página HTML pelos IDs deles.
// ESSES IDs AQUI DEVEM BATER EXATAMENTE COM OS IDs DOS SEUS ELEMENTOS NO index.html!
const botaoVerificarClima = document.getElementById("verificar-clima-btn-bicicleta");
const inputCidadePrevisao = document.getElementById("cidade-previsao-input-bicicleta");
const divResultadoPrevisao = document.getElementById("previsao-tempo-resultado-bicicleta");

// IDs das áreas (divs) onde os resultados das Dicas de Manutenção serão exibidos (da A8).
// VERIFIQUE SE ESSES IDs CORRESPONDEM AOS DAS SUAS DIVS NO index.html.
const divListaDicasGerais = document.getElementById("lista-dicas-gerais-div");
const divListaDicasPorTipo = document.getElementById("lista-dicas-por-tipo-div");

// IDs dos botões que você vai clicar para pedir as Dicas de Manutenção (da A8).
// VERIFIQUE SE ESSES IDs CORRESPONDEM AOS DOS SEUS BOTÕES NO index.html.
const botaoBuscarDicasGerais = document.getElementById("btn-buscar-dicas-gerais"); // Ex: <button id="btn-buscar-dicas-gerais">
const botaoBuscarDicasCarro = document.getElementById("btn-buscar-dicas-carro");   // Ex: <button id="btn-buscar-dicas-carro">
const botaoBuscarDicasMoto = document.getElementById("btn-buscar-dicas-moto");     // Ex: <button id="btn-buscar-dicas-moto">
const botaoBuscarDicasCaminhao = document.getElementById("btn-buscar-dicas-caminhao"); // Ex: <button id="btn-buscar-dicas-caminhao">
// Se você criou botões para outros tipos de veículo, adicione a referência aqui.


// ===========================================================================
//         LÓGICA PARA O CLIMA (CONECTANDO BOTÃO -> PEGA INPUT -> CHAMA BACKEND -> MOSTRA RESULTADO)
//         Este código será executado quando o botão 'verificar-clima-btn-bicicleta' for clicado.
// ===========================================================================

// Primeiro, verificamos se TODOS os elementos HTML que precisamos para o clima foram encontrados na página.
if (botaoVerificarClima && inputCidadePrevisao && divResultadoPrevisao) {
    console.log("[FRONTEND] Elementos HTML essenciais para a funcionalidade de Clima encontrados. Configurando listener...");
    // Se encontrou todos, adiciona o 'ouvinte' para o evento de 'click' no botão de verificar clima.
    // Quando o botão é clicado, a função `async () => { ... }` é executada.
    botaoVerificarClima.addEventListener("click", async () => {
        // Pega o texto atual digitado no campo de input da cidade e remove espaços extras no começo e fim.
        const cidade = inputCidadePrevisao.value.trim();

        // Antes de buscar, limpa o conteúdo da div onde o resultado aparece e coloca uma mensagem de carregamento.
        divResultadoPrevisao.innerHTML = "<p>Carregando previsão do tempo...</p>";

        // Validação simples: se a cidade estiver vazia depois de remover espaços, mostra um erro e para.
        if (!cidade) {
            divResultadoPrevisao.innerHTML = '<p style="color:red;">Por favor, digite o nome de uma cidade para verificar o clima.</p>';
            return; // Sai da função sem fazer a chamada fetch.
        }

        console.log(`[FRONTEND] Botão de Clima clicado. Preparando para buscar previsão para "${cidade}" no backend.`);

        try {
            // === FAZENDO A REQUISIÇÃO HTTP PARA O NOSSO PRÓPRIO BACKEND ===
            // USAMOS A `backendUrl` que definimos no topo, combinada com o endpoint que criamos no server.js (`/api/previsao/`)
            // e passamos a `cidade` como parte da URL (parâmetro de rota).
            // NOTA: A CHAVE API DO OPENWEATHERMAP NÃO VEM NUNCA AQUI NO FRONTEND! Ela fica só no BACKEND!
            const urlParaChamarBackend = `${backendUrl}/api/previsao/${cidade}`;
            console.log(`[FRONTEND] Chamando URL do backend para clima: ${urlParaChamarBackend}`);

            // Usa `fetch` para enviar a requisição GET para o nosso backend.
            const responseDoBackend = await fetch(urlParaChamarBackend);

            // === VERIFICANDO A RESPOSTA QUE VEIO DO NOSSO BACKEND ===
            // Se o status da resposta do nosso backend não for OK (ou seja, se for 4xx ou 5xx).
            if (!responseDoBackend.ok) {
                // Tentamos ler a resposta como JSON, porque o nosso backend (server.js) envia erros no formato JSON { error: "mensagem de erro" }.
                const errorDataDoBackend = await responseDoBackend.json();
                // Loga o erro no console do navegador para ajudar a gente a depurar.
                console.error(`[FRONTEND] Erro recebido do Backend (${responseDoBackend.status} - ${responseDoBackend.statusText}):`, errorDataDoBackend);

                // Pega a mensagem de erro mais útil para mostrar para o usuário. Prioriza a mensagem 'error' que o backend pode ter enviado,
                // ou cria uma mensagem genérica com o status HTTP se não houver mensagem 'error'.
                const errorMessageParaUI = errorDataDoBackend.error || `Erro desconhecido (Status: ${responseDoBackend.status}) ao obter previsão.`;

                // Lança um novo objeto `Error` com a mensagem. Isso faz com que o código "pule" direto para o bloco `catch` abaixo.
                throw new Error(errorMessageParaUI);
            }

            // === SE A RESPOSTA DO BACKEND FOI DE SUCESSO (STATUS 200) ===
            // Lê os dados JSON que o nosso backend enviou. Nosso backend já enviou os dados formatados, do jeito que queremos!
            const dadosRecebidosDoBackend = await responseDoBackend.json();
            console.log(`[FRONTEND] Dados de previsão recebidos do backend:`, dadosRecebidosDoBackend);

            // === ATUALIZA A PARTE VISUAL DA PÁGINA (O HTML) COM OS DADOS RECEBIDOS DO BACKEND ===
            // Acessamos as propriedades do objeto `dadosRecebidosDoBackend` que vêm do nosso backend.
            divResultadoPrevisao.innerHTML = `
              <h5>Previsão do tempo para ${dadosRecebidosDoBackend.nomeCidade}, ${dadosRecebidosDoBackend.pais}</h5>
              <p>${dadosRecebidosDoBackend.descricaoClima}</p>
              <img src="https://openweathermap.org/img/wn/${dadosRecebidosDoBackend.iconeClima}@2x.png" alt="${dadosRecebidosDoBackend.descricaoClima}">
              <p>Temperatura: ${dadosRecebidosDoBackend.temperaturaAtual}°C (Sensação: ${dadosRecebidosDoBackend.sensacaoTermica}°C)</p>
              <p>Máx: ${dadosRecebidosDoBackend.temperaturaMax}°C / Mín: ${dadosRecebidosDoBackend.temperaturaMin}°C</p>
              <p>Vento: ${dadosRecebidosDoBackend.velocidadeVento} m/s</p>
            `;

        } catch (error) {
            // === TRATANDO ERROS ===
            // Qualquer erro que aconteça durante o `fetch` (como problema de rede do navegador, ou o erro que "lançamos" no `if (!responseDoBackend.ok)`),
            // será pego por este bloco `catch`.
            console.error("[FRONTEND] Erro geral durante a busca ou processamento da previsão:", error);
            // Mostra a mensagem do erro para o usuário na área de resultado.
            divResultadoPrevisao.innerHTML = `<p style="color:red;">Erro: ${error.message}</p>`;
        }
    });
} else {
     // Se algum dos elementos HTML com os IDs corretos não foi encontrado quando a página carregou.
     console.error("[FRONTEND] ERRO FATAL: Elementos HTML para a funcionalidade de Clima não encontrados. Verifique os IDs no seu index.html. A funcionalidade de Clima NÃO VAI FUNCIONAR.");
     if (!botaoVerificarClima) console.error("- Elemento com ID 'verificar-clima-btn-bicicleta' não encontrado.");
     if (!inputCidadePrevisao) console.error("- Elemento com ID 'cidade-previsao-input-bicicleta' não encontrado.");
     if (!divResultadoPrevisao) console.error("- Elemento com ID 'previsao-tempo-resultado-bicicleta' não encontrado.");
     console.log("[FRONTEND] Certifique-se de que o script está sendo carregado APÓS os elementos HTML existirem (geralmente colocar o <script> antes do fechamento </body> resolve).");
}


// ===========================================================================
//         FUNÇÕES E LÓGICA PARA AS DICAS DE MANUTENÇÃO (DA ATIVIDADE A8)
//         Você precisará ter botões e divs no seu HTML para usar/ver isso!
//         E CONECTAR OS BOTÕES ÀS FUNÇÕES NO FINAL DESTE CÓDIGO.
// ===========================================================================

// Função auxiliar para mostrar mensagens (loading, sucesso, erro) na área de Dicas Gerais.
function exibirMensagemDicasGerais(mensagem, isError = false) {
     if (divListaDicasGerais) { // Verifica se a div de Dicas Gerais foi encontrada no HTML
         // Atualiza o conteúdo da div, mudando a cor para vermelho se for uma mensagem de erro.
         divListaDicasGerais.innerHTML = `<p style="color:${isError ? 'red' : 'black'};">${mensagem}</p>`;
     } else {
         console.error("[FRONTEND] Div para Dicas Gerais (ID: 'lista-dicas-gerais-div') NÃO encontrada no HTML. Não é possível exibir mensagens ou resultados para Dicas Gerais.");
     }
}

// Função auxiliar para mostrar mensagens (loading, sucesso, erro) na área de Dicas Por Tipo.
function exibirMensagemDicasPorTipo(mensagem, isError = false) {
     if (divListaDicasPorTipo) { // Verifica se a div de Dicas Por Tipo foi encontrada no HTML
         // Atualiza o conteúdo da div, mudando a cor para vermelho se for uma mensagem de erro.
         divListaDicasPorTipo.innerHTML = `<p style="color:${isError ? 'red' : 'black'};">${mensagem}</p>`;
     } else {
         console.error("[FRONTEND] Div para Dicas Por Tipo (ID: 'lista-dicas-por-tipo-div') NÃO encontrada no HTML. Não é possível exibir mensagens ou resultados para Dicas Por Tipo.");
     }
}


// === Função para buscar Dicas Gerais de Manutenção ===
// Esta função é chamada, por exemplo, quando o botão 'btn-buscar-dicas-gerais' é clicado.
async function buscarDicasGerais() {
    console.log(`[FRONTEND] Iniciando busca por dicas gerais no backend: ${backendUrl}/api/dicas-manutencao`);
    exibirMensagemDicasGerais("Carregando dicas gerais..."); // Mostra mensagem de loading na área correta.

    try {
        // === CHAMA O ENDPOINT ESPECÍFICO DO NOSSO BACKEND PARA DICAS GERAIS ===
        const response = await fetch(`${backendUrl}/api/dicas-manutencao`);

        // === VERIFICA A RESPOSTA DO NOSSO BACKEND ===
        // Se o nosso backend retornou um status de erro.
        if (!response.ok) {
            const errorData = await response.json(); // Lê a resposta de erro do backend (ex: { error: "Mensagem" })
             const errorMessage = errorData.error || `Erro ao buscar dicas gerais (Status: ${response.status}).`;
             throw new Error(errorMessage); // Lança erro para ir pro catch
        }

        // Se a resposta do backend foi OK (status 200), lê os dados JSON.
        // O backend configurou esta rota para sempre retornar um array de dicas.
        const dicas = await response.json();
        console.log(`[FRONTEND] Dicas gerais recebidas do backend:`, dicas);

        // === ATUALIZA A DIV DE DICAS GERAIS NA INTERFACE COM OS DADOS ===
        let htmlDicas = "<h4>Dicas Gerais de Manutenção:</h4>"; // Título para a lista
        if (dicas && Array.isArray(dicas) && dicas.length > 0) { // Verifica se recebeu um array não vazio de dicas
            htmlDicas += "<ul>"; // Começa uma lista HTML
            dicas.forEach(dica => {
                // Para cada dica no array, cria um item na lista HTML.
                // Verificação extra caso algum item no array não seja um objeto com .dica.
                htmlDicas += `<li>${dica && dica.dica ? dica.dica : 'Erro ao carregar item da dica.'}</li>`;
            });
            htmlDicas += "</ul>"; // Fecha a lista HTML
        } else {
             // Mensagem se o array veio vazio (nenhuma dica cadastrada no backend para esta rota)
             htmlDicas += "<p>Nenhuma dica geral de manutenção disponível no momento.</p>";
        }
         // Atualiza a div correta no HTML com o conteúdo gerado, mas só se a div existir.
         if(divListaDicasGerais) divListaDicasGerais.innerHTML = htmlDicas;
        // ===============================================

    } catch (error) {
        // === TRATA QUALQUER ERRO NA BUSCA DE DICAS GERAIS ===
        console.error("[FRONTEND] Erro ao buscar dicas gerais:", error);
        // Mostra a mensagem de erro na div de dicas gerais.
         exibirMensagemDicasGerais(`Erro ao buscar dicas gerais: ${error.message}`, true);
    }
}

// === Função para buscar Dicas de Manutenção por Tipo de Veículo ===
// Esta função é chamada passando o tipo de veículo (ex: buscarDicasPorTipo('carro')).
// Ela é chamada, por exemplo, quando botões específicos (carro, moto) são clicados.
async function buscarDicasPorTipo(tipoVeiculo) {
    // Validação simples para garantir que um tipo foi passado.
    if (!tipoVeiculo || typeof tipoVeiculo !== 'string') {
         console.warn("[FRONTEND] Chamada inválida para buscarDicasPorTipo. Um tipo de veículo (string) deve ser fornecido.");
         exibirMensagemDicasPorTipo('Erro interno: Tipo de veículo inválido para buscar dicas.', true);
         return; // Para a execução.
    }
    console.log(`[FRONTEND] Iniciando busca por dicas para "${tipoVeiculo}" no backend: ${backendUrl}/api/dicas-manutencao/${tipoVeiculo}`);
    // Mostra mensagem de loading na área correta, indicando para qual tipo está buscando.
    exibirMensagemDicasPorTipo(`Carregando dicas para ${tipoVeiculo}...`);

     try {
        // === CHAMA O ENDPOINT ESPECÍFICO DO NOSSO BACKEND PARA DICAS POR TIPO ===
        // Passamos o `tipoVeiculo` na URL como parâmetro de rota para o backend.
        const response = await fetch(`${backendUrl}/api/dicas-manutencao/${tipoVeiculo.toLowerCase()}`); // Manda pra lowercase só por segurança

        // === VERIFICA A RESPOSTA DO NOSSO BACKEND ===
        if (!response.ok) {
            // Se o backend retornou um erro (por exemplo, 404 Not Found se o tipo não existir no backend,
            // ou outro erro se acontecer algum problema interno lá).
            const errorData = await response.json(); // Tenta ler a resposta de erro JSON do backend.
            const errorMessage = errorData.error || `Erro ao buscar dicas para ${tipoVeiculo} (Status: ${response.status}).`;
            throw new Error(errorMessage); // Lança o erro para ser pego pelo bloco `catch`.
        }

        // Se a resposta do backend foi OK (status 200), lê os dados JSON.
        // Nosso backend configurou esta rota para sempre retornar um array de dicas para o tipo se ele existe (mesmo que o array esteja vazio).
        const dicas = await response.json(); // Deveria ser um array de objetos ou [].
        console.log(`[FRONTEND] Dicas para "${tipoVeiculo}" recebidas do backend:`, dicas);

         // === ATUALIZA A DIV DE DICAS POR TIPO NA INTERFACE COM OS DADOS ===
        let htmlDicas = `<h4>Dicas para ${tipoVeiculo}:</h4>`; // Título para a lista
        // Verifica se o que recebemos é um array, não está vazio, e se os itens parecem corretos.
        if (dicas && Array.isArray(dicas) && dicas.length > 0) {
             htmlDicas += "<ul>"; // Começa lista
             dicas.forEach(dica => {
                 // Para cada dica no array, cria um item de lista. Verificação extra de segurança.
                 htmlDicas += `<li>${dica && dica.dica ? dica.dica : 'Erro ao carregar item da dica.'}</li>`;
             });
             htmlDicas += "</ul>"; // Fecha lista
        } else {
             // Mensagem se o array veio vazio (tipo existe no backend mas não tem dicas) ou se deu algum outro problema.
             // NOTA: Se o tipo de veículo NÃO existir no backend, o backend deve retornar 404, e isso já foi tratado pelo `catch`.
             htmlDicas += `<p>Nenhuma dica específica encontrada para o tipo "${tipoVeiculo}" no momento.</p>`;
        }
         // Atualiza a div correta no HTML com o conteúdo gerado, mas só se ela existir.
         if(divListaDicasPorTipo) divListaDicasPorTipo.innerHTML = htmlDicas;
        // ===============================================

    } catch (error) {
        // === TRATA QUALQUER ERRO NA BUSCA DE DICAS POR TIPO ===
        console.error(`[FRONTEND] Erro ao buscar dicas por tipo (${tipoVeiculo}):`, error);
        // Mostra a mensagem de erro na div de dicas por tipo.
        exibirMensagemDicasPorTipo(`Erro ao buscar dicas para ${tipoVeiculo}: ${error.message}`, true);
    }
}


// ===========================================================================
//         CONECTA BOTÕES DO HTML COM AS FUNÇÕES JS DE DICAS
//         Verifica se os botões de Dicas de Manutenção foram encontrados no HTML
//         e adiciona os 'listeners' de clique neles.
// ===========================================================================

// --- Conecta o botão de Dicas Gerais com a função ---
// Verifica se o elemento com o ID 'btn-buscar-dicas-gerais' existe no HTML.
if (botaoBuscarDicasGerais) {
    console.log("[FRONTEND] Botão 'Dicas Gerais' (ID: 'btn-buscar-dicas-gerais') encontrado. Conectando...");
    // Adiciona um 'ouvinte': quando o botão é clicado, executa a função `buscarDicasGerais`.
    botaoBuscarDicasGerais.addEventListener("click", buscarDicasGerais);
} else {
     // Mensagem de aviso se o botão não foi encontrado. Ajuda a gente a corrigir o HTML se necessário.
     console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-gerais' NÃO encontrado no HTML. A função de buscar dicas gerais não será ativada por botão.");
}

// --- Conecta o botão de Dicas para Carro com a função ---
// Verifica se o elemento com o ID 'btn-buscar-dicas-carro' existe no HTML.
if (botaoBuscarDicasCarro) {
     console.log("[FRONTEND] Botão 'Dicas para Carro' (ID: 'btn-buscar-dicas-carro') encontrado. Conectando...");
    // Adiciona um 'ouvinte'. Quando o botão é clicado, executamos UMA PEQUENA FUNÇÃO () => {...}.
    // Esta pequena função chama a função `buscarDicasPorTipo` passando a string "carro" como argumento.
    // Precisamos dessa função "intermediária" porque `addEventListener` espera uma função que ele execute, e `buscarDicasPorTipo("carro")` EXECUTARIA a função NA HORA, e não SÓ QUANDO CLICADO.
    botaoBuscarDicasCarro.addEventListener("click", () => buscarDicasPorTipo("carro"));
} else {
    console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-carro' NÃO encontrado no HTML.");
}

// --- Conecta o botão de Dicas para Moto com a função ---
if (botaoBuscarDicasMoto) {
     console.log("[FRONTEND] Botão 'Dicas para Moto' (ID: 'btn-buscar-dicas-moto') encontrado. Conectando...");
     // Similar ao carro, chama buscarDicasPorTipo passando "moto".
     botaoBuscarDicasMoto.addEventListener("click", () => buscarDicasPorTipo("moto"));
} else {
    console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-moto' NÃO encontrado no HTML.");
}

// --- Conecta o botão de Dicas para Caminhão com a função ---
// Exemplo: Adicione este if/else se você criar um botão com o ID 'btn-buscar-dicas-caminhao' no HTML.
if (botaoBuscarDicasCaminhao) {
     console.log("[FRONTEND] Botão 'Dicas para Caminhão' (ID: 'btn-buscar-dicas-caminhao') encontrado. Conectando...");
     // Similar aos outros tipos, chama buscarDicasPorTipo passando "caminhao".
     botaoBuscarDicasCaminhao.addEventListener("click", () => buscarDicasPorTipo("caminhao"));
} else {
     console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-caminhao' NÃO encontrado no HTML.");
}

// === Adicione mais blocos 'if' e 'addEventListener' aqui para conectar outros botões de tipo se criar mais no HTML ===

// --- DICA IMPORTANTE: ESTRUTURA DE EXEMPLO NO SEU index.html ---
/*
    Para que o código acima funcione, seu arquivo index.html precisa ter elementos HTML com os IDs corretos.
    Veja um exemplo de como poderia ser a estrutura das seções de Clima e Dicas:

    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Minha Garagem Inteligente</title>
        // Você pode ter seu arquivo de estilos CSS aqui <link rel="stylesheet" href="style.css">
    </head>
    <body>

        <h1>Garagem Inteligente da Luana!</h1> // :)

        <section id="secao-clima">
            <h2>Previsão do Tempo da Garagem</h2>
            <div>
                <input type="text" id="cidade-previsao-input-bicicleta" placeholder="Ex: Sao Paulo, BR">
                <button id="verificar-clima-btn-bicicleta">Buscar Clima</button>
            </div>
            // Área onde o resultado da previsão será exibido.
            <div id="previsao-tempo-resultado-bicicleta" style="margin-top: 15px; padding: 15px; border: 1px solid #ccc; min-height: 50px;">
                <p>Resultado da previsão aparecerá aqui...</p>
            </div>
        </section>

        <hr style="margin: 30px 0;"> // Uma linha visual para separar as seções

        <section id="secao-dicas-manutencao">
            <h2>Dicas de Manutenção</h2>
            <p>Escolha um tipo ou veja dicas gerais:</p>
            <div> // Botões para acionar as buscas de dicas
                <button id="btn-buscar-dicas-gerais">Dicas Gerais</button>
                <button id="btn-buscar-dicas-carro">Para Carros</button>
                <button id="btn-buscar-dicas-moto">Para Motos</button>
                <button id="btn-buscar-dicas-caminhao">Para Caminhões</button>
                // Adicione aqui outros botões de tipo se necessário
            </div>

            // Áreas onde os resultados das dicas serão exibidos.
            // Podem estar juntas ou separadas, dependendo do seu design.
            <div id="lista-dicas-gerais-div" style="margin-top: 15px; padding: 15px; border: 1px dashed #ddd; min-height: 30px;">
                 // Resultado das dicas gerais aparecerá aqui...
            </div>
             <div id="lista-dicas-por-tipo-div" style="margin-top: 15px; padding: 15px; border: 1px dashed #ddd; min-height: 30px;">
                 // Resultado das dicas por tipo aparecerá aqui...
            </div>
        </section>


        // <<<<< VINCULE SEU ARQUIVO JAVASCRIPT AQUI! <<<<<
        // Este script DEVE estar após os elementos HTML que ele manipula (como os botões e divs),
        // ou usar o evento 'DOMContentLoaded' se estiver no <head>.
        // Geralmente colocar antes de fechar o </body> é a forma mais simples e segura.
        // VERIFIQUE SE O NOME NO `src` CORRESPONDE AO NOME REAL DO SEU ARQUIVO (client.js, script.js, etc.)!
        <script src="client.js"></script>

    </body>
    </html>
*/
// =====================================================================================