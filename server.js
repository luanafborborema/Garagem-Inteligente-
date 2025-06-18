// server.js
// Este arquivo roda no seu servidor Node.js (no Render).
// É o CÉREBRO da sua aplicação: recebe pedidos do frontend e processa dados ou fala com outras APIs.

// === BIBLIOTECAS NECESSÁRIAS ===
// Estas bibliotecas precisam estar listadas no package.json e instaladas via 'npm install'.
import express from 'express';
import cors from 'cors'; // Permite que seu frontend (em outro endereço) se conecte.
// node-fetch: biblioteca para usar 'fetch' dentro do ambiente Node.js (backend).
// Precisamos dela para que o backend possa fazer requisições HTTP (para o OpenWeatherMap, por exemplo).
import fetch from 'node-fetch';

const app = express();
// Configura a porta: usa a porta que o ambiente de hospedagem (Render) te der, ou a porta 3001 para teste no seu computador.
const port = process.env.PORT || 3001;

// --- SUA CHAVE API DO OPENWEATHERMAP ---
// POR ENQUANTO COLOCADA DIRETAMENTE AQUI para simplificar (Menos seguro para produção, será melhorada na próxima atividade).
// A CHAVE DA API ESTÁ SEGURA AQUI, DENTRO DO BACKEND, porque o frontend não vê este código.
const OPENWEATHER_API_KEY = "9fd6298e4ca0ebb6f4b7e6a570fc58c3";
// << NA PRÓXIMA ATIVIDADE IDEALMENTE SERÁ: const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY; >>
// << ONDE process.env.OPENWEATHER_API_KEY É CONFIGURADO COMO VARIÁVEL DE AMBIENTE NO RENDER. >>
// ----------------------------------------------------------------------

// === MIDDLEWARES DO EXPRESS ===
// Funções que processam as requisições HTTP antes de chegarem às rotas específicas.
// Permite que o frontend fale com o backend.
app.use(cors());
// Permite que o Express leia dados em formato JSON que vêm no corpo das requisições (útil para métodos POST, PUT, etc.).
app.use(express.json());

console.log("[BACKEND] Servidor backend iniciando...");


