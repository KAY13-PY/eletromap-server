require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('@googlemaps/google-maps-services-js');
const Groq = require('groq-sdk');
const haversine = require('haversine'); // Deixamos ele aqui para a outra rota

const app = express();
const PORT = 3001;

// --- Configuração dos Clientes (sem mudança) ---
const googleMapsClient = new Client({});
const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
// ----------------------------------

app.use(cors());
app.use(express.json());


app.post('/api/search', async (req, res) => {
  try {

    const { query: userQuery, filters: userFilters } = req.body;
    
    console.log(`Servidor: Recebi a busca por: "${userQuery}"`);
    console.log(`Servidor: Com os filtros:`, userFilters);

    let filterText = "";
    if (userFilters && userFilters.length > 0) {
      filterText = `
        Por favor, OBRIGATORIAMENTE, inclua estes filtros na sua busca:
        - ${userFilters.join('\n- ')}
        
        Exemplos de como incluir os filtros:
        - "Abertos agora" significa que a busca deve incluir "aberto agora".
        - "Carregador Rápido (CCS)" significa que a busca deve incluir "carregador CCS" ou "recarga rápida".
      `;
    }

    const prompt = `
      Analise o pedido do usuário e transforme-o em um termo de busca ideal para a API do Google Maps.
      O pedido do usuário é: "${userQuery}"
      
      ${filterText} 
      
      Responda APENAS com um objeto JSON com duas chaves:
      1. "query": O termo de busca otimizado (ex: "estação de carregamento CCS com café aberto agora").
      2. "location": O local da busca (ex: "Campinas - SP"). Se o usuário não especificar, use "Campinas - SP" como padrão.
    `;

    console.log("Servidor: Perguntando à IA (Groq) com o novo prompt...");
    
    // CHAMA A IA
    const aiResult = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente que SÓ retorna código JSON. Sem "```json" ou explicações.'
        },
        {
          role: 'user',
          content: prompt, 
        },
      ],
      model: 'llama-3.1-8b-instant', 
      response_format: { type: 'json_object' },
    });

    const aiResponseText = aiResult.choices[0].message.content;
    console.log("Servidor: IA respondeu ->", aiResponseText);

    // 4. Converte a resposta
    const jsonResponse = JSON.parse(aiResponseText);
    
    const intelligentQuery = `${jsonResponse.query} em ${jsonResponse.location}`;
    console.log(`Servidor: IA traduziu para: "${intelligentQuery}"`);

    // 5. Busca no Google Maps
    console.log("Servidor: Buscando no Google Maps...");
    const mapsResponse = await googleMapsClient.textSearch({
      params: {
        query: intelligentQuery,
        key: mapsApiKey,
        language: 'pt-BR',
      },
      timeout: 5000,
    });

    // 6. Formata e envia
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
    console.error("Erro no servidor (/api/search):", error.message || error);
    res.status(500).json({ message: "Erro ao processar a busca" });
  }
});

// --- ROTA DE BUSCA NO TRAJETO ---
app.post('/api/search-along-route', async (req, res) => {
  try {
    const { origin, destination } = req.body;
    console.log("Servidor: Recebi pedido de busca no trajeto.");

    if (!origin || !destination) {
      return res.status(400).json({ message: "Origem e destino são obrigatórios." });
    }
    const haversineOrigin = { latitude: origin.lat, longitude: origin.lng };
    const haversineDestination = { latitude: destination.lat, longitude: destination.lng };
    const midpoint = {
      latitude: (origin.lat + destination.lat) / 2,
      longitude: (origin.lng + destination.lng) / 2,
    };
    const distanceInMeters = haversine(haversineOrigin, haversineDestination, { unit: 'meter' });
    const radius = Math.min(distanceInMeters / 2, 20000); 
    console.log(`Servidor: Buscando postos perto de ${JSON.stringify(midpoint)} com raio de ${Math.round(radius)}m`);

    const mapsResponse = await googleMapsClient.placesNearby({
      params: {
        location: midpoint,
        radius: radius,
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
    console.error("Erro no servidor (/api/search-along-route):", error.message || error);
    res.status(500).json({ message: "Erro ao processar a busca no trajeto" });
  }
});

// --- ROTA DE DETALHES DO LOCAL (shimas-) ---
app.post('/api/place-details', async (req, res) => {
  try {
    const { placeId } = req.body;
    console.log(`Servidor: Recebi pedido de detalhes para o Place ID: ${placeId}`);
    if (!placeId) {
      return res.status(400).json({ message: "Place ID é obrigatório." });
    }
    const response = await googleMapsClient.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'opening_hours', 'website'],
        key: mapsApiKey,
        language: 'pt-BR',
      },
      timeout: 5000,
    });
    res.json(response.data.result);
  } catch (error) {
    console.error("Erro no servidor (/api/place-details):", error.message || error);
    res.status(500).json({ message: "Erro ao processar a busca no local" });
  }
});

// --- Inicia o servidor ---
app.listen(PORT, () => {
  console.log(`Servidor backend (com GROQ + Filtros!) rodando na porta ${PORT}`);
});