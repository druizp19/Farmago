import { useState, useMemo, useEffect, memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { ChevronLeft } from 'lucide-react';
import type { CategoryStat } from '../../../types/orders';

const COLORS = ['#6A5CBC', '#8A74E0', '#9E88FD', '#B3B7F2', '#C4BEE4', '#D3E0E0', '#BFCED6', '#3F4554'];

interface CategoryChartsProps {
  categoryStats: CategoryStat[];
  loading?: boolean;
  categoryFilter?: string | null;
}

interface CategoryNode {
  name: string;
  fullPath: string;
  level: number;
  stats: {
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  };
  children: CategoryNode[];
}

// ── Category Sales Chart (con drill-down) ────────────────────────────────────
export const CategorySalesChartImproved = memo(({ categoryStats, loading, categoryFilter }: CategoryChartsProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  // Reset selectedPath cuando cambia el filtro
  useEffect(() => {
    setSelectedPath(null);
  }, [categoryFilter]);
  
  // Si hay un filtro de categoría activo, usarlo como base
  const effectivePath = selectedPath || categoryFilter;

  // Construir árbol de categorías
  const categoryTree = useMemo(() => {
    const nodeMap = new Map<string, CategoryNode>();

    // Primero crear todos los nodos
    categoryStats.forEach(stat => {
      const parts = stat.category.split(' > ').map(p => p.trim());
      
      for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join(' > ');
        
        if (!nodeMap.has(currentPath)) {
          const node: CategoryNode = {
            name: parts[i],
            fullPath: currentPath,
            level: i,
            children: [],
            stats: {
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            },
          };
          nodeMap.set(currentPath, node);
        }
      }
    });

    // Luego acumular stats desde las hojas hacia arriba
    categoryStats.forEach(stat => {
      const parts = stat.category.split(' > ').map(p => p.trim());
      
      // Acumular en todos los niveles de la jerarquía
      for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join(' > ');
        const node = nodeMap.get(currentPath);
        if (node) {
          node.stats.totalQuantity += stat.totalQuantity;
          node.stats.totalRevenue += stat.totalRevenue;
          node.stats.orderCount += stat.orderCount;
        }
      }
    });

    // Construir jerarquía
    const root: CategoryNode[] = [];
    nodeMap.forEach(node => {
      if (node.level === 0) {
        root.push(node);
      } else {
        const parentPath = node.fullPath.split(' > ').slice(0, -1).join(' > ');
        const parent = nodeMap.get(parentPath);
        if (parent && !parent.children.find(c => c.fullPath === node.fullPath)) {
          parent.children.push(node);
        }
      }
    });

    return { root, nodeMap };
  }, [categoryStats]);

  // Obtener datos para mostrar
  const displayData = useMemo(() => {
    let nodes: CategoryNode[];
    
    if (!effectivePath) {
      // Mostrar nivel 1 (raíz)
      nodes = categoryTree.root;
    } else {
      // Mostrar hijos del nodo seleccionado
      const selectedNode = categoryTree.nodeMap.get(effectivePath);
      nodes = selectedNode?.children || [];
    }

    return nodes
      .map(node => ({
        name: node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name,
        fullName: node.name,
        quantity: node.stats.totalQuantity,
        fullPath: node.fullPath,
        hasChildren: node.children.length > 0,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [categoryTree, effectivePath]);

  const handleBarClick = (data: any) => {
    if (data.hasChildren) {
      setSelectedPath(data.fullPath);
    }
  };

  const handleBack = () => {
    if (!effectivePath) return;
    const parts = effectivePath.split(' > ');
    if (parts.length === 1) {
      setSelectedPath(null);
    } else {
      setSelectedPath(parts.slice(0, -1).join(' > '));
    }
  };

  const currentLevel = effectivePath ? effectivePath.split(' > ').length : 0;
  const showBackButton = selectedPath || categoryFilter;

  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-700">
              Ventas por Categoría {effectivePath && `- ${effectivePath}`}
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Top 10 categorías · Nivel {currentLevel + 1} · Click para explorar
            </CardDescription>
          </div>
          {showBackButton && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-violet-50 text-violet-600 rounded-md hover:bg-violet-100 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              Volver
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">{data.fullName}</p>
                    <p className="text-violet-600">
                      Unidades: {data.quantity.toLocaleString('es-PE')}
                    </p>
                    {data.hasChildren && (
                      <p className="text-gray-400 text-[10px] mt-1">Click para explorar →</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="quantity" 
              fill={COLORS[currentLevel % COLORS.length]}
              cursor="pointer"
              onClick={(data: any) => handleBarClick(data)}
              activeBar={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
CategorySalesChartImproved.displayName = 'CategorySalesChartImproved';

// ── Category Revenue Chart (con drill-down) ──────────────────────────────────
export const CategoryRevenueChartImproved = memo(({ categoryStats, loading, categoryFilter }: CategoryChartsProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  
  // Reset selectedPath cuando cambia el filtro
  useEffect(() => {
    setSelectedPath(null);
  }, [categoryFilter]);
  
  // Si hay un filtro de categoría activo, usarlo como base
  const effectivePath = selectedPath || categoryFilter;

  const categoryTree = useMemo(() => {
    const nodeMap = new Map<string, CategoryNode>();

    // Primero crear todos los nodos
    categoryStats.forEach(stat => {
      const parts = stat.category.split(' > ').map(p => p.trim());
      
      for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join(' > ');
        
        if (!nodeMap.has(currentPath)) {
          const node: CategoryNode = {
            name: parts[i],
            fullPath: currentPath,
            level: i,
            children: [],
            stats: {
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            },
          };
          nodeMap.set(currentPath, node);
        }
      }
    });

    // Luego acumular stats desde las hojas hacia arriba
    categoryStats.forEach(stat => {
      const parts = stat.category.split(' > ').map(p => p.trim());
      
      // Acumular en todos los niveles de la jerarquía
      for (let i = 0; i < parts.length; i++) {
        const currentPath = parts.slice(0, i + 1).join(' > ');
        const node = nodeMap.get(currentPath);
        if (node) {
          node.stats.totalQuantity += stat.totalQuantity;
          node.stats.totalRevenue += stat.totalRevenue;
          node.stats.orderCount += stat.orderCount;
        }
      }
    });

    const root: CategoryNode[] = [];
    nodeMap.forEach(node => {
      if (node.level === 0) {
        root.push(node);
      } else {
        const parentPath = node.fullPath.split(' > ').slice(0, -1).join(' > ');
        const parent = nodeMap.get(parentPath);
        if (parent && !parent.children.find(c => c.fullPath === node.fullPath)) {
          parent.children.push(node);
        }
      }
    });

    return { root, nodeMap };
  }, [categoryStats]);

  const displayData = useMemo(() => {
    let nodes: CategoryNode[];
    
    if (!effectivePath) {
      nodes = categoryTree.root;
    } else {
      const selectedNode = categoryTree.nodeMap.get(effectivePath);
      nodes = selectedNode?.children || [];
    }

    return nodes
      .map(node => ({
        name: node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name,
        fullName: node.name,
        revenue: node.stats.totalRevenue / 100,
        fullPath: node.fullPath,
        hasChildren: node.children.length > 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [categoryTree, effectivePath]);

  const handleBarClick = (data: any) => {
    if (data.hasChildren) {
      setSelectedPath(data.fullPath);
    }
  };

  const handleBack = () => {
    if (!effectivePath) return;
    const parts = effectivePath.split(' > ');
    if (parts.length === 1) {
      setSelectedPath(null);
    } else {
      setSelectedPath(parts.slice(0, -1).join(' > '));
    }
  };

  const currentLevel = effectivePath ? effectivePath.split(' > ').length : 0;
  const showBackButton = selectedPath || categoryFilter;

  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-700">
              Ingresos por Categoría {effectivePath && `- ${effectivePath}`}
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              Top 10 categorías · Nivel {currentLevel + 1} · Click para explorar
            </CardDescription>
          </div>
          {showBackButton && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs px-3 py-1 bg-violet-50 text-violet-600 rounded-md hover:bg-violet-100 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              Volver
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700 mb-1">{data.fullName}</p>
                    <p className="text-violet-600">
                      Ingresos: S/ {data.revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                    {data.hasChildren && (
                      <p className="text-gray-400 text-[10px] mt-1">Click para explorar →</p>
                    )}
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill={COLORS[(currentLevel + 1) % COLORS.length]}
              cursor="pointer"
              onClick={(data: any) => handleBarClick(data)}
              activeBar={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
CategoryRevenueChartImproved.displayName = 'CategoryRevenueChartImproved';

// ── Category Pie Chart (solo nivel 1) ────────────────────────────────────────
export const CategoryPieChartImproved = memo(({ categoryStats, loading }: CategoryChartsProps) => {
  const data = useMemo(() => {
    const level1Map = new Map<string, number>();
    
    categoryStats.forEach(stat => {
      const level1 = stat.category.split(' > ')[0].trim();
      level1Map.set(level1, (level1Map.get(level1) || 0) + stat.totalRevenue);
    });

    return Array.from(level1Map.entries())
      .map(([name, value]) => ({ name, value: value / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [categoryStats]);

  if (loading) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-400 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700">
          Distribución de Ingresos (Nivel 1)
        </CardTitle>
        <CardDescription className="text-xs text-gray-400">
          Top 8 categorías principales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={false}
              label={(entry: any) => `${((entry.percent || 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#999', strokeWidth: 1 }}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
              contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={60}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
              formatter={(value: string) => {
                return value.length > 25 ? value.substring(0, 25) + '...' : value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});
CategoryPieChartImproved.displayName = 'CategoryPieChartImproved';