// ========================================================
//          ENDPOINT 1: PREVISÃO DO TEMPO (/api/previsao/:cidade)
//          Método HTTP: GET
//          Função: O backend atua como "proxy". Ele recebe o pedido do frontend,
//          chama a API real do OpenWeatherMap usando a chave secreta,
//          processa a resposta e envia APENAS os dados necessários para o frontend.
// ========================================================
// Rota: Recebe requisições GET para o caminho "/api/previsao/" seguido do nome da cidade.
app.get('/api/previsao/:cidade', async (req, res) => {
    // Captura o valor da cidade da URL.
    const cidade = req.params.cidade; // Ex: /api/previsao/Curitiba -> cidade será "Curitiba".

    console.log(`[BACKEND LOG] Requisição recebida: GET /api/previsao/${cidade}`);

    // === MONTA A URL COMPLETA PARA CHAMAR A API REAL DO OPENWEATHER MAP ===
    // *** USA A CHAVE API (que está segura aqui no backend)! ***
    const urlOpenWeather = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        // === O BACKEND FAZ A REQUISIÇÃO HTTP PARA A API EXTERNA (OpenWeatherMap) ===
        const responseOpenWeather = await fetch(urlOpenWeather);

        // === VERIFICA SE A RESPOSTA DA API EXTERNA (OpenWeather) FOI BEM SUCEDIDA ===
        // response.ok é true para status 2xx, false para outros (4xx, 5xx).
        if (!responseOpenWeather.ok) {
             // Se deu erro na OpenWeather, tentamos pegar os detalhes do erro que eles mandaram
             const errorDataOpenWeather = await responseOpenWeather.json();
             console.error(`[BACKEND LOG] Erro da API OpenWeatherMap (${responseOpenWeather.status} - ${responseOpenWeather.statusText}):`, errorDataOpenWeather);

             // --- PREPARA A RESPOSTA DE ERRO PARA ENVIAR DE VOLTA PARA O SEU FRONTEND ---
             // Usa o mesmo status code da OpenWeather se for 4xx, senão usa 400 (Bad Request)
             const statusCodeParaFrontend = responseOpenWeather.status >= 400 && responseOpenWeather.status < 500 ? responseOpenWeather.status : 400;
             return res.status(statusCodeParaFrontend).json({ // `return` encerra a execução
                 // Manda a mensagem de erro da OpenWeather se disponível, ou uma genérica.
                 error: errorDataOpenWeather.message || responseOpenWeather.statusText || 'Erro ao buscar dados de clima na fonte externa.', // Mensagem para o frontend
                 cidadeRequisitada: cidade // Pode ser útil para o frontend saber qual cidade falhou
             });
        }

        // Se a resposta da OpenWeather foi sucesso (status 200), lê os dados
        const dadosOpenWeather = await responseOpenWeather.json();

        console.log(`[BACKEND LOG] Dados de previsão recebidos da OpenWeather para ${cidade}: ${dadosOpenWeather.weather[0].description}`);

        // --- FORMATANDO OS DADOS ANTES DE ENVIAR PRO FRONTEND ---
        // Pegamos só os campos que queremos mandar.
        const dadosFormatadosParaFrontend = {
            nomeCidade: dadosOpenWeather.name,
            pais: dadosOpenWeather.sys.country,
            descricaoClima: dadosOpenWeather.weather[0].description,
            iconeClima: dadosOpenWeather.weather[0].icon,
            temperaturaAtual: dadosOpenWeather.main.temp,
            temperaturaMax: dadosOpenWeather.main.temp_max,
            temperaturaMin: dadosOpenWeather.main.temp_min,
            sensacaoTermica: dadosOpenWeather.main.feels_like,
            velocidadeVento: dadosOpenWeather.wind.speed
        };

        // === ENVIA A RESPOSTA DE SUCESSO PARA O SEU FRONTEND ===
        res.json(dadosFormatadosParaFrontend); // Manda os dados formatados como JSON

    } catch (error) {
        // === TRATA ERROS INTERNOS NO BACKEND (ex: problema de rede DO SEU BACKEND ao chamar OPEWNEATHER) ===
        console.error("[BACKEND LOG] Erro interno do servidor ao processar requisição de previsão:", error);
        // Envia um erro genérico para o frontend (não expõe detalhes técnicos do servidor)
        res.status(500).json({ error: 'Erro interno do servidor ao processar a requisição de clima.' });
    }
});

// ========================================================
//          DADOS DE EXEMPLO (EM MEMÓRIA NO BACKEND)
//          Simula um banco de dados simples com arrays de objetos JS.
// ========================================================
const dicasManutencaoGerais = [
    { id: 1, dica: "Verifique o nível do óleo regularmente." },
    { id: 2, dica: "Calibre os pneus semanalmente." },
    { id: 3, dica: "Confira o fluido de arrefecimento." },
    { id: 4, dica: "Mantenha os filtros de ar e combustível limpos." }
];

const dicasPorTipo = {
    carro: [
        { id: 10, dica: "Faça o rodízio dos pneus a cada 10.000 km ou conforme manual." },
        { id: 11, dica: "Verifique as palhetas do limpador de para-brisa." },
        { id: 12, dica: "Alinhe e balanceie a direção periodicamente." }
    ],
    moto: [
        { id: 20, dica: "Lubrifique e ajuste a corrente (se for o caso) frequentemente." },
        { id: 21, dica: "Verifique o desgaste das pastilhas de freio." },
        { id: 22, dica: "Cheque a pressão dos pneus antes de cada uso prolongado." }
    ],
     caminhao: [
        { id: 30, dica: "Verifique sistemas de freio a ar, se aplicável." },
        { id: 31, dica: "Monitore o desgaste dos pneus, especialmente em longas distâncias." },
        { id: 32, dica: "Atenção à manutenção preventiva do motor para eficiência do combustível." }
    ]
};

// ========================================================
//          ENDPOINT 2: DICAS GERAIS (/api/dicas-manutencao)
//          Método HTTP: GET
//          Função: Retorna uma lista de dicas de manutenção geral salvas aqui no backend.
// ========================================================
// Rota: Recebe requisições GET para o caminho "/api/dicas-manutencao".
app.get('/api/dicas-manutencao', (req, res) => {
    console.log('[BACKEND LOG] Requisição recebida: GET /api/dicas-manutencao');
    // Simplesmente envia o array completo de dicas gerais para o frontend como JSON.
    res.json(dicasManutencaoGerais);
});

