// server.js
// Este arquivo roda no seu servidor Node.js (no Render).
// É aqui que guardamos a chave da API do tempo de forma segura e criamos os endpoints.

// === BIBLIOTECAS NECESSÁRIAS ===
// Elas devem estar listadas no package.json e instaladas via 'npm install'.
import express from 'express';
import cors from 'cors';
// Importamos fetch para usar no backend para chamar APIs externas (como OpenWeatherMap).
// Isso só funciona com node-fetch instalado E "type": "module" no package.json.
import fetch from 'node-fetch';

const app = express();
// Configura a porta: usa a porta que o Render definir (process.env.PORT) ou a porta 3001 para teste local.
const port = process.env.PORT || 3001;

// --- CHAVE API DO OPENWEATHERMAP ---
// POR BOAS PRÁTICAS DE SEGURANÇA, CHAVES SECRETAS DEVEM SER CARREGADAS DE VARIÁVEIS DE AMBIENTE (process.env)
// Você configuraria OPENWEATHER_API_KEY no Render.
// Se testando localmente, pode criar um arquivo .env (se usar dotenv) ou setar a variável na mão no terminal.
// *** POR AGORA, ESTAMOS COLOCANDO DIRETAMENTE AQUI (MENOS SEGURO NA PRÓX. ATIVIDADE VAMOS MUDAR) APENAS PARA FUNCIONAR RÁPIDO PARA VOCÊ: ***
const OPENWEATHER_API_KEY = "9fd6298e4ca0ebb6f4b7e6a570fc58c3";
// *** IDEALMENTE SERIA: const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
// ----------------------------------------------------------------------
// NOTE: Ao usar no Render, você DEVE configurar uma variável de ambiente lá chamada OPENWEATHER_API_KEY
// e colar sua chave nela, e mudar a linha acima para usar process.env.


// === MIDDLEWARES ===
// Configuram como o servidor Express lida com as requisições.
// Permite que seu frontend (em outro endereço, como Render ou localhost diferente) se conecte.
app.use(cors());
// Permite que o Express entenda e analise dados JSON que vêm no corpo das requisições (POST, PUT).
app.use(express.json());

console.log("[BACKEND] Servidor backend iniciando...");


// ========================================================
//          ENDPOINT 1: PREVISÃO DO TEMPO (/api/previsao/:cidade)
//          Descrição: Backend chama OpenWeatherMap e responde pro Frontend.
//          Método: GET
// ========================================================
app.get('/api/previsao/:cidade', async (req, res) => {
    // Captura a parte variável da URL que representa a cidade (ex: /api/previsao/Paris -> cidade="Paris")
    const cidade = req.params.cidade;

    console.log(`[BACKEND LOG] Requisição recebida: GET /api/previsao/${cidade}`);

    // === MONTA A URL PARA CHAMAR A API REAL DO OPENWEATHER MAP ===
    // *** USAMOS A CHAVE API AQUI NO BACKEND (segura)! ***
    const urlOpenWeather = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        // === O BACKEND FAZ A REQUISIÇÃO PARA A API EXTERNA (OpenWeatherMap) ===
        const responseOpenWeather = await fetch(urlOpenWeather);

        // === VERIFICA A RESPOSTA DA API EXTERNA ===
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
                 error: errorDataOpenWeather.message || responseOpenWeather.statusText || 'Erro ao buscar dados de clima na fonte externa.',
                 cidadeRequisitada: cidade // Pode ser útil para o frontend saber qual cidade falhou
             });
        }

        // Se a resposta da OpenWeather foi sucesso (status 200), lê os dados
        const dadosOpenWeather = await responseOpenWeather.json();

        console.log(`[BACKEND LOG] Dados recebidos da OpenWeather para ${cidade}: ${dadosOpenWeather.weather[0].description}`);

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
        // === TRATA ERROS INTERNOS NO BACKEND (ex: problema de rede DO SEU BACKEND para OpenWeather) ===
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
//          Descrição: Retorna uma lista de dicas de manutenção geral.
//          Método: GET
// ========================================================
app.get('/api/dicas-manutencao', (req, res) => {
    console.log('[BACKEND LOG] Requisição recebida: GET /api/dicas-manutencao');
    // Envia o array completo de dicas gerais como JSON.
    res.json(dicasManutencaoGerais);
});

// ========================================================
//          ENDPOINT 3: DICAS POR TIPO (/api/dicas-manutencao/:tipoVeiculo)
//          Descrição: Retorna dicas de manutenção específicas para um tipo de veículo.
//          Método: GET
// ========================================================
app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    // Captura o valor do ":tipoVeiculo" da URL.
    const { tipoVeiculo } = req.params; // Ex: /api/dicas-manutencao/moto -> tipoVeiculo="moto"
    console.log(`[BACKEND LOG] Requisição recebida: GET /api/dicas-manutencao/${tipoVeiculo}`);

    // Converte o tipo para minúsculas para garantir que ache no nosso objeto `dicasPorTipo`.
    const tipoLowerCase = tipoVeiculo.toLowerCase();

    // Busca o array de dicas correspondente. Se não achar, `dicasEncontradas` será `undefined`.
    const dicasEncontradas = dicasPorTipo[tipoLowerCase];

    // === VERIFICA SE ENCONTROU DICAS PARA O TIPO REQUISITADO ===
    if (dicasEncontradas !== undefined) {
         console.log(`[BACKEND LOG] Encontradas ${dicasEncontradas.length} dicas para o tipo: ${tipoLowerCase}`);
        // === ENVIA RESPOSTA DE SUCESSO (mesmo que o array esteja vazio, se o tipo é válido) ===
        res.json(dicasEncontradas); // Envia o array de dicas como JSON.
    } else {
         // === SE O TIPO NÃO EXISTE NO NOSSO OBJETO `dicasPorTipo` ===
         console.warn(`[BACKEND LOG] Tipo de veículo não encontrado para dicas: ${tipoVeiculo}`);
        // === ENVIA RESPOSTA DE ERRO 404 (Não Encontrado) ===
        res.status(404).json({
             error: `Tipo de veículo '${tipoVeiculo}' não encontrado em nossa lista de dicas.`,
             dicas: [] // Envia um array vazio para ser consistente com a resposta de sucesso
        });
    }
});


// ========================================================
//          ENDPOINT BÁSICO: ROTA RAIZ (/)
//          Descrição: Apenas informa que o backend está rodando.
//          Método: GET
// ========================================================
app.get('/', (req, res) => {
    res.send('Servidor da Garagem Inteligente backend está online! 👋');
});


// ========================================================
//          INICIA O SERVIDOR BACKEND
//          Faz o Express começar a escutar na porta configurada.
// ========================================================
app.listen(port, () => {
    console.log(`[BACKEND] Servidor Express rodando na porta ${port}`);
    console.log(`[BACKEND] Para teste local, acesse: http://localhost:${port}`);
    console.log(`[BACKEND] Ao deployar no Render, use a URL fornecida por eles no frontend.`);
});