# 📦 FarmaGo Dashboard - Listo para Producción

Este proyecto está **100% configurado** para desplegarse en `/Farmago` en el servidor de producción.

## ✅ Cambios Realizados

### Frontend
- ✅ `vite.config.ts` - Configurado con `base: '/Farmago/'`
- ✅ `LoginForm.tsx` - Logo usa `import.meta.env.BASE_URL`
- ✅ `Sidebar.tsx` - Logo usa `import.meta.env.BASE_URL`
- ✅ `socketService.ts` - WebSocket configurado con `path` correcto
- ✅ `DistrictMap.tsx` - GeoJSON usa `import.meta.env.BASE_URL`
- ✅ `PeruMap.tsx` - GeoJSON usa `import.meta.env.BASE_URL`

### Backend
- ✅ `.env.production` - CORS y API_URL incluyen `/Farmago`

### Archivos de Configuración
- ✅ `apache-farmago.conf` - Configuración de Apache lista para usar
- ✅ `ecosystem.config.js` - Configuración de PM2 lista para usar
- ✅ `DEPLOY_SIMPLE.md` - Guía paso a paso simplificada

## 🚀 Despliegue

Sigue la guía en **`DEPLOY_SIMPLE.md`** - son solo 7 pasos:

1. Preparar servidor (Node.js, Apache, PM2)
2. Subir proyecto
3. Configurar variables (`.env`)
4. Compilar (frontend y backend)
5. Configurar Apache
6. Iniciar backend con PM2
7. Verificar

## 📋 Checklist Pre-Despliegue

Antes de subir a Git, verifica:

- [ ] `.env` NO está en el repositorio (está en `.gitignore`)
- [ ] `.env.production` SÍ está en el repositorio (es plantilla)
- [ ] `node_modules/` NO está en el repositorio
- [ ] `dist/` NO está en el repositorio
- [ ] Todos los archivos de configuración están incluidos

## 🔐 Seguridad

**IMPORTANTE**: Después del primer despliegue, cambia las credenciales:

```bash
# En el servidor
nano /var/www/farmago/.env

# Cambiar:
VITE_AUTH_USERNAME=nuevo_usuario
VITE_AUTH_PASSWORD=contraseña_segura

# Recompilar frontend
npm run build
```

## 📊 URLs en Producción

- **Dashboard**: http://172.17.1.204/Farmago
- **API Health**: http://172.17.1.204/Farmago/api/health
- **WebSocket**: ws://172.17.1.204/Farmago/socket.io/

## 🆘 Soporte

Si hay problemas:
1. Revisa `DEPLOY_SIMPLE.md` - sección "Solución de Problemas"
2. Verifica logs: `pm2 logs farmago-backend`
3. Verifica Apache: `sudo tail -f /var/log/apache2/farmago-error.log`

---

**Estado**: ✅ Listo para producción  
**Última actualización**: Mayo 2026
