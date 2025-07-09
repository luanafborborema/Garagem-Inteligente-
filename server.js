// server.js

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const mongoUriCrud = process.env.MONGO_URI_CRUD;

async function connectCrudDB() {
  if (mongoose.connections[0].readyState) {
    console.log("✅ Mongoose já está conectado.");
    return;
  }

  if (!mongoUriCrud) {
    console.error("❌ ERRO: MONGO_URI_CRUD não está definida!");
    return;
  }

  try {
    await mongoose.connect(mongoUriCrud, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    console.log("🚀 Conectado ao MongoDB Atlas!");

    mongoose.connection.on('disconnected', () =>
      console.warn("⚠️ Mongoose foi desconectado!")
    );

    mongoose.connection.on('error', (err) =>
      console.error("❌ Erro de conexão Mongoose:", err)
    );

  } catch (err) {
    console.error("❌ Falha ao conectar ao MongoDB:", err.message);
  }
}

// Conecta no banco
connectCrudDB();

// Configura Express
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota exemplo da previsão do tempo
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

app.get('/api/previsao/:cidade', async (req, res) => {
  const { cidade } = req.params;

  if (!OPENWEATHER_API_KEY) {
    return res.status(500).json({ error: 'Chave de API do clima não configurada.' });
  }

  try {
    const urlOpenWeather = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;
    const responseOpenWeather = await fetch(urlOpenWeather);

    if (!responseOpenWeather.ok) {
      const errorData = await responseOpenWeather.json().catch(() => ({}));
      return res.status(responseOpenWeather.status).json({ error: errorData.message || 'Erro ao buscar dados do clima.' });
    }

    const data = await responseOpenWeather.json();

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

    res.json(previsaoFormatada);

  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor ao processar a previsão.' });
  }
});

// Dados mock
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

// Endpoints GET

app.get('/api/garagem/veiculos-destaque', (req, res) => {
  res.json(veiculosDestaque);
});

app.get('/api/garagem/servicos-oferecidos', (req, res) => {
  res.json(servicosGaragem);
});

app.get('/api/garagem/ferramentas-essenciais/:idFerramenta', (req, res) => {
  const { idFerramenta } = req.params;
  const ferramenta = ferramentasEssenciais.find(f => f.id === idFerramenta);
  if (ferramenta) {
    res.json(ferramenta);
  } else {
    res.status(404).json({ error: 'Ferramenta não encontrada com o ID fornecido.' });
  }
});

// Rota raiz para teste
app.get('/', (req, res) => {
  res.send('Servidor da Garagem Inteligente Online!');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[BACKEND] Servidor rodando na porta ${PORT}`);
});
