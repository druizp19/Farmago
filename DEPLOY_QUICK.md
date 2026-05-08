# 🚀 Guía Rápida de Despliegue - FarmaGo Dashboard

**Servidor**: 172.17.1.204  
**Usuario**: admin / farmago2026

---

## 1️⃣ Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Apache
sudo apt install -y apache2

# Habilitar módulos de Apache
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers
sudo systemctl restart apache2

# Instalar Redis (opcional)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Instalar PM2
sudo npm install -g pm2
```

---

## 2️⃣ Copiar Proyecto

```bash
# Crear directorio
sudo mkdir -p /var/www/farmago
sudo chown -R $USER:www-data /var/www/farmago

# Copiar archivos (desde tu máquina Windows con PowerShell)
# scp -r "C:\Users\druizp\OneDrive - Medifarma S.A\Escritorio\dashboard_farmago\*" usuario@172.17.1.204:/var/www/farmago/
```

---

## 3️⃣ Configurar Variables

```bash
cd /var/www/farmago
cp .env.production .env
```

---

## 4️⃣ Compilar Proyecto

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

---

## 5️⃣ Configurar Apache

```bash
sudo nano /etc/apache2/sites-available/farmago.conf
```

Pegar:

```apache
<VirtualHost *:80>
    ServerName 172.17.1.204
    DocumentRoot /var/www/farmago/dist

    <Directory /var/www/farmago/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ProxyPreserveHost On
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api
    ProxyPass /socket.io http://localhost:3001/socket.io
    ProxyPassReverse /socket.io http://localhost:3001/socket.io

    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /socket.io/(.*) ws://localhost:3001/socket.io/$1 [P,L]

    ErrorLog ${APACHE_LOG_DIR}/farmago-error.log
    CustomLog ${APACHE_LOG_DIR}/farmago-access.log combined
</VirtualHost>
```

Activar:

```bash
sudo a2dissite 000-default.conf
sudo a2ensite farmago.conf
sudo apache2ctl configtest
sudo systemctl restart apache2
```

---

## 6️⃣ Configurar PM2

```bash
cd /var/www/farmago
nano ecosystem.config.js
```

Pegar:

```javascript
module.exports = {
  apps: [{
    name: 'farmago-backend',
    cwd: '/var/www/farmago/server',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '500M',
    env: { NODE_ENV: 'production', PORT: 3001 },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    time: true
  }]
};
```

Iniciar:

```bash
mkdir -p logs
pm2 start ecosystem.config.js
pm2 startup systemd
# Ejecutar el comando que PM2 muestre
pm2 save
```

---

## 7️⃣ Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## ✅ Verificar

```bash
# Backend
pm2 status
curl http://localhost:3001/api/health

# Apache
sudo systemctl status apache2

# Navegador
# http://172.17.1.204
```

---

## 📊 Comandos Útiles

```bash
# Ver logs backend
pm2 logs farmago-backend

# Reiniciar backend
pm2 restart farmago-backend

# Ver logs Apache
sudo tail -f /var/log/apache2/farmago-error.log

# Reiniciar Apache
sudo systemctl restart apache2
```

---

## 🔄 Actualizar Aplicación

```bash
cd /var/www/farmago

# Frontend
npm run build

# Backend
cd server
npm run build
cd ..

# Reiniciar
pm2 restart farmago-backend
sudo systemctl restart apache2
```

---

## 🐛 Problemas Comunes

**502 Bad Gateway**
```bash
pm2 restart farmago-backend
sudo systemctl restart apache2
```

**Página en blanco**
```bash
sudo chmod -R 755 /var/www/farmago/dist
sudo systemctl restart apache2
```

**WebSocket no conecta**
```bash
sudo a2enmod proxy_wstunnel
sudo systemctl restart apache2
```

---

**¡Listo!** 🎉
