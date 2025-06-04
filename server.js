// backend/server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

app.use(cors());
app.use(express.json());

// Rota para /api/previsao/:cidade
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;

    // Log para ver o que estamos recebendo
    console.log(`[Backend] Parâmetro cidade recebido: '${cidade}'`); // Adicione este log

    if (!cidade || cidade.trim() === '') { // Adicionamos .trim() === '' para pegar strings vazias também
        console.log("[Backend] Erro: Nome da cidade está vazio ou ausente."); // Adicione este log
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    // ... (resto do código da rota continua igual) ...

    if (!OPENWEATHER_API_KEY) {
        console.error("ERRO GRAVE: Chave da API OpenWeatherMap não está configurada no servidor backend.");
        return res.status(500).json({ error: 'Erro interno no servidor: Configuração da API Key ausente.' });
    }

    const openWeatherMapApiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    try {
        console.log(`[Backend] Recebida requisição para cidade (após validação): ${cidade}`);
        console.log(`[Backend] Chamando URL da OpenWeatherMap: ${openWeatherMapApiUrl.replace(OPENWEATHER_API_KEY, "SUA_CHAVE_ESCONDIDA")}`);

        const apiResponse = await axios.get(openWeatherMapApiUrl);
        
        console.log(`[Backend] Resposta da OpenWeatherMap recebida com status: ${apiResponse.status}`);
        res.json(apiResponse.data);

    } catch (error) {
        // ... (bloco catch continua igual) ...
        console.error("[Backend] Erro ao buscar dados da OpenWeatherMap:", error.message);
        if (error.response) {
            console.error("[Backend] Erro - Dados da resposta da API:", error.response.data);
            console.error("[Backend] Erro - Status da resposta da API:", error.response.status);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error("[Backend] Erro - Nenhuma resposta da API:", error.request);
            res.status(502).json({ error: 'Serviço da OpenWeatherMap indisponível ou não respondeu (Bad Gateway).' });
        } else {
            console.error('[Backend] Erro ao configurar a requisição para OpenWeatherMap:', error.message);
            res.status(500).json({ error: 'Erro interno ao processar a sua requisição de previsão.' });
        }
    }
});

// Rota de fallback para tratar /api/previsao/ sem parâmetro de cidade
// Esta rota precisa vir DEPOIS da rota mais específica /api/previsao/:cidade
app.get('/api/previsao/', (req, res) => {
    console.log("[Backend] Requisição recebida para /api/previsao/ sem parâmetro de cidade.");
    return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
});


app.listen(PORT, () => {
    console.log(`Servidor backend (proxy OpenWeatherMap) rodando em http://localhost:${PORT}`);
    if (!OPENWEATHER_API_KEY) {
        console.warn("ALERTA NO BACKEND: A variável de ambiente OPENWEATHER_API_KEY não foi definida! O endpoint de previsão falhará.");
    } else {
        console.log("[Backend] Chave da API OpenWeatherMap carregada com sucesso.");
    }
});