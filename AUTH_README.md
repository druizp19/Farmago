# Autenticación del Dashboard Farmago

## Descripción

El dashboard ahora cuenta con autenticación simple mediante usuario y contraseña. La sesión se mantiene por 24 horas en el navegador.

## Credenciales por Defecto

- **Usuario**: `admin`
- **Contraseña**: `farmago2026`

## Configuración

### Desarrollo Local

Las credenciales están configuradas en el archivo `.env`:

```env
VITE_AUTH_USERNAME=admin
VITE_AUTH_PASSWORD=farmago2026
```

### Producción

Para cambiar las credenciales en producción:

1. Crea o edita el archivo `.env.production`:

```env
VITE_AUTH_USERNAME=tu_usuario
VITE_AUTH_PASSWORD=tu_contraseña_segura
```

2. Reconstruye el proyecto:

```bash
npm run build
```

## Características

- ✅ Pantalla de login con diseño Farmago
- ✅ Sesión persistente por 24 horas
- ✅ Botón de cerrar sesión en el sidebar
- ✅ Indicador de usuario actual
- ✅ Protección automática de todas las rutas
- ✅ Redirección automática al login si la sesión expira

## Seguridad

⚠️ **IMPORTANTE**: Esta es una autenticación básica para protección simple. Para mayor seguridad considera:

- Usar contraseñas fuertes y únicas
- Implementar JWT con backend si necesitas múltiples usuarios
- Usar HTTPS en producción
- Cambiar las credenciales regularmente
- No compartir las credenciales por canales inseguros

## Uso

1. Al abrir el dashboard, verás la pantalla de login
2. Ingresa usuario y contraseña
3. La sesión se mantendrá por 24 horas
4. Para cerrar sesión, haz clic en "Cerrar Sesión" en el sidebar

## Múltiples Usuarios

Si necesitas agregar más usuarios, puedes:

1. Modificar el archivo `src/features/auth/hooks/useAuth.ts`
2. Agregar un array de usuarios válidos
3. Validar contra ese array en la función `login`

Ejemplo:

```typescript
const VALID_USERS = [
  { username: 'admin', password: 'farmago2026' },
  { username: 'usuario2', password: 'password2' },
];
```

## Soporte

Para cualquier duda o problema con la autenticación, contacta al equipo de desarrollo.
