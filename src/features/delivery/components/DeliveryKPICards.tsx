import { memo } from 'react';
import { Truck, DollarSign, TrendingUp, Package, Banknote, Receipt, TrendingDown } from 'lucide-react';

interface DeliveryKPIsData {
  totalDeliveryCost: number;
  avgDeliveryCostPerOrder: number;
  deliveryCostVsRevenue: number;
  totalRevenue: number;
  totalOrders: number;
  deliveryOrders: number;
  pickupOrders: number;
  topCompany: string;
  fixedMonthlyCost: number;
  fixedDailyCost: number;
  fixedCostDifference: number;
}

interface DeliveryKPICardsProps {
  kpis: DeliveryKPIsData;
}

export const DeliveryKPICards = memo(({ kpis }: DeliveryKPICardsProps) => {
  const cards = [
    {
      title: 'Ingresos Totales',
      value: `S/ ${kpis.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Facturación total',
      icon: Banknote,
      color: 'text-green-900',
      bg: 'bg-green-100',
      border: 'border-green-200',
    },
    {
      title: 'Costo Total Delivery',
      value: `S/ ${kpis.totalDeliveryCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Costo acumulado',
      icon: DollarSign,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Costo Promedio/Orden',
      value: `S/ ${kpis.avgDeliveryCostPerOrder.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Por orden',
      icon: TrendingUp,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Costo vs Ingresos',
      value: `S/ ${kpis.deliveryCostVsRevenue.toLocaleString('es-PE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      subtitle: 'Ratio de costo',
      icon: Package,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Total Órdenes',
      value: kpis.totalOrders.toLocaleString('es-PE'),
      subtitle: `${kpis.deliveryOrders} domicilio · ${kpis.pickupOrders} retiro`,
      icon: Truck,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Gasto Total Fijo',
      value: `S/ ${kpis.fixedMonthlyCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `S/ ${kpis.fixedDailyCost.toFixed(2)} diario`,
      icon: Receipt,
      color: 'text-orange-900',
      bg: 'bg-orange-100',
      border: 'border-orange-200',
    },
    {
      title: 'Diferencia Fijo vs Delivery',
      value: `S/ ${kpis.fixedCostDifference.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: kpis.fixedCostDifference >= 0 ? 'Bajo presupuesto' : 'Sobre presupuesto',
      icon: TrendingDown,
      color: kpis.fixedCostDifference >= 0 ? 'text-green-900' : 'text-red-900',
      bg: kpis.fixedCostDifference >= 0 ? 'bg-green-100' : 'bg-red-100',
      border: kpis.fixedCostDifference >= 0 ? 'border-green-200' : 'border-red-200',
    },
  ];

  return (
    <div className="space-y-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white rounded-lg border ${card.border} px-3 py-2.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className={`p-2 rounded-md ${card.bg} flex-shrink-0`}>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-1 truncate">
                {card.title}
              </p>
              <p className={`text-base font-black leading-none ${card.color}`}>
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
DeliveryKPICards.displayName = 'DeliveryKPICards';
