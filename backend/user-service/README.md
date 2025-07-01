# User Service

Microservicio para la gestión de usuarios del e-commerce ZuluCommerce.

## 🚀 Características

- **Gestión completa de usuarios**: CRUD completo para usuarios
- **Autenticación**: Middleware de autenticación JWT
- **Validación**: Validación robusta de datos de entrada
- **Perfiles de usuario**: Gestión de información personal
- **Cambio de contraseñas**: Funcionalidad segura para cambiar contraseñas
- **Estadísticas**: Métricas de usuarios registrados
- **Paginación**: Soporte para listados paginados
- **Búsqueda**: Filtrado por nombre, email, username

## 📋 Endpoints

### Rutas Públicas
- `GET /api/users/stats` - Obtener estadísticas de usuarios
- `POST /api/users` - Crear nuevo usuario

### Rutas Protegidas (requieren JWT)
- `GET /api/users` - Obtener todos los usuarios (con paginación)
- `GET /api/users/profile` - Obtener perfil del usuario actual
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/profile` - Actualizar perfil del usuario actual
- `PUT /api/users/:id` - Actualizar usuario específico
- `PUT /api/users/change-password` - Cambiar contraseña
- `DELETE /api/users/:id` - Eliminar usuario

## 🛠 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 🔧 Configuración

### Variables de Entorno

```env
PORT=3005
DB_USER=zulucommerce
DB_PASSWORD=zulucommerce123
DB_HOST=localhost
DB_PORT=5433
DB_DATABASE=zulucommerce
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
NODE_ENV=development
```

## 📊 Estructura de Datos

### Usuario
```json
{
  "id": 1,
  "email": "usuario@ejemplo.com",
  "username": "usuario123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "address": "Calle Principal 123",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 🔐 Autenticación

Para acceder a las rutas protegidas, incluye el token JWT en el header:

```
Authorization: Bearer <tu_token_jwt>
```

## 📝 Ejemplos de Uso

### Crear Usuario
```bash
curl -X POST http://localhost:3005/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@usuario.com",
    "username": "nuevo_usuario",
    "password": "123456",
    "first_name": "Nuevo",
    "last_name": "Usuario"
  }'
```

### Obtener Perfil
```bash
curl -X GET http://localhost:3005/api/users/profile \
  -H "Authorization: Bearer <tu_token_jwt>"
```

### Actualizar Perfil
```bash
curl -X PUT http://localhost:3005/api/users/profile \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan Actualizado",
    "phone": "+1234567890"
  }'
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test
```

## 📈 Monitoreo

- **Health Check**: `GET /health`
- **Logs**: Los logs se muestran en consola con timestamps
- **Errores**: Manejo centralizado de errores con respuestas JSON

## 🔄 Integración

Este servicio se integra con:
- **Auth Service**: Para autenticación y autorización
- **Cart Service**: Para asociar carritos con usuarios
- **Wishlist Service**: Para listas de deseos por usuario
- **Order Service**: Para historial de pedidos

## 🚨 Consideraciones de Seguridad

- Contraseñas encriptadas con bcrypt
- Validación de entrada con express-validator
- Autenticación JWT para rutas protegidas
- Sanitización de datos de entrada
- Headers de seguridad configurados 