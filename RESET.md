# 🔄 Desinstalación Completa y Reinstalación desde Cero

## 🗑️ PASO 1: Desinstalar Todo

```bash
# Detener todos los servicios
sudo systemctl stop farmago-backend
sudo systemctl stop nginx
sudo systemctl stop redis-server

# Deshabilitar servicios
sudo systemctl disable farmago-backend
sudo systemctl disable nginx
sudo systemctl disable redis-server

# Eliminar servicio de farmago
sudo rm /etc/systemd/system/farmago-backend.service
sudo systemctl daemon-reload

# Desinstalar Nginx
sudo apt remove --purge nginx nginx-common -y
sudo apt autoremove -y
sudo rm -rf /etc/nginx
sudo rm -rf /var/log/nginx

# Desinstalar Redis
sudo apt remove --purge redis-server -y
sudo apt autoremove -y
sudo rm -rf /etc/redis
sudo rm -rf /var/lib/redis

# Eliminar proyecto de /var/www
sudo rm -rf /var/www/farmago

# Eliminar proyecto de /home/denis (si existe)
rm -rf /home/denis/Documents/Farmago
rm -rf /home/denis/Desktop/Farmago

# Limpiar paquetes
sudo apt clean
sudo apt autoclean

# Verificar que se eliminaron
which nginx          # No debe mostrar nada
which redis-server   # No debe mostrar nada
ls /var/www/         # No debe existir farmago

echo "✅ Todo desinstalado completamente"
```

---

## 🚀 PASO 2: Instalación Limpia desde Cero

### 1. Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # Debe mostrar v18 o superior
npm --version
```

### 3. Instalar Nginx

```bash
sudo apt install -y nginx

# Verificar
nginx -v
sudo systemctl status nginx
```

### 4. Instalar Redis

```bash
sudo apt install -y redis-server

# Habilitar e iniciar
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar
redis-cli ping  # Debe responder: PONG
```

### 5. Crear Directorio del Proyecto

```bash
# Crear directorio en /var/www
sudo mkdir -p /var/www/farmago

# Dar permisos al usuario denis
sudo chown -R denis:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago

# Ir al directorio
cd /var/www/farmago

# Verificar
pwd  # Debe mostrar: /var/www/farmago
```

### 6. Clonar/Subir el Proyecto

**Opción A: Con Git**
```bash
cd /var/www/farmago
git clone https://github.com/tu-usuario/farmago-dashboard.git .
```

**Opción B: Subir archivos manualmente**
- Usar WinSCP, FileZilla o panel de control
- Subir toda la carpeta del proyecto a: `/var/www/farmago`
- Asegurarse de que incluya:
  - package.json
  - src/
  - server/
  - index.html
  - vite.config.ts
  - etc.

**Opción C: Copiar desde otra ubicación**
```bash
# Si ya tienes el proyecto en otra ubicación
sudo cp -r /ruta/origen/* /var/www/farmago/
sudo chown -R denis:www-data /var/www/farmago
```

### 7. Crear archivo .env

```bash
cd /var/www/farmago
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

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

Verificar:
```bash
cat .env
```

### 8. Compilar el Proyecto

```bash
cd /var/www/farmago

# Instalar dependencias del frontend
npm install

# Compilar frontend
npm run build

# Verificar que se creó dist/
ls -la dist/
ls -la dist/assets/

# Instalar dependencias del backend
cd server
npm install

# Compilar backend
npm run build

# Verificar que se creó server/dist/
ls -la dist/

# Volver a la raíz
cd ..

# Dar permisos correctos
sudo chown -R denis:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

### 9. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/farmago-dashboard
```

Pegar:
```nginx
server {
    listen 80;
    server_name 190.187.184.138;

    # Frontend estático
    location / {
        root /var/www/farmago/dist;
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

Activar:
```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/farmago-dashboard /etc/nginx/sites-enabled/

# Eliminar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Debe mostrar: syntax is ok

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar estado
sudo systemctl status nginx
```

### 10. Configurar Backend como Servicio

```bash
sudo nano /etc/systemd/system/farmago-backend.service
```

Pegar:
```ini
[Unit]
Description=FarmaGo Dashboard Backend
After=network.target redis-server.service

[Service]
Type=simple
User=denis
WorkingDirectory=/var/www/farmago/server
EnvironmentFile=/var/www/farmago/.env
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

Activar:
```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable farmago-backend

# Iniciar servicio
sudo systemctl start farmago-backend

# Verificar estado
sudo systemctl status farmago-backend

# Debe mostrar: active (running)
```

### 11. Configurar Firewall

```bash
# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp

# Permitir SSH
sudo ufw allow 22/tcp

# Habilitar firewall
sudo ufw enable

# Verificar
sudo ufw status
```

### 12. Verificar Todo

```bash
# Backend
curl http://localhost:3001/api/health
# Debe responder: {"status":"ok"}

# Frontend
curl http://localhost/ | head -20
# Debe mostrar HTML

# Logs del backend
sudo journalctl -u farmago-backend -n 20
# No debe haber errores

# Estado de servicios
sudo systemctl status nginx
sudo systemctl status farmago-backend
sudo systemctl status redis-server
# Todos deben estar: active (running)

# Verificar archivos
ls -la /var/www/farmago/dist/
ls -la /var/www/farmago/dist/assets/
ls -la /var/www/farmago/server/dist/
# Todos deben existir con archivos
```

### 13. Probar en Navegador

Abrir: **http://190.187.184.138**

Debe cargar el dashboard completo.

---

## ✅ Checklist de Verificación

- [ ] Node.js 18+ instalado
- [ ] Nginx instalado y corriendo
- [ ] Redis instalado y corriendo
- [ ] Proyecto clonado en `/var/www/farmago`
- [ ] Archivo `.env` creado
- [ ] Frontend compilado (`dist/` con archivos)
- [ ] Backend compilado (`server/dist/` con archivos)
- [ ] Configuración de Nginx creada y activada
- [ ] Servicio systemd creado y corriendo
- [ ] Firewall configurado
- [ ] Backend responde en http://localhost:3001/api/health
- [ ] Frontend carga en http://190.187.184.138
- [ ] Sin errores en logs

---

## 🐛 Si Algo Falla

### Backend no inicia
```bash
sudo journalctl -u farmago-backend -n 50
```

### Frontend no carga
```bash
sudo tail -f /var/log/nginx/error.log
```

### Verificar permisos
```bash
ls -la /var/www/farmago/
sudo chown -R denis:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

---

## 📝 Resumen de Ubicaciones

- **Proyecto**: `/var/www/farmago`
- **Frontend compilado**: `/var/www/farmago/dist`
- **Backend compilado**: `/var/www/farmago/server/dist`
- **Variables de entorno**: `/var/www/farmago/.env`
- **Configuración Nginx**: `/etc/nginx/sites-available/farmago-dashboard`
- **Servicio systemd**: `/etc/systemd/system/farmago-backend.service`
- **Logs backend**: `sudo journalctl -u farmago-backend -f`
- **Logs Nginx**: `/var/log/nginx/error.log`

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu dashboard debe estar funcionando en:

**http://190.187.184.138**

Para ver logs en tiempo real:
```bash
sudo journalctl -u farmago-backend -f
```
