import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import type { CategoryStat } from '../../../types/orders';

interface CategoryNode {
  name: string;
  fullPath: string;
  level: number;
  children: CategoryNode[];
  stats: {
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  };
}

interface CategoryTreeTableProps {
  categoryStats: CategoryStat[];
  loading?: boolean;
}

export function CategoryTreeTable({ categoryStats, loading }: CategoryTreeTableProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Construir árbol de categorías
  const categoryTree = useMemo(() => {
    const root: CategoryNode[] = [];
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

          if (i === 0) {
            root.push(node);
          } else {
            const parentPath = parts.slice(0, i).join(' > ');
            const parent = nodeMap.get(parentPath);
            if (parent) {
              parent.children.push(node);
            }
          }
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

    // Ordenar hijos por revenue
    const sortChildren = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);
      nodes.forEach(node => sortChildren(node.children));
    };
    sortChildren(root);

    return root;
  }, [categoryStats]);

  // Aplanar árbol para paginación
  const flattenedTree = useMemo(() => {
    const result: CategoryNode[] = [];
    
    const traverse = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        result.push(node);
        if (expandedNodes.has(node.fullPath) && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(categoryTree);
    return result;
  }, [categoryTree, expandedNodes]);

  const totalPages = Math.ceil(flattenedTree.length / itemsPerPage);
  const paginatedData = flattenedTree.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleNode = (path: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allPaths = new Set<string>();
    const traverse = (nodes: CategoryNode[]) => {
      nodes.forEach(node => {
        if (node.children.length > 0) {
          allPaths.add(node.fullPath);
          traverse(node.children);
        }
      });
    };
    traverse(categoryTree);
    setExpandedNodes(allPaths);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-700">
              Resumen por Categorías
            </CardTitle>
            <CardDescription className="text-xs text-gray-400">
              {flattenedTree.length} categorías (jerarquía) · {categoryStats.length} categorías únicas
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs px-3 py-1 bg-violet-50 text-violet-600 rounded-md hover:bg-violet-100 transition-colors"
            >
              Expandir todo
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-3 py-1 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            >
              Colapsar todo
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-[40%]">
                  Categoría
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">
                  Unidades
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">
                  Órdenes
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">
                  Ingresos
                </th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">
                  % Util
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((node, index) => {
                const isExpanded = expandedNodes.has(node.fullPath);
                const hasChildren = node.children.length > 0;
                const totalRevenue = categoryStats.reduce((sum, c) => sum + c.totalRevenue, 0);
                const percentage = totalRevenue > 0 ? (node.stats.totalRevenue / totalRevenue) * 100 : 0;

                return (
                  <tr
                    key={node.fullPath}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="py-2 px-3">
                      <div
                        className="flex items-center gap-1 cursor-pointer"
                        style={{ paddingLeft: `${node.level * 20}px` }}
                        onClick={() => hasChildren && toggleNode(node.fullPath)}
                      >
                        {hasChildren ? (
                          isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )
                        ) : (
                          <div className="w-3" />
                        )}
                        <Package
                          className={`h-3 w-3 flex-shrink-0 ${
                            node.level === 0
                              ? 'text-violet-500'
                              : node.level === 1
                              ? 'text-blue-500'
                              : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`${
                            node.level === 0
                              ? 'font-semibold text-gray-800'
                              : node.level === 1
                              ? 'font-medium text-gray-700'
                              : 'text-gray-600'
                          }`}
                        >
                          {node.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-3 text-gray-700 font-medium">
                      {node.stats.totalQuantity.toLocaleString('es-PE')}
                    </td>
                    <td className="text-right py-2 px-3 text-gray-600">
                      {node.stats.orderCount.toLocaleString('es-PE')}
                    </td>
                    <td className="text-right py-2 px-3 text-gray-800 font-semibold">
                      S/ {(node.stats.totalRevenue / 100).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="text-right py-2 px-3 text-gray-600">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, flattenedTree.length)} de{' '}
              {flattenedTree.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-violet-500 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
