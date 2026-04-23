import { useState } from 'react';
import type { DashboardFilters } from '../../types/orders';
import { Button } from '../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { MultiSelect } from '../../components/ui/multi-select';
import { TimePicker } from '../../components/ui/time-picker';
import { Filter, Calendar, RotateCcw, X, Zap } from 'lucide-react';

interface FilterBarProps {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  resetFilters: () => void;
  filterOptions: {
    statuses: string[];
    origins: string[];
    payments: string[];
  };
  level1Options: string[];
  level2Options: string[];
  level3Options: string[];
  totalOrders: number;
  filteredCount: number;
}

const STATUS_LABELS: Record<string, string> = {
  'payment-pending': 'Pago Pendiente',
  'payment-approved': 'Pago Aprobado',
  'ready-for-handling': 'Listo para Preparar',
  'handling': 'En Preparación',
  'invoiced': 'Facturado',
  'canceled': 'Cancelado',
  'cancellation-requested': 'Solic. Cancelación',
  'window-to-cancel': 'Ventana Cancelación',
  'waiting-ffmt-authorization': 'Esp. Autorización',
  'approve-payment': 'Aprobando Pago',
};

const ORIGIN_LABELS: Record<string, string> = {
  'Marketplace': 'Farmago',
  'Fulfillment': 'Juntoz',
};

const PRESETS = [
  { label: 'Hoy', days: 0 },
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '3 meses', days: 90 },
  { label: '6 meses', days: 180 },
];

function toDateInput(d: Date) {
  return d.toISOString().split('T')[0];
}

