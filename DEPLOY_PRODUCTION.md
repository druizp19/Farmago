# 🚀 Despliegue en Producción - FarmaGo Dashboard

**IP del Servidor**: 172.17.1.204  
**Usuario**: (tu usuario actual)  
**Ruta del proyecto**: `/var/www/farmago`  
**Dashboard**: http://172.17.1.204  
**API**: http://172.17.1.204:3001

---

## ✅ CHECKLIST DE PREPARACIÓN

### 1. Archivos de Configuración a Actualizar

#### `.env.production` (Ya existe, actualizar IP)
```bash
# Actualizar con la nueva IP
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB

PORT=3001
NODE_ENV=production

# IMPORTANTE: Actualizar con la nueva IP
CORS_ORIGINS=http://172.17.1.204,http://172.17.1.204:80,http://172.17.1.204:3001

# Redis (si está instalado)
REDIS_URL=redis://localhost:6379

# Frontend API URL
VITE_API_URL=http://172.17.1.204:3001

# Credenciales de autenticación
VITE_AUTH_USERNAME=admin
VITE_AUTH_PASSWORD=farmago2026
```

---

## 📋 PASOS PARA DESPLEGAR

### Paso 1: Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+ (si no está instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versión
node --version  # Debe ser v18 o superior
npm --version

# Instalar Apache
sudo apt install -y apache2

# Habilitar módulos necesarios de Apache
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers

# Reiniciar Apache para aplicar módulos
sudo systemctl restart apache2

# Instalar Redis (opcional pero recomendado)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar Redis
redis-cli ping  # Debe responder: PONG
```

### Paso 2: Crear Directorio del Proyecto

```bash
# Crear directorio
sudo mkdir -p /var/www/farmago

# Dar permisos a tu usuario
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

### Paso 3: Copiar el Proyecto

```bash
# Opción A: Si ya tienes el proyecto en el servidor
cp -r /ruta/actual/del/proyecto/* /var/www/farmago/

# Opción B: Subir desde tu máquina local usando SCP
# Desde tu máquina Windows (PowerShell):
# scp -r C:\Users\druizp\OneDrive - Medifarma S.A\Escritorio\dashboard_farmago\* usuario@172.17.1.204:/var/www/farmago/

# Dar permisos
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

### Paso 4: Configurar Variables de Entorno

```bash
cd /var/www/farmago

# Copiar el archivo de producción
cp .env.production .env

# Editar si es necesario
nano .env

# Verificar que la IP sea correcta
cat .env | grep CORS_ORIGINS
cat .env | grep VITE_API_URL
```

### Paso 5: Compilar el Proyecto

```bash
cd /var/www/farmago

# Instalar dependencias del frontend
npm install

# Compilar frontend
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/

# Compilar backend
cd server
npm install
npm run build

# Verificar que se creó server/dist
ls -la dist/

cd ..
```

### Paso 6: Configurar Apache

```bash
# Deshabilitar sitio por defecto
sudo a2dissite 000-default.conf

# Crear archivo de configuración para FarmaGo
sudo nano /etc/apache2/sites-available/farmago-dashboard.conf
```

Pegar este contenido:

```apache
<VirtualHost *:80>
    ServerName 172.17.1.204
    ServerAdmin admin@farmago.com

    # Directorio del frontend
    DocumentRoot /var/www/farmago/dist

    # Configuración del directorio
    <Directory /var/www/farmago/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Rewrite para SPA (Single Page Application)
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Proxy para el backend API
    ProxyPreserveHost On
    ProxyRequests Off

    # API endpoints
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    # WebSocket para Socket.IO
    ProxyPass /socket.io http://localhost:3001/socket.io
    ProxyPassReverse /socket.io http://localhost:3001/socket.io
    
    # Configuración para WebSocket
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://localhost:3001/socket.io/$1 [P,L]

    # Headers de seguridad
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    # Logs
    ErrorLog ${APACHE_LOG_DIR}/farmago-error.log
    CustomLog ${APACHE_LOG_DIR}/farmago-access.log combined

    # Timeout para conexiones largas (WebSocket)
    ProxyTimeout 300
</VirtualHost>
```

Guardar: `Ctrl+O`, Enter, `Ctrl+X`

Activar el sitio:

```bash
# Habilitar el sitio
sudo a2ensite farmago-dashboard.conf

# Verificar configuración
sudo apache2ctl configtest
# Debe decir: Syntax OK

# Si todo está OK, reiniciar Apache
sudo systemctl restart apache2
sudo systemctl enable apache2

