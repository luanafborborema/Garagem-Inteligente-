import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3001;

const dicasManutencaoGerais = [
  { id: 1, dica: "Verifique o nível do óleo regularmente." },
  { id: 2, dica: "Calibre os pneus semanalmente." },
  { id: 3, dica: "Confira o fluido de arrefecimento." }
];

const dicasPorTipo = {
  carro: [{ id: 10, dica: "Faça o rodízio dos pneus a cada 10.000 km." }],
  moto: [{ id: 20, dica: "Lubrifique a corrente frequentemente." }]
};

const viagensPopulares = [
  { id: 1, destino: "Rio de Janeiro", descricao: "Praias e Carnaval" },
  { id: 2, destino: "Foz do Iguaçu", descricao: "Cataratas e natureza" },
  { id: 3, destino: "Chapada Diamantina", descricao: "Trilhas e cachoeiras" }
];

const OPENWEATHER_API_KEY = "9fd6298e4ca0ebb6f4b7e6a570fc58c3";

app.use(cors());
app.use(express.json());

console.log("[BACKEND] Servidor backend iniciando...");

app.get('/api/previsao/:cidade', async (req, res) => {
    const cidade = req.params.cidade;
    console.log(`[BACKEND LOG] Requisição recebida: GET /api/previsao/${cidade}`);
    const urlOpenWeather = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        const responseOpenWeather = await fetch(urlOpenWeather);

        if (!responseOpenWeather.ok) {
             const errorDataOpenWeather = await responseOpenWeather.json();
             console.error(`[BACKEND LOG] Erro da API OpenWeatherMap (${responseOpenWeather.status} - ${responseOpenWeather.statusText}):`, errorDataOpenWeather);
             const statusCodeParaFrontend = responseOpenWeather.status >= 400 && responseOpenWeather.status < 500 ? responseOpenWeather.status : 400;
             return res.status(statusCodeParaFrontend).json({
                 error: errorDataOpenWeather.message || responseOpenWeather.statusText || 'Erro ao buscar dados de clima na fonte externa.',
                 cidadeRequisitada: cidade
             });
        }

        const dadosOpenWeather = await responseOpenWeather.json();

        console.log(`[BACKEND LOG] Dados de previsão recebidos da OpenWeather para ${cidade}: ${dadosOpenWeather.weather[0].description}`);

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

        res.json(dadosFormatadosParaFrontend);

    } catch (error) {
        console.error("[BACKEND LOG] Erro interno do servidor ao processar requisição de previsão:", error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar a requisição de clima.' });
    }
});

app.get('/api/dicas-manutencao', (req, res) => {
    console.log('[BACKEND LOG] Requisição recebida: GET /api/dicas-manutencao');
    res.json(dicasManutencaoGerais);
});

app.get('/api/dicas-manutencao/:tipoVeiculo', (req, res) => {
    const { tipoVeiculo } = req.params;
    console.log(`[BACKEND LOG] Requisição recebida: GET /api/dicas-manutencao/${tipoVeiculo}`);

    const tipoLowerCase = tipoVeiculo.toLowerCase();
    const dicasEncontradas = dicasPorTipo[tipoLowerCase];

    if (dicasEncontradas !== undefined) {
        console.log(`[BACKEND LOG] Encontradas ${dicasEncontradas.length} dicas para o tipo: ${tipoLowerCase}`);
        res.json(dicasEncontradas);
    } else {
        console.warn(`[BACKEND LOG] Tipo de veículo não encontrado em 'dicasPorTipo': ${tipoVeiculo}`);
        res.status(404).json({
            error: `Tipo de veículo '${tipoVeiculo}' não encontrado em nossa lista de dicas.`,
            dicas: []
        });
    }
});

app.get('/', (req, res) => {
    console.log('[BACKEND LOG] Requisição recebida: GET /');
    res.send('Servidor da Garagem Inteligente backend está online e pronto! ✨');
});

app.listen(port, () => {
    console.log(`[BACKEND] Servidor Express rodando na porta ${port}`);
    console.log(`[BACKEND] Para teste local, acesse: http://localhost:${port}`);
    console.log(`[BACKEND] Ao deployar no Render, use a URL pública fornecida por eles no seu frontend.`);
});
