# Inventory Service

Microservicio para gestión de inventario y stock de ZuluCommerce.

## Endpoints principales

- `GET /api/inventory/items` — Listar items de inventario
- `GET /api/inventory/items/:id` — Obtener item por ID
- `POST /api/inventory/items` — Crear item de inventario
- `PUT /api/inventory/items/:id` — Actualizar item
- `PUT /api/inventory/items/:id/stock` — Actualizar stock
- `POST /api/inventory/reservations` — Crear reserva
- `GET /api/inventory/movements` — Consultar movimientos
- `GET /api/inventory/alerts` — Consultar alertas
- `GET /api/inventory/low-stock` — Items con stock bajo
- `POST /api/inventory/sync` — Sincronizar con sistemas externos
- `GET /health` — Health check
- `GET /api/info` — Info del servicio

## Variables de entorno

- `PORT`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `REDIS_URL`

## Ejecución local

```bash
npm install
npm run dev
``` 