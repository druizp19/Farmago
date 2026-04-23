# 🚀 FarmaGo Dashboard - Despliegue en Producción

## 📍 Información del Servidor

- **IP del Servidor**: `190.187.184.138`
- **URL del Dashboard**: http://190.187.184.138
- **URL de la API**: http://190.187.184.138:3001

---

## ⚡ Inicio Rápido

### Archivos de Configuración Listos

Ya están creados los archivos de configuración específicos para tu servidor:

1. ✅ `.env.production` - Configuración del backend
2. ✅ `.env.frontend.production` - Configuración del frontend
3. ✅ `nginx.conf` - Configuración de Nginx
4. ✅ `farmago-backend.service` - Servicio systemd
5. ✅ `DEPLOY_190.187.184.138.md` - Guía paso a paso completa

### Opción 1: Seguir la Guía Completa

```bash
# Abrir la guía específica para tu servidor
cat DEPLOY_190.187.184.138.md
```

Esta guía incluye:
- ✅ Instalación de dependencias (Node.js, Nginx, Redis)
- ✅ Configuración paso a paso
- ✅ Comandos exactos para copiar y pegar
- ✅ Solución de problemas comunes

### Opción 2: Verificar Configuración Actual

Si ya tienes el servidor configurado, verifica que todo esté correcto:

```bash
# Dar permisos de ejecución
chmod +x verify-deployment.sh

# Ejecutar verificación
./verify-deployment.sh
```

---

## 📁 Estructura de Archivos de Configuración

```
farmago-dashboard/
├── .env.production                    # ← Backend config (copiar como .env)
├── .env.frontend.production           # ← Frontend config (copiar como .env.production)
├── nginx.conf                         # ← Nginx config
├── farmago-backend.service            # ← Systemd service
├── DEPLOY_190.187.184.138.md         # ← Guía completa paso a paso
├── verify-deployment.sh               # ← Script de verificación
└── README_DEPLOYMENT.md               # ← Este archivo
```

---

## 🎯 Pasos Resumidos

### En tu Máquina Local (antes de subir al servidor)

```bash
# 1. Configurar frontend para producción
cp .env.frontend.production .env.production

# 2. Compilar frontend
npm install
npm run build

# 3. Subir al servidor (opción A: SCP)
scp -r . usuario@190.187.184.138:~/farmago-dashboard/

# O (opción B: Git)
git push origin main
```

### En el Servidor Linux

```bash
# 1. Conectar al servidor
ssh usuario@190.187.184.138

# 2. Ir al directorio del proyecto
cd ~/farmago-dashboard

# 3. Configurar backend
cp .env.production .env

# 4. Compilar backend
cd server
npm install
npm run build
cd ..

# 5. Configurar Nginx
sudo cp nginx.conf /etc/nginx/sites-available/farmago-dashboard
sudo ln -s /etc/nginx/sites-available/farmago-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 6. Configurar servicio del backend
sudo cp farmago-backend.service /etc/systemd/system/
# Editar el archivo para ajustar rutas y usuario
sudo nano /etc/systemd/system/farmago-backend.service
sudo systemctl daemon-reload
sudo systemctl enable farmago-backend
sudo systemctl start farmago-backend

# 7. Verificar
./verify-deployment.sh
```

---

## ✅ Verificación Rápida

### 1. Backend funcionando
```bash
curl http://localhost:3001/api/health
# Debe responder: {"status":"ok"}
```

### 2. Nginx funcionando
```bash
sudo systemctl status nginx
# Debe mostrar: active (running)
```

### 3. Dashboard accesible
Abrir en navegador: http://190.187.184.138

---

## 🔧 Comandos Útiles

### Ver Logs
```bash
# Backend
sudo journalctl -u farmago-backend -f

# Nginx
sudo tail -f /var/log/nginx/farmago-error.log
```

### Reiniciar Servicios
```bash
# Backend
sudo systemctl restart farmago-backend

# Nginx
sudo systemctl restart nginx
```

### Ver Estado
```bash
# Backend
sudo systemctl status farmago-backend

# Nginx
sudo systemctl status nginx

# Redis
sudo systemctl status redis-server
```

---

## 🐛 Problemas Comunes

### Error: "Cannot connect to backend"
```bash
# Verificar que el backend esté corriendo
sudo systemctl status farmago-backend

# Ver logs
sudo journalctl -u farmago-backend -n 50
```

### Error: "502 Bad Gateway"
```bash
# Reiniciar backend
sudo systemctl restart farmago-backend

# Verificar puerto
sudo netstat -tulpn | grep 3001
```

### Error: "CORS"
```bash
# Verificar configuración
cat .env | grep CORS_ORIGINS

# Debe incluir: http://190.187.184.138
```

---

## 📚 Documentación Completa

- **`DEPLOY_190.187.184.138.md`** - Guía paso a paso completa y detallada
- **`PRODUCTION_SETUP.md`** - Guía general de producción
- **`QUICK_START_PRODUCTION.md`** - Inicio rápido genérico

---

## 🔒 Seguridad

### Configurar HTTPS (Recomendado)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 190.187.184.138
```

### Configurar Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

---

## 📊 Monitoreo

### Verificar que todo funcione
```bash
# Ejecutar script de verificación
./verify-deployment.sh
```

### Ver métricas en tiempo real
```bash
# CPU y memoria
htop

# Logs del backend
sudo journalctl -u farmago-backend -f

# Conexiones activas
sudo netstat -an | grep :3001 | wc -l
```

---

## 🔄 Actualizar la Aplicación

```bash
# 1. Conectar al servidor
ssh usuario@190.187.184.138

# 2. Ir al directorio
cd ~/farmago-dashboard

# 3. Descargar cambios
git pull origin main

# 4. Recompilar
npm run build
cd server && npm run build && cd ..

# 5. Reiniciar
sudo systemctl restart farmago-backend
sudo systemctl restart nginx
```

---

## ✅ Checklist de Despliegue

- [ ] Node.js 18+ instalado
- [ ] Nginx instalado
- [ ] Redis instalado (opcional)
- [ ] Archivo `.env` configurado con IP correcta
- [ ] Frontend compilado (`dist/` existe)
- [ ] Backend compilado (`server/dist/` existe)
- [ ] Nginx configurado y corriendo
- [ ] Servicio systemd configurado y corriendo
- [ ] Firewall configurado
- [ ] Dashboard accesible en http://190.187.184.138
- [ ] API responde en http://190.187.184.138/api/health
- [ ] WebSocket conectado (sin errores en consola)
- [ ] Datos cargando correctamente

---

## 📞 URLs de Acceso

- **Dashboard**: http://190.187.184.138
- **API Health**: http://190.187.184.138/api/health
- **Backend Directo**: http://190.187.184.138:3001/api

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu dashboard debería estar funcionando en:

### 🌐 http://190.187.184.138

---

**¿Necesitas ayuda?** Consulta `DEPLOY_190.187.184.138.md` para la guía completa.
