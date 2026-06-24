// ============================================================================
// COMPONENT - Inventory Dashboard (Rediseñado)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingDown,
  RefreshCw,
  Search,
  ChevronUp,
  ChevronDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useStock } from '../hooks/useStock';
import type { ProductAggregation } from '../../../types/orders';
import type { Warehouse } from '../../../types/stock';
import { getStockLevel, getStockColor, getStockIcon } from '../../../types/stock';
import { useDeliveryStore } from '../../../shared/store/store';

interface InventoryDashboardProps {
  products: ProductAggregation[];
}

type SortField = 'name' | 'refId' | 'stock';
type SortDir = 'asc' | 'desc';

export function InventoryDashboard({ products }: InventoryDashboardProps) {
  const {
    stock,
    stockInfo,
    loading,
    lastUpdate,
    getProductStockByWarehouse,
    refreshStock,
  } = useStock();

  const orderDetailsMap = useDeliveryStore((state) => state.orderDetailsMap);

  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse>('Todos');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('stock');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // ── Construir mapa refId → nombre de producto (de VTEX orders y detalles) ──
  const productNameMap = useMemo(() => {
    const map: Record<string, { name: string; imageUrl?: string; totalQuantity: number }> = {};
    
    // 1. Llenar con los topProducts de las props
    for (const p of products) {
      if (p.refId) {
        map[p.refId] = {
          name: p.name,
          imageUrl: p.imageUrl,
          totalQuantity: p.totalQuantity,
        };
      }
    }

    // 2. Complementar con todos los items de orderDetailsMap para capturar nombres reales
    Object.values(orderDetailsMap).forEach((order: any) => {
      if (order && order.items) {
        order.items.forEach((item: any) => {
          const refId = item.refId || item.productId;
          if (refId && !map[refId]) {
            map[refId] = {
              name: item.name,
              imageUrl: item.imageUrl,
              totalQuantity: 0,
            };
          }
        });
      }
    });

    return map;
  }, [products, orderDetailsMap]);

  // Función robusta para buscar el nombre real del producto usando su refId
  const getProductInfo = useCallback((refId: string) => {
    if (productNameMap[refId]) return productNameMap[refId];
    
    // Intentar match con base refId (removiendo sufijos como -1, -A)
    const baseRefId = refId.split('-')[0];
    if (productNameMap[baseRefId]) return productNameMap[baseRefId];
    
    // Buscar coincidencia parcial
    const matchKey = Object.keys(productNameMap).find(
      (key) => key.startsWith(baseRefId) || baseRefId.startsWith(key)
    );
    if (matchKey) return productNameMap[matchKey];
    
    return null;
  }, [productNameMap]);

  // ── Construir lista unificada desde la API de Stock + nombres de VTEX ──
  const allStockProducts = useMemo(() => {
    // Determinar almacenes a mostrar
    const warehouses =
      selectedWarehouse === 'Todos'
        ? Object.keys(stock)
        : [selectedWarehouse];

    // Recolectar todos los refIds del stock
    const refIdSet = new Set<string>();
    for (const wh of warehouses) {
      if (stock[wh]) {
        Object.keys(stock[wh]).forEach((r) => refIdSet.add(r));
      }
    }

    return Array.from(refIdSet)
      .map((refId) => {
        const stockData = getProductStockByWarehouse(refId);
        const relevantStock =
          selectedWarehouse === 'Todos' ? stockData.total : stockData[selectedWarehouse] ?? 0;
        const vtex = getProductInfo(refId);
        const hasDirectSale = Boolean(productNameMap[refId]);

        return {
          refId,
          name: vtex?.name ?? '',
          imageUrl: vtex?.imageUrl,
          stockData,
          relevantStock,
          stockLevel: getStockLevel(relevantStock),
          inVtex: hasDirectSale,
        };
      })
      .filter((p) => p.inVtex && p.name !== '');
  }, [stock, selectedWarehouse, getProductStockByWarehouse, getProductInfo, productNameMap]);

  // ── Filtrar por búsqueda ──
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allStockProducts;
    const q = search.toLowerCase();
    return allStockProducts.filter(
      (p) => 
        p.name.toLowerCase().includes(q) || 
        p.refId.toLowerCase().includes(q)
    );
  }, [allStockProducts, search]);

  // ── Ordenar ──
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir(field === 'stock' ? 'asc' : 'desc');
      }
      setCurrentPage(1); // Reiniciar a página 1 al ordenar
    },
    [sortField]
  );

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        const nameA = a.name || `Producto en Stock - SKU: ${a.refId}`;
        const nameB = b.name || `Producto en Stock - SKU: ${b.refId}`;
        cmp = nameA.localeCompare(nameB);
      }
      else if (sortField === 'refId') cmp = a.refId.localeCompare(b.refId);
      else if (sortField === 'stock') cmp = a.relevantStock - b.relevantStock;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredProducts, sortField, sortDir]);

  // ── Paginación ──
  const totalPages = Math.ceil(sortedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedProducts.slice(startIndex, startIndex + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // ── KPIs ──
  const kpis = useMemo(() => {
    const total = allStockProducts.length;
    const withStock = allStockProducts.filter((p) => p.relevantStock > 0).length;
    const depleted = allStockProducts.filter((p) => p.relevantStock === 0).length;
    const critical = allStockProducts.filter(
      (p) => p.relevantStock > 0 && p.relevantStock <= 5
    ).length;
    const warning = allStockProducts.filter(
      (p) => p.relevantStock > 5 && p.relevantStock <= 10
    ).length;
    return { total, withStock, depleted, critical, warning };
  }, [allStockProducts]);

  // Cambiar página de forma segura
  const handlePageChange = (page: number) => {
    const targetPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(targetPage);
  };

  // ── SortIcon helper ──
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-blue-500" />
    ) : (
      <ChevronDown className="h-3 w-3 text-blue-500" />
    );
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  // ── Sin datos del servidor de stock ──
  const stockEmpty = Object.keys(stock).length === 0;
  if (stockEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
        <Package className="h-12 w-12 opacity-30" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500">No se pudo cargar el inventario</p>
          <p className="text-xs mt-1">El servidor no retornó datos de stock</p>
        </div>
        <button
          onClick={refreshStock}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Premium Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-violet-600" />
            Control de Stock e Inventario
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {stockInfo
              ? `${stockInfo.totalProducts} productos registrados · Sincronizado en tiempo real`
              : 'Información y control de almacenes'}
          </p>
        </div>
        
        {/* Controls: Search, Warehouse & Sync */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Warehouse Selector */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
            <span className="text-[10px] text-gray-400 mr-1.5 font-bold uppercase tracking-wider">Almacén:</span>
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value as Warehouse);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer font-sans"
            >
              <option value="Todos">Todos los almacenes</option>
              <option value="PT">PT (Principal)</option>
              <option value="CV">CV</option>
              <option value="94">Almacén 94</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre o SKU..."
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 w-52 font-medium"
            />
          </div>

          {/* Sync Button */}
          <button
            onClick={refreshStock}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-lg hover:bg-violet-100 transition-all shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar
          </button>
        </div>
      </div>

      {/* KPI Cards Rediseñadas (Estilo Premium) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: 'Total SKU en Stock',
            value: kpis.total,
            bg: 'bg-white',
            borderColor: 'border-gray-100',
            textColor: 'text-gray-900',
            icon: Package,
            iconColor: 'text-violet-500 bg-violet-50',
          },
          {
            label: 'Disponibles',
            value: kpis.withStock,
            bg: 'bg-white',
            borderColor: 'border-gray-100',
            textColor: 'text-emerald-700',
            icon: Package,
            iconColor: 'text-emerald-500 bg-emerald-50',
          },
          {
            label: 'Stock Bajo (10 o menos)',
            value: kpis.warning + kpis.critical,
            bg: 'bg-white',
            borderColor: 'border-gray-100',
            textColor: 'text-amber-700',
            icon: AlertTriangle,
            iconColor: 'text-amber-500 bg-amber-50',
          },
          {
            label: 'Críticos (5 o menos)',
            value: kpis.critical,
            bg: 'bg-white',
            borderColor: 'border-gray-100',
            textColor: 'text-orange-700',
            icon: TrendingDown,
            iconColor: 'text-orange-500 bg-orange-50',
          },
          {
            label: 'Agotados',
            value: kpis.depleted,
            bg: 'bg-white',
            borderColor: 'border-gray-100',
            textColor: 'text-rose-700',
            icon: XCircle,
            iconColor: 'text-rose-500 bg-rose-50',
          },
        ].map(({ label, value, bg, borderColor, textColor, icon: Icon, iconColor }) => (
          <div key={label} className={`${bg} ${borderColor} border rounded-xl p-3 shadow-sm flex items-center gap-3`}>
            <div className={`p-2 rounded-lg ${iconColor} flex-shrink-0`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
              <p className={`text-lg font-bold ${textColor} mt-0.5`}>{value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Redesigned Paginated Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-xs font-bold text-gray-700">
            Listado de Inventario 
            <span className="text-[10px] text-gray-400 font-normal ml-1">
              (Mostrando {paginatedProducts.length} de {sortedProducts.length} SKUs)
            </span>
          </h3>
          {lastUpdate && (
            <p className="text-[9px] text-gray-400 font-medium">
              Última actualización: {lastUpdate.toLocaleTimeString('es-PE')}
            </p>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100/50 border-b border-gray-200 font-sans text-xs">
              <tr className="border-b border-gray-100">
                <th rowSpan={2} className="px-4 py-2 text-gray-400 font-bold w-12 text-center border-r border-gray-100">#</th>
                <th
                  rowSpan={2}
                  className="px-4 py-2 text-gray-500 font-bold cursor-pointer hover:text-gray-800 select-none text-left"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1.5">
                    Producto <SortIcon field="name" />
                  </span>
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-2 text-gray-500 font-bold cursor-pointer hover:text-gray-800 select-none text-right w-28 border-l border-gray-100"
                  onClick={() => handleSort('refId')}
                >
                  <span className="flex items-center justify-end gap-1.5">
                    SKU <SortIcon field="refId" />
                  </span>
                </th>
                <th colSpan={3} className="py-1 text-center font-bold text-[10px] uppercase tracking-wider text-gray-400 bg-gray-50/50 border-l border-r border-gray-100">
                  Stock Almacenes
                </th>
                <th
                  rowSpan={2}
                  className="px-4 py-2 text-gray-500 font-bold cursor-pointer hover:text-gray-800 select-none text-right w-28"
                  onClick={() => handleSort('stock')}
                >
                  <span className="flex items-center justify-end gap-1.5">
                    Stock Total <SortIcon field="stock" />
                  </span>
                </th>
                <th rowSpan={2} className="px-4 py-2 text-gray-500 font-bold text-center w-28 border-l border-gray-100">Estado</th>
              </tr>
              <tr>
                <th className="px-3 py-1 text-gray-500 font-bold text-right w-16 bg-gray-50/30 border-l border-gray-100">PT</th>
                <th className="px-3 py-1 text-gray-500 font-bold text-right w-16 bg-gray-50/30">CV</th>
                <th className="px-3 py-1 text-gray-500 font-bold text-right w-16 bg-gray-50/30 border-r border-gray-100">94</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((product, idx) => {
                const stockColor = getStockColor(product.stockLevel);
                const stockEmoji = getStockIcon(product.stockLevel);
                
                // Índice real del producto
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
 
                return (
                  <tr
                    key={`${product.refId}-${idx}`}
                    className="hover:bg-violet-50/10 transition-colors"
                  >
                    <td className="px-4 py-2 text-center text-gray-400 font-medium border-r border-gray-50">
                      {globalIndex}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-6.5 h-6.5 object-contain rounded-md bg-white border border-gray-200 flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-gray-700 font-semibold truncate max-w-sm">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-[10px] text-gray-500 font-semibold border-l border-gray-50 w-28">
                      {product.refId}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600 bg-gray-50/10 border-l border-gray-50 w-16">
                      {product.stockData.PT.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600 bg-gray-50/10 w-16">
                      {product.stockData.CV.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600 bg-gray-50/10 border-r border-gray-50 w-16">
                      {product.stockData['94'].toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-blue-600 font-mono w-28">
                      {product.stockData.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border-l border-gray-50 w-28">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors ${stockColor}`}
                        >
                          <span>{stockEmoji}</span>
                          {product.stockLevel === 'depleted' && 'Agotado'}
                          {product.stockLevel === 'critical' && 'Crítico'}
                          {product.stockLevel === 'warning' && 'Bajo'}
                          {product.stockLevel === 'ok' && 'OK'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sortedProducts.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-sm font-semibold">No se encontraron productos</p>
              <p className="text-xs text-gray-400 mt-1">Prueba a buscar con otro término o SKU</p>
            </div>
          )}
        </div>

        {/* Premium Pagination Footer */}
        {sortedProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/50 text-[11px] text-gray-500">
            {/* Page Size Selector & Total info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-sans">
                <span>Filas por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer font-bold text-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div>
                Mostrando del <span className="font-semibold text-gray-700">{(currentPage - 1) * pageSize + 1}</span> al{' '}
                <span className="font-semibold text-gray-700">
                  {Math.min(currentPage * pageSize, sortedProducts.length)}
                </span>{' '}
                de <span className="font-semibold text-gray-700">{sortedProducts.length}</span> registros
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                title="Primera página"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <span className="mx-2 text-gray-600 font-sans">
                Página <span className="font-bold text-gray-700">{currentPage}</span> de{' '}
                <span className="font-bold text-gray-700">{totalPages}</span>
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                title="Última página"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