# Verificar que Apache está corriendo
sudo systemctl status apache2
```

### Paso 7: Configurar Backend como Servicio

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
User=$USER
WorkingDirectory=/var/www/farmago/server
EnvironmentFile=/var/www/farmago/.env
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=farmago-backend

[Install]
WantedBy=multi-user.target
```

**IMPORTANTE**: Reemplaza `$USER` con tu nombre de usuario real.

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

# Ver logs
sudo journalctl -u farmago-backend -n 50
```

### Paso 8: Configurar Firewall

```bash
# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS (para futuro)
sudo ufw allow 443/tcp

# Permitir SSH (si no está permitido)
sudo ufw allow 22/tcp

# Habilitar firewall (si no está habilitado)
sudo ufw enable

# Verificar reglas
sudo ufw status
```

---

## ✅ VERIFICACIÓN

### 1. Verificar Backend

```bash
# Verificar que el servicio está corriendo
sudo systemctl status farmago-backend

# Verificar que el puerto 3001 está escuchando
sudo netstat -tulpn | grep 3001

# Probar el endpoint de salud
curl http://localhost:3001/api/health
# Debe responder: {"status":"ok"}

# Ver logs en tiempo real
sudo journalctl -u farmago-backend -f
```

### 2. Verificar Apache

```bash
# Verificar que Apache está corriendo
sudo systemctl status apache2

# Verificar configuración
sudo apache2ctl configtest

# Ver logs de Apache
sudo tail -f /var/log/apache2/farmago-error.log
sudo tail -f /var/log/apache2/farmago-access.log
```

### 3. Verificar Frontend

```bash
# Verificar que los archivos existen
ls -la /var/www/farmago/dist/
ls -la /var/www/farmago/dist/assets/

# Verificar permisos
ls -ld /var/www/farmago/dist/
# Debe mostrar: drwxr-xr-x ... usuario www-data ...

# Probar desde el servidor
curl http://localhost/ | head -20
```

### 4. Verificar desde el Navegador

Abrir en el navegador: **http://172.17.1.204**

Deberías ver:
- ✅ Pantalla de login
- ✅ Sin errores en la consola del navegador (F12)
- ✅ WebSocket conectado (ver en Network > WS)
- ✅ Datos cargando correctamente

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: Backend no inicia

```bash
# Ver logs detallados
sudo journalctl -u farmago-backend -n 100 --no-pager

# Verificar que el archivo .env existe
cat /var/www/farmago/.env

# Verificar que server/dist existe
ls -la /var/www/farmago/server/dist/

# Intentar iniciar manualmente para ver errores
cd /var/www/farmago/server
node dist/index.js
```

### Error: 502 Bad Gateway o Proxy Error

Significa que Apache no puede conectarse al backend:

```bash
# Verificar que el backend está corriendo
sudo systemctl status farmago-backend

# Verificar puerto 3001
sudo netstat -tulpn | grep 3001

# Reiniciar backend
sudo systemctl restart farmago-backend

# Ver logs
sudo journalctl -u farmago-backend -f

# Verificar módulos de Apache
sudo apache2ctl -M | grep proxy
# Debe mostrar: proxy_module, proxy_http_module, proxy_wstunnel_module

# Si faltan módulos, habilitarlos
sudo a2enmod proxy proxy_http proxy_wstunnel
sudo systemctl restart apache2
```

### Error: Página en blanco

```bash
# Verificar que dist/ tiene contenido
ls -la /var/www/farmago/dist/
ls -la /var/www/farmago/dist/assets/

# Verificar permisos
sudo chmod -R 755 /var/www/farmago/dist
sudo chown -R $USER:www-data /var/www/farmago/dist

# Ver logs de Apache
sudo tail -f /var/log/apache2/farmago-error.log

# Verificar DocumentRoot en Apache
sudo apache2ctl -S | grep DocumentRoot
```

### Error: CORS

```bash
# Verificar CORS_ORIGINS en .env
cat /var/www/farmago/.env | grep CORS_ORIGINS

# Debe incluir: http://172.17.1.204

# Si no, editar
nano /var/www/farmago/.env

# Reiniciar backend
sudo systemctl restart farmago-backend
```

### Error: WebSocket no conecta

```bash
# Verificar que el backend está corriendo
sudo systemctl status farmago-backend

# Verificar logs
sudo journalctl -u farmago-backend -f

# Verificar que el módulo proxy_wstunnel está habilitado
sudo apache2ctl -M | grep proxy_wstunnel

# Si no está, habilitarlo
sudo a2enmod proxy_wstunnel
sudo systemctl restart apache2

# Ver logs de Apache
sudo tail -f /var/log/apache2/farmago-error.log
```

### Error: Forbidden (403)

```bash
# Verificar permisos del directorio
ls -ld /var/www/farmago/dist/

