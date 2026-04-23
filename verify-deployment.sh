#!/bin/bash

# ============================================================================
# Script de Verificación de Despliegue
# FarmaGo Dashboard - 190.187.184.138
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FarmaGo Dashboard - Verificación de Despliegue          ║${NC}"
echo -e "${BLUE}║  Servidor: 190.187.184.138                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Contador de errores
ERRORS=0

# 1. Verificar Node.js
echo -e "${YELLOW}[1/12]${NC} Verificando Node.js..."
node --version > /dev/null 2>&1
if check "Node.js instalado"; then
    NODE_VERSION=$(node --version)
    echo "       Versión: $NODE_VERSION"
else
    ((ERRORS++))
fi
echo ""

# 2. Verificar npm
echo -e "${YELLOW}[2/12]${NC} Verificando npm..."
npm --version > /dev/null 2>&1
if check "npm instalado"; then
    NPM_VERSION=$(npm --version)
    echo "       Versión: $NPM_VERSION"
else
    ((ERRORS++))
fi
echo ""

# 3. Verificar Nginx
echo -e "${YELLOW}[3/12]${NC} Verificando Nginx..."
systemctl is-active --quiet nginx
if check "Nginx corriendo"; then
    nginx -v 2>&1 | head -n 1
else
    ((ERRORS++))
fi
echo ""

# 4. Verificar Redis
echo -e "${YELLOW}[4/12]${NC} Verificando Redis..."
systemctl is-active --quiet redis-server
if check "Redis corriendo"; then
    redis-cli ping > /dev/null 2>&1 && echo "       Redis responde: PONG"
else
    echo -e "${YELLOW}⚠${NC}  Redis no está corriendo (opcional)"
fi
echo ""

# 5. Verificar archivo .env
echo -e "${YELLOW}[5/12]${NC} Verificando archivo .env..."
if [ -f ".env" ]; then
    check ".env existe"
    if grep -q "CORS_ORIGINS=.*190.187.184.138" .env; then
        check "CORS configurado correctamente"
    else
        echo -e "${RED}✗${NC} CORS no incluye 190.187.184.138"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} .env no existe"
    ((ERRORS++))
fi
echo ""

# 6. Verificar build del frontend
echo -e "${YELLOW}[6/12]${NC} Verificando build del frontend..."
if [ -d "dist" ]; then
    check "Carpeta dist/ existe"
    FILE_COUNT=$(find dist -type f | wc -l)
    echo "       Archivos: $FILE_COUNT"
else
    echo -e "${RED}✗${NC} Carpeta dist/ no existe"
    echo "       Ejecutar: npm run build"
    ((ERRORS++))
fi
echo ""

# 7. Verificar build del backend
echo -e "${YELLOW}[7/12]${NC} Verificando build del backend..."
if [ -d "server/dist" ]; then
    check "Carpeta server/dist/ existe"
    if [ -f "server/dist/index.js" ]; then
        check "index.js compilado"
    else
        echo -e "${RED}✗${NC} index.js no encontrado"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Carpeta server/dist/ no existe"
    echo "       Ejecutar: cd server && npm run build"
    ((ERRORS++))
fi
echo ""

# 8. Verificar servicio del backend
echo -e "${YELLOW}[8/12]${NC} Verificando servicio del backend..."
if systemctl list-unit-files | grep -q farmago-backend; then
    check "Servicio systemd configurado"
    systemctl is-active --quiet farmago-backend
    if check "Backend corriendo"; then
        echo "       Estado: $(systemctl is-active farmago-backend)"
    else
        echo -e "${RED}✗${NC} Backend no está corriendo"
        echo "       Ejecutar: sudo systemctl start farmago-backend"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Servicio systemd no configurado"
    echo "       Ver: farmago-backend.service"
    ((ERRORS++))
fi
echo ""

# 9. Verificar puerto 3001
echo -e "${YELLOW}[9/12]${NC} Verificando puerto 3001..."
if netstat -tuln | grep -q ":3001 "; then
    check "Puerto 3001 abierto"
else
    echo -e "${RED}✗${NC} Puerto 3001 no está escuchando"
    ((ERRORS++))
fi
echo ""

# 10. Verificar configuración de Nginx
echo -e "${YELLOW}[10/12]${NC} Verificando configuración de Nginx..."
if [ -f "/etc/nginx/sites-available/farmago-dashboard" ]; then
    check "Configuración de Nginx existe"
    if [ -L "/etc/nginx/sites-enabled/farmago-dashboard" ]; then
        check "Sitio habilitado"
    else
        echo -e "${RED}✗${NC} Sitio no habilitado"
        echo "       Ejecutar: sudo ln -s /etc/nginx/sites-available/farmago-dashboard /etc/nginx/sites-enabled/"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Configuración de Nginx no existe"
    echo "       Ver: nginx.conf"
    ((ERRORS++))
fi
echo ""

# 11. Verificar API del backend
echo -e "${YELLOW}[11/12]${NC} Verificando API del backend..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    check "API responde en localhost"
else
    echo -e "${RED}✗${NC} API no responde"
    echo "       Verificar logs: sudo journalctl -u farmago-backend -n 20"
    ((ERRORS++))
fi
echo ""

# 12. Verificar firewall
echo -e "${YELLOW}[12/12]${NC} Verificando firewall..."
if command -v ufw > /dev/null 2>&1; then
    if ufw status | grep -q "Status: active"; then
        check "UFW activo"
        if ufw status | grep -q "80/tcp"; then
            check "Puerto 80 permitido"
        else
            echo -e "${YELLOW}⚠${NC}  Puerto 80 no permitido en firewall"
            echo "       Ejecutar: sudo ufw allow 80/tcp"
        fi
    else
        echo -e "${YELLOW}⚠${NC}  UFW no está activo"
    fi
else
    echo -e "${YELLOW}⚠${NC}  UFW no instalado"
fi
echo ""

# Resumen
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Verificación completada sin errores${NC}"
    echo ""
    echo -e "${GREEN}🎉 El sistema está listo para producción${NC}"
    echo ""
    echo "Acceder al dashboard en:"
    echo "  → http://190.187.184.138"
    echo ""
    echo "Verificar API:"
    echo "  → http://190.187.184.138/api/health"
else
    echo -e "${RED}✗ Se encontraron $ERRORS errores${NC}"
    echo ""
    echo "Por favor, corrige los errores antes de continuar."
    echo "Ver documentación en: DEPLOY_190.187.184.138.md"
fi
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Comandos útiles
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "  Ver logs backend:  sudo journalctl -u farmago-backend -f"
echo "  Ver logs Nginx:    sudo tail -f /var/log/nginx/farmago-error.log"
echo "  Reiniciar backend: sudo systemctl restart farmago-backend"
echo "  Reiniciar Nginx:   sudo systemctl restart nginx"
echo ""

exit $ERRORS
