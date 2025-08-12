// server.js

// Importações dos módulos que vamos precisar
// No Node.js moderno (com "type": "module" no package.json), usamos 'import'.
import express from 'express'; // Framework para construir o servidor web
import dotenv from 'dotenv';   // Para carregar variáveis de ambiente (nossa API Key)
import axios from 'axios';     // Para fazer requisições HTTP para a API OpenWeatherMap

// Carrega as variáveis de ambiente do arquivo .env para process.env
// Isso faz com que process.env.OPENWEATHER_API_KEY funcione
dotenv.config();

// Inicializa o aplicativo Express
// 'app' será nosso objeto principal para configurar o servidor
const app = express();

// Define a porta onde nosso servidor backend vai "ouvir" por requisições
// Ele vai tentar usar a porta definida na variável de ambiente PORT (útil para deploys)
// Se não encontrar, vai usar a porta 3001 como padrão.
const port = process.env.PORT || 3001;

// Pega a chave da API OpenWeatherMap que carregamos do arquivo .env
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para permitir CORS (Cross-Origin Resource Sharing)
// Isso é importante para que seu frontend (que pode estar rodando em outra porta ou domínio)
// possa fazer requisições para este backend.
app.use((req, res, next) => {
    // Permite acesso de qualquer origem. Em produção, você restringiria isso
    // para o domínio exato do seu frontend (ex: 'https://sua-garagem.vercel.app').
    res.header('Access-Control-Allow-Origin', '*');

    // Define quais cabeçalhos HTTP são permitidos na requisição
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Continua para a próxima função/middleware na cadeia de requisições
    next();
});

// ----- NOSSO PRIMEIRO ENDPOINT: Previsão do Tempo -----
// Define uma rota que responde a requisições HTTP GET no caminho /api/previsao/:cidade
// :cidade é um parâmetro dinâmico que podemos pegar da URL.
app.get('/api/previsao/:cidade', async (req, res) => {
    // Pega o valor do parâmetro 'cidade' da URL.
    // Se a URL for /api/previsao/Curitiba, req.params.cidade será "Curitiba".
    const { cidade } = req.params;

    // Validação 1: Verifica se a API Key foi carregada corretamente do .env
    if (!apiKey) {
        console.error("[Servidor] Erro: Chave da API OpenWeatherMap não configurada.");
        // Retorna um erro 500 (Internal Server Error) para o cliente
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }

    // Validação 2: Verifica se o nome da cidade foi fornecido na URL
    if (!cidade) {
        console.warn("[Servidor] Aviso: Nome da cidade não fornecido na requisição.");
        // Retorna um erro 400 (Bad Request) para o cliente
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    // Monta a URL para fazer a requisição à API OpenWeatherMap
    // Usamos encodeURIComponent(cidade) para tratar espaços ou caracteres especiais no nome da cidade.
    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        // Informa no console do servidor que estamos buscando a previsão
        // Isso é útil para debugging quando o servidor estiver rodando.
        console.log(`[Servidor] Buscando previsão para: ${cidade} na URL: ${weatherAPIUrl}`);

        // Faz a requisição GET para a API OpenWeatherMap usando axios
        // 'await' pausa a execução aqui até que a promessa do axios.get() seja resolvida
        const apiResponse = await axios.get(weatherAPIUrl);

        // Informa no console do servidor que os dados foram recebidos
        console.log('[Servidor] Dados recebidos da OpenWeatherMap.');

        // (Opcional) Para ver a estrutura completa dos dados da API no console do servidor (útil na primeira vez)
        // console.log(JSON.stringify(apiResponse.data, null, 2));

        // Envia os dados recebidos da OpenWeatherMap (apiResponse.data) de volta para o cliente (frontend) como JSON.
        res.json(apiResponse.data);

    } catch (error) {
        // Se ocorrer qualquer erro durante a chamada à API OpenWeatherMap ou no bloco 'try'
        console.error("[Servidor] Erro ao buscar previsão:", error.response?.data || error.message);

        // Determina o status do erro. Se a API externa retornou um erro (ex: 404 cidade não encontrada),
        // usamos o status dela. Caso contrário, usamos 500 (erro interno do servidor).
        const status = error.response?.status || 500;

        // Monta uma mensagem de erro mais amigável.
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo no servidor.';

        // Envia a resposta de erro para o cliente (frontend)
        res.status(status).json({ error: message });
    }
});

// Inicia o servidor para "ouvir" por requisições na porta que definimos
app.listen(port, () => {
    // Esta mensagem aparecerá no console do servidor quando ele iniciar com sucesso.
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    // (Lembre-se, isso só acontecerá quando o Node.js estiver instalado e você rodar 'node server.js')
});