# Dar permisos correctos
sudo chown -R $USER:www-data /var/www/farmago/dist
sudo chmod -R 755 /var/www/farmago/dist

# Verificar que Apache puede leer el directorio
sudo -u www-data ls /var/www/farmago/dist/

# Reiniciar Apache
sudo systemctl restart apache2
```

---

## 🔄 ACTUALIZAR LA APLICACIÓN

Cuando hagas cambios en el código:

```bash
cd /var/www/farmago

# Subir nuevos archivos (o git pull si usas Git)

# Recompilar frontend
npm install  # Solo si hay nuevas dependencias
npm run build

# Recompilar backend
cd server
npm install  # Solo si hay nuevas dependencias
npm run build
cd ..

# Dar permisos
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago

# Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart apache2

# Verificar
sudo systemctl status farmago-backend
sudo systemctl status apache2
```

---

## 📊 COMANDOS ÚTILES

```bash
# Ver logs del backend en tiempo real
sudo journalctl -u farmago-backend -f

# Ver logs de Apache
sudo tail -f /var/log/apache2/farmago-error.log
sudo tail -f /var/log/apache2/farmago-access.log

# Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart apache2

# Ver estado de servicios
sudo systemctl status farmago-backend
sudo systemctl status apache2
sudo systemctl status redis-server

# Ver puertos abiertos
sudo netstat -tulpn | grep LISTEN

# Ver uso de recursos
htop  # o: top

# Ver espacio en disco
df -h

# Ver uso de memoria
free -h

# Ir al directorio del proyecto
cd /var/www/farmago

# Verificar configuración de Apache
sudo apache2ctl configtest
sudo apache2ctl -S  # Ver sitios configurados
sudo apache2ctl -M  # Ver módulos habilitados
```

---

## ✅ CHECKLIST FINAL

Antes de considerar el despliegue completo:

- [ ] Node.js 18+ instalado
- [ ] Apache instalado y corriendo
- [ ] Módulos de Apache habilitados (proxy, proxy_http, proxy_wstunnel, rewrite, headers)
- [ ] Redis instalado y corriendo (opcional)
- [ ] Proyecto copiado a `/var/www/farmago`
- [ ] Archivo `.env` con IP correcta (172.17.1.204)
- [ ] Frontend compilado (`dist/` existe con archivos)
- [ ] Backend compilado (`server/dist/` existe)
- [ ] Apache configurado correctamente
- [ ] Servicio systemd configurado y corriendo
- [ ] Permisos correctos (755)
- [ ] Firewall configurado
- [ ] Dashboard accesible: http://172.17.1.204
- [ ] API responde: http://172.17.1.204/api/health
- [ ] WebSocket conectado (sin errores en consola)
- [ ] Datos cargando correctamente
- [ ] Login funciona
- [ ] Todos los módulos funcionan (Analytics, Delivery, etc.)

---

## 🎉 ¡LISTO!

Tu dashboard está funcionando en: **http://172.17.1.204**

**Credenciales de acceso**:
- Usuario: `admin`
- Contraseña: `farmago2026`

**IMPORTANTE**: Cambia estas credenciales en producción editando el archivo `.env`:
```bash
nano /var/www/farmago/.env
# Cambiar VITE_AUTH_USERNAME y VITE_AUTH_PASSWORD
# Luego recompilar el frontend:
npm run build
```

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad**: Las credenciales actuales son de desarrollo. Cámbialas en producción.
2. **Backups**: Considera hacer backups regulares de `/var/www/farmago`
3. **Monitoreo**: Revisa los logs regularmente con `journalctl` y logs de Apache
4. **Actualizaciones**: Mantén Node.js y el sistema operativo actualizados
5. **HTTPS**: Considera configurar SSL/TLS para producción (Let's Encrypt con Certbot)
6. **Apache vs Nginx**: Apache es más fácil de configurar pero Nginx es más eficiente para aplicaciones Node.js

---

## 🔒 Configurar HTTPS (Opcional pero Recomendado)

```bash
# Instalar Certbot para Apache
sudo apt install -y certbot python3-certbot-apache

# Obtener certificado SSL (requiere dominio)
# Si tienes un dominio apuntando a 172.17.1.204:
sudo certbot --apache -d tudominio.com

# Si solo usas IP, puedes usar un certificado autofirmado:
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/farmago-selfsigned.key \
  -out /etc/ssl/certs/farmago-selfsigned.crt

