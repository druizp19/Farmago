import { useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DistrictData {
  name: string;
  count: number;
}

interface DistrictMapProps {
  data: DistrictData[];
}

// Normalize district names for matching (uppercase, no accents)
function normalize(str: string): string {
  return str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Color scale from light to dark violet based on value
function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return '#f3f4f6';
  const ratio = count / max;
  if (ratio > 0.8) return '#4c1d95';
  if (ratio > 0.6) return '#6A5CBC';
  if (ratio > 0.4) return '#8A74E0';
  if (ratio > 0.2) return '#B3B7F2';
  return '#DDD8F8';
}

export function DistrictMap({ data }: DistrictMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Build lookup map: normalized district name -> count
  const districtLookup = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      map[normalize(d.name)] = d.count;
    });
    return map;
  }, [data]);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [-12.05, -77.0],
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      });

      // Light tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Remove previous GeoJSON layer
    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
    }

    // Load and render GeoJSON
    fetch('/peru_distrital_simple.geojson')
      .then(r => r.json())
      .then((geojson: any) => {
        const layer = L.geoJSON(geojson, {
          style: (feature) => {
            const distName = feature?.properties?.NOMBDIST ?? '';
            const count = districtLookup[normalize(distName)] ?? 0;
            return {
              fillColor: getColor(count, maxCount),
              fillOpacity: count > 0 ? 0.85 : 0.25,
              color: '#ffffff',
              weight: 1,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            const distName = feature?.properties?.NOMBDIST ?? 'Desconocido';
            const count = districtLookup[normalize(distName)] ?? 0;

            // Solo agregar interactividad si hay órdenes
            if (count > 0) {
              const originalStyle = {
                fillColor: getColor(count, maxCount),
                fillOpacity: 0.85,
                color: '#ffffff',
                weight: 1,
                opacity: 0.8,
              };

              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  l.setStyle({ weight: 2.5, color: '#1f2937', fillOpacity: 0.95 });
                  l.bringToFront();
                  l.bindTooltip(
                    `<div style="font-size:12px;font-weight:600;color:#1f2937">${distName}</div>` +
                    `<div style="font-size:11px;color:#6b7280">${count} órdenes</div>`,
                    { sticky: true, className: 'district-tooltip' }
                  ).openTooltip();
                },
                mouseout: (e) => {
                  e.target.setStyle(originalStyle);
                  e.target.closeTooltip();
                },
                click: (e) => {
                  map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
                },
              });
            }
          },
        });

        layer.addTo(map);
        geojsonLayerRef.current = layer;
      })
      .catch(console.error);

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update styles when data changes without re-creating the map
  useEffect(() => {
    if (!geojsonLayerRef.current) return;
    geojsonLayerRef.current.setStyle((feature) => {
      const distName = feature?.properties?.NOMBDIST ?? '';
      const count = districtLookup[normalize(distName)] ?? 0;
      return {
        fillColor: getColor(count, maxCount),
        fillOpacity: count > 0 ? 0.85 : 0.25,
        color: '#ffffff',
        weight: 1,
        opacity: 0.8,
      };
    });
  }, [districtLookup, maxCount]);

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          Top Distritos con Más Deliveries
        </CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Mapa interactivo — hover para ver detalle, click para hacer zoom
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        {/* Legend */}
        <div className="flex items-center gap-2 mb-2 px-2">
          <span className="text-[10px] text-gray-400">Menos</span>
          {['#DDD8F8', '#B3B7F2', '#8A74E0', '#6A5CBC', '#4c1d95'].map(c => (
            <div key={c} className="h-3 w-6 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-gray-400">Más</span>
        </div>
        <div ref={containerRef} style={{ height: 420, borderRadius: 8, overflow: 'hidden' }} />
      </CardContent>
    </Card>
  );
}