export function FilterBar({
  filters,
  setFilters,
  resetFilters,
  filterOptions,
  level1Options,
  level2Options,
  level3Options,
  totalOrders,
  filteredCount,
}: FilterBarProps) {
  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.origin !== 'all' ||
    filters.paymentMethod.length > 0 ||
    filters.isCyberOrder !== 'all' ||
    filters.categoryLevel1.length > 0 ||
    filters.categoryLevel2.length > 0 ||
    filters.categoryLevel3.length > 0 ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.timeFrom !== '' ||
    filters.timeTo !== '';

  const activeCount = [
    filters.status.length > 0,
    filters.origin !== 'all',
    filters.paymentMethod.length > 0,
    filters.isCyberOrder !== 'all',
    filters.categoryLevel1.length > 0,
    filters.categoryLevel2.length > 0,
    filters.categoryLevel3.length > 0,
    filters.dateFrom !== '' || filters.dateTo !== '',
    filters.timeFrom !== '' || filters.timeTo !== '',
  ].filter(Boolean).length;

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    if (days === 0) {
      setFilters({ ...filters, dateFrom: toDateInput(from), dateTo: toDateInput(to) });
    } else {
      from.setDate(from.getDate() - days);
      setFilters({ ...filters, dateFrom: toDateInput(from), dateTo: toDateInput(to) });
    }
  };

  const removeCategory = (level: 1 | 2 | 3, category: string) => {
    if (level === 1) {
      setFilters({
        ...filters,
        categoryLevel1: filters.categoryLevel1.filter(c => c !== category),
        categoryLevel2: [],
        categoryLevel3: [],
      });
    } else if (level === 2) {
      setFilters({
        ...filters,
        categoryLevel2: filters.categoryLevel2.filter(c => c !== category),
        categoryLevel3: [],
      });
    } else {
      setFilters({
        ...filters,
        categoryLevel3: filters.categoryLevel3.filter(c => c !== category),
      });
    }
  };

  const hasSelectedCategories = filters.categoryLevel1.length > 0 || filters.categoryLevel2.length > 0 || filters.categoryLevel3.length > 0;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm sticky top-0 z-40">
      <div className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-1.5 text-gray-500 flex-shrink-0">
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeCount}
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-gray-200 flex-shrink-0 hidden sm:block" />

          {/* Date presets */}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <div className="flex gap-1">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p.days)}
                  className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date From */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 flex-shrink-0">Desde</span>
            <input
              type="date"
              value={filters.dateFrom}
              min="2025-11-01"
              onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 flex-shrink-0">Hasta</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-1">
            <TimePicker
              value={filters.timeFrom}
              onChange={(value) => setFilters({ ...filters, timeFrom: value })}
              placeholder="Hora desde"
              className="w-32"
            />
            <span className="text-xs text-gray-400">-</span>
            <TimePicker
              value={filters.timeTo}
              onChange={(value) => setFilters({ ...filters, timeTo: value })}
              placeholder="Hora hasta"
              className="w-32"
            />
          </div>

          {/* Status - MultiSelect */}
          <MultiSelect
            options={filterOptions.statuses.map(s => ({
              value: s,
              label: STATUS_LABELS[s] || s
            }))}
            selected={filters.status}
            onChange={(selected) => setFilters({ ...filters, status: selected })}
            placeholder="Estado"
            className="w-44"
            renderValue={(selected) => 
              selected.length === 0 
                ? "Todos los estados" 
                : selected.length === 1 
                ? STATUS_LABELS[selected[0]] || selected[0]
                : `${selected.length} estados`
            }
          />

          {/* Origin */}
          {filterOptions.origins.length > 1 && (
            <Select
              value={filters.origin}
              onValueChange={v => setFilters({ ...filters, origin: v })}
            >
              <SelectTrigger className={`h-8 w-36 text-xs border-gray-200 ${filters.origin !== 'all' ? 'border-blue-300 bg-blue-50 text-blue-700' : ''}`}>
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
                <SelectItem value="all">Todos los orígenes</SelectItem>
                {filterOptions.origins.map(o => (
                  <SelectItem key={o} value={o}>{ORIGIN_LABELS[o] || o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Payment - MultiSelect */}
          <MultiSelect
            options={filterOptions.payments}
            selected={filters.paymentMethod}
            onChange={(selected) => setFilters({ ...filters, paymentMethod: selected })}
            placeholder="Método de pago"
            className="w-44"
            renderValue={(selected) => 
              selected.length === 0 
                ? "Todos los pagos" 
                : selected.length === 1 
                ? selected[0]
                : `${selected.length} métodos`
            }
          />

          {/* Cyber Filter */}
          <Select
            value={filters.isCyberOrder}
            onValueChange={v => setFilters({ ...filters, isCyberOrder: v })}
          >
            <SelectTrigger className={`h-8 w-40 text-xs border-gray-200 ${filters.isCyberOrder !== 'all' ? 'border-purple-300 bg-purple-50 text-purple-700' : ''}`}>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                <SelectValue placeholder="Tipo de orden" />
              </div>
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="max-h-[300px] w-[var(--radix-select-trigger-width)]">
              <SelectItem value="all">Todas las órdenes</SelectItem>
              <SelectItem value="cyber">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-purple-600" />
                  Solo Cyber
                </div>
              </SelectItem>
              <SelectItem value="regular">Solo Regulares</SelectItem>
            </SelectContent>
          </Select>

          {/* Category filters */}
          {level1Options.length > 0 && (
            <MultiSelect
              options={level1Options}
              selected={filters.categoryLevel1}
              onChange={(selected) => setFilters({ ...filters, categoryLevel1: selected, categoryLevel2: [], categoryLevel3: [] })}
              placeholder="Categoría Nivel 1"
              className="w-44"
            />
          )}

          {level2Options.length > 0 && filters.categoryLevel1.length > 0 && (
            <MultiSelect
              options={level2Options}
              selected={filters.categoryLevel2}
              onChange={(selected) => setFilters({ ...filters, categoryLevel2: selected, categoryLevel3: [] })}
              placeholder="Categoría Nivel 2"
              className="w-44"
            />
          )}

          {level3Options.length > 0 && filters.categoryLevel2.length > 0 && (
            <MultiSelect
              options={level3Options}
              selected={filters.categoryLevel3}
              onChange={(selected) => setFilters({ ...filters, categoryLevel3: selected })}
              placeholder="Categoría Nivel 3"
              className="w-44"
            />
          )}

          {/* Clear */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 gap-1 px-2"
            >
              <RotateCcw className="h-3 w-3" />
              Limpiar
            </Button>
          )}

          {/* Result count */}
          <div className="ml-auto text-xs text-gray-400 flex-shrink-0">
            <span className={`font-semibold ${hasActiveFilters ? 'text-blue-600' : 'text-gray-600'}`}>
              {filteredCount.toLocaleString()}
            </span>
            {hasActiveFilters && (
              <span> de {totalOrders.toLocaleString()}</span>
            )}{' '}órdenes
          </div>
        </div>
      </div>

      {/* Selected categories chips */}
      {hasSelectedCategories && (
        <div className="px-4 pb-3 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">Categorías seleccionadas:</span>
            
            {filters.categoryLevel1.map(cat => (
              <div
                key={`l1-${cat}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-md text-xs"
              >
                <span className="font-medium">N1:</span>
                <span>{cat}</span>
                <button
                  onClick={() => removeCategory(1, cat)}
                  className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {filters.categoryLevel2.map(cat => (
              <div
                key={`l2-${cat}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-md text-xs"
              >
                <span className="font-medium">N2:</span>
                <span>{cat}</span>
                <button
                  onClick={() => removeCategory(2, cat)}
                  className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {filters.categoryLevel3.map(cat => (
              <div
                key={`l3-${cat}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-md text-xs"
              >
                <span className="font-medium">N3:</span>
                <span>{cat}</span>
                <button
                  onClick={() => removeCategory(3, cat)}
                  className="ml-0.5 hover:bg-violet-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected status and payment chips */}
      {(filters.status.length > 0 || filters.paymentMethod.length > 0) && (
        <div className="px-4 pb-3 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {filters.status.length > 0 && (
              <>
                <span className="text-xs text-gray-400 flex-shrink-0">Estados:</span>
                {filters.status.map(status => (
                  <div
                    key={`status-${status}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs"
                  >
                    <span>{STATUS_LABELS[status] || status}</span>
                    <button
                      onClick={() => setFilters({ ...filters, status: filters.status.filter(s => s !== status) })}
                      className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </>
            )}

            {filters.paymentMethod.length > 0 && (
              <>
                <span className="text-xs text-gray-400 flex-shrink-0">Pagos:</span>
                {filters.paymentMethod.map(payment => (
                  <div
                    key={`payment-${payment}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs"
                  >
                    <span>{payment}</span>
                    <button
                      onClick={() => setFilters({ ...filters, paymentMethod: filters.paymentMethod.filter(p => p !== payment) })}
                      className="ml-0.5 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
