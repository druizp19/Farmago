# 📊 Dashboard FarmaGo - VTEX Orders

Dashboard en tiempo real para visualizar y analizar órdenes de VTEX con caché inteligente.

## ✨ Características

- 📈 **KPIs en tiempo real**: Ingresos, órdenes, conversión
- 📊 **Gráficos interactivos**: Ventas por día, categorías, productos
- 🗺️ **Mapa geográfico**: Distribución de órdenes en Perú con Leaflet
- 🔔 **Notificaciones**: Alertas de nuevas órdenes
- 🎯 **Filtros avanzados**: Por fecha, estado, origen, categorías
- ⚡ **Caché inteligente**: Primera carga completa, luego solo últimos 5 días
- 🔄 **Auto-actualización**: Cada 5 minutos
- 💾 **Persistencia**: Redis (o memoria como fallback)

## 🚀 Inicio Rápido

### 1. Clonar e instalar

```bash
git clone <tu-repo>
cd dashboard_farmago
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

```env
VTEX_ACCOUNT=tu_cuenta
VTEX_APP_KEY=tu_app_key
VTEX_APP_TOKEN=tu_app_token
PORT=3001
```

### 3. (Opcional) Instalar Redis

Ver [REDIS_SETUP.md](REDIS_SETUP.md) para instrucciones detalladas.

**Nota**: El servidor funciona sin Redis, pero los datos no persisten entre reinicios.

### 4. Iniciar servidor y frontend

```bash
# Terminal 1: Servidor
npm run server

# Terminal 2: Frontend
npm run dev
```

### 5. Abrir en navegador

```
http://localhost:5173
```

## 📁 Estructura del Proyecto

```
dashboard_farmago/
├── server/
│   ├── index.js          # Servidor Express + Socket.io
│   └── cache.js          # Sistema de caché Redis/Memoria
├── src/
│   ├── components/       # Componentes React
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   └── App.tsx          # Componente principal
├── .env.example         # Plantilla de variables de entorno
├── CACHE_STRATEGY.md    # Documentación de caché
├── REDIS_SETUP.md       # Guía de instalación Redis
└── PRODUCTION_CHECKLIST.md  # Checklist para producción
```

## 🎯 Cómo Funciona el Caché

### Primera Carga (Solo una vez)
1. Servidor inicia
2. Verifica caché → Vacío
3. Descarga TODAS las órdenes desde Nov 2025 (~2-3 min)
4. Guarda en Redis/Memoria
5. Dashboard muestra datos completos

### Cargas Posteriores (Instantáneo)
1. Servidor inicia
2. Carga datos desde caché (~5 seg)
3. Sincroniza solo últimos 5 días (~10 seg)
4. Actualiza estados de órdenes
5. Dashboard listo

### Auto-actualización (Cada 5 min)
1. Descarga últimos 5 días
2. Actualiza estados (pending → invoiced)
3. Agrega órdenes nuevas
4. Notifica a todos los clientes

**Resultado**: 
- ⚡ 95% más rápido después de primera carga
- 📉 90% menos llamadas a API VTEX
- 💰 Menos riesgo de rate limiting

Ver [CACHE_STRATEGY.md](CACHE_STRATEGY.md) para más detalles.

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia Vite dev server
npm run server       # Inicia servidor Express

# Producción
npm run build        # Build para producción
npm run preview      # Preview del build

# Utilidades
npm run lint         # Ejecuta ESLint
```

## 🌐 API Endpoints

```
GET  /api/orders              # Lista de órdenes (paginada)
GET  /api/orders/:orderId     # Detalle de orden
GET  /api/health              # Health check
```

## 🔌 Socket.io Events

```javascript
// Cliente → Servidor
socket.emit('orders:refresh')  // Forzar actualización

// Servidor → Cliente
socket.on('orders:update', data)    // Nuevas órdenes
socket.on('products:update', data)  // Productos actualizados
socket.on('error', error)           // Errores
```

## 📊 Pestañas del Dashboard

