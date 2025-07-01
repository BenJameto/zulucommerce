#!/bin/bash

# Script para construir y desplegar ZuluCommerce en Minikube
# Autor: ZuluCommerce Team
# Versión: 1.0.0

set -e  # Salir si hay algún error

echo "🚀 Iniciando construcción y despliegue de ZuluCommerce..."

# Verificar que Minikube esté ejecutándose
if ! minikube status | grep -q "Running"; then
    echo "❌ Minikube no está ejecutándose. Iniciando Minikube..."
    minikube start
else
    echo "✅ Minikube ya está ejecutándose"
fi

# Configurar Docker para usar el daemon de Minikube
echo "🔧 Configurando Docker para usar Minikube..."
eval $(minikube docker-env)

# Construir la imagen del API Gateway
echo "🏗️  Construyendo imagen del API Gateway..."
cd api-gateway
docker build -t zulucommerce-api-gateway:latest .
cd ..

# Construir la imagen del Auth Service
echo "🔐 Construyendo imagen del Auth Service..."
cd auth-service
docker build -t zulucommerce-auth-service:latest .
cd ..

# Construir la imagen del Product Service
echo "🛍️  Construyendo imagen del Product Service..."
cd product-service
docker build -t zulucommerce-product-service:latest .
cd ..

# Construir la imagen del Cart Service
echo "🛒 Construyendo imagen del Cart Service..."
cd cart-service
docker build -t zulucommerce-cart-service:latest .
cd ..

# Construir la imagen del Order Service
echo "📦 Construyendo imagen del Order Service..."
cd order-service
docker build -t zulucommerce-order-service:latest .
cd ..

# Construir la imagen del Search Service
echo "🔍 Construyendo imagen del Search Service..."
cd search-service
docker build -t zulucommerce-search-service:latest .
cd ..

# Construir la imagen del Payment Service
echo "💳 Construyendo imagen del Payment Service..."
cd payment-service
docker build -t zulucommerce-payment-service:latest .
cd ..

# Aplicar manifiestos de Kubernetes en orden
echo "📦 Aplicando manifiestos de Kubernetes..."

echo "1️⃣  Aplicando PVC de PostgreSQL..."
kubectl apply -f k8s/postgres-pvc.yaml

echo "2️⃣  Aplicando deployment de PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml

echo "3️⃣  Aplicando servicio de PostgreSQL..."
kubectl apply -f k8s/postgres-service.yaml

echo "4️⃣  Aplicando deployment del Auth Service..."
kubectl apply -f k8s/auth-service-deployment.yaml

echo "5️⃣  Aplicando servicio del Auth Service..."
kubectl apply -f k8s/auth-service-service.yaml

echo "6️⃣  Aplicando deployment del Product Service..."
kubectl apply -f k8s/product-service-deployment.yaml

echo "7️⃣  Aplicando servicio del Product Service..."
kubectl apply -f k8s/product-service-service.yaml

echo "8️⃣  Aplicando deployment del API Gateway..."
kubectl apply -f k8s/api-gateway-deployment.yaml

echo "9️⃣  Aplicando servicio del API Gateway..."
kubectl apply -f k8s/api-gateway-service.yaml

echo "🔄 Aplicando deployment del Cart Service..."
kubectl apply -f k8s/cart-service-deployment.yaml

echo "🔄 Aplicando servicio del Cart Service..."
kubectl apply -f k8s/cart-service-service.yaml

echo "🔄 Aplicando deployment del Order Service..."
kubectl apply -f k8s/order-service-deployment.yaml

echo "🔄 Aplicando servicio del Order Service..."
kubectl apply -f k8s/order-service-service.yaml

echo "🔄 Aplicando deployment del Search Service..."
kubectl apply -f k8s/search-service-deployment.yaml

echo "🔄 Aplicando servicio del Search Service..."
kubectl apply -f k8s/search-service-service.yaml

echo "🔄 Aplicando deployment del Payment Service..."
kubectl apply -f k8s/payment-service-deployment.yaml

echo "🔄 Aplicando servicio del Payment Service..."
kubectl apply -f k8s/payment-service-service.yaml

# Esperar a que los pods estén listos
echo "⏳ Esperando a que los pods estén listos..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s
kubectl wait --for=condition=ready pod -l app=auth-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=product-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=api-gateway --timeout=300s
kubectl wait --for=condition=ready pod -l app=cart-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=order-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=search-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=payment-service --timeout=300s

# Mostrar estado de los pods
echo "📊 Estado de los pods:"
kubectl get pods

# Mostrar servicios
echo "🌐 Servicios disponibles:"
kubectl get services

# Obtener URL del API Gateway
echo "🔗 URL del API Gateway:"
minikube service api-gateway-service --url

echo "✅ Despliegue completado exitosamente!"
echo ""
echo "📋 Comandos útiles:"
echo "  - Ver logs del API Gateway: kubectl logs -l app=api-gateway"
echo "  - Ver logs del Auth Service: kubectl logs -l app=auth-service"
echo "  - Ver logs del Product Service: kubectl logs -l app=product-service"
echo "  - Ver logs de PostgreSQL: kubectl logs -l app=postgres"
echo "  - Acceder al API Gateway: minikube service api-gateway-service"
echo "  - Health check API Gateway: curl \$(minikube service api-gateway-service --url)/health"
echo "  - Health check Auth Service: kubectl port-forward svc/auth-service 3001:3001 & curl http://localhost:3001/health"
echo "  - Health check Product Service: kubectl port-forward svc/product-service 3002:3002 & curl http://localhost:3002/health"
echo "  - Health check Cart Service: kubectl port-forward svc/cart-service 3003:3003 & curl http://localhost:3003/health"
echo "  - Health check Order Service: kubectl port-forward svc/order-service 3004:3004 & curl http://localhost:3004/health"
echo "  - Health check Search Service: kubectl port-forward svc/search-service 3005:3005 & curl http://localhost:3005/health"
echo "  - Health check Payment Service: kubectl port-forward svc/payment-service 3006:3006 & curl http://localhost:3006/health" 