# 🚀 Despliegue Rápido - FarmaGo Dashboard en /Farmago

**Servidor**: 172.17.1.204  
**URL**: http://172.17.1.204/Farmago  
**Usuario**: admin / farmago2026

---

## 📦 1. Preparar Servidor

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

## 📁 2. Subir Proyecto

```bash
# Crear directorio
sudo mkdir -p /var/www/farmago
sudo chown -R $USER:www-data /var/www/farmago

# Opción A: Clonar desde Git
cd /var/www
git clone <tu-repo> farmago
cd farmago

# Opción B: Subir con SCP desde Windows
# scp -r "C:\ruta\proyecto\*" usuario@172.17.1.204:/var/www/farmago/
```

---

## ⚙️ 3. Configurar Variables

```bash
cd /var/www/farmago
cp .env.production .env
```

**Verificar que `.env` tenga**:
```bash
VITE_API_URL=http://172.17.1.204/Farmago
CORS_ORIGINS=http://172.17.1.204,http://172.17.1.204:80,http://172.17.1.204/Farmago
```

---

## 🔨 4. Compilar

```bash
cd /var/www/farmago

# Frontend
npm install
npm run build

# Backend
cd server
npm install
npm run build
cd ..

# Crear directorio de logs
mkdir -p logs
```

---

## 🌐 5. Configurar Apache

```bash
# Copiar configuración
sudo cp apache-farmago.conf /etc/apache2/sites-available/farmago.conf

# Desactivar sitio por defecto
sudo a2dissite 000-default.conf

# Activar sitio
sudo a2ensite farmago.conf

# Verificar configuración
sudo apache2ctl configtest

# Reiniciar Apache
sudo systemctl restart apache2
```

---

## 🚀 6. Iniciar Backend con PM2

```bash
cd /var/www/farmago

# Iniciar con PM2
pm2 start ecosystem.config.cjs

# Configurar inicio automático
pm2 startup systemd
# Ejecutar el comando que PM2 muestre

# Guardar configuración
pm2 save

# Verificar
pm2 status
```

---

## 🔒 7. Firewall (Opcional)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

---

## ✅ Verificar

```bash
# Backend
pm2 status
curl http://localhost:3001/api/health

# Proxy de Apache
curl http://localhost/Farmago/api/health

# Navegador
# http://172.17.1.204/Farmago
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

# Actualizar código (git pull o subir archivos)

# Recompilar frontend
npm run build

# Recompilar backend
cd server
npm run build
cd ..

# Reiniciar servicios
pm2 restart farmago-backend
sudo systemctl restart apache2
```

---

## 🐛 Solución de Problemas

**502 Bad Gateway**
```bash
pm2 restart farmago-backend
sudo systemctl restart apache2
```

**Página en blanco**
```bash
sudo chown -R www-data:www-data /var/www/farmago/dist
sudo chmod -R 755 /var/www/farmago/dist
sudo systemctl restart apache2
```

**WebSocket no conecta**
```bash
sudo a2enmod proxy_wstunnel
sudo systemctl restart apache2
pm2 logs farmago-backend
```

**Permisos al compilar**
```bash
sudo chown -R $USER:www-data /var/www/farmago
sudo chmod -R 755 /var/www/farmago
```

---

## 📝 Notas Importantes

1. **Todos los archivos ya están configurados** para funcionar en `/Farmago`
2. **No necesitas editar código** - solo seguir los pasos
3. **Limpia el caché del navegador** después del primer despliegue
4. **El backend se conecta automáticamente** cuando un cliente abre la página

---

**¡Listo!** 🎉

Tu dashboard estará en: **http://172.17.1.204/Farmago**
