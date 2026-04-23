# 🚀 INSTALACIÓN RÁPIDA DE REDIS

## ⚡ OPCIÓN 1: Memurai (Recomendado para Windows)

Memurai es una versión de Redis optimizada para Windows.

### Instalación
1. Descargar desde: https://www.memurai.com/get-memurai
2. Ejecutar instalador
3. Memurai se inicia automáticamente como servicio de Windows
4. ¡Listo! El servidor ya funciona con Redis

### Verificar
```bash
# Abrir PowerShell
memurai-cli ping
# Debe responder: PONG
```

---

## 🐳 OPCIÓN 2: Docker (Más fácil)

Si tienes Docker instalado:

```bash
# Iniciar Redis
docker run -d --name redis -p 6379:6379 redis:alpine

# Verificar
docker exec -it redis redis-cli ping
# Debe responder: PONG

# Detener
docker stop redis

# Iniciar de nuevo
docker start redis
```

---

## 📦 OPCIÓN 3: Redis para Windows (Legacy)

### Instalación
1. Descargar desde: https://github.com/microsoftarchive/redis/releases
2. Descargar `Redis-x64-3.0.504.zip`
3. Extraer a `C:\Redis`
4. Abrir PowerShell como Administrador:

```powershell
cd C:\Redis
.\redis-server.exe
```

### Instalar como servicio (opcional)
```powershell
cd C:\Redis
.\redis-server.exe --service-install redis.windows.conf
.\redis-server.exe --service-start
```

---

## 🍎 OPCIÓN 4: Mac

```bash
# Instalar con Homebrew
brew install redis

# Iniciar
brew services start redis

# Verificar
redis-cli ping
```

---

## 🐧 OPCIÓN 5: Linux

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server

# Iniciar
sudo systemctl start redis

# Habilitar en inicio
sudo systemctl enable redis

# Verificar
redis-cli ping
```

---

## ✅ VERIFICAR INSTALACIÓN

```bash
# Probar conexión
redis-cli ping
# Debe responder: PONG

# Ver información
redis-cli INFO

# Probar set/get
redis-cli SET test "Hello Redis"
redis-cli GET test
# Debe responder: "Hello Redis"
```

---

## 🔧 CONFIGURACIÓN PARA EL PROYECTO

Una vez instalado Redis, el servidor lo detectará automáticamente:

```bash
# Iniciar servidor
npm run server

# Deberías ver:
# ✅ Redis conectado
# 💾 Cache: Redis
```

---

## ⚠️ SI REDIS NO ESTÁ DISPONIBLE

No te preocupes! El servidor funciona perfectamente sin Redis:

```bash
npm run server

# Verás:
# ⚠️  Redis no disponible, usando caché en memoria
# 💾 Cache: Memory
```

**Diferencia**: Los datos se perderán al reiniciar el servidor, pero todo lo demás funciona igual.

---

## 🎯 RECOMENDACIÓN

Para desarrollo local:
- ✅ **Memurai** (Windows) - Más fácil
- ✅ **Docker** - Si ya tienes Docker
- ✅ **Sin Redis** - Funciona igual, solo sin persistencia

Para producción:
- ✅ **Redis Cloud** (https://redis.com/try-free/)
- ✅ **AWS ElastiCache**
- ✅ **Azure Cache for Redis**
- ✅ **DigitalOcean Managed Redis**

---

## 🔗 RECURSOS

- Memurai: https://www.memurai.com/
- Redis oficial: https://redis.io/
- Docker Hub: https://hub.docker.com/_/redis
- Redis Cloud: https://redis.com/
