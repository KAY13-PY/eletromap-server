require('dotenv').config(); // Carrega as variáveis do .env (nossa chave!)
const express = require('express');
const cors = require('cors');
const { Client } = require('@googlemaps/google-maps-services-js'); // Importa o cliente do Google

const app = express();
const PORT = 3001;

// Configura o cliente do Google com nossa chave secreta
const googleMapsClient = new Client({});

// Middlewares
app.use(cors());
app.use(express.json());

// --- NOSSA ROTA DE API "REAL" ---
app.get('/api/search', async (req, res) => {
  console.log("Servidor: Recebi uma chamada REAL em /api/search");

  // Parâmetros da busca
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Pega a chave do .env
  const query = 'postos de carregamento de veículos elétricos em Campinas'; // O que queremos buscar

  try {
    // 1. Faz a chamada REAL para a API do Google (Places API)
    const response = await googleMapsClient.textSearch({
      params: {
        query: query,
        key: apiKey,
        language: 'pt-BR', // Queremos resultados em português
      },
      timeout: 5000, // 5 segundos de limite
    });

    // 2. Filtra os resultados para enviar só o que o React precisa
    const stations = response.data.results.map(place => {
      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating, // Nota (ex: 4.5)
        user_ratings_total: place.user_ratings_total, // Qtd de avaliações
      };
    });

    // 3. Envia a lista de postos reais para o React
    res.json(stations);

  } catch (error) {
    console.error("Erro ao chamar a API do Google:", error.response?.data || error.message);
    res.status(500).json({ message: "Erro ao buscar dados do Google" });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});