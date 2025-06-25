// ginteligente/backend/server.js (SUBSTITUIR TODO O CONTEÚDO DESTE ARQUIVO)

require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const cors = require('cors'); // Para permitir requisições do frontend
const app = express();
const PORT = process.env.PORT || 3001; // Porta 3001 como padrão, mas usa a do ambiente se houver

// Middleware
app.use(cors()); // Habilita o CORS para todas as requisições, importante para comunicação frontend-backend
app.use(express.json()); // Permite que o Express leia JSON no corpo das requisições

// =========================================================================
// Rota de Proxy para Previsão do Tempo (Segura: a chave fica AQUI, no backend)
// O frontend chamará /api/previsao/:cidade e não mais a API direta do OpenWeatherMap
// =========================================================================
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY; // A chave é carregada do .env!

app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    console.log(`[BACKEND] Requisição para previsão do tempo para: ${cidade}`);

    if (!OPENWEATHER_API_KEY) {
        console.error("[BACKEND] OPENWEATHER_API_KEY não definida no arquivo .env");
        return res.status(500).json({ error: 'Chave da API de clima não configurada no servidor. Contate o administrador.' });
    }

    try {
        const urlOpenWeather = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
        const responseOpenWeather = await fetch(urlOpenWeather);

        if (!responseOpenWeather.ok) {
            const errorData = await responseOpenWeather.json();
            console.error(`[BACKEND] Erro ao buscar dados do OpenWeatherMap: ${responseOpenWeather.status} - ${errorData.message}`);
            // Retorna o status de erro e a mensagem da API externa para o frontend
            return res.status(responseOpenWeather.status).json({ error: errorData.message || 'Erro ao buscar dados do clima na API externa.' });
        }

        const data = await responseOpenWeather.json();

        // Processa os dados para o formato que seu frontend espera (compatível com o seu 'script.js' atual)
        const previsaoFormatada = {
            nomeCidade: data.name,
            pais: data.sys.country,
            temperaturaAtual: data.main.temp,
            sensacaoTermica: data.main.feels_like,
            temperaturaMax: data.main.temp_max,
            temperaturaMin: data.main.temp_min,
            descricaoClima: data.weather[0].description,
            iconeClima: data.weather[0].icon,
            velocidadeVento: data.wind.speed
        };

        res.json(previsaoFormatada); // Envia os dados processados para o frontend
        console.log(`[BACKEND] Previsão para ${cidade} enviada com sucesso.`);

    } catch (error) {
        console.error(`[BACKEND] Erro interno no servidor ao processar previsão: ${error.message}`);
        res.status(500).json({ error: 'Erro interno ao processar a previsão do tempo.' });
    }
});


// =========================================================================
// ATIVIDADE 09 - O Arsenal de Dados do Backend: Criando e Consumindo Múltiplos Endpoints GET!
// =========================================================================

// --- Estoques de Dados (Arrays Mock - Simulando um Banco de Dados) ---
// Estes dados são definidos diretamente no código do servidor
const veiculosDestaque = [
    { id: 1, modelo: "Tesla Cybertruck", ano: 2024, destaque: "Design Futurista, Elétrico e Potente", imagemUrl: "https://hips.hearstapps.com/hmg-prod/images/tesla-cybertruck-release-date-us-6415aa02e6d19.jpeg?crop=0.8888888888888888xw:1xh;center,top&resize=1200:*" },
    { id: 2, modelo: "Ford Maverick Híbrida", ano: 2023, destaque: "Picape compacta, híbrida e versátil", imagemUrl: "https://image.webmotors.com.br/_fotos/upload/clipping/2023/11/08/maior-picapes-mais-economicas-2023-wm.webp?teste" },
    { id: 3, modelo: "Porsche Taycan", ano: 2022, destaque: "Esportivo elétrico de alta performance", imagemUrl: "https://hips.hearstapps.com/hmg-prod/images/15porsche-taycan-cross-turismo-front-top-studio-010-1678121345.jpg?crop=0.627xw:1xh;center,top&resize=1200:*" },
    { id: 4, modelo: "Honda Civic Type R", ano: 2024, destaque: "Carro esportivo de alto desempenho", imagemUrl: "https://cdn.motor1.com/images/mgl/Lp9P90/s3/2023-honda-civic-type-r-front-angle-track-uk-press-cars-1-2023.jpg" }
];

const servicosGaragem = [
    { id: "S01", nome: "Troca de Óleo e Filtro", descricao: "Uso de óleo sintético de alta qualidade e troca de filtro de óleo.", precoEstimado: "R$ 250,00" },
    { id: "S02", nome: "Balanceamento e Alinhamento", descricao: "Equilíbrio de rodas e ajuste da geometria da suspensão para sua segurança.", precoEstimado: "R$ 180,00" },
    { id: "S03", nome: "Revisão Geral do Sistema de Freios", descricao: "Verificação completa de pastilhas, discos, fluido e ajuste geral do sistema.", precoEstimado: "R$ 350,00" }
];

const ferramentasEssenciais = [
    { id: "F01", nome: "Jogo de Chaves Combinadas", utilidade: "Para parafusos e porcas de diferentes tamanhos, essencial para pequenos reparos.", categoria: "Manual" },
    { id: "F02", nome: "Macaco Hidráulico Automotivo", utilidade: "Para levantar veículos com segurança durante a troca de pneus ou manutenções.", categoria: "Elevação" },
    { id: "F03", nome: "Chave de Impacto Elétrica", utilidade: "Facilita a remoção e aperto rápido de porcas de roda e outros fixadores pesados.", categoria: "Elétrica" }
];

// --- Endpoints GET para os dados mock (Balcões de Atendimento para o Frontend) ---

// Rota 1: Obtém todos os veículos em destaque
app.get('/api/garagem/veiculos-destaque', (req, res) => {
    console.log(`[BACKEND] Requisição para /api/garagem/veiculos-destaque`);
    res.json(veiculosDestaque); // Retorna o array completo de veículos como JSON
});

// Rota 2: Obtém todos os serviços oferecidos pela garagem
app.get('/api/garagem/servicos-oferecidos', (req, res) => {
    console.log(`[BACKEND] Requisição para /api/garagem/servicos-oferecidos`);
    res.json(servicosGaragem); // Retorna o array completo de serviços como JSON
});

// Rota 3 (com parâmetro): Obtém UMA ferramenta específica por ID
// Exemplo de URL de requisição: /api/garagem/ferramentas-essenciais/F01
app.get('/api/garagem/ferramentas-essenciais/:idFerramenta', (req, res) => {
    const { idFerramenta } = req.params; // Captura o ID fornecido na URL (ex: 'F01')
    console.log(`[BACKEND] Requisição para /api/garagem/ferramentas-essenciais com ID: ${idFerramenta}`);
    
    // Procura a ferramenta no array `ferramentasEssenciais` que corresponde ao ID
    const ferramenta = ferramentasEssenciais.find(f => f.id === idFerramenta);
    
    if (ferramenta) {
        res.json(ferramenta); // Se encontrou, retorna o objeto da ferramenta como JSON
    } else {
        // Se não encontrou, envia uma resposta de erro 404 (Not Found)
        res.status(404).json({ error: 'Ferramenta não encontrada com o ID fornecido.' });
    }
});


// =========================================================================
// Rota Home: Apenas para verificar se o backend está rodando
// Esta rota é acessada pela URL base do seu backend (ex: http://localhost:3001)
app.get('/', (req, res) => {
    res.send('Servidor Garagem Inteligente Online! Para ver o frontend, abra seu arquivo index.html no navegador.');
});

// Inicializa o servidor Express, escutando na porta definida
app.listen(PORT, () => {
    console.log('[BACKEND] Servidor backend iniciando...');
    console.log(`[BACKEND] Servidor Express rodando na porta ${PORT}`);
    console.log(`[BACKEND] Para teste local, acesse: http://localhost:${PORT}`);
    console.log('[BACKEND] IMPORTANTE: Garanta que sua OPENWEATHER_API_KEY esteja configurada no arquivo .env');
});