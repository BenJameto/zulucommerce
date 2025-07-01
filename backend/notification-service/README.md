# Notification Service

Microservicio para la gestión de notificaciones del sistema de e-commerce ZuluCommerce.

## Descripción

Este microservicio maneja todas las notificaciones del sistema, incluyendo:
- Notificaciones de pedidos
- Notificaciones de productos
- Notificaciones del sistema
- Notificaciones personalizadas

## Características

- ✅ CRUD completo de notificaciones
- ✅ Paginación de resultados
- ✅ Filtrado por estado (leídas/no leídas)
- ✅ Estadísticas de notificaciones
- ✅ Validación de datos
- ✅ Manejo de errores
- ✅ Conexión a PostgreSQL

## Instalación

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

## Variables de Entorno

```env
PORT=3008
DB_USER=zulucommerce
DB_PASSWORD=zulucommerce123
DB_HOST=localhost
DB_PORT=5433
DB_DATABASE=zulucommerce
```

## API Endpoints

### Notificaciones

#### GET `/api/notifications/user/:userId`
Obtiene las notificaciones de un usuario específico.

**Parámetros de consulta:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Límite de resultados por página (default: 10, max: 100)
- `unreadOnly` (opcional): Solo notificaciones no leídas (true/false)

**Ejemplo:**
```bash
GET /api/notifications/user/1?page=1&limit=10&unreadOnly=false
```

#### POST `/api/notifications`
Crea una nueva notificación.

**Body:**
```json
{
  "user_id": 1,
  "message": "Tu pedido ha sido confirmado",
  "type": "order"
}
```

#### PATCH `/api/notifications/:id/read`
Marca una notificación específica como leída.

#### PATCH `/api/notifications/user/:userId/read-all`
Marca todas las notificaciones de un usuario como leídas.

#### DELETE `/api/notifications/:id`
Elimina una notificación específica.

#### GET `/api/notifications/user/:userId/stats`
Obtiene estadísticas de notificaciones de un usuario.

### Health Check

#### GET `/health`
Verifica el estado del servicio.

## Estructura de la Base de Datos

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Tipos de Notificaciones

- `order`: Notificaciones relacionadas con pedidos
- `product`: Notificaciones relacionadas con productos
- `system`: Notificaciones del sistema
- `general`: Notificaciones generales (default)

## Respuestas de Error

```json
{
  "error": "Descripción del error",
  "message": "Mensaje adicional"
}
```

## Desarrollo

### Estructura del Proyecto

```
notification-service/
├── src/
│   ├── controllers/
│   │   └── notification.controller.js
│   ├── routes/
│   │   └── notification.routes.js
│   ├── middleware/
│   ├── utils/
│   │   └── database.js
│   └── index.js
├── package.json
├── .env
└── README.md
```

### Scripts Disponibles

- `npm run dev`: Ejecuta el servidor en modo desarrollo con nodemon
- `npm start`: Ejecuta el servidor en modo producción
- `npm test`: Ejecuta las pruebas (pendiente de implementar)

## Integración con Otros Microservicios

Este microservicio puede ser llamado por otros microservicios para crear notificaciones:

```javascript
// Ejemplo de integración desde otro microservicio
const createNotification = async (userId, message, type) => {
  const response = await fetch('http://localhost:3008/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: userId,
      message: message,
      type: type
    })
  });
  return response.json();
};
```

## Logs

El servicio registra logs importantes:
- ✅ Conexión exitosa a PostgreSQL
- ❌ Errores de conexión a la base de datos
- 📝 Errores en operaciones CRUD
- 🚀 Inicio del servidor

## Puerto

El servicio corre por defecto en el puerto **3008**. 