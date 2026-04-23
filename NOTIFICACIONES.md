# 🔔 Sistema de Notificaciones de Nuevas Órdenes con Cola

## Descripción General

El sistema detecta automáticamente cuando llegan nuevas órdenes desde VTEX y muestra una notificación visual y sonora al usuario. Incluye un sistema de cola inteligente para manejar múltiples órdenes nuevas simultáneamente.

## 🎯 Características

### ✅ Detección Automática con Cola
- Compara las órdenes recibidas con las anteriores
- Identifica órdenes nuevas por su `orderId`
- Solo muestra notificaciones después de la carga inicial (evita falsos positivos)
- **Sistema de cola**: Maneja múltiples órdenes nuevas simultáneamente
- **Auto-avance**: Pasa automáticamente a la siguiente orden cada 10 segundos
- **Navegación manual**: Botones para ir a la orden anterior/siguiente
- **Indicador de progreso**: Muestra "1 de 3" para saber cuántas órdenes hay

### 🎨 Notificación Visual (Modal Centrado con Cola)
- **Ubicación**: Centro de la pantalla (modal)
- **Duración**: 10 segundos por orden (auto-avance)
- **Backdrop**: Fondo oscuro con blur
- **Sistema de Cola**:
  - Muestra una orden a la vez
  - Indicador "1 de 3" en el header
  - Botones "Anterior" y "Siguiente" para navegación manual
  - Auto-avance desactivable (navega manualmente para desactivar)
  - Barra de progreso por cada orden
- **Animaciones**:
  - Pulso en el fondo del header (primeros 2 segundos por orden)
  - Bounce en el ícono principal
  - Ping/pulse en el indicador
  - Swing en la campana
  - Barra de progreso animada
  - Fade in/out suave
  - Scale y translate para entrada/salida
  - Transición suave entre órdenes
- **Información mostrada**:
  - Número de orden (sequence)
  - Valor total destacado
  - Nombre del cliente
  - Método de pago
  - Cantidad de items
  - Origen de la orden
  - Fecha y hora de creación
  - Estado de la orden
  - Contador de órdenes (si hay múltiples)

### 🔊 Notificación Sonora
- Tono simple generado con Web Audio API
- Frecuencia: 800Hz
- Duración: 0.5 segundos
- Volumen: 30% (no intrusivo)
- Manejo de errores: Si falla, no interrumpe la notificación visual

### 🌐 Disponibilidad Global
- Aparece en **TODAS las pestañas** del dashboard:
  - ✅ Resumen
  - ✅ Categorías
  - ✅ Productos
  - ✅ Delivery
  - ✅ Órdenes
- No importa dónde esté navegando el usuario

## 🔧 Implementación Técnica

### Archivos Modificados

1. **`src/shared/hooks/useSocket.ts`**
   - Detecta nuevas órdenes comparando IDs
   - Usa `useRef` para mantener el historial de IDs
   - Llama a `setNewOrder()` para la primera orden
   - Llama a `addNewOrders()` para las órdenes adicionales
   - Ignora la primera carga para evitar notificaciones falsas

2. **`src/features/orders/components/NewOrderNotification.tsx`**
   - Componente de notificación con sistema de cola
   - Recibe un array de órdenes en lugar de una sola
   - Navegación entre órdenes con botones
   - Auto-avance cada 10 segundos
   - Animaciones CSS personalizadas
   - Sonido con Web Audio API
   - Indicador de progreso "1 de 3"

3. **`src/shared/store/store.ts`**
   - Agregado `newOrdersQueue` para almacenar órdenes pendientes
   - Agregado `addNewOrders()` para agregar múltiples órdenes
   - Agregado `clearAllNewOrders()` para limpiar todo

4. **`src/App.tsx`**
   - Pasa array de órdenes al componente de notificación
   - Combina `newOrder` y `newOrdersQueue`
   - Usa `clearAllNewOrders()` al cerrar

### Flujo de Datos

