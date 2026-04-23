import { memo } from 'react';
import type { DashboardKPIs } from '../../../types/orders';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Percent,
  Zap,
  Tag,
  Timer,
} from 'lucide-react';

interface KPICardsProps {
  kpis: DashboardKPIs;
}

interface KPICardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
}

export const KPICards = memo(({ kpis }: KPICardsProps) => {
  const hasCyberOrders = kpis.cyberOrders > 0;

  // Format time between orders
  const formatTimeBetweenOrders = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else {
      const days = Math.floor(minutes / 1440);
      const hours = Math.floor((minutes % 1440) / 60);
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
  };

  const cards: KPICardData[] = [
    {
      title: 'Total Órdenes',
      value: kpis.totalOrders.toLocaleString('es-PE'),
      subtitle: 'Total registradas',
      icon: ShoppingCart,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Ingresos Totales',
      value: `S/ ${kpis.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Valor total ventas',
      icon: DollarSign,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Ticket Promedio',
      value: `S/ ${kpis.avgOrderValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Por orden',
      icon: TrendingUp,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Frecuencia Órdenes',
      value: formatTimeBetweenOrders(kpis.avgTimeBetweenOrders),
      subtitle: 'Tiempo promedio',
      icon: Timer,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    ...(hasCyberOrders ? [{
      title: 'Cyber Órdenes',
      value: kpis.cyberOrders.toLocaleString('es-PE'),
      subtitle: `${kpis.cyberPercentage}% del total`,
      icon: Zap,
      color: 'text-purple-700',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
    }] : []),
    ...(hasCyberOrders ? [{
      title: 'Cyber Ingresos',
      value: `S/ ${kpis.cyberRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `Descuento: S/ ${kpis.cyberDiscountTotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Tag,
      color: 'text-purple-700',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
    }] : []),
    {
      title: 'En Preparación',
      value: kpis.handlingOrders.toLocaleString('es-PE'),
      subtitle: 'Siendo preparadas',
      icon: Package,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Listas Preparar',
      value: kpis.readyForHandling.toLocaleString('es-PE'),
      subtitle: 'Pendientes iniciar',
      icon: Clock,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Facturadas',
      value: kpis.invoicedOrders.toLocaleString('es-PE'),
      subtitle: 'Completadas',
      icon: CheckCircle,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Canceladas',
      value: kpis.cancelledOrders.toLocaleString('es-PE'),
      subtitle: 'Órdenes canceladas',
      icon: XCircle,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
    {
      title: 'Conversión',
      value: `${kpis.conversionRate}%`,
      subtitle: 'Facturadas / Total',
      icon: Percent,
      color: 'text-gray-900',
      bg: 'bg-gray-100',
      border: 'border-gray-200',
    },
  ];

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white rounded-xl border ${card.border} px-3 py-2.5 flex items-center gap-2.5 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <div className={`p-1.5 rounded-lg ${card.bg} flex-shrink-0`}>
              <Icon className={`h-3.5 w-3.5 ${card.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-1 truncate">
                {card.title}
              </p>
              <p className={`text-base font-black leading-none ${card.color}`}>{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
KPICards.displayName = 'KPICards';
