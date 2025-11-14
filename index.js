require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001; // Vamos usar uma porta diferente do React

// Middlewares
app.use(cors()); // Permite que o React chame esta API
app.use(express.json()); // Permite que o servidor entenda JSON

// --- NOSSA ROTA DE API "FALSA" ---
// O React vai chamar este endpoint
app.get('/api/search', (req, res) => {
  console.log("Servidor: Recebi uma chamada em /api/search");

  // Por enquanto, vamos retornar dados "falsos" (mock data)
  const fakeChargingStations = [
    { 
      id: '1', 
      name: 'Posto Shell (Recarga Rápida)', 
      address: 'Av. Brasil, 1000, Campinas - SP' 
    },
    { 
      id: '2', 
      name: 'Estacionamento Shopping Iguatemi (Tipo 2)', 
      address: 'Av. Iguatemi, 777, Campinas - SP'
    },
    { 
      id: '3', 
      name: 'Carrefour Dom Pedro (Lento)', 
      address: 'Rod. Dom Pedro I, s/n, Campinas - SP' 
    }
  ];

  // Envia os dados falsos como resposta
  res.json(fakeChargingStations);
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
  console.log('Acesse http://localhost:3001/api/search no seu navegador para testar.');
});