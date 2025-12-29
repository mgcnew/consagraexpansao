import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface House {
  id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  city: string | null;
  state: string | null;
  distance_km?: number;
}

interface HousesMapProps {
  houses: House[];
  userLocation?: { lat: number; lng: number } | null;
  onHouseClick?: (house: House) => void;
  className?: string;
}

export function HousesMap({ houses, userLocation, onHouseClick, className = '' }: HousesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Se já existe um mapa, destruir
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Centro padrão: Brasil
    const defaultCenter: [number, number] = [-15.7801, -47.9292];
    const defaultZoom = 4;

    // Criar mapa
    const map = L.map(mapRef.current).setView(
      userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter,
      userLocation ? 10 : defaultZoom
    );

    // Adicionar tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Marcador do usuário
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('Sua localização');
    }

    // Marcadores das casas
    const bounds: [number, number][] = [];
    
    houses.forEach((house) => {
      if (house.lat && house.lng) {
        const houseIcon = L.divIcon({
          className: 'house-marker',
          html: `<div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #7c3aed, #f59e0b);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
          ">🏠</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([house.lat, house.lng], { icon: houseIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 150px;">
              <strong>${house.name}</strong><br/>
              <span style="color: #666;">${house.city || ''}${house.state ? `, ${house.state}` : ''}</span>
              ${house.distance_km ? `<br/><span style="color: #7c3aed; font-weight: 500;">${house.distance_km.toFixed(1)} km</span>` : ''}
            </div>
          `);

        if (onHouseClick) {
          marker.on('click', () => onHouseClick(house));
        }

        bounds.push([house.lat, house.lng]);
      }
    });

    // Ajustar zoom para mostrar todos os marcadores
    if (bounds.length > 0) {
      if (userLocation) {
        bounds.push([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [houses, userLocation, onHouseClick]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full min-h-[300px] rounded-lg ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
