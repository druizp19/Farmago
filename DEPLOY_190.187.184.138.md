# 🚀 Guía de Despliegue - Servidor 190.187.184.138

## 📋 Información del Servidor

- **IP**: 190.187.184.138
- **Frontend**: http://190.187.184.138
- **Backend API**: http://190.187.184.138:3001
- **Sistema**: Linux

---

## ⚡ Despliegue Rápido (Paso a Paso)

### 1️⃣ Preparar el Servidor Linux

```bash
# Conectar al servidor
ssh usuario@190.187.184.138

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe ser v18 o superior
npm --version

# Instalar Nginx
sudo apt install -y nginx

# Instalar Redis (recomendado)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Instalar Git (si no está instalado)
sudo apt install -y git
```

### 2️⃣ Clonar o Subir el Proyecto

**Opción A: Con Git**
```bash
cd ~
git clone https://github.com/tu-usuario/farmago-dashboard.git
cd farmago-dashboard
```

**Opción B: Subir archivos con SCP (desde tu máquina local)**
```bash
# Desde tu máquina local
scp -r /ruta/local/farmago-dashboard usuario@190.187.184.138:~/
```

### 3️⃣ Configurar Variables de Entorno

```bash
# En el servidor, dentro del directorio del proyecto
cd ~/farmago-dashboard

# Copiar archivo de configuración de producción
cp .env.production .env

# Verificar que el contenido sea correcto
cat .env
```

El archivo `.env` debe contener:
```bash
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://190.187.184.138,http://190.187.184.138:80,http://190.187.184.138:5173
REDIS_URL=redis://localhost:6379
```

### 4️⃣ Compilar el Frontend

```bash
# Copiar configuración del frontend
cp .env.frontend.production .env.production

# Instalar dependencias
npm install

# Compilar frontend
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/
```

### 5️⃣ Compilar el Backend

```bash
# Ir a la carpeta del servidor
cd server

# Instalar dependencias
npm install

# Compilar backend
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/

# Volver a la raíz
cd ..
```

### 6️⃣ Configurar Nginx

```bash
# Editar el archivo de configuración de Nginx
sudo nano /etc/nginx/sites-available/farmago-dashboard
```

Pegar el siguiente contenido (reemplazar `/home/tu_usuario/farmago-dashboard` con la ruta real):

```nginx
server {
    listen 80;
    server_name 190.187.184.138;

    access_log /var/log/nginx/farmago-access.log;
    error_log /var/log/nginx/farmago-error.log;

    client_max_body_size 10M;

    location / {
        # IMPORTANTE: Reemplazar con tu ruta real
        root /home/tu_usuario/farmago-dashboard/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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

### 7️⃣ Configurar Backend como Servicio

```bash
# Editar archivo de servicio
sudo nano /etc/systemd/system/farmago-backend.service
```

Pegar el siguiente contenido (reemplazar `tu_usuario` y la ruta):

```ini
[Unit]
Description=FarmaGo Dashboard Backend API
After=network.target redis-server.service

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/home/tu_usuario/farmago-dashboard/server
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

### 8️⃣ Configurar Firewall

```bash
# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS (para futuro)
sudo ufw allow 443/tcp

# Permitir SSH (importante!)
sudo ufw allow 22/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## ✅ Verificación

### 1. Verificar Backend
```bash
# Ver logs del backend
sudo journalctl -u farmago-backend -f

# Verificar que esté corriendo
curl http://localhost:3001/api/health
```

### 2. Verificar Nginx
```bash
# Ver logs de Nginx
sudo tail -f /var/log/nginx/farmago-error.log

# Verificar que esté corriendo
sudo systemctl status nginx
```

### 3. Verificar desde Navegador
Abrir en tu navegador:
- **Dashboard**: http://190.187.184.138
- **API Health**: http://190.187.184.138/api/health

---

## 🔧 Comandos Útiles

### Backend
```bash
# Ver logs en tiempo real
sudo journalctl -u farmago-backend -f

# Reiniciar backend
sudo systemctl restart farmago-backend

# Detener backend
sudo systemctl stop farmago-backend

