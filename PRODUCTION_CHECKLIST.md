# 🚨 CHECKLIST DE PRODUCCIÓN - Dashboard FarmaGo

## ⚠️ CRÍTICO - SEGURIDAD

### 1. **ARCHIVO .ENV EXPUESTO** 🔴 URGENTE
- **Problema**: El archivo `.env` contiene credenciales sensibles y NO está en `.gitignore`
- **Riesgo**: Credenciales VTEX y SQL Server expuestas en el repositorio
- **Solución**:
  ```bash
  # Agregar a .gitignore
  echo ".env" >> .gitignore
  
  # Si ya fue commiteado, removerlo del historial
  git rm --cached .env
  git commit -m "Remove .env from repository"
  ```
- **Acción**: Rotar INMEDIATAMENTE las credenciales VTEX_APP_KEY y VTEX_APP_TOKEN

### 2. **Credenciales hardcodeadas en server/index.js**
```javascript
// LÍNEA 23-25 - ELIMINAR VALORES POR DEFECTO
const VTEX_ACCOUNT = process.env.VTEX_ACCOUNT || 'medifarmape'; // ❌
const VTEX_APP_KEY = process.env.VTEX_APP_KEY || ''; // ❌
const VTEX_APP_TOKEN = process.env.VTEX_APP_TOKEN || ''; // ❌
```
**Solución**: Lanzar error si no existen las variables de entorno

### 3. **CORS demasiado permisivo**
```javascript
// server/index.js línea 14-16
cors: {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'], // ❌
}
```
**Solución**: Usar variable de entorno para dominios permitidos en producción

### 4. **URL del servidor hardcodeada**
```javascript
// src/hooks/useOrders.ts línea 9
const SERVER_URL = 'http://localhost:3001'; // ❌
```
**Solución**: Usar variable de entorno

---

## 🐛 BUGS Y ERRORES

### 5. **Manejo de errores insuficiente**
- No hay try-catch en varios lugares críticos
- Errores de red no se manejan adecuadamente
- No hay reintentos automáticos para fallos de conexión

### 6. **Memory leaks potenciales**
- Socket.io no limpia listeners correctamente
- Leaflet maps no se destruyen completamente en cleanup
- Intervalos no se limpian en unmount

### 7. **Race conditions**
- Múltiples llamadas simultáneas a `refresh()` pueden causar duplicados
- No hay debouncing en filtros

---

## 🚀 RENDIMIENTO

### 8. **Console.logs en producción** 🟡
- **Ubicaciones**: 
  - `server/index.js`: 12 console.log
  - `src/hooks/useOrders.ts`: 11 console.log
- **Impacto**: Degradación de rendimiento, información sensible en logs
- **Solución**: Implementar logger condicional

### 9. **Procesamiento ineficiente**
```javascript
// server/index.js línea 86-89
for (let i = 0; i < recentOrders.length; i += CONCURRENCY) {
  const batch = recentOrders.slice(i, i + CONCURRENCY);
  const details = await Promise.all(batch.map(o => fetchOrderDetail(o.orderId)));
}
```
- Procesa TODAS las órdenes en cada refresh (puede ser miles)
- No hay paginación en el procesamiento
- Cache no tiene límite de tamaño

### 10. **Re-renders innecesarios**
- `useOrders` hook recalcula todo en cada cambio de filtro
- Múltiples `useMemo` anidados pueden ser optimizados
- No hay virtualización en tablas grandes

### 11. **Bundle size**
- Leaflet CSS se importa globalmente
- No hay code splitting
- Todas las dependencias se cargan al inicio

---

## 📦 ARQUITECTURA

### 12. **Sin manejo de estado global**
- Todo el estado está en un solo hook gigante
- Difícil de testear y mantener
- Considerar Context API o Zustand

### 13. **Sin validación de datos**
- No se validan respuestas de VTEX API
- Tipos TypeScript no se validan en runtime
- Usar Zod o similar

### 14. **Sin rate limiting**
- API de VTEX puede bloquear por exceso de requests
- No hay throttling en el cliente
- Auto-refresh cada 2 minutos puede ser agresivo

---

## 🔧 CONFIGURACIÓN

### 15. **Variables de entorno faltantes**
Crear archivo `.env.example`:
```env
# VTEX API
VTEX_ACCOUNT=
VTEX_APP_KEY=
VTEX_APP_TOKEN=

# Server
PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=

# SQL Server (si se usa)
SQL_SERVER=
SQL_PORT=
SQL_USER=
SQL_PASSWORD=
SQL_DATABASE=
```

### 16. **Sin configuración de producción**
- No hay `vite.config.ts` para producción
- Falta configuración de build optimizado
- No hay minificación de assets

### 17. **Sin health checks**
- No hay endpoint `/health` para monitoreo
- No hay métricas de servidor
- No hay logging estructurado

---

## 🧪 TESTING

### 18. **Sin tests**
- No hay tests unitarios
- No hay tests de integración
- No hay tests E2E

---

## 📝 DOCUMENTACIÓN

### 19. **README incompleto**
- Falta documentación de instalación
- Falta documentación de deployment
- Falta documentación de variables de entorno

---

## 🔄 CI/CD

### 20. **Sin pipeline**
- No hay GitHub Actions / GitLab CI
- No hay linting automático
- No hay build verification

---

## 🎯 PRIORIDADES PARA PRODUCCIÓN

### ✅ URGENTE - COMPLETADO
1. ✅ Agregar `.env` a `.gitignore`
2. ⚠️ Rotar credenciales VTEX (ACCIÓN MANUAL REQUERIDA)
3. ✅ Remover console.logs (13 en server, 11 en frontend)
4. ✅ Configurar CORS correctamente
5. ✅ Variables de entorno para URLs

