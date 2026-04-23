# 🔥 Sistema de Tracking de Órdenes Cyber/Promociones

## Descripción General

Sistema completo para identificar, etiquetar y analizar órdenes que provienen de promociones especiales como CyberWow, Black Friday, Hot Sale, etc.

## 🎯 Características Implementadas

### ✅ Detección Automática de Promociones

El sistema detecta automáticamente órdenes de promociones mediante:

1. **`ratesAndBenefitsData`** - Promociones aplicadas en VTEX
   - Busca palabras clave en `name` y `description`
   - Ejemplo: "Cyber Hylo", "CyberWow", "Black Friday"

2. **`marketingData.utmCampaign`** - Campañas de marketing
   - Analiza el parámetro UTM de la campaña
   - Ejemplo: "ml-conversiones-cyber-abril26-hylo-carrusel"

3. **`priceTags`** - Descuentos aplicados
   - Calcula el descuento total de la orden
   - Suma todos los tags de tipo "DISCOUNT"

### 🔍 Palabras Clave Detectadas

El sistema busca estas palabras clave (case-insensitive):
- `cyber`
- `cyberwow`
- `cyber wow`
- `black friday`
- `hot sale`
- `hotsale`
- `descuento especial`
- `promocion especial`

### 📊 Datos Capturados por Orden

Cada orden incluye:
```typescript
{
  isCyberOrder: boolean,        // ¿Es una orden de promoción?
  promotionName: string | null, // Nombre de la promoción
  discountValue: number,        // Descuento total en centavos
  utmCampaign: string | null    // Campaña de marketing
}
```

### 📈 Métricas en el Dashboard

El dashboard ahora muestra:

**KPI Cards (si hay órdenes Cyber):**
- 🔥 Cyber Órdenes: Cantidad y porcentaje del total
- 💰 Cyber Ingresos: Ingresos totales y descuento aplicado

**Métricas Disponibles:**
```typescript
{
  cyberOrders: number,           // Cantidad de órdenes Cyber
  cyberRevenue: number,          // Ingresos de órdenes Cyber
  cyberDiscountTotal: number,    // Descuento total aplicado
  cyberPercentage: number,       // % de órdenes Cyber
  topPromotions: Array<{         // Top 10 promociones
    name: string,
    orders: number,
    revenue: number,
    discount: number
  }>
}
```

### 🎨 Indicadores Visuales

**1. Notificación de Nueva Orden**
- Badge "CYBER" morado con ícono de rayo ⚡
- Muestra el descuento aplicado
- Muestra el nombre de la promoción

**2. KPI Cards**
- Tarjetas moradas especiales para métricas Cyber
- Solo aparecen si hay órdenes Cyber en el período filtrado

## 🔧 Arquitectura Técnica

### Backend (Server)

**1. `PromotionDetectionService.ts`**
```typescript
// Servicio para detectar promociones
class PromotionDetectionService {
  static detectPromotion(orderDetail: OrderDetail): PromotionInfo
  static containsCyberKeyword(text: string): boolean
  static cleanPromotionName(name: string): string
}
```

**2. `GetDashboardDataUseCase.ts`**
- Enriquece las órdenes con datos de promoción
- Llama a `PromotionDetectionService` para cada orden con detalles
- Almacena la información en cache

**3. Tipos Actualizados**
- `OrderListItem` - Agregados campos de promoción
- `OrderDetail` - Agregados `marketingData`, `totals`, `priceTags`

### Frontend (Client)

**1. `useKPIs.ts`**
- Calcula métricas de Cyber/Promociones
- Agrupa por nombre de promoción
- Calcula porcentajes y totales

**2. `KPICards.tsx`**
- Muestra tarjetas Cyber si hay órdenes
- Diseño morado distintivo
- Iconos especiales (Zap, Tag)

**3. `NewOrderNotification.tsx`**
- Badge "CYBER" en el header
- Información de descuento
- Nombre de la promoción

## 📝 Ejemplo de Orden Cyber

```json
{
  "orderId": "1627000501450-01",
  "sequence": "501450",
  "totalValue": 6825,
  "isCyberOrder": true,
  "promotionName": "Cyber Hylo",
  "discountValue": 2025,
  "utmCampaign": "ml-conversiones-cyber-abril26-hylo-carrusel",
  "ratesAndBenefitsData": {
    "rateAndBenefitsIdentifiers": [{
      "name": "Cyber Hylo",
      "description": "Hylo cyber descuentos",
      "id": "0a72f833-b0e4-4592-8566-4cedf8c70828"
    }]
  },
  "marketingData": {
    "utmCampaign": "ml-conversiones-cyber-abril26-hylo-carrusel",
    "utmSource": "facebook",
    "utmMedium": "cpa"
  },
  "items": [{
    "priceTags": [{
      "name": "DISCOUNT@MARKETPLACE",
      "value": -2025,
      "identifier": "0a72f833-b0e4-4592-8566-4cedf8c70828"
    }]
  }]
}
```

## 🧪 Cómo Probar

### Verificar Detección
1. Iniciar servidor: `cd server && npm run dev`
2. Iniciar cliente: `npm run dev`
3. Esperar sincronización de órdenes
4. Buscar en consola del servidor: "Promotion detected" o similar
5. Ver KPI Cards en el dashboard

### Verificar Notificaciones
1. Cuando llegue una orden Cyber nueva
2. Verás el badge "CYBER" morado en el modal
3. Se mostrará el descuento aplicado
4. Se mostrará el nombre de la promoción

### Verificar Métricas
1. Ir a la pestaña "Resumen"
2. Si hay órdenes Cyber, verás 2 tarjetas moradas adicionales
3. Las tarjetas muestran cantidad, porcentaje, ingresos y descuentos

## 📊 Casos de Uso

### 1. Análisis de Campañas
```typescript
// Ver top promociones
kpis.topPromotions.forEach(promo => {
  console.log(`${promo.name}: ${promo.orders} órdenes, S/ ${promo.revenue}`);
});
```

### 2. Filtrar Órdenes Cyber
```typescript
const cyberOrders = orders.filter(o => o.isCyberOrder);
const totalCyberRevenue = cyberOrders.reduce((sum, o) => sum + o.totalValue, 0);
```

### 3. Calcular ROI de Promoción
```typescript
const promotion = kpis.topPromotions[0];
const roi = (promotion.revenue - promotion.discount) / promotion.discount;
console.log(`ROI: ${(roi * 100).toFixed(2)}%`);
```

## 🔮 Mejoras Futuras

- [ ] Filtro específico para órdenes Cyber en FilterBar
- [ ] Gráfico de tendencia de órdenes Cyber por día
- [ ] Comparación de promociones (tabla detallada)
- [ ] Exportar reporte de promociones a Excel/CSV
- [ ] Alertas cuando una promoción supera X órdenes
- [ ] Dashboard dedicado solo para promociones
- [ ] Análisis de productos más vendidos en Cyber
- [ ] Comparación año a año de eventos Cyber

## 🎨 Personalización

### Agregar Nuevas Palabras Clave
Editar `server/src/domain/services/PromotionDetectionService.ts`:
```typescript
private static readonly CYBER_KEYWORDS = [
  'cyber',
  'cyberwow',
  'tu-nueva-palabra-clave', // ← Agregar aquí
];
```

### Cambiar Colores de Cyber
Editar `src/features/analytics/components/KPICards.tsx`:
```typescript
{
  color: 'text-purple-700',  // ← Color del texto
  bg: 'bg-purple-100',       // ← Color de fondo
  border: 'border-purple-200', // ← Color del borde
}
```

## 📁 Archivos Modificados/Creados

### Backend
- ✨ `server/src/domain/services/PromotionDetectionService.ts` (nuevo)
- 📝 `server/src/domain/types/Order.ts` (modificado)
- 📝 `server/src/application/usecases/GetDashboardDataUseCase.ts` (modificado)

### Frontend
- 📝 `src/types/orders.ts` (modificado)
- 📝 `src/features/analytics/hooks/useKPIs.ts` (modificado)
- 📝 `src/features/analytics/components/KPICards.tsx` (modificado)
- 📝 `src/features/orders/components/NewOrderNotification.tsx` (modificado)

## ✅ Resumen

El sistema ahora puede:
1. ✅ Detectar automáticamente órdenes de promociones Cyber
2. ✅ Extraer nombre de la promoción y descuento aplicado
3. ✅ Mostrar métricas específicas en el dashboard
4. ✅ Indicar visualmente órdenes Cyber en notificaciones
5. ✅ Calcular ROI y estadísticas de promociones
6. ✅ Almacenar datos en cache para análisis histórico

Todo funciona de forma automática sin configuración adicional. El sistema detecta las promociones basándose en los datos que VTEX ya proporciona en las órdenes.