# Ver estado
sudo systemctl status farmago-backend
```

### Nginx
```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de error
sudo tail -f /var/log/nginx/farmago-error.log

# Ver logs de acceso
sudo tail -f /var/log/nginx/farmago-access.log

# Verificar configuración
sudo nginx -t
```

### Sistema
```bash
# Ver puertos abiertos
sudo netstat -tulpn | grep LISTEN

# Ver uso de memoria
free -h

# Ver uso de disco
df -h

# Ver procesos de Node
ps aux | grep node
```

---

## 🔄 Actualizar la Aplicación

```bash
# 1. Conectar al servidor
ssh usuario@190.187.184.138

# 2. Ir al directorio del proyecto
cd ~/farmago-dashboard

# 3. Descargar cambios (si usas Git)
git pull origin main

# 4. Instalar dependencias (si hay cambios)
npm install
cd server && npm install && cd ..

# 5. Recompilar frontend
npm run build

# 6. Recompilar backend
cd server && npm run build && cd ..

# 7. Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart nginx
```

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to backend"
```bash
# Verificar que el backend esté corriendo
sudo systemctl status farmago-backend

# Ver logs del backend
sudo journalctl -u farmago-backend -n 50

# Verificar puerto 3001
sudo netstat -tulpn | grep 3001
```

### Error: "502 Bad Gateway"
```bash
# El backend no está corriendo o no responde
sudo systemctl restart farmago-backend

# Verificar logs de Nginx
sudo tail -f /var/log/nginx/farmago-error.log
```

### Error: "CORS"
```bash
# Verificar configuración de CORS en .env
cat .env | grep CORS_ORIGINS

# Debe incluir: http://190.187.184.138
# Si no, editar y reiniciar backend
nano .env
sudo systemctl restart farmago-backend
```

### Frontend muestra página en blanco
```bash
# Verificar que dist/ existe y tiene archivos
ls -la dist/

# Verificar permisos
sudo chmod -R 755 dist/

# Verificar configuración de Nginx
sudo nginx -t

# Ver logs de Nginx
sudo tail -f /var/log/nginx/farmago-error.log
```

---

## 📊 Monitoreo

### Ver métricas en tiempo real
```bash
# CPU y memoria
htop

# Logs del backend
sudo journalctl -u farmago-backend -f

# Logs de Nginx
sudo tail -f /var/log/nginx/farmago-access.log

# Conexiones activas
sudo netstat -an | grep :3001 | wc -l
```

---

## 🔒 Seguridad Adicional (Recomendado)

### 1. Configurar HTTPS con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 190.187.184.138
```

### 2. Actualizar CORS para HTTPS
```bash
nano .env
# Cambiar CORS_ORIGINS a: https://190.187.184.138
sudo systemctl restart farmago-backend
```

### 3. Configurar fail2ban (protección contra ataques)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📞 URLs de Acceso

- **Dashboard Principal**: http://190.187.184.138
- **API Health Check**: http://190.187.184.138/api/health
- **WebSocket**: ws://190.187.184.138/socket.io

---

## ✅ Checklist Final

- [ ] Node.js 18+ instalado
- [ ] Nginx instalado y configurado
- [ ] Redis instalado y corriendo
- [ ] Proyecto clonado/subido al servidor
- [ ] Archivo `.env` configurado correctamente
- [ ] Frontend compilado (`dist/` existe)
- [ ] Backend compilado (`server/dist/` existe)
- [ ] Servicio systemd configurado y corriendo
- [ ] Nginx configurado y corriendo
- [ ] Firewall configurado
- [ ] Dashboard accesible desde http://190.187.184.138
- [ ] WebSocket conectado (verificar en consola del navegador)
- [ ] Datos cargando correctamente

---

## 📚 Documentación Adicional

- `PRODUCTION_SETUP.md` - Guía completa de producción
- `QUICK_START_PRODUCTION.md` - Inicio rápido
- `nginx.conf` - Configuración de Nginx
- `farmago-backend.service` - Configuración de systemd

---

¡Listo! Tu dashboard debería estar funcionando en http://190.187.184.138 🎉
