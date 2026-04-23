# Guía de Configuración para Producción

## 📋 Checklist Pre-Despliegue

### 1. Variables de Entorno del Servidor

Crea un archivo `.env` en la raíz del proyecto con:

```bash
# VTEX API Credentials (mantener las actuales)
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration - IMPORTANTE: Agregar la IP/dominio del servidor
CORS_ORIGINS=http://TU_IP_SERVIDOR:5173,http://TU_IP_SERVIDOR:3000,http://localhost:5173

# Redis Configuration (opcional pero recomendado para producción)
REDIS_URL=redis://localhost:6379

# Frontend API URL - NO SE USA EN EL SERVIDOR
# VITE_API_URL=http://TU_IP_SERVIDOR:3001
```

**⚠️ IMPORTANTE:** Reemplaza `TU_IP_SERVIDOR` con la IP real de tu servidor Linux.

### 2. Variables de Entorno del Frontend

Durante el BUILD del frontend, necesitas configurar:

```bash
# Crear archivo .env.production en la raíz
VITE_API_URL=http://TU_IP_SERVIDOR:3001
```

### 3. Configuración de CORS

El servidor ya está configurado para aceptar múltiples orígenes. Solo necesitas:

1. Editar el archivo `.env` en el servidor
2. Actualizar `CORS_ORIGINS` con las URLs desde donde se accederá:
   - Si accedes desde `http://192.168.1.100:5173` → agregar esa URL
   - Si usas un dominio → agregar `http://tudominio.com`
   - Si usas HTTPS → agregar `https://tudominio.com`

Ejemplo:
```bash
CORS_ORIGINS=http://192.168.1.100:5173,http://192.168.1.100:3000,https://dashboard.farmago.com
```

## 🚀 Pasos de Despliegue

### Opción A: Despliegue con Build Estático (Recomendado)

#### 1. Build del Frontend
```bash
# En tu máquina local o en el servidor
npm run build
```

Esto genera la carpeta `dist/` con archivos estáticos.

#### 2. Configurar Nginx (Recomendado)

Instalar Nginx en el servidor:
```bash
sudo apt update
sudo apt install nginx
```

Crear configuración en `/etc/nginx/sites-available/farmago-dashboard`:
```nginx
server {
    listen 80;
    server_name TU_IP_SERVIDOR;  # o tu dominio

    # Frontend estático
    location / {
        root /ruta/a/tu/proyecto/dist;
        try_files $uri $uri/ /index.html;
        
        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Proxy para el backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket para Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/farmago-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. Configurar el Backend como Servicio

Crear archivo `/etc/systemd/system/farmago-backend.service`:
```ini
[Unit]
Description=FarmaGo Dashboard Backend
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/ruta/a/tu/proyecto/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Iniciar el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable farmago-backend
sudo systemctl start farmago-backend
sudo systemctl status farmago-backend
```

### Opción B: Despliegue con PM2 (Alternativa)

#### 1. Instalar PM2
```bash
npm install -g pm2
```

#### 2. Crear archivo `ecosystem.config.js` en la raíz:
```javascript
module.exports = {
  apps: [
    {
      name: 'farmago-backend',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

#### 3. Iniciar con PM2
```bash
# Build del backend
cd server
npm run build

# Iniciar con PM2
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔧 Configuración Adicional

### Firewall (UFW)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp  # Solo si accedes directamente al backend
sudo ufw enable
```

### Redis (Opcional pero Recomendado)
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Node.js (Asegurar versión correcta)
```bash
# Instalar Node.js 18+ usando nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

## 📝 Verificación Post-Despliegue

### 1. Verificar Backend
```bash
curl http://localhost:3001/api/health
```

### 2. Verificar Frontend
Abrir en navegador: `http://TU_IP_SERVIDOR`

### 3. Verificar WebSocket
Abrir consola del navegador y verificar que no haya errores de conexión Socket.IO

### 4. Verificar Logs
```bash
# Si usas systemd
sudo journalctl -u farmago-backend -f

# Si usas PM2
pm2 logs farmago-backend
```

## 🔒 Seguridad Adicional (Recomendado)

### 1. HTTPS con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

### 2. Actualizar CORS para HTTPS
En `.env`:
```bash
CORS_ORIGINS=https://tudominio.com
```

### 3. Variables de Entorno Seguras
- NO subir el archivo `.env` a Git
- Usar permisos restrictivos: `chmod 600 .env`
- Considerar usar un gestor de secretos en producción

## 🐛 Troubleshooting

### Error: CORS
- Verificar que `CORS_ORIGINS` incluya la URL exacta desde donde accedes
- Verificar que no haya espacios en la lista de URLs
- Reiniciar el backend después de cambiar `.env`

### Error: Cannot connect to backend
- Verificar que el backend esté corriendo: `sudo systemctl status farmago-backend`
- Verificar firewall: `sudo ufw status`
- Verificar que el puerto 3001 esté abierto: `netstat -tulpn | grep 3001`

### Error: WebSocket connection failed
- Verificar configuración de Nginx para `/socket.io`
- Verificar que el backend soporte WebSocket upgrades

### Frontend muestra "localhost" en las URLs
- Verificar que el build se hizo con `VITE_API_URL` correcto
- Rebuild el frontend: `npm run build`

## 📊 Monitoreo

### Logs del Sistema
```bash
# Backend logs
sudo journalctl -u farmago-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Métricas con PM2
```bash
pm2 monit
pm2 status
```

## 🔄 Actualización del Sistema

```bash
# 1. Pull cambios
git pull origin main

# 2. Instalar dependencias
npm install
cd server && npm install && cd ..

# 3. Build frontend
npm run build

# 4. Build backend
cd server && npm run build && cd ..

# 5. Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart nginx

# O con PM2
pm2 restart farmago-backend
```

## ✅ Checklist Final

- [ ] Variables de entorno configuradas correctamente
- [ ] CORS incluye la IP/dominio del servidor
- [ ] Backend compilado y corriendo
- [ ] Frontend compilado con la URL correcta del backend
- [ ] Nginx configurado y corriendo
- [ ] Firewall configurado
- [ ] Redis instalado y corriendo (opcional)
- [ ] Logs sin errores
- [ ] Dashboard accesible desde navegador
- [ ] WebSocket conectado correctamente
- [ ] Datos cargando correctamente

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs del backend
2. Revisar logs de Nginx
3. Verificar configuración de CORS
4. Verificar que todas las URLs usen la IP/dominio correcto
