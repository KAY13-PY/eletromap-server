import { 
  useState, 
  useEffect,
  useCallback,
  useRef 
} from 'react';
import axios from 'axios';
import './App.css';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary 
} from '@vis.gl/react-google-maps';

function App() {
  const [postos, setPostos] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null); 
  const [placeDetails, setPlaceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [userLocation, setUserLocation] = useState(null); 
  const [directionsResult, setDirectionsResult] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]); 
  const [loadingRouteStations, setLoadingRouteStations] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const watchIdRef = useRef(null); 

  // --- 1. NOVOS ESTADOS PARA OS FILTROS ---
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterFastCharge, setFilterFastCharge] = useState(false);
  // ----------------------------------------

  // COLE SUA CHAVE DO GOOGLE MAPS AQUI
  const REACT_APP_GOOGLE_MAPS_KEY = "AIzaSyBHGet7x2C3tfKz-pF6QG_Z9BEfKKVZ2uQ";

  const initialPosition = { lat: -22.9056, lng: -47.0608 };
  const [mapCenter, setMapCenter] = useState(initialPosition);

  // --- Funções de Limpeza e "Seguir" (sem mudança) ---
  const clearPlaceDetails = () => {
    setSelectedPlace(null);
    setPlaceDetails(null);
    setDetailsLoading(false);
  };
  const stopFollowing = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsFollowing(false);
  }, []); 
  const handleClearRoute = () => {
    stopFollowing(); 
    setDirectionsResult(null);
    setNearbyStations([]);
    setLoadingRouteStations(false);
    clearPlaceDetails();
  };

  // --- 3. ATUALIZADO: handleSearch (agora envia os filtros) shimas ---
  const handleSearch = async (event) => {
    event.preventDefault();
    stopFollowing(); 
    handleClearRoute();
    clearPlaceDetails();
    if (!searchTerm) return;
    setLoading(true);

    // 3a. Pega os filtros ativos
    const activeFilters = [];
    if (filterOpenNow) activeFilters.push("Abertos agora");
    if (filterFastCharge) activeFilters.push("Carregador Rápido (CCS)");

    try {
      // 3b. Envia o 'query' E os 'filters' para o backend
      const response = await axios.post('http://localhost:3001/api/search', {
        query: searchTerm,
        filters: activeFilters 
      });
      
      setPostos(response.data);
      if (response.data.length > 0) {
        setMapCenter(response.data[0].location);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do backend:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- toggleFollowMode (milleni) ---
  const toggleFollowMode = () => {
    if (isFollowing) {
      stopFollowing();
    } else {
      if (navigator.geolocation) {
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
            setUserLocation(newLoc);
            setMapCenter(newLoc);
          },
          (error) => {
            console.error("Erro no watchPosition:", error);
            alert('Não foi possível seguir sua localização.');
            stopFollowing();
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
        );
        setIsFollowing(true); 
      } else {
        alert('Seu navegador não suporta geolocalização.');
      }
    }
  };

  // --- handleTraceRoute () ---
  const handleTraceRoute = (postoDestino) => {
    if (!userLocation) {
      alert('Por favor, clique no ícone de localização 🎯 no mapa primeiro!');
      return;
    }
    if (!postoDestino) return;
    
    stopFollowing(); 
    clearPlaceDetails();
    setDirectionsResult(null);
    setNearbyStations([]);
    setLoadingRouteStations(true);
    setDirectionsResult({
      origin: userLocation,
      destination: postoDestino.location,
      travelMode: 'DRIVING',
    });
    axios.post('http://localhost:3001/api/search-along-route', {
      origin: userLocation,
      destination: postoDestino.location,
    })
    .then(response => { setNearbyStations(response.data); })
    .catch(error => { console.error("Erro ao buscar postos no trajeto:", error); })
    .finally(() => { setLoadingRouteStations(false); });
  };

  // --- handleMarkerClick (kayke) ---
  const handleMarkerClick = (posto) => {
    stopFollowing(); 
    setMapCenter(posto.location);
    setSelectedPlace(posto);
    setPlaceDetails(null);
    setDetailsLoading(true);
    axios.post('http://localhost:3001/api/place-details', {
      placeId: posto.id
    })
    .then(response => { setPlaceDetails(response.data); })
    .catch(error => { console.error("Erro ao buscar detalhes:", error); })
    .finally(() => { setDetailsLoading(false); });
  };

  return (
    <APIProvider apiKey={REACT_APP_GOOGLE_MAPS_KEY}>
      <div className="App">

        {/* 1. O MAPA (sem mudança) */}
        <div className="map-container">
          <Map
            zoom={13}
            center={mapCenter}
            mapId="eletromap_style_modern"
            disableDefaultUI={true}
            gestureHandling={'greedy'}
            onClick={clearPlaceDetails}
          >
            {/* ... (Pinos, Rotas, InfoWindow, etc - sem mudança) ... */}
            {postos.map(posto => ( <AdvancedMarker key={posto.id} position={posto.location} onClick={() => handleMarkerClick(posto)}> <Pin background={selectedPlace?.id === posto.id ? '#1a73e8' : '#EA4335'} borderColor={'#000'} glyphColor={'#fff'} /> </AdvancedMarker> ))}
            {userLocation && ( <AdvancedMarker position={userLocation} title={"Sua Localização"}> <Pin background={'#00D8A3'} glyphColor={'#000'} /> </AdvancedMarker> )}
            {directionsResult && ( <DirectionsRendererComponent request={directionsResult} /> )}
            {nearbyStations.map(station => ( <AdvancedMarker key={station.id} position={station.location} title={station.name} onClick={() => handleMarkerClick(station)} > <Pin background={selectedPlace?.id === station.id ? '#1a73e8' : '#9333EA'} /> </AdvancedMarker> ))}
            {selectedPlace && (
              <InfoWindow position={selectedPlace.location} pixelOffset={[0, -40]} onCloseClick={clearPlaceDetails}>
                <div style={{ padding: '5px 10px', maxWidth: '250px' }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{selectedPlace.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.9em' }}>{selectedPlace.address}</p>
                  {detailsLoading && <p style={{ margin: '10px 0', fontSize: '0.9em', color: '#666' }}>Carregando detalhes...</p>}
                  {placeDetails && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                      {placeDetails.opening_hours ? (
                        <p style={{ margin: '5px 0', fontSize: '0.9em', color: placeDetails.opening_hours.open_now ? '#34A853' : '#EA4335' }}>
                          <strong>{placeDetails.opening_hours.open_now ? 'Aberto agora' : 'Fechado agora'}</strong>
                        </p>
                      ) : ( <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#666' }}>Horário indisponível</p> )}
                      {placeDetails.formatted_phone_number && (
                        <p style={{ margin: '5px 0', fontSize: '0.9em' }}> 📞 {placeDetails.formatted_phone_number} </p>
                      )}
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
            <MapFollowController isFollowing={isFollowing} mapCenter={mapCenter} onDragStart={() => setIsFollowing(false)} />
          </Map>
          
          <button 
            onClick={toggleFollowMode}
            className={`map-location-button ${isFollowing ? 'active' : ''}`}
            title={isFollowing ? "Parar de seguir" : "Seguir minha localização"}
          >
            🎯
          </button>
        </div>

        {/* 2. O CONTAINER DA BUSCA (AGORA COM FILTROS) */}
        <div className="search-container">
          <h1>EletroMap ⚡</h1>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Carregador rápido perto do shopping"
            />
            <button type="submit" disabled={loading}>
              {loading ? "..." : "Buscar"}
            </button>
          </form>

          {/* --- 2. OS NOVOS FILTROS (CHECKBOXES) --- */}
          <div className="filters-container">
            <label>
              <input 
                type="checkbox"
                checked={filterOpenNow}
                onChange={(e) => setFilterOpenNow(e.target.checked)}
              />
              Abertos agora
            </label>
            <label>
              <input 
                type="checkbox"
                checked={filterFastCharge}
                onChange={(e) => setFilterFastCharge(e.target.checked)}
              />
              Carregador Rápido (CCS)
            </label>
          </div>
          {/* ------------------------------------- */}
          
        </div>

        {/* 3. LISTA DE RESULTADOS (sem mudanças) */}
        <div className="results-list">
          {/* ... (Todo o JSX da lista continua igual) ... */}
          {directionsResult ? (
            <>
              <button onClick={handleClearRoute} className="clear-route-button"> &larr; Limpar Rota e Voltar </button>
              <h2>Postos no Trajeto</h2>
              {loadingRouteStations && <p>Buscando postos...</p>}
              {!loadingRouteStations && nearbyStations.length === 0 && ( <p>Nenhum posto elétrico encontrado perto do seu trajeto.</p> )}
              <ul>
                {nearbyStations.map(posto => (
                  <li key={posto.id} onClick={() => handleMarkerClick(posto)}>
                    <strong>{posto.name}</strong>
                    <p>{posto.address}</p>
                    <p style={{ color: '#666', fontSize: '0.8em', paddingTop: '5px' }}>
                      Nota: {posto.rating} ({posto.user_ratings_total} avaliações)
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              {loading && <p style={{ textAlign: 'center' }}>Buscando...</p>}
              {!loading && postos.length === 0 && ( <p>Nenhum resultado. Digite o que você procura.</p> )}
              {!loading && postos.length > 0 && <h2>Resultados</h2>}
              <ul>
                {postos.map(posto => (
                  <li key={posto.id} onClick={() => handleMarkerClick(posto)}>
                    <strong>{posto.name}</strong>
                    <p>{posto.address}</p>
                    <p style={{ color: '#666', fontSize: '0.8em', paddingTop: '5px' }}>
                      Nota: {posto.rating} ({posto.user_ratings_total} avaliações)
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleTraceRoute(posto); }}
                      className="route-button"
                    >
                      Traçar Rota e Achar Postos
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </APIProvider>
  );
}

// O COMPONENTE QUE DESENHA A ROTA (igual a antes)
function DirectionsRendererComponent({ request }) {
  const map = useMap(); 
  const routesLibrary = useMapsLibrary('routes'); 
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
    return () => {
      if (directionsRenderer) directionsRenderer.setMap(null);
    };
  }, [routesLibrary, map]);
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !request) return;
    directionsService.route(
      {
        origin: new google.maps.LatLng(request.origin.lat, request.origin.lng),
        destination: new google.maps.LatLng(request.destination.lat, request.destination.lng),
        travelMode: request.travelMode,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result); 
        } else {
          console.error(`Erro ao buscar rota: ${status}`);
        }
      }
    );
  }, [directionsService, directionsRenderer, request]);
  return null; 
}

// O CONTROLE DO MAPA (igual a antes)
function MapFollowController({ isFollowing, mapCenter, onDragStart }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onDragStart) return;
    const listener = map.addListener('dragstart', onDragStart);
    return () => listener.remove();
  }, [map, onDragStart]);
  useEffect(() => {
    if (map && isFollowing && mapCenter) {
      map.panTo(mapCenter);
    }
  }, [map, isFollowing, mapCenter]);
  return null; 
}

export default App;