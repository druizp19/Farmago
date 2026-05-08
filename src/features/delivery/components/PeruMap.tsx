import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PeruMap.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';

interface LocationData {
  state: string;
  city: string;
  count: number;
  revenue: number;
  coordinates: [number, number] | null;
}

interface PeruMapProps {
  locationData: LocationData[];
  loading?: boolean;
}

// Normalize names for matching
function normalize(str: string): string {
  const normalized = str
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  
  // Consolidar variantes de Lima
  if (normalized === 'LIMA' || normalized === 'LIMA METROPOLITANA' || normalized === 'LIMA PROVINCIA') {
    return 'LIMA';
  }
  
  return normalized;
}

// Color scale
function getColor(count: number, max: number): string {
  if (max === 0 || count === 0) return '#f3f4f6';
  const ratio = count / max;
  if (ratio > 0.8) return '#4c1d95';
  if (ratio > 0.6) return '#6A5CBC';
  if (ratio > 0.4) return '#8A74E0';
  if (ratio > 0.2) return '#B3B7F2';
  return '#DDD8F8';
}

export function PeruMap({ locationData, loading }: PeruMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Aggregate data by department
  const departmentLookup = useMemo(() => {
    const map: Record<string, number> = {};
    locationData.forEach((loc) => {
      const state = normalize(loc.state || 'Desconocido');
      map[state] = (map[state] || 0) + loc.count;
    });
    return map;
  }, [locationData]);

  const maxCount = useMemo(() => {
    const counts = Object.values(departmentLookup);
    return Math.max(...counts, 1);
  }, [departmentLookup]);

  useEffect(() => {
    if (!mapContainerRef.current || loading) return;

    // Initialize map only once
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-9.19, -75.0152],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
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
      geojsonLayerRef.current = null;
    }

    // Load and render GeoJSON
    fetch(`${import.meta.env.BASE_URL}peru_departamental_simple.geojson`)
      .then(r => r.json())
      .then((geojson: any) => {
        // Check if map still exists
        if (!mapRef.current) return;
        
        const layer = L.geoJSON(geojson, {
          style: (feature) => {
            const deptName = feature?.properties?.NOMBDEP ?? '';
            const count = departmentLookup[normalize(deptName)] ?? 0;
            return {
              fillColor: getColor(count, maxCount),
              fillOpacity: count > 0 ? 0.85 : 0.25,
              color: '#ffffff',
              weight: 1.5,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            const deptName = feature?.properties?.NOMBDEP ?? 'Desconocido';
            const count = departmentLookup[normalize(deptName)] ?? 0;

            if (count > 0) {
              const originalStyle = {
                fillColor: getColor(count, maxCount),
                fillOpacity: 0.85,
                color: '#ffffff',
                weight: 1.5,
                opacity: 0.8,
              };

              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  l.setStyle({ weight: 3, color: '#1f2937', fillOpacity: 0.95 });
                  l.bringToFront();
                  l.bindTooltip(
                    `<div style="font-size:12px;font-weight:600;color:#1f2937">${deptName}</div>` +
                    `<div style="font-size:11px;color:#6b7280">${count} órdenes</div>`,
                    { sticky: true }
                  ).openTooltip();
                },
                mouseout: (e) => {
                  e.target.setStyle(originalStyle);
                  e.target.closeTooltip();
                },
              });
            }
          },
        });

        if (mapRef.current) {
          layer.addTo(map);
          geojsonLayerRef.current = layer;
        }
      })
      .catch(console.error);

    // Cleanup function
    return () => {
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.remove();
        geojsonLayerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, departmentLookup, maxCount]);

  // Update styles when data changes (only if layer exists)
  useEffect(() => {
    if (!geojsonLayerRef.current || !mapRef.current) return;
    
    try {
      geojsonLayerRef.current.setStyle((feature) => {
        const deptName = feature?.properties?.NOMBDEP ?? '';
        const count = departmentLookup[normalize(deptName)] ?? 0;
        return {
          fillColor: getColor(count, maxCount),
          fillOpacity: count > 0 ? 0.85 : 0.25,
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.8,
        };
      });
    } catch (error) {
      // Ignore errors if layer is being removed
      console.debug('Map style update skipped:', error);
    }
  }, [departmentLookup, maxCount]);

  // Top departments for sidebar
  const topDepartments = useMemo(() => {
    const deptData = new Map<string, { count: number; revenue: number }>();
    locationData.forEach((loc) => {
      const state = loc.state || 'Desconocido';
      // Consolidar Lima
      const normalizedState = state.toUpperCase() === 'LIMA' || 
                              state.toUpperCase() === 'LIMA METROPOLITANA' || 
                              state.toUpperCase() === 'LIMA PROVINCIA' 
                              ? 'Lima' 
                              : state;
      
      const existing = deptData.get(normalizedState) || { count: 0, revenue: 0 };
      deptData.set(normalizedState, {
        count: existing.count + loc.count,
        revenue: existing.revenue + loc.revenue,
      });
    });
    return Array.from(deptData.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);
  }, [locationData]);

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700">
          Distribución Geográfica
          {loading && <span className="ml-2 text-xs font-normal text-gray-400 animate-pulse">Cargando...</span>}
        </CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Mapa de calor de órdenes por departamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-96 text-gray-300 text-sm">
            <div className="animate-spin h-6 w-6 border-2 border-violet-400 border-t-transparent rounded-full" />
          </div>
        ) : locationData.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-gray-300 text-sm">
            Sin datos de ubicación
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Mapa */}
            <div className="lg:col-span-2">
              {/* Legend */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gray-400">Menos</span>
                {['#DDD8F8', '#B3B7F2', '#8A74E0', '#6A5CBC', '#4c1d95'].map(c => (
                  <div key={c} className="h-3 w-6 rounded-sm" style={{ backgroundColor: c }} />
                ))}
                <span className="text-[10px] text-gray-400">Más</span>
              </div>
              <div
                ref={mapContainerRef}
                className="w-full h-[350px] rounded-lg border border-gray-200 overflow-hidden"
              />
            </div>

            {/* Top departamentos */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-gray-700 mb-1.5">Top Departamentos</h4>
              {topDepartments.length > 0 ? (
                topDepartments.map(([dept, data], i) => {
                  const percentage = (data.count / (topDepartments[0]?.[1]?.count || 1)) * 100;
                  return (
                    <div key={dept} className="space-y-0.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-700 font-medium truncate flex-1">
                          {i + 1}. {dept}
                        </span>
                        <span className="text-gray-500 ml-2 text-[9px]">{data.count}</span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: getColor(data.count, maxCount),
                          }}
                        />
                      </div>
                      <div className="text-[8px] text-gray-400">
                        S/ {(data.revenue / 100).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400 text-center py-4">
                  Sin datos disponibles
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
