# ZuluCommerce - Plataforma de Comercio Electrónico con Microservicios

## 🚀 Descripción General

ZuluCommerce es una plataforma de comercio electrónico moderna desarrollada con arquitectura de microservicios, diseñada para ser escalable, mantenible y desplegable en Kubernetes. La aplicación utiliza React para el frontend, Node.js para los microservicios backend, y PostgreSQL para las bases de datos.

## 🏗️ Arquitectura del Sistema

### Microservicios Implementados

1. **API Gateway** (Puerto 3000) - Punto de entrada único para todas las APIs
2. **Auth Service** (Puerto 4001) - Autenticación y autorización de usuarios
3. **User Service** (Puerto 4002) - Gestión de perfiles de usuario
4. **Product Service** (Puerto 4003) - Catálogo de productos y categorías
5. **Cart Service** (Puerto 4004) - Carrito de compras (Redis)
6. **Order Service** (Puerto 4005) - Gestión de órdenes
7. **Payment Service** (Puerto 4006) - Procesamiento de pagos
8. **Inventory Service** (Puerto 4007) - Control de inventario

### Base de Datos por Microservicio

- **auth_db** - Usuarios y autenticación (Auth + User Service)
- **products_db** - Productos y categorías (Product Service)
- **orders_db** - Órdenes y detalles (Order Service)
- **inventory_db** - Inventario y stock (Inventory Service)

### Servicios de Infraestructura

- **Redis** - Caché y carrito de compras
- **RabbitMQ** - Mensajería entre microservicios
- **PostgreSQL** - Múltiples instancias para cada microservicio

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con Express
- **PostgreSQL** - Bases de datos relacionales
- **Redis** - Caché y sesiones
- **RabbitMQ** - Mensajería asíncrona
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas

### Frontend
- **React 19** - Framework de UI
- **Axios** - Cliente HTTP
- **React Router** - Navegación
- **React Icons** - Iconografía

### DevOps
- **Docker** - Contenedores
- **Docker Compose** - Orquestación local
- **Kubernetes** - Orquestación en producción

## 📋 Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Git

## 🚀 Instalación y Despliegue

### 1. Clonar el Repositorio

```bash
git clone https://github.com/usuario/zulucommerce.git
cd zulucommerce
```

### 2. Despliegue con Docker Compose

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build
```

### 3. Verificar Servicios

Una vez desplegado, los servicios estarán disponibles en:

- **Frontend**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672
- **Redis**: localhost:6379

### 4. Bases de Datos

Las bases de datos PostgreSQL estarán disponibles en:
- **Auth DB**: localhost:5432
- **Products DB**: localhost:5433
- **Orders DB**: localhost:5434
- **Inventory DB**: localhost:5435

## 🔧 Desarrollo Local

### Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Ejecutar Servicios Individualmente

```bash
# API Gateway
cd backend/api-gateway
npm run dev

# Auth Service
cd backend/auth-service
npm run dev

# Product Service
cd backend/product-service
npm run dev

# Frontend
cd frontend
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obtener perfil

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `GET /api/products/search?q=term` - Buscar productos
- `GET /api/products/featured` - Productos destacados

### Carrito
- `GET /api/cart` - Obtener carrito
- `POST /api/cart/items` - Agregar item
- `PUT /api/cart/items/:productId` - Actualizar cantidad
- `DELETE /api/cart/items/:productId` - Remover item
- `POST /api/cart/checkout` - Finalizar compra

## 🧪 Pruebas

### Ejecutar Tests

```bash
# API Gateway
cd backend/api-gateway
npm test

# Auth Service
cd backend/auth-service
npm test

# Product Service
cd backend/product-service
npm test
```

## 📊 Monitoreo

### Health Checks

Cada microservicio expone un endpoint de health check:

```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:4001/health  # Auth Service
curl http://localhost:4003/health  # Product Service
```

### Logs

```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs auth-service
docker-compose logs product-service
```

## 🔒 Seguridad

- **Helmet** - Headers de seguridad
- **CORS** - Control de acceso entre dominios
- **Rate Limiting** - Protección contra ataques DDoS
- **JWT** - Autenticación stateless
- **bcryptjs** - Encriptación de contraseñas
- **Validación de entrada** - Sanitización de datos

## 📈 Escalabilidad

### Estrategias Implementadas

1. **Base de datos por microservicio** - Independencia de datos
2. **Caché con Redis** - Mejora de rendimiento
3. **Mensajería asíncrona** - Desacoplamiento de servicios
4. **API Gateway** - Punto de entrada único
5. **Contenedores Docker** - Despliegue consistente

### Escalado Horizontal

```bash
# Escalar un servicio específico
docker-compose up --scale product-service=3

# Escalar múltiples servicios
docker-compose up --scale product-service=3 --scale auth-service=2
```

## 🚀 Despliegue en Kubernetes

### Preparar para Minikube

```bash
# Iniciar Minikube
minikube start

# Habilitar ingress
minikube addons enable ingress

# Construir imágenes
eval $(minikube docker-env)
docker-compose build

# Aplicar manifiestos de Kubernetes
kubectl apply -f kubernetes/
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: equipo@zulucommerce.com
- **GitHub**: [Issues](https://github.com/usuario/zulucommerce/issues)

## 🔄 Roadmap

- [ ] Implementar Order Service completo
- [ ] Implementar Payment Service
- [ ] Implementar Inventory Service
- [ ] Agregar notificaciones por email
- [ ] Implementar búsqueda avanzada con Elasticsearch
- [ ] Agregar analytics y métricas
- [ ] Implementar sistema de reseñas
- [ ] Agregar sistema de cupones y descuentos
- [ ] Implementar multi-tenancy
- [ ] Agregar tests de integración
- [ ] Implementar CI/CD pipeline
- [ ] Agregar documentación con Swagger
- [ ] Implementar sistema de logs centralizado
- [ ] Agregar monitoreo con Prometheus y Grafana

