#!/bin/bash

# ============================================================================
# Script de Configuración Rápida para Producción
# FarmaGo Dashboard
# ============================================================================

set -e

echo "🚀 FarmaGo Dashboard - Configuración de Producción"
echo "=================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Solicitar IP del servidor
echo ""
print_info "Ingresa la IP o dominio del servidor (ej: 192.168.1.100 o dashboard.farmago.com):"
read -p "> " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    print_error "Error: Debes ingresar una IP o dominio."
    exit 1
fi

# Solicitar puerto del frontend (opcional)
echo ""
print_info "¿En qué puerto se accederá al frontend? (Enter para usar 80 - Nginx):"
read -p "> " FRONTEND_PORT

if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT="80"
fi

# Construir URLs
if [ "$FRONTEND_PORT" = "80" ]; then
    FRONTEND_URL="http://${SERVER_IP}"
else
    FRONTEND_URL="http://${SERVER_IP}:${FRONTEND_PORT}"
fi

BACKEND_URL="http://${SERVER_IP}:3001"

echo ""
echo "📋 Configuración:"
echo "   Frontend: ${FRONTEND_URL}"
echo "   Backend:  ${BACKEND_URL}"
echo ""

# Confirmar
read -p "¿Es correcta esta configuración? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_error "Configuración cancelada."
    exit 1
fi

# Crear .env para el backend
echo ""
print_info "Creando archivo .env para el backend..."

cat > .env << EOF
# VTEX API Credentials
VTEX_ACCOUNT=medifarmape
VTEX_APP_KEY=vtexappkey-medifarmape-TISBGF
VTEX_APP_TOKEN=UTSFLETYSPKLCZKJFMCVXMSDMKOQEZVKYCDQWCNZVQYMWBPIZHOVPXHIWAHLUOCIESAGXGYOGMINTBXPOSMRDIEOOOUPMIUQXEHFKPZINLUNRWTKUGRLAZXMSXKJRBSB

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGINS=${FRONTEND_URL},http://localhost:5173

# Redis Configuration
REDIS_URL=redis://localhost:6379
EOF

print_success "Archivo .env creado"

# Crear .env.production para el frontend
echo ""
print_info "Creando archivo .env.production para el frontend..."

cat > .env.production << EOF
# Frontend API URL
VITE_API_URL=${BACKEND_URL}
EOF

print_success "Archivo .env.production creado"

# Instalar dependencias
echo ""
print_info "¿Deseas instalar las dependencias ahora? (s/n):"
read -p "> " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Instalando dependencias del frontend..."
    npm install
    print_success "Dependencias del frontend instaladas"
    
    print_info "Instalando dependencias del backend..."
    cd server && npm install && cd ..
    print_success "Dependencias del backend instaladas"
fi

# Build del proyecto
echo ""
print_info "¿Deseas compilar el proyecto ahora? (s/n):"
read -p "> " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Compilando frontend..."
    npm run build
    print_success "Frontend compilado en ./dist"
    
    print_info "Compilando backend..."
    cd server && npm run build && cd ..
    print_success "Backend compilado en ./server/dist"
fi

# Resumen final
echo ""
echo "=================================================="
print_success "Configuración completada!"
echo "=================================================="
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Verificar archivos de configuración:"
echo "   - .env (backend)"
echo "   - .env.production (frontend)"
echo ""
echo "2. Si no compilaste, ejecutar:"
echo "   npm run build"
echo "   cd server && npm run build"
echo ""
echo "3. Configurar Nginx (ver PRODUCTION_SETUP.md)"
echo ""
echo "4. Iniciar el backend:"
echo "   cd server && node dist/index.js"
echo "   O configurar como servicio systemd"
echo ""
echo "5. Acceder al dashboard:"
echo "   ${FRONTEND_URL}"
echo ""
echo "📖 Para más detalles, consulta PRODUCTION_SETUP.md"
echo ""
