const backendUrl = "https://garagem-inteligente.onrender.com";

console.log(`[FRONTEND] Configurado para chamar backend em: ${backendUrl}`);

const botaoVerificarClima = document.getElementById("verificar-clima-btn-bicicleta");
const inputCidadePrevisao = document.getElementById("cidade-previsao-input-bicicleta");
const divResultadoPrevisao = document.getElementById("previsao-tempo-resultado-bicicleta");

const divListaDicasGerais = document.getElementById("lista-dicas-gerais-div");
const divListaDicasPorTipo = document.getElementById("lista-dicas-por-tipo-div");

const botaoBuscarDicasGerais = document.getElementById("btn-buscar-dicas-gerais");
const botaoBuscarDicasCarro = document.getElementById("btn-buscar-dicas-carro");
const botaoBuscarDicasMoto = document.getElementById("btn-buscar-dicas-moto");
const botaoBuscarDicasCaminhao = document.getElementById("btn-buscar-dicas-caminhao");

if (botaoVerificarClima && inputCidadePrevisao && divResultadoPrevisao) {
    console.log("[FRONTEND] Elementos HTML essenciais para a funcionalidade de Clima encontrados. Configurando listener...");
    botaoVerificarClima.addEventListener("click", async () => {
        const cidade = inputCidadePrevisao.value.trim();
        divResultadoPrevisao.innerHTML = "<p>Carregando previsão do tempo...</p>";
        if (!cidade) {
            divResultadoPrevisao.innerHTML = '<p style="color:red;">Por favor, digite o nome de uma cidade para verificar o clima.</p>';
            return;
        }
        console.log(`[FRONTEND] Botão de Clima clicado. Preparando para buscar previsão para "${cidade}" no backend.`);
        try {
            const urlParaChamarBackend = `${backendUrl}/api/previsao/${cidade}`;
            console.log(`[FRONTEND] Chamando URL do backend para clima: ${urlParaChamarBackend}`);
            const responseDoBackend = await fetch(urlParaChamarBackend);
            if (!responseDoBackend.ok) {
                const errorDataDoBackend = await responseDoBackend.json();
                console.error(`[FRONTEND] Erro recebido do Backend (${responseDoBackend.status} - ${responseDoBackend.statusText}):`, errorDataDoBackend);
                const errorMessageParaUI = errorDataDoBackend.error || `Erro desconhecido (Status: ${responseDoBackend.status}) ao obter previsão.`;
                throw new Error(errorMessageParaUI);
            }
            const dadosRecebidosDoBackend = await responseDoBackend.json();
            console.log(`[FRONTEND] Dados de previsão recebidos do backend:`, dadosRecebidosDoBackend);
            divResultadoPrevisao.innerHTML = `
              <h5>Previsão do tempo para ${dadosRecebidosDoBackend.nomeCidade}, ${dadosRecebidosDoBackend.pais}</h5>
              <p>${dadosRecebidosDoBackend.descricaoClima}</p>
              <img src="https://openweathermap.org/img/wn/${dadosRecebidosDoBackend.iconeClima}@2x.png" alt="${dadosRecebidosDoBackend.descricaoClima}">
              <p>Temperatura: ${dadosRecebidosDoBackend.temperaturaAtual}°C (Sensação: ${dadosRecebidosDoBackend.sensacaoTermica}°C)</p>
              <p>Máx: ${dadosRecebidosDoBackend.temperaturaMax}°C / Mín: ${dadosRecebidosDoBackend.temperaturaMin}°C</p>
              <p>Vento: ${dadosRecebidosDoBackend.velocidadeVento} m/s</p>
            `;
        } catch (error) {
            console.error("[FRONTEND] Erro geral durante a busca ou processamento da previsão:", error);
            divResultadoPrevisao.innerHTML = `<p style="color:red;">Erro: ${error.message}</p>`;
        }
    });
} else {
    console.error("[FRONTEND] ERRO FATAL: Elementos HTML para a funcionalidade de Clima não encontrados. Verifique os IDs no seu index.html. A funcionalidade de Clima NÃO VAI FUNCIONAR.");
    if (!botaoVerificarClima) console.error("- Elemento com ID 'verificar-clima-btn-bicicleta' não encontrado.");
    if (!inputCidadePrevisao) console.error("- Elemento com ID 'cidade-previsao-input-bicicleta' não encontrado.");
    if (!divResultadoPrevisao) console.error("- Elemento com ID 'previsao-tempo-resultado-bicicleta' não encontrado.");
    console.log("[FRONTEND] Certifique-se de que o script está sendo carregado APÓS os elementos HTML existirem (geralmente colocar o <script> antes do fechamento </body> resolve).");
}

