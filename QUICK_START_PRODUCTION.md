# 🚀 Inicio Rápido - Producción

## Opción 1: Script Automático (Recomendado)

```bash
# Dar permisos de ejecución
chmod +x setup-production.sh

# Ejecutar script
./setup-production.sh
```

El script te pedirá:
1. IP o dominio del servidor (ej: `192.168.1.100`)
2. Puerto del frontend (Enter para usar 80 con Nginx)
3. Confirmación para instalar dependencias
4. Confirmación para compilar el proyecto

## Opción 2: Configuración Manual

### 1. Configurar Backend

Editar `.env` en la raíz:
```bash
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://TU_IP_SERVIDOR,http://TU_IP_SERVIDOR:5173
REDIS_URL=redis://localhost:6379
```

### 2. Configurar Frontend

Crear `.env.production` en la raíz:
```bash
VITE_API_URL=http://TU_IP_SERVIDOR:3001
```

### 3. Compilar

```bash
# Frontend
npm install
npm run build

# Backend
cd server
npm install
npm run build
cd ..
```

### 4. Iniciar Backend

```bash
cd server
node dist/index.js
```

## ✅ Verificación Rápida

### Backend funcionando:
```bash
curl http://localhost:3001/api/health
```

### Frontend compilado:
```bash
ls -la dist/
```

## 🔧 Configuración de Nginx (Recomendado)

Ver archivo `PRODUCTION_SETUP.md` para configuración completa de Nginx.

Configuración básica en `/etc/nginx/sites-available/farmago`:
```nginx
server {
    listen 80;
    server_name TU_IP_SERVIDOR;

    location / {
        root /ruta/completa/al/proyecto/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Activar:
```bash
sudo ln -s /etc/nginx/sites-available/farmago /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🐛 Problemas Comunes

### Error de CORS
- Verificar que `CORS_ORIGINS` en `.env` incluya la URL exacta
- Reiniciar el backend después de cambiar `.env`

### Frontend no conecta al backend
- Verificar que `VITE_API_URL` en `.env.production` sea correcto
- Recompilar el frontend: `npm run build`

### Backend no inicia
- Verificar que el puerto 3001 esté libre: `netstat -tulpn | grep 3001`
- Verificar logs: `cd server && node dist/index.js`

## 📚 Documentación Completa

Para configuración avanzada, ver:
- `PRODUCTION_SETUP.md` - Guía completa de despliegue
- `DEPLOYMENT_GUIDE.md` - Guía de deployment existente

## 🔒 Seguridad

Antes de producción:
- [ ] Cambiar `NODE_ENV=production`
- [ ] Configurar firewall (UFW)
- [ ] Instalar Redis
- [ ] Configurar HTTPS con Let's Encrypt (recomendado)
- [ ] Verificar que `.env` no esté en Git

## 📞 Acceso

Una vez configurado:
- Dashboard: `http://TU_IP_SERVIDOR` (o el puerto configurado)
- API: `http://TU_IP_SERVIDOR:3001/api`

## ⚡ Comandos Útiles

```bash
# Ver logs del backend
cd server && node dist/index.js

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar puertos abiertos
sudo netstat -tulpn | grep LISTEN
```
