# Analytics Service

Microservicio para recopilar y analizar eventos y métricas de ZuluCommerce.

## Endpoints principales

- `POST /api/analytics/track` — Registrar evento
- `GET /api/analytics/events` — Consultar eventos
- `GET /api/analytics/metrics` — Métricas generales
- `GET /api/analytics/sales` — Métricas de ventas
- `GET /api/analytics/products` — Métricas de productos
- `GET /api/analytics/users` — Métricas de usuarios
- `GET /api/analytics/reports` — Reportes agregados
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