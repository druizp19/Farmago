import { memo } from 'react';
import { Truck, DollarSign, TrendingUp, Package } from 'lucide-react';

interface DeliveryKPIsData {
  totalDeliveryCost: number;
  avgDeliveryCostPerOrder: number;
  deliveryCostPercentage: number;
  totalOrders: number;
  deliveryOrders: number;
  pickupOrders: number;
  topCompany: string;
}

interface DeliveryKPICardsProps {
  kpis: DeliveryKPIsData;
}

export const DeliveryKPICards = memo(({ kpis }: DeliveryKPICardsProps) => {
  const cards = [
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
      title: '% Costo vs Ingresos',
      value: `${kpis.deliveryCostPercentage.toFixed(2)}%`,
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
  ];

  return (
    <div className="space-y-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white rounded-xl border ${card.border} p-3 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${card.bg} flex-shrink-0`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  {card.title}
                </p>
                <p className={`text-3xl font-black leading-none ${card.color} mb-2`}>
                  {card.value}
                </p>
                <p className="text-xs text-gray-500">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
DeliveryKPICards.displayName = 'DeliveryKPICards';