function exibirMensagemDicasGerais(mensagem, isError = false) {
    if (divListaDicasGerais) {
        divListaDicasGerais.innerHTML = `<p style="color:${isError ? 'red' : 'black'};">${mensagem}</p>`;
    } else {
        console.error("[FRONTEND] Div para Dicas Gerais (ID: 'lista-dicas-gerais-div') NÃO encontrada no HTML. Não é possível exibir mensagens ou resultados para Dicas Gerais.");
    }
}

function exibirMensagemDicasPorTipo(mensagem, isError = false) {
    if (divListaDicasPorTipo) {
        divListaDicasPorTipo.innerHTML = `<p style="color:${isError ? 'red' : 'black'};">${mensagem}</p>`;
    } else {
        console.error("[FRONTEND] Div para Dicas Por Tipo (ID: 'lista-dicas-por-tipo-div') NÃO encontrada no HTML. Não é possível exibir mensagens ou resultados para Dicas Por Tipo.");
    }
}

async function buscarDicasGerais() {
    console.log(`[FRONTEND] Iniciando busca por dicas gerais no backend: ${backendUrl}/api/dicas-manutencao`);
    exibirMensagemDicasGerais("Carregando dicas gerais...");
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao`);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || `Erro ao buscar dicas gerais (Status: ${response.status}).`;
            throw new Error(errorMessage);
        }
        const dicas = await response.json();
        console.log(`[FRONTEND] Dicas gerais recebidas do backend:`, dicas);
        let htmlDicas = "<h4>Dicas Gerais de Manutenção:</h4>";
        if (dicas && Array.isArray(dicas) && dicas.length > 0) {
            htmlDicas += "<ul>";
            dicas.forEach(dica => {
                htmlDicas += `<li>${dica && dica.dica ? dica.dica : 'Erro ao carregar item da dica.'}</li>`;
            });
            htmlDicas += "</ul>";
        } else {
            htmlDicas += "<p>Nenhuma dica geral de manutenção disponível no momento.</p>";
        }
        if(divListaDicasGerais) divListaDicasGerais.innerHTML = htmlDicas;
    } catch (error) {
        console.error("[FRONTEND] Erro ao buscar dicas gerais:", error);
        exibirMensagemDicasGerais(`Erro ao buscar dicas gerais: ${error.message}`, true);
    }
}

async function buscarDicasPorTipo(tipoVeiculo) {
    if (!tipoVeiculo || typeof tipoVeiculo !== 'string') {
        console.warn("[FRONTEND] Chamada inválida para buscarDicasPorTipo. Um tipo de veículo (string) deve ser fornecido.");
        exibirMensagemDicasPorTipo('Erro interno: Tipo de veículo inválido para buscar dicas.', true);
        return;
    }
    console.log(`[FRONTEND] Iniciando busca por dicas para "${tipoVeiculo}" no backend: ${backendUrl}/api/dicas-manutencao/${tipoVeiculo}`);
    exibirMensagemDicasPorTipo(`Carregando dicas para ${tipoVeiculo}...`);
    try {
        const response = await fetch(`${backendUrl}/api/dicas-manutencao/${tipoVeiculo.toLowerCase()}`);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error || `Erro ao buscar dicas para ${tipoVeiculo} (Status: ${response.status}).`;
            throw new Error(errorMessage);
        }
        const dicas = await response.json();
        console.log(`[FRONTEND] Dicas para "${tipoVeiculo}" recebidas do backend:`, dicas);
        let htmlDicas = `<h4>Dicas para ${tipoVeiculo}:</h4>`;
        if (dicas && Array.isArray(dicas) && dicas.length > 0) {
            htmlDicas += "<ul>";
            dicas.forEach(dica => {
                htmlDicas += `<li>${dica && dica.dica ? dica.dica : 'Erro ao carregar item da dica.'}</li>`;
            });
            htmlDicas += "</ul>";
        } else {
            htmlDicas += `<p>Nenhuma dica específica encontrada para o tipo "${tipoVeiculo}" no momento.</p>`;
        }
        if(divListaDicasPorTipo) divListaDicasPorTipo.innerHTML = htmlDicas;
    } catch (error) {
        console.error(`[FRONTEND] Erro ao buscar dicas por tipo (${tipoVeiculo}):`, error);
        exibirMensagemDicasPorTipo(`Erro ao buscar dicas para ${tipoVeiculo}: ${error.message}`, true);
    }
}

if (botaoBuscarDicasGerais) {
    console.log("[FRONTEND] Botão 'Dicas Gerais' (ID: 'btn-buscar-dicas-gerais') encontrado. Conectando...");
    botaoBuscarDicasGerais.addEventListener("click", buscarDicasGerais);
} else {
    console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-gerais' NÃO encontrado no HTML. A função de buscar dicas gerais não será ativada por botão.");
}

if (botaoBuscarDicasCarro) {
    console.log("[FRONTEND] Botão 'Dicas para Carro' (ID: 'btn-buscar-dicas-carro') encontrado. Conectando...");
    botaoBuscarDicasCarro.addEventListener("click", () => buscarDicasPorTipo("carro"));
} else {
    console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-carro' NÃO encontrado no HTML.");
}

if (botaoBuscarDicasMoto) {
    console.log("[FRONTEND] Botão 'Dicas para Moto' (ID: 'btn-buscar-dicas-moto') encontrado. Conectando...");
    botaoBuscarDicasMoto.addEventListener("click", () => buscarDicasPorTipo("moto"));
} else {
    console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-moto' NÃO encontrado no HTML.");
}

if (botaoBuscarDicasCaminhao) {
    console.log("[FRONTEND] Botão 'Dicas para Caminhão' (ID: 'btn-buscar-dicas-caminhao') encontrado. Conectando...");
    botaoBuscarDicasCaminhao.addEventListener("click", () => buscarDicasPorTipo("caminhao"));
} else {
    console.warn("[FRONTEND] Elemento com ID 'btn-buscar-dicas-caminhao' NÃO encontrado no HTML.");
}

// ====================== PREVISÃO DO TEMPO UNIVERSAL ======================
const botoesClima = document.querySelectorAll('.verificar-clima-btn-veiculo');

botoesClima.forEach(botao => {
    botao.addEventListener('click', async () => {
        const tipo = botao.getAttribute('data-veiculo-tipo');
        const input = document.getElementById(`cidade-previsao-input-${tipo}`);
        const cidadeSpan = document.getElementById(`nome-cidade-previsao-${tipo}`);
        const resultado = document.getElementById(`previsao-tempo-resultado-${tipo}`);

        const cidade = input.value.trim();

        if (!cidade) {
            resultado.innerHTML = '<p class="text-danger">Digite uma cidade.</p>';
            return;
        }

        cidadeSpan.textContent = cidade;
        resultado.innerHTML = '<p class="text-info">Buscando previsão...</p>';

        try {
            // Versão com latitude e longitude fixas — Assis Chateaubriand, PR
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-24.1&longitude=-54.3&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
            const data = await response.json();

            if (!data.daily) {
                resultado.innerHTML = '<p class="text-danger">Erro ao obter dados.</p>';
                return;
            }

            const html = data.daily.time.map((dia, index) => {
                return `
                    <div class="border p-2 mb-2 bg-light rounded">
                        <strong>${dia}</strong><br>
                        Máx: ${data.daily.temperature_2m_max[index]}°C<br>
                        Mín: ${data.daily.temperature_2m_min[index]}°C<br>
                        Chuva: ${data.daily.precipitation_sum[index]} mm
                    </div>
                `;
            }).join('');

            resultado.innerHTML = html;

        } catch (erro) {
            resultado.innerHTML = '<p class="text-danger">Erro ao buscar previsão.</p>';
        }
    });
});
