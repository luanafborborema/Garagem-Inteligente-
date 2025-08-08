// server.js

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import Veiculo from './models/Veiculo.js';

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

// ENDPOINT para criar um novo veículo (POST)
app.post('/api/veiculos', async (req, res) => {
    try {
        const novoVeiculoData = req.body;
        const veiculoCriado = await Veiculo.create(novoVeiculoData);
        
        console.log('[Servidor] Veículo criado com sucesso:', veiculoCriado);
        res.status(201).json(veiculoCriado);

    } catch (error) {
        console.error("[Servidor] Erro ao criar veículo:", error);
        if (error.code === 11000) { 
            return res.status(409).json({ error: 'Veículo com esta placa já existe.' });
        }
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        res.status(500).json({ error: 'Erro interno ao criar veículo.' });
    }
});

// ENDPOINT para ler todos os veículos (GET)
app.get('/api/veiculos', async (req, res) => {
    try {
        const todosOsVeiculos = await Veiculo.find();
        
        console.log('[Servidor] Buscando todos os veículos do DB.');
        res.json(todosOsVeiculos);

    } catch (error) {
        console.error("[Servidor] Erro ao buscar veículos:", error);
        res.status(500).json({ error: 'Erro interno ao buscar veículos.' });
    }
});

// ENDPOINT para atualizar um veículo por ID (PUT)
app.put('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizacao = req.body;

        const veiculoAtualizado = await Veiculo.findByIdAndUpdate(id, dadosAtualizacao, { new: true, runValidators: true });

        if (!veiculoAtualizado) {
            return res.status(404).json({ error: 'Veículo não encontrado para atualização.' });
        }
        
        console.log('[Servidor] Veículo atualizado com sucesso:', veiculoAtualizado);
        res.json(veiculoAtualizado);

    } catch (error) {
        console.error("[Servidor] Erro ao atualizar veículo:", error);
        if (error.code === 11000) { 
            return res.status(409).json({ error: 'Erro de duplicidade: Veículo com esta placa já existe.' });
        }
        if (error.name === 'ValidationError') { 
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ error: messages.join(' ') });
        }
        if (error.name === 'CastError' && error.path === '_id') {
            return res.status(400).json({ error: 'ID de veículo inválido.' });
        }
        res.status(500).json({ error: 'Erro interno ao atualizar veículo.' });
    }
});

// ENDPOINT para deletar um veículo por ID (DELETE)
app.delete('/api/veiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const veiculoDeletado = await Veiculo.findByIdAndDelete(id);

        if (!veiculoDeletado) {
            return res.status(404).json({ error: 'Veículo não encontrado para remoção.' });
        }
        
        console.log('[Servidor] Veículo removido com sucesso:', veiculoDeletado);
        res.status(200).json({ message: 'Veículo removido com sucesso.', veiculo: veiculoDeletado });

    } catch (error) {
        console.error("[Servidor] Erro ao deletar veículo:", error);
        if (error.name === 'CastError' && error.path === '_id') {
            return res.status(400).json({ error: 'ID de veículo inválido.' });
        }
        res.status(500).json({ error: 'Erro interno ao deletar veículo.' });
    }
});


// Rota exemplo da previsão do tempo (MANTIDA)
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

// Dados mock (MANTIDOS)
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

// Endpoints GET (MANTIDOS)

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

// Rota raiz para teste (MANTIDA)
app.get('/', (req, res) => {
  res.send('Servidor da Garagem Inteligente Online!');
});

// Iniciar servidor (MANTIDO)
app.listen(PORT, () => {
  console.log(`[BACKEND] Servidor rodando na porta ${PORT}`);
});