# Luego actualizar la configuración de Apache para usar HTTPS
```

---

## 🆘 SOPORTE

Si encuentras problemas:

1. Revisa los logs: `sudo journalctl -u farmago-backend -n 100`
2. Revisa logs de Apache: `sudo tail -f /var/log/apache2/farmago-error.log`
3. Verifica la configuración: `sudo apache2ctl configtest`
4. Verifica que todos los servicios estén corriendo
5. Revisa la sección de "Solución de Problemas" arriba


### Paso 2: Crear Directorio del Proyecto

```bash
# Crear directorio
sudo mkdir -p /var/www/farmago

# Dar permisos a tu usuario
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

### Paso 3: Copiar el Proyecto

```bash
# Opción A: Si ya tienes el proyecto en el servidor
cp -r /ruta/actual/del/proyecto/* /var/www/farmago/

# Opción B: Subir desde tu máquina local usando SCP
# Desde tu máquina Windows (PowerShell):
# scp -r C:\Users\druizp\OneDrive - Medifarma S.A\Escritorio\dashboard_farmago\* usuario@172.17.1.204:/var/www/farmago/

# Dar permisos
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

### Paso 4: Configurar Variables de Entorno

```bash
cd /var/www/farmago

# Copiar el archivo de producción
cp .env.production .env

# Editar si es necesario
nano .env

# Verificar que la IP sea correcta
cat .env | grep CORS_ORIGINS
cat .env | grep VITE_API_URL
```

### Paso 5: Compilar el Proyecto

```bash
cd /var/www/farmago

# Instalar dependencias del frontend
npm install

# Compilar frontend
npm run build

# Verificar que se creó la carpeta dist
ls -la dist/

# Compilar backend
cd server
npm install
npm run build

# Verificar que se creó server/dist
ls -la dist/

cd ..
```

### Paso 6: Configurar Nginx

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/farmago-dashboard
```

Pegar este contenido (con la IP correcta):

```nginx
server {
    listen 80;
    server_name 172.17.1.204;

    # Frontend estático
    location / {
        root /var/www/farmago/dist;
        try_files $uri $uri/ /index.html;
        
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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

# Si todo está OK, reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Paso 7: Configurar Backend como Servicio

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
User=$USER
WorkingDirectory=/var/www/farmago/server
EnvironmentFile=/var/www/farmago/.env
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=farmago-backend

[Install]
WantedBy=multi-user.target
```

**IMPORTANTE**: Reemplaza `$USER` con tu nombre de usuario real.

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

# Ver logs
sudo journalctl -u farmago-backend -n 50
```

### Paso 8: Configurar Firewall

```bash
# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS (para futuro)
sudo ufw allow 443/tcp

# Permitir SSH (si no está permitido)
sudo ufw allow 22/tcp

# Habilitar firewall (si no está habilitado)
sudo ufw enable

# Verificar reglas
sudo ufw status
```

---

## ✅ VERIFICACIÓN

### 1. Verificar Backend

```bash
# Verificar que el servicio está corriendo
sudo systemctl status farmago-backend

# Verificar que el puerto 3001 está escuchando
sudo netstat -tulpn | grep 3001

# Probar el endpoint de salud
curl http://localhost:3001/api/health
# Debe responder: {"status":"ok"}

# Ver logs en tiempo real
sudo journalctl -u farmago-backend -f
```

### 2. Verificar Nginx

```bash
# Verificar que Nginx está corriendo
sudo systemctl status nginx

# Verificar configuración
sudo nginx -t

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 3. Verificar Frontend

```bash
# Verificar que los archivos existen
ls -la /var/www/farmago/dist/
ls -la /var/www/farmago/dist/assets/

# Verificar permisos
ls -ld /var/www/farmago/dist/
# Debe mostrar: drwxr-xr-x ... usuario www-data ...

# Probar desde el servidor
curl http://localhost/ | head -20
```

### 4. Verificar desde el Navegador

Abrir en el navegador: **http://172.17.1.204**

Deberías ver:
- ✅ Pantalla de login
- ✅ Sin errores en la consola del navegador (F12)
- ✅ WebSocket conectado (ver en Network > WS)
- ✅ Datos cargando correctamente

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: Backend no inicia

```bash
# Ver logs detallados
sudo journalctl -u farmago-backend -n 100 --no-pager

# Verificar que el archivo .env existe
cat /var/www/farmago/.env

# Verificar que server/dist existe
ls -la /var/www/farmago/server/dist/

# Intentar iniciar manualmente para ver errores
cd /var/www/farmago/server
node dist/index.js
```

### Error: 502 Bad Gateway

Significa que Nginx no puede conectarse al backend:

```bash
# Verificar que el backend está corriendo
sudo systemctl status farmago-backend

# Verificar puerto 3001
sudo netstat -tulpn | grep 3001

# Reiniciar backend
sudo systemctl restart farmago-backend

# Ver logs
sudo journalctl -u farmago-backend -f
```

### Error: Página en blanco

```bash
# Verificar que dist/ tiene contenido
ls -la /var/www/farmago/dist/
ls -la /var/www/farmago/dist/assets/

# Verificar permisos
sudo chmod -R 755 /var/www/farmago/dist

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar configuración de Nginx
sudo nginx -T | grep "root"
```

### Error: CORS

```bash
# Verificar CORS_ORIGINS en .env
cat /var/www/farmago/.env | grep CORS_ORIGINS

# Debe incluir: http://172.17.1.204

# Si no, editar
nano /var/www/farmago/.env

# Reiniciar backend
sudo systemctl restart farmago-backend
```

### Error: WebSocket no conecta

```bash
# Verificar que el backend está corriendo
sudo systemctl status farmago-backend

# Verificar logs
sudo journalctl -u farmago-backend -f

# Verificar configuración de Nginx para WebSocket
sudo nginx -T | grep -A 10 "location /socket.io"

# Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart nginx
```

---

## 🔄 ACTUALIZAR LA APLICACIÓN

Cuando hagas cambios en el código:

```bash
cd /var/www/farmago

# Subir nuevos archivos (o git pull si usas Git)

# Recompilar frontend
npm install  # Solo si hay nuevas dependencias
npm run build

# Recompilar backend
cd server
npm install  # Solo si hay nuevas dependencias
npm run build
cd ..

# Dar permisos
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago

# Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart nginx

# Verificar
sudo systemctl status farmago-backend
```

---

## 📊 COMANDOS ÚTILES

```bash
# Ver logs del backend en tiempo real
sudo journalctl -u farmago-backend -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reiniciar servicios
sudo systemctl restart farmago-backend
sudo systemctl restart nginx

# Ver estado de servicios
sudo systemctl status farmago-backend
sudo systemctl status nginx
sudo systemctl status redis-server

# Ver puertos abiertos
sudo netstat -tulpn | grep LISTEN

# Ver uso de recursos
htop  # o: top

# Ver espacio en disco
df -h

# Ver uso de memoria
free -h

# Ir al directorio del proyecto
cd /var/www/farmago
```

---

## ✅ CHECKLIST FINAL

Antes de considerar el despliegue completo:

- [ ] Node.js 18+ instalado
- [ ] Nginx instalado y corriendo
- [ ] Redis instalado y corriendo (opcional)
- [ ] Proyecto copiado a `/var/www/farmago`
- [ ] Archivo `.env` con IP correcta (172.17.1.204)
- [ ] Frontend compilado (`dist/` existe con archivos)
- [ ] Backend compilado (`server/dist/` existe)
- [ ] Nginx configurado correctamente
- [ ] Servicio systemd configurado y corriendo
- [ ] Permisos correctos (755)
- [ ] Firewall configurado
- [ ] Dashboard accesible: http://172.17.1.204
- [ ] API responde: http://172.17.1.204:3001/api/health
- [ ] WebSocket conectado (sin errores en consola)
- [ ] Datos cargando correctamente
- [ ] Login funciona
- [ ] Todos los módulos funcionan (Analytics, Delivery, etc.)

---

## 🎉 ¡LISTO!

Tu dashboard está funcionando en: **http://172.17.1.204**

**Credenciales de acceso**:
- Usuario: `admin`
- Contraseña: `farmago2026`

**IMPORTANTE**: Cambia estas credenciales en producción editando el archivo `.env`:
```bash
nano /var/www/farmago/.env
# Cambiar VITE_AUTH_USERNAME y VITE_AUTH_PASSWORD
# Luego recompilar el frontend:
npm run build
```

---

## 📝 NOTAS IMPORTANTES

1. **Seguridad**: Las credenciales actuales son de desarrollo. Cámbialas en producción.
2. **Backups**: Considera hacer backups regulares de `/var/www/farmago`
3. **Monitoreo**: Revisa los logs regularmente con `journalctl`
4. **Actualizaciones**: Mantén Node.js y el sistema operativo actualizados
5. **HTTPS**: Considera configurar SSL/TLS para producción (Let's Encrypt)

---

## 🆘 SOPORTE

Si encuentras problemas:

1. Revisa los logs: `sudo journalctl -u farmago-backend -n 100`
2. Verifica la configuración de Nginx: `sudo nginx -t`
3. Verifica que todos los servicios estén corriendo
4. Revisa la sección de "Solución de Problemas" arriba