### 1. Resumen
- KPI cards (ingresos, órdenes, conversión)
- Gráfico de ingresos por día
- Distribución de estados
- Métodos de pago
- Top clientes
- Mapa de calor por hora
- Mapa geográfico de Perú

### 2. Categorías
- Ventas por categoría
- Ingresos por categoría
- Gráfico de pastel
- Radar de rendimiento
- Tabla resumen con paginación

### 3. Productos
- Top 20 productos
- Ranking con imágenes
- Filtros por categoría

### 4. Órdenes
- Tabla completa de órdenes
- Filtros avanzados
- Modal de detalle

## 🎨 Filtros Disponibles

- **Estado**: Pago pendiente, aprobado, facturado, etc.
- **Fecha**: Rango personalizado
- **Origen**: Marketplace, Fulfillment
- **Método de pago**: Tarjeta, efectivo, etc.
- **Categorías**: 3 niveles jerárquicos con selección múltiple

## 🔐 Seguridad

### ⚠️ IMPORTANTE: Antes de subir a Git

```bash
# 1. Asegurar que .env está en .gitignore
echo ".env" >> .gitignore

# 2. Si ya fue commiteado, removerlo
git rm --cached .env
git commit -m "Remove .env from repository"

# 3. Rotar credenciales VTEX
# Generar nuevas credenciales en VTEX Admin
```

### Variables de Entorno

**NUNCA** commitear:
- ❌ `.env`
- ❌ Credenciales VTEX
- ❌ Tokens de API

**SIEMPRE** commitear:
- ✅ `.env.example` (sin valores reales)
- ✅ Documentación

## 🚀 Deployment

### Preparación

1. Revisar [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)
2. Configurar variables de entorno en servidor
3. Instalar Redis (recomendado)
4. Build del frontend

```bash
npm run build
```

### Con PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar servidor
pm2 start server/index.js --name farmago-api

# Guardar configuración
pm2 save

# Auto-inicio en boot
pm2 startup
```

### Variables de Entorno en Producción

```env
NODE_ENV=production
VTEX_ACCOUNT=tu_cuenta
VTEX_APP_KEY=tu_key
VTEX_APP_TOKEN=tu_token
PORT=3001
CORS_ORIGINS=https://tu-dominio.com
REDIS_URL=redis://tu-redis-server:6379
```

## 📈 Monitoreo

### Health Check

```bash
curl http://localhost:3001/api/health
```

Respuesta:
```json
{
  "status": "ok",
  "cache": "redis",
  "lastSync": "2025-01-15T10:30:00.000Z",
  "totalOrders": 1234
}
```

### Logs

```bash
# Con PM2
pm2 logs farmago-api

# Ver errores
pm2 logs farmago-api --err

# Monitoreo en tiempo real
pm2 monit
```

## 🐛 Troubleshooting

### Problema: "Missing required VTEX environment variables"
**Solución**: Verificar que `.env` existe y tiene las variables correctas

### Problema: "Redis no disponible"
**Solución**: 
- Instalar Redis (ver REDIS_SETUP.md)
- O ignorar, el servidor usa memoria automáticamente

### Problema: "Rate limit exceeded"
**Solución**: 
- Esperar unos minutos
- Reducir frecuencia de auto-sync
- Contactar soporte VTEX para aumentar límite

### Problema: Dashboard no carga datos
**Solución**:
1. Verificar que servidor está corriendo: `http://localhost:3001/api/health`
2. Revisar logs del servidor
3. Verificar credenciales VTEX
4. Verificar CORS en servidor

## 📚 Documentación Adicional

- [CACHE_STRATEGY.md](CACHE_STRATEGY.md) - Estrategia de caché detallada
- [REDIS_SETUP.md](REDIS_SETUP.md) - Instalación de Redis
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Checklist para producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Privado - Medifarma S.A.

## 👥 Contacto

Equipo de Desarrollo - Medifarma S.A.

---

**Nota**: Este proyecto usa datos reales de VTEX. Mantener credenciales seguras.
