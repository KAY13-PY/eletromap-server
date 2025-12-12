require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@googlemaps/google-maps-services-js');
const Groq = require('groq-sdk');
const haversine = require('haversine');

const app = express();
const PORT = 3001;

// --- 1. MEMÓRIA DOS FAVORITOS (In-Memory Database) ---
let favoritos = []; 
// -----------------------------------------------------

const googleMapsClient = new Client({});
// Assegure-se de que o seu arquivo .env tem estas chaves
const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

// --- 2. ROTA DE BUSCA INTELIGENTE (IA + Google) ---
app.post('/api/search', async (req, res) => {
  try {
    const { query: userQuery, filters: userFilters } = req.body;
    console.log(`🔎 Buscando por: "${userQuery}"`);

    // Prepara o texto dos filtros para a IA
    let filterText = "";
    if (userFilters && userFilters.length > 0) {
      filterText = `Obrigatoriamente inclua estes filtros técnicos na busca: ${userFilters.join(', ')}.`;
    }

    // Prompt para a IA (Groq)
    const prompt = `
      Você é um assistente de mapas. O usuário quer buscar: "${userQuery}".
      ${filterText}
      Converta isso para um termo de busca otimizado para o Google Maps Places API.
      Responda APENAS um objeto JSON neste formato exato:
      {"query": "termo otimizado", "location": "Campinas - SP"}
      Se o usuário não disser o local, use "Campinas - SP".
    `;
    
    const aiResult = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
    });

    const jsonResponse = JSON.parse(aiResult.choices[0].message.content);
    const intelligentQuery = `${jsonResponse.query} em ${jsonResponse.location}`;
    console.log(`🤖 IA traduziu para: "${intelligentQuery}"`);

    // Busca Textual no Google Maps
    const mapsResponse = await googleMapsClient.textSearch({
      params: {
        query: intelligentQuery,
        key: mapsApiKey,
        language: 'pt-BR',
      },
      timeout: 5000,
    });

    // Formata os resultados para o Frontend
    const stations = mapsResponse.data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      location: place.geometry.location,
    }));

    res.json(stations);

  } catch (error) {
    console.error("Erro na busca:", error.message);
    res.status(500).json({ message: "Erro ao processar a busca" });
  }
});

// --- 3. ROTA DE BUSCA NO TRAJETO ---
app.post('/api/search-along-route', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) {
      return res.status(400).json({ message: "Origem e destino são obrigatórios." });
    }

    // Calcula o ponto médio da viagem
    const midpoint = {
      latitude: (origin.lat + destination.lat) / 2,
      longitude: (origin.lng + destination.lng) / 2,
    };
    
    // Busca postos num raio de 20km do ponto médio
    const mapsResponse = await googleMapsClient.placesNearby({
      params: {
        location: midpoint,
        radius: 20000, // 20km
        keyword: 'posto de carregamento elétrico', 
        key: mapsApiKey,
      },
      timeout: 5000,
    });

    const stations = mapsResponse.data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity, 
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      location: place.geometry.location,
    }));

    res.json(stations);
  } catch (error) {
    console.error("Erro no trajeto:", error.message);
    res.status(500).json({ message: "Erro ao buscar no trajeto" });
  }
});

// --- 4. ROTA DE DETALHES (Pop-up) ---
app.post('/api/place-details', async (req, res) => {
  try {
    const { placeId } = req.body;
    if (!placeId) return res.status(400).json({ message: "ID do local necessário" });

    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'opening_hours'],
        key: mapsApiKey,
        language: 'pt-BR',
      },
      timeout: 5000,
    });
    res.json(response.data.result);
  } catch (error) {
    console.error("Erro nos detalhes:", error.message);
    res.status(500).json({ message: "Erro ao buscar detalhes" });
  }
}); 
//  5. ROTAS DE FAVORITOS (CRUD) ---

// [R] Read (Ler)
app.get('/api/favorites', (req, res) => {
  res.json(favoritos);
});

// Create (Criar/Salvar)
app.post('/api/favorites', (req, res) => {
  const posto = req.body;
  // Verifica se já existe para não duplicar
  const existe = favoritos.find(fav => fav.id === posto.id);
  
  if (!existe) {
    favoritos.push(posto);
    console.log(`⭐ Favorito salvo: ${posto.name}`);
  }
  res.json(favoritos);
});

// [D] Delete (Apagar)
app.delete('/api/favorites/:id', (req, res) => {
  const { id } = req.params;
  favoritos = favoritos.filter(posto => posto.id !== id);
  console.log(`🗑️ Favorito removido ID: ${id}`);
  res.json(favoritos);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor (Nível 9 Completo) rodando na porta ${PORT}`);
});