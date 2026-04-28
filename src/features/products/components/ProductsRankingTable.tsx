import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ProductAggregation } from '../../../types/orders';

interface ProductsRankingTableProps {
  products: ProductAggregation[];
}

type SortField = 'name' | 'unidades' | 'ordenes' | 'ingresos';
type SortOrder = 'asc' | 'desc';

export function ProductsRankingTable({ products }: ProductsRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>('unidades');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'unidades':
          aVal = a.totalQuantity;
          bVal = b.totalQuantity;
          break;
        case 'ordenes':
          aVal = a.orderCount;
          bVal = b.orderCount;
          break;
        case 'ingresos':
          aVal = a.totalRevenue;
          bVal = b.totalRevenue;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [products, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
      >
        <span>{label}</span>
        {isActive && (
          sortOrder === 'desc' 
            ? <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
            : <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mx-auto max-w-full">
      <div className="px-3 py-2.5 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-800">Ranking de Productos</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Top 20 productos por unidades — últimas 100 órdenes</p>
      </div>
      <div className="overflow-x-auto flex justify-center">
        <table className="w-full text-[11px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2.5 text-gray-500 font-semibold w-6">#</th>
              <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Producto</th>
              <th className="text-left px-3 py-2.5 text-gray-500 font-semibold">Categoría</th>
              <th className="text-right px-3 py-2.5 text-gray-500 font-semibold">SKU</th>
              <th className="px-3 py-2.5 text-gray-500 font-semibold">
                <div className="flex justify-end">
                  <SortButton field="unidades" label="Unidades" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-gray-500 font-semibold">
                <div className="flex justify-end">
                  <SortButton field="ordenes" label="Órdenes" />
                </div>
              </th>
              <th className="px-3 py-2.5 text-gray-500 font-semibold">
                <div className="flex justify-end">
                  <SortButton field="ingresos" label="Ingresos" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2.5 text-gray-400 font-medium">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name}
                        className="w-7 h-7 object-contain rounded bg-white border border-gray-100 flex-shrink-0" />
                    )}
                    <span className="text-gray-700 font-medium line-clamp-1">{p.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-100">
                    {p.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-gray-400 font-mono text-[10px]">{p.refId}</td>
                <td className="px-3 py-2.5 text-right font-bold text-blue-600">{p.totalQuantity.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">{p.orderCount}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">
                  S/ {(p.totalRevenue / 100).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