```
1. Servidor emite 'orders:update' cada 30 segundos
   ↓
2. useSocket.ts recibe las órdenes
   ↓
3. Compara IDs con previousOrderIdsRef
   ↓
4. Si hay nuevas órdenes:
   - Primera orden → setNewOrder()
   - Resto de órdenes → addNewOrders()
   ↓
5. useUIStore actualiza 'newOrder' y 'newOrdersQueue'
   ↓
6. NewOrderNotification recibe array combinado
   ↓
7. Muestra primera orden con animaciones + sonido
   ↓
8. Auto-avance cada 10 segundos a la siguiente orden
   ↓
9. Usuario puede navegar manualmente (desactiva auto-avance)
   ↓
10. Después de la última orden → auto-cierre
```

### Flujo de Cola de Órdenes

```
Ejemplo: Llegan 3 órdenes nuevas (#1001, #1002, #1003)

Estado inicial:
  newOrder: null
  newOrdersQueue: []

Después de detección:
  newOrder: #1001
  newOrdersQueue: [#1002, #1003]

Componente recibe:
  orders: [#1001, #1002, #1003]
  currentIndex: 0

Usuario ve:
  "¡Nuevas Órdenes!" (1 de 3)
  [Orden #1001]
  [Anterior] [Siguiente]

Después de 10 segundos (auto-avance):
  currentIndex: 1
  "¡Nuevas Órdenes!" (2 de 3)
  [Orden #1002]

Si usuario hace clic en "Anterior":
  currentIndex: 0
  autoAdvance: false (desactivado)
  "Navegación manual activada (1/3)"
```

## 🧪 Cómo Probar

### Opción 1: Esperar una orden real
1. Iniciar el servidor: `cd server && npm run dev`
2. Iniciar el cliente: `npm run dev`
3. Esperar a que llegue una nueva orden desde VTEX
4. La notificación aparecerá automáticamente

### Opción 2: Simular una orden nueva (desarrollo)
Para probar sin esperar órdenes reales, puedes modificar temporalmente el servidor para simular nuevas órdenes:

```typescript
// En server/src/presentation/websocket/SocketHandler.ts
// Agregar una orden ficticia al array de órdenes cada vez que se sincroniza
```

### Opción 3: Forzar refresh
1. Hacer clic en el botón "Actualizar" del dashboard
2. Si hay órdenes nuevas desde la última sincronización, aparecerá la notificación

## 🎛️ Configuración

### Cambiar duración de la notificación
En `NewOrderNotification.tsx`, línea ~52:
```typescript
const closeTimer = setTimeout(() => {
  handleClose();
}, 10000); // ← Cambiar este valor (en milisegundos)
```

### Desactivar el sonido
En `NewOrderNotification.tsx`, comentar el bloque de código (líneas ~25-42):
```typescript
// try {
//   const audioContext = new (window.AudioContext || ...
//   ...
// } catch (err) { ... }
```

### Cambiar estilo del modal
El modal está centrado usando flexbox. Para modificar el tamaño:
```tsx
<div className={`... w-full max-w-lg ...`}>
//                           ↑
//                      max-w-lg (512px)
// Opciones: max-w-sm (384px), max-w-md (448px), max-w-lg (512px), max-w-xl (576px)
```

## 🐛 Troubleshooting

### La notificación no aparece
1. Verificar que el servidor esté corriendo
2. Verificar conexión WebSocket (debe decir "En línea" en el header)
3. Abrir consola del navegador y buscar: `🆕 Nueva orden detectada:`
4. Verificar que haya órdenes nuevas (no aparece en la primera carga)

### El sonido no se reproduce
- Algunos navegadores bloquean audio automático
- El usuario debe haber interactuado con la página primero
- Verificar que el volumen del navegador no esté silenciado

### La notificación aparece múltiples veces
- Esto no debería ocurrir gracias al sistema de tracking de IDs
- Si ocurre, verificar que `previousOrderIdsRef` se esté actualizando correctamente

## 📊 Logs de Consola

Cuando se detecta una nueva orden, verás en la consola:
```
🆕 Nueva orden detectada: v123456789abc-01 1234567
                          ↑                  ↑
                          orderId            sequence
```

## 🚀 Mejoras Futuras

- [ ] Agregar configuración de usuario para activar/desactivar sonido
- [ ] Permitir elegir diferentes tonos de notificación
- [ ] Agregar notificaciones del navegador (Notification API)
- [ ] Mostrar múltiples notificaciones si llegan varias órdenes a la vez
- [ ] Agregar botón para ver el detalle de la orden desde la notificación
- [ ] Persistir preferencias de notificación en localStorage
