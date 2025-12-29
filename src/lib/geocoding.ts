/**
 * Funções de geocodificação usando Nominatim (OpenStreetMap)
 * API gratuita, sem necessidade de chave
 */

interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
}

/**
 * Converte um CEP brasileiro em coordenadas
 */
export async function geocodeByCep(cep: string): Promise<GeocodingResult | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    // Primeiro, buscar endereço via ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const viaCepData = await viaCepResponse.json();
    
    if (viaCepData.erro) return null;

    // Depois, geocodificar o endereço via Nominatim
    const address = `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade}, ${viaCepData.uf}, Brasil`;
    
    return await geocodeByAddress(address);
  } catch (error) {
    console.error('Erro ao geocodificar CEP:', error);
    return null;
  }
}

/**
 * Converte um endereço em coordenadas
 */
export async function geocodeByAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=br&limit=1`,
      {
        headers: {
          'User-Agent': 'ConscienciaDivinal/1.0',
        },
      }
    );

    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
}

/**
 * Geocodifica por cidade e estado
 */
export async function geocodeByCityState(city: string, state: string): Promise<GeocodingResult | null> {
  return geocodeByAddress(`${city}, ${state}, Brasil`);
}

/**
 * Calcula a distância entre dois pontos em km (fórmula de Haversine)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Obtém a localização atual do usuário via GPS
 */
export function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos de cache
      }
    );
  });
}