// ========================================================
//          ENDPOINT 3: DICAS POR TIPO (/api/dicas-manutencao/:tipoVeiculo)
//          Método HTTP: GET
//          Função: Retorna dicas de manutenção específicas baseadas no tipo de veículo requisitado.
// ========================================================
// Rota: Recebe requisições GET para o caminho "/api/dicas-manutencao/" seguido do tipo de veículo.
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    // Captura o valor do parâmetro ":tipoVeiculo" da URL.
    const { tipoVeiculo } = req.params; // Ex: /api/dicas-manutencao/moto -> tipoVeiculo="moto".
    console.log(`[BACKEND LOG] Requisição recebida: GET /api/dicas-manutencao/${tipoVeiculo}`);

    // Converte o tipo recebido para letras minúsculas para buscar no nosso objeto `dicasPorTipo`.
    const tipoLowerCase = tipoVeiculo.toLowerCase();

    // Busca o array de dicas correspondente ao tipo convertido para minúsculas.
    // Se não achar a chave, `dicasEncontradas` será `undefined`.
    const dicasEncontradas = dicasPorTipo[tipoLowerCase];

    // === VERIFICA SE ENCONTROU UM ARRAY DE DICAS PARA ESSE TIPO ===
    // Verificamos se `dicasEncontradas` NÃO é `undefined`.
    if (dicasEncontradas !== undefined) {
         console.log(`[BACKEND LOG] Encontradas ${dicasEncontradas.length} dicas para o tipo: ${tipoLowerCase}`);
        // === ENVIA RESPOSTA DE SUCESSO (STATUS 200 OK) ===
        // Retorna o array de dicas (mesmo que esteja vazio, significa que o tipo é válido mas não tem dicas cadastradas para ele).
        res.json(dicasEncontradas); // Envia o array de dicas como JSON.
    } else {
         // === SE O TIPO DE VEÍCULO NÃO EXISTE NO NOSSO OBJETO `dicasPorTipo` ===
         console.warn(`[BACKEND LOG] Tipo de veículo não encontrado em 'dicasPorTipo': ${tipoVeiculo}`);
        // === ENVIA RESPOSTA DE ERRO 404 (Não Encontrado) PARA O FRONTEND ===
        res.status(404).json({ // Retorna status 404 Not Found.
             error: `Tipo de veículo '${tipoVeiculo}' não encontrado em nossa lista de dicas.`, // Mensagem de erro.
             dicas: [] // Inclui um array vazio para ser consistente no frontend.
        });
    }
});

// ========================================================
//      ESPAÇO PARA NOVOS ENDPOINTS GET DA ATIVIDADE A9!
//      Você adicionaria aqui as rotas app.get() para:
//      /api/garagem/veiculos-destaque, /api/garagem/servicos-oferecidos, etc.
//      Esses endpoints retornariam os NOVOS ARRAYS de dados que você criar
//      lá na seção "DADOS DE EXEMPLO" acima.
// ========================================================
/*
// Exemplo para A9 (Não cole AGORA a menos que já esteja nesta atividade):
app.get('/api/garagem/veiculos-destaque', (req, res) => {
    console.log('[BACKEND LOG] Requisição recebida: GET /api/garagem/veiculos-destaque');
    // Assume que você criou um array 'listaVeiculosDestaque' lá em cima
    // res.json(listaVeiculosDestaque);
});
*/

// ========================================================
//          ENDPOINT BÁSICO: ROTA RAIZ (/)
//          Método: GET
//          Serve apenas para verificar se o backend está online acessando a URL base no navegador.
// ========================================================
app.get('/', (req, res) => {
    console.log('[BACKEND LOG] Requisição recebida: GET /');
    res.send('Servidor da Garagem Inteligente backend está online e pronto! ✨');
});


// ========================================================
//          INICIA O SERVIDOR BACKEND
//          Faz o Express começar a escutar requisições na porta configurada.
// ========================================================
app.listen(port, () => {
    console.log(`[BACKEND] Servidor Express rodando na porta ${port}`);
    console.log(`[BACKEND] Para teste local, acesse: http://localhost:${port}`);
    console.log(`[BACKEND] Ao deployar no Render, use a URL pública fornecida por eles no seu frontend.`);
});