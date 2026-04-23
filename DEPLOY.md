# 🚀 Guía de Despliegue - FarmaGo Dashboard

**Servidor**: 190.187.184.138  
**Usuario**: denis  
**Ruta del proyecto**: /home/denis/Documents/Farmago  
**Dashboard**: http://190.187.184.138  
**API**: http://190.187.184.138:3001

---

## 📦 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Nginx
sudo apt install -y nginx

# Instalar Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar instalaciones
node --version  # Debe ser v18+
nginx -v
redis-cli ping  # Debe responder PONG
```

---

## 📁 2. Verificar el Proyecto

```bash
# Ir al directorio del proyecto
cd /home/denis/Documents/Farmago

# Verificar que existe
pwd
ls -la
```

---

## ⚙️ 3. Configurar Variables de Entorno

```bash
# Ir al directorio del proyecto
cd /home/denis/Documents/Farmago

# Crear archivo .env
nano .env
```

Pegar este contenido EXACTO:
```
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://190.187.184.138,http://190.187.184.138:80,http://localhost:5173
REDIS_URL=redis://localhost:6379
VITE_API_URL=http://190.187.184.138:3001
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

Verificar:
```bash
cat .env
```

---

## 🔨 4. Compilar el Proyecto

```bash
# Asegurarse de estar en el directorio correcto
cd /home/denis/Documents/Farmago

# Instalar dependencias del frontend
npm install

# Compilar frontend
npm run build

# Instalar dependencias del backend
cd server
npm install

# Compilar backend
npm run build

# Volver a la raíz
cd ..

# Verificar que se crearon las carpetas
ls -la dist/           # Frontend compilado
ls -la server/dist/    # Backend compilado
```

---

## 🌐 5. Configurar Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/farmago-dashboard
```

Pegar este contenido:

```nginx
server {
    listen 80;
    server_name 190.187.184.138;

    # Frontend estático
    location / {
        root /home/denis/Documents/Farmago/dist;
        try_files $uri $uri/ /index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Activar el sitio:
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/farmago-dashboard /etc/nginx/sites-enabled/

# Eliminar sitio por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔧 6. Configurar Backend como Servicio

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/farmago-backend.service
```

Pegar este contenido:

```ini
[Unit]
Description=FarmaGo Dashboard Backend
After=network.target redis-server.service

[Service]
Type=simple
User=denis
WorkingDirectory=/home/denis/Documents/Farmago/server
EnvironmentFile=/home/denis/Documents/Farmago/.env
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Activar el servicio:
```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable farmago-backend

# Iniciar servicio
sudo systemctl start farmago-backend

# Verificar estado
sudo systemctl status farmago-backend
```

---

## 🔒 7. Configurar Firewall

```bash
# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS (para futuro)
sudo ufw allow 443/tcp

# Permitir SSH
sudo ufw allow 22/tcp

# Habilitar firewall
sudo ufw enable

# Verificar
sudo ufw status
```

---

## ✅ 8. Verificar Instalación

```bash
# Verificar backend
curl http://localhost:3001/api/health
# Debe responder: {"status":"ok"}

# Verificar logs del backend
sudo journalctl -u farmago-backend -n 20

# Verificar Nginx
sudo systemctl status nginx

# Verificar Redis
redis-cli ping
# Debe responder: PONG
```

**Abrir en navegador**: http://190.187.184.138

---

## 🐛 Solución de Problemas

### Error: "Missing required environment variables" (TU ERROR ACTUAL)

```bash
# 1. Ir al directorio del proyecto
cd /home/denis/Documents/Farmago

# 2. Verificar que .env existe
ls -la .env

# 3. Si no existe, crearlo
nano .env
```

Pegar:
```
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://190.187.184.138,http://190.187.184.138:80,http://localhost:5173
REDIS_URL=redis://localhost:6379
VITE_API_URL=http://190.187.184.138:3001
```

```bash
# 4. Verificar contenido
cat .env

# 5. Verificar que el servicio tiene la ruta correcta
sudo nano /etc/systemd/system/farmago-backend.service
```

Debe tener:
```ini
WorkingDirectory=/home/denis/Documents/Farmago/server
EnvironmentFile=/home/denis/Documents/Farmago/.env
```

```bash
# 6. Recargar y reiniciar
sudo systemctl daemon-reload
sudo systemctl restart farmago-backend

# 7. Ver logs en tiempo real
sudo journalctl -u farmago-backend -f
```

### Backend no inicia
```bash
# Ver logs completos
sudo journalctl -u farmago-backend -n 50

# Verificar puerto
sudo netstat -tulpn | grep 3001

# Reiniciar
sudo systemctl restart farmago-backend
```

### Error 502 Bad Gateway
```bash
# El backend no está corriendo
sudo systemctl status farmago-backend
sudo systemctl start farmago-backend
```

### Error de CORS
```bash
# Verificar .env
cat /home/denis/Documents/Farmago/.env | grep CORS_ORIGINS
# Debe incluir: http://190.187.184.138

# Si no, editar y reiniciar
nano /home/denis/Documents/Farmago/.env
sudo systemctl restart farmago-backend
```

### Frontend en blanco
```bash
# Verificar que dist/ existe
ls -la /home/denis/Documents/Farmago/dist/

# Verificar permisos
sudo chmod -R 755 /home/denis/Documents/Farmago/dist/

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Actualizar la Aplicación

```bash
# Ir al directorio del proyecto
cd /home/denis/Documents/Farmago

# Descargar cambios (si usas Git)
git pull origin main

# Instalar dependencias (si hay cambios)
npm install
cd server && npm install && cd ..

# Recompilar
npm run build
cd server && npm run build && cd ..

# Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart nginx
```

---

## 📊 Comandos Útiles

```bash
# Ver logs del backend en tiempo real
sudo journalctl -u farmago-backend -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar backend
sudo systemctl restart farmago-backend

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver estado de servicios
sudo systemctl status farmago-backend
sudo systemctl status nginx
sudo systemctl status redis-server

# Ver puertos abiertos
sudo netstat -tulpn | grep LISTEN

# Ir al directorio del proyecto
cd /home/denis/Documents/Farmago
```

---

## 🔐 Seguridad Adicional (Opcional)

### Configurar HTTPS con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 190.187.184.138

# Actualizar CORS en .env
nano /home/denis/Documents/Farmago/.env
# Cambiar a: CORS_ORIGINS=https://190.187.184.138
sudo systemctl restart farmago-backend
```

---

## ✅ Checklist Final

- [ ] Node.js 18+ instalado
- [ ] Nginx instalado y corriendo
- [ ] Redis instalado y corriendo
- [ ] Proyecto en `/home/denis/Documents/Farmago`
- [ ] Archivo `.env` creado en `/home/denis/Documents/Farmago/.env`
- [ ] Frontend compilado (`dist/` existe)
- [ ] Backend compilado (`server/dist/` existe)
- [ ] Nginx configurado con ruta correcta
- [ ] Servicio systemd configurado con rutas correctas
- [ ] Firewall configurado
- [ ] Dashboard accesible: http://190.187.184.138
- [ ] API responde: http://190.187.184.138/api/health
- [ ] WebSocket conectado (sin errores en consola)
- [ ] Datos cargando correctamente

---

## 🎉 ¡Listo!

Tu dashboard está funcionando en: **http://190.187.184.138**

Para ver logs en tiempo real:
```bash
sudo journalctl -u farmago-backend -f
```