### ✅ IMPORTANTE - COMPLETADO
6. ✅ Implementar manejo de errores robusto
7. ✅ Prevenir race conditions
8. ✅ Corregir memory leaks (Leaflet, Socket.io)
9. ✅ Agregar health checks
10. ✅ Graceful shutdown
11. ✅ Sistema de caché inteligente (Redis + Memoria)
12. ✅ Reconexión automática Socket.io

### ⚠️ PENDIENTE (Antes de deploy)
13. ⚠️ Rotar credenciales VTEX en VTEX Admin (MANUAL)
14. ⚠️ Configurar Redis en servidor de producción
15. ⚠️ Configurar variables de entorno en servidor
16. ⚠️ Build y deploy

### 📋 RECOMENDADO (Post-launch)
17. 📋 Implementar tests
18. 📋 Agregar monitoring (Sentry, LogRocket)
19. 📋 Optimizar bundle size
20. 📋 Refactorizar arquitectura

---

## 📋 CÓDIGO PARA IMPLEMENTAR

### Archivo: `server/config.js`
```javascript
import dotenv from 'dotenv';
dotenv.config();

// Validar variables requeridas
const requiredEnvVars = [
  'VTEX_ACCOUNT',
  'VTEX_APP_KEY',
  'VTEX_APP_TOKEN'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  vtex: {
    account: process.env.VTEX_ACCOUNT,
    appKey: process.env.VTEX_APP_KEY,
    appToken: process.env.VTEX_APP_TOKEN,
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
  cache: {
    ordersTTL: 60 * 1000,
    detailsTTL: 10 * 60 * 1000,
  }
};
```

### Archivo: `server/logger.js`
```javascript
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args) => isDev && console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => isDev && console.warn('[WARN]', ...args),
  debug: (...args) => isDev && console.debug('[DEBUG]', ...args),
};
```

### Archivo: `.env.example`
```env
# VTEX API Credentials
VTEX_ACCOUNT=your_account_name
VTEX_APP_KEY=your_app_key
VTEX_APP_TOKEN=your_app_token

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Frontend API URL
VITE_API_URL=http://localhost:3001
```

### Actualizar `.gitignore`
```
# Environment variables
.env
.env.local
.env.production
.env.*.local

# Logs
logs
*.log
npm-debug.log*

# Build
dist
dist-ssr
build

# IDE
.vscode/*
!.vscode/extensions.json
.idea
```

---

## 🚀 COMANDOS DE DEPLOYMENT

### Build para producción
```bash
# Frontend
npm run build

# Verificar build
npm run preview

# Server (con PM2)
pm2 start server/index.js --name farmago-api
pm2 save
pm2 startup
```

### Variables de entorno en servidor
```bash
# Crear archivo .env en servidor
nano .env

# Copiar variables de .env.example
# Llenar con valores reales

# Verificar permisos
chmod 600 .env
```

---

## 📊 MÉTRICAS A MONITOREAR

1. **Tiempo de respuesta API VTEX**
2. **Uso de memoria del servidor**
3. **Número de conexiones Socket.io**
4. **Errores de red**
5. **Tiempo de carga del dashboard**
6. **Rate limit hits**

---

## ✅ CHECKLIST FINAL

- [ ] `.env` en `.gitignore`
- [ ] Credenciales rotadas
- [ ] Console.logs removidos
- [ ] CORS configurado
- [ ] Variables de entorno documentadas
- [ ] Manejo de errores implementado
- [ ] Health check endpoint
- [ ] Build de producción testeado
- [ ] Documentación actualizada
- [ ] Monitoring configurado


## ✅ CHECKLIST FINAL

- [x] `.env` en `.gitignore`
- [ ] Credenciales rotadas (ACCIÓN MANUAL - Ver instrucciones abajo)
- [x] Console.logs removidos (13 en server, 11 en frontend)
- [x] CORS configurado con variables de entorno
- [x] Variables de entorno documentadas
- [x] Manejo de errores implementado
- [x] Race conditions prevenidas
- [x] Memory leaks corregidos
- [x] Health check endpoint
- [x] Graceful shutdown
- [x] Sistema de caché inteligente
- [x] Reconexión automática Socket.io
- [x] Documentación completa
- [ ] Redis configurado en producción
- [ ] Variables de entorno configuradas en servidor
- [ ] Build de producción testeado
- [ ] Deploy completado

---

## 🔐 INSTRUCCIONES PARA ROTAR CREDENCIALES VTEX

### Paso 1: Acceder a VTEX Admin
1. Ir a: `https://{tu-cuenta}.myvtex.com/admin`
2. Navegar a: **Account Settings** > **Account** > **Security**

### Paso 2: Generar Nuevas Credenciales
1. En la sección **Application Keys**, buscar la key actual
2. Hacer clic en **Regenerate** o crear una nueva key
3. Copiar el nuevo `VTEX_APP_KEY` y `VTEX_APP_TOKEN`
4. **IMPORTANTE**: Guardar las credenciales en un lugar seguro

### Paso 3: Actualizar Variables de Entorno
```bash
# En el servidor de producción
nano .env

# Actualizar con las nuevas credenciales
VTEX_APP_KEY=nueva_key_aqui
VTEX_APP_TOKEN=nuevo_token_aqui
```

### Paso 4: Reiniciar Servidor
```bash
pm2 restart farmago-api
```

### Paso 5: Verificar
```bash
# Verificar que el servidor está funcionando
curl http://localhost:3001/api/health

# Verificar logs
pm2 logs farmago-api
```
