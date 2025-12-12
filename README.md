# EletroMap - Localizador Inteligente de Postos de Recarga

O **EletroMap** é uma aplicação Full-Stack desenvolvida para facilitar a vida de motoristas de veículos elétricos. Utilizando Inteligência Artificial e Geolocalização, o sistema permite encontrar postos de recarga, traçar rotas estratégicas e gerenciar uma lista de locais favoritos em tempo real.

![Status do Projeto](https://img.shields.io/badge/Status-Concluído-green) ![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue) ![Node](https://img.shields.io/badge/Backend-Node.js-green)

---
## APIs e Serviços Externos

O projeto integra serviços de terceiros para garantir dados precisos e inteligência:

### 1. Google Maps Platform
Utilizamos três APIs principais do Google:
* **Maps JavaScript API:** Para renderização do mapa interativo e marcadores.
* **Places API:** Para busca de locais (Text Search, Nearby Search) e detalhes (Place Details).
* **Directions API:** Para cálculo de rotas e desenho do trajeto (polilinha) no mapa.

### 2. Groq Cloud (Inteligência Artificial)
* **Modelo:** Llama 3 (`llama-3.1-8b-instant`).
* **Função:** Atua como um interpretador de linguagem natural. Recebe o texto do usuário (ex: "quero café") e os filtros selecionados, convertendo-os em parâmetros técnicos otimizados para a busca no Google Maps.











## Funcionalidades Principais

* **Busca Inteligente (IA):** Integração com a **Groq AI (Llama 3)** para interpretar buscas em linguagem natural (ex: "posto com carregador rápido perto do shopping").
* **Busca no Trajeto:** Calcula automaticamente postos de recarga situados ao longo do caminho entre o usuário e o destino (usando algoritmo de Haversine).
* **Gestão de Favoritos (CRUD):** Permite salvar, visualizar e remover postos preferidos. Os dados persistem na memória do servidor.
* **Detalhes em Tempo Real:** Exibe informações atualizadas do Google Maps, como horário de funcionamento ("Aberto agora") e telefone.
* **Interface Responsiva:** Layout moderno que se adapta a computadores e dispositivos móveis (painel lateral vira "gaveta" no celular).

##  Requisitos do Sistema

Abaixo estão listados os requisitos funcionais e não funcionais que guiaram o desenvolvimento do EletroMap.

### 1. Requisitos Funcionais (RF)
*O que o sistema é capaz de fazer:*

* **RF-01 (Busca Inteligente):** O sistema utiliza Inteligência Artificial (Groq) para interpretar buscas em linguagem natural (ex: *"posto perto do shopping"*).
* **RF-02 (Filtros):** O usuário pode filtrar resultados por critérios técnicos, como *"Abertos agora"* e *"Carregador Rápido (CCS)"*.
* **RF-03 (Visualização no Mapa):** Exibir os resultados como pinos interativos no Google Maps.
* **RF-04 (Geolocalização):** Obter a posição atual do usuário para centralizar o mapa e traçar rotas.
* **RF-05 (Rotas e Navegação):** Traçar o caminho entre a posição do usuário e um destino selecionado.
* **RF-06 (Busca no Trajeto):** Identificar automaticamente postos de recarga situados ao longo da rota traçada (raio de 20km do ponto médio).
* **RF-07 (Detalhes do Local):** Exibir informações detalhadas (horário em tempo real, telefone) ao clicar num posto.
* **RF-08 (Gestão de Favoritos - CRUD):**
    * **C**riar: Salvar um posto na lista de favoritos.
    * **L**er: Visualizar a lista de postos salvos.
    * **E**xcluir: Remover um posto da lista.

### 2. Requisitos Não Funcionais (RNF)
*Critérios de qualidade e restrições técnicas:*

* **RNF-01 (Segurança):** As chaves de API (Google e Groq) são armazenadas exclusivamente no Backend (arquivo `.env`) e nunca expostas ao cliente.
* **RNF-02 (Desempenho - SPA):** A aplicação opera como uma Single Page Application (React + Vite), garantindo navegação fluida sem recarregamentos.
* **RNF-03 (Otimização de API):** O Backend utiliza *Field Masking* nas requisições ao Google Maps, solicitando apenas os dados estritamente necessários para economizar banda e custos.
* **RNF-04 (Usabilidade & Responsividade):** A interface adapta-se automaticamente a diferentes tamanhos de tela (Desktop e Mobile) e fornece feedback visual (loading) durante o processamento.
* **RNF-05 (Tratamento de Erros):** O sistema trata falhas de comunicação com as APIs externas de forma graciosa, informando o usuário sem quebrar a aplicação.

## Endpoints da API (Backend)

O sistema possui uma API RESTful própria (http://localhost:3001) que serve o Frontend:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| **POST** | `/api/search` | Recebe texto (ex: "posto com café") e filtros, processa com IA e retorna locais do Google. |
| **POST** | `/api/search-along-route` | Recebe origem/destino, calcula o ponto médio e busca postos no raio da rota. |
| **POST** | `/api/place-details` | Busca detalhes específicos (telefone, horário) de um local pelo `place_id`. |
| **GET** | `/api/favorites` | Retorna a lista de postos favoritos salvos na memória. |
| **POST** | `/api/favorites` | Salva um novo posto nos favoritos (Create). |
| **DELETE** | `/api/favorites/:id` | Remove um posto dos favoritos pelo ID (Delete). |

---

## Tecnologias Utilizadas

### Frontend (Cliente)
* **React.js** com **Vite** (Performance e componentização).
* **@vis.gl/react-google-maps** (Mapas interativos e marcadores avançados).
* **Axios** (Comunicação HTTP com o Backend).
* **CSS3** (Estilização responsiva e layouts flutuantes).

### Backend (Servidor)
* **Node.js** & **Express** (API RESTful).
* **Groq SDK** (Inteligência Artificial Generativa).
* **Google Maps Services** (Places API, Directions API).
* **Haversine** (Cálculos de geometria espacial).
* **Dotenv** (Segurança de variáveis de ambiente).

---

## Pré-requisitos

Antes de começar, você precisa ter instalado:
* [Node.js](https://nodejs.org/) (Versão 18 ou superior).
* Uma chave de API do **Google Maps** (com Maps JS API, Places API e Directions API ativados).
* Uma chave de API da **Groq Cloud**.

---

## Como Rodar o Projeto

Siga os passos abaixo para configurar e executar o sistema localmente.

### 1. Configurando o Backend (Servidor)

Abra o terminal e entre na pasta do servidor:

bash
cd eletromap-server


Instale as dependências:
npm install


Crie um arquivo chamado .env dentro da pasta eletromap-server e adicione as suas chaves:

# Arquivo: .env
GOOGLE_MAPS_API_KEY=Sua_Chave_Google_Aqui_AIza...
GROQ_API_KEY=Sua_Chave_Groq_Aqui_gsk...


Inicie o servidor:

node index.js


2. Configurando o Frontend (Interface)

Abra um novo terminal (não feche o do servidor) e entre na pasta do cliente:


cd eletromap-client

Configuração da Chave: Abra o arquivo src/App.jsx e verifique a linha da chave de API:
const REACT_APP_GOOGLE_MAPS_KEY = "SUA_CHAVE_GOOGLE_AQUI";

Inicie a aplicação:
npm run dev

O sistema estará acessível em: http://localhost:5173



Como Usar o Sistema

    Localização: Clique no botão Alvo para o mapa centrar onde você está.

    Busca: Digite "Shopping" ou "Posto rápido" e clique em Buscar. A IA entenderá o pedido.

    Detalhes: Clique num pino vermelho para ver se o local está "Aberto agora".

    Favoritar: No pop-up, clique na Estrela para salvar. Veja a lista no botão "Ver Meus Favoritos".

    Rotas: Selecione um posto e clique em "Traçar Rota" para ver o caminho e postos próximos (pinos roxos).

Estrutura de Pastas

eletromap/
├── eletromap-server/       # Backend (Node.js)
│   ├── index.js            # Lógica principal, Rotas e IA
│   ├── .env                # Arquivo de senhas (não compartilhar!)
│   └── package.json        # Dependências do servidor
│
└── eletromap-client/       # Frontend (React)
    ├── src/
    │   ├── App.jsx         # Componente principal e Mapa
    │   ├── App.css         # Estilos e responsividade
    │   └── main.jsx        # Ponto de entrada do React
    └── package.json        # Dependências do cliente



    Autor:kayke silva, Milleni lima, Gabriel shimamoto
