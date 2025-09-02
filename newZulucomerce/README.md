# ZuluCommerce - Plataforma de Comercio Electrónico

## Descripción

ZuluCommerce es una plataforma de comercio electrónico basada en microservicios, diseñada para ser escalable y mantenible. Este proyecto utiliza Node.js para el backend, React para el frontend, PostgreSQL para las bases de datos, y se despliega en Kubernetes (Minikube).

## Arquitectura

### Microservicios Planificados

- **API Gateway** (Puerto 3000) - Punto de entrada principal
- **Auth Service** (Puerto 3001) - Autenticación y autorización
- **Product Service** (Puerto 3002) - Gestión de productos
- **Cart Service** (Puerto 3003) - Gestión del carrito de compras
- **Order Service** (Puerto 3004) - Gestión de pedidos
- **Search Service** (Puerto 3005) - Búsqueda de productos
- **Frontend** (Puerto 3006) - Interfaz de usuario

### Infraestructura

- **PostgreSQL** - Base de datos principal
- **Redis** - Cache y sesiones
- **RabbitMQ** - Cola de mensajes
- **Kubernetes/Minikube** - Orquestación de contenedores

## Estructura del Proyecto

```
newZulucommerce/
├── api-gateway/           # API Gateway (implementado)
│   ├── src/
│   │   └── index.js
│   ├── Dockerfile
│   ├── package.json
│   └── .dockerignore
├── k8s/                   # Manifiestos de Kubernetes
│   ├── api-gateway-deployment.yaml
│   ├── api-gateway-service.yaml
│   ├── postgres-deployment.yaml
│   ├── postgres-service.yaml
│   └── postgres-pvc.yaml
├── build-and-deploy.sh    # Script de despliegue
└── README.md
```

## Requisitos Previos

- Docker
- Minikube
- kubectl
- Node.js 18+

## Instalación y Despliegue

### 1. Preparar el Entorno

```bash
# Verificar que Minikube esté instalado
minikube version

# Iniciar Minikube (si no está ejecutándose)
minikube start

# Verificar que kubectl esté configurado
kubectl cluster-info
```

### 2. Desplegar el Proyecto

```bash
# Ejecutar el script de construcción y despliegue
./build-and-deploy.sh
```

### 3. Verificar el Despliegue

```bash
# Ver el estado de los pods
kubectl get pods

# Ver los servicios
kubectl get services

# Obtener la URL del API Gateway
minikube service api-gateway-service --url
```

## Endpoints Disponibles

### API Gateway

- `GET /` - Página principal
- `GET /health` - Health check
- `GET /api/info` - Información del API Gateway
- `GET /api/auth/*` - Proxy al servicio de autenticación
- `GET /api/products/*` - Proxy al servicio de productos
- `GET /api/cart/*` - Proxy al servicio de carrito
- `GET /api/orders/*` - Proxy al servicio de pedidos

## Desarrollo Local

### API Gateway

```bash
cd api-gateway

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start
```

### Construir Imagen Docker

```bash
cd api-gateway
docker build -t zulucommerce-api-gateway:latest .
```

## Comandos Útiles

### Kubernetes

```bash
# Ver logs del API Gateway
kubectl logs -l app=api-gateway

# Ver logs de PostgreSQL
kubectl logs -l app=postgres

# Acceder al API Gateway
minikube service api-gateway-service

# Eliminar todos los recursos
kubectl delete all --all
kubectl delete pvc --all
```

### Docker

```bash
# Ver imágenes locales
docker images | grep zulucommerce

# Eliminar imagen
docker rmi zulucommerce-api-gateway:latest
```

## Próximos Pasos

1. **Implementar Auth Service** - Servicio de autenticación
2. **Implementar Product Service** - Gestión de productos
3. **Implementar Cart Service** - Carrito de compras
4. **Implementar Order Service** - Gestión de pedidos
5. **Implementar Frontend** - Interfaz de usuario
6. **Configurar Redis** - Cache y sesiones
7. **Configurar RabbitMQ** - Cola de mensajes
8. **Implementar CI/CD** - Pipeline de integración continua

## Troubleshooting

### Problemas Comunes

1. **ImagePullBackOff**: Las imágenes no se encuentran
   ```bash
   # Verificar que las imágenes estén construidas
   docker images | grep zulucommerce
   
   # Reconstruir imagen
   docker build -t zulucommerce-api-gateway:latest ./api-gateway
   ```

2. **Pods no inician**: Verificar logs
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name>
   ```

3. **Servicios no accesibles**: Verificar configuración
   ```bash
   kubectl get services
   kubectl describe service <service-name>
   ```

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

ZuluCommerce Team - [@zulucommerce](https://github.com/zulucommerce)

Link del proyecto: [https://github.com/zulucommerce/zulucommerce](https://github.com/zulucommerce/zulucommerce) 