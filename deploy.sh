#!/bin/bash

# ZuluCommerce - Script de Despliegue
# Este script automatiza el despliegue de la aplicación de microservicios

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Verificar requisitos
check_requirements() {
    print_header "Verificando Requisitos"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor instala Docker primero."
        exit 1
    fi
    
    # Verificar Docker Compose (versión moderna)
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
        exit 1
    fi
    
    # Verificar que Docker esté corriendo
    if ! docker info &> /dev/null; then
        print_error "Docker no está corriendo. Por favor inicia Docker primero."
        exit 1
    fi
    
    print_message "Todos los requisitos están satisfechos ✓"
}

# Limpiar recursos existentes
cleanup() {
    print_header "Limpiando Recursos Existentes"
    
    print_message "Deteniendo contenedores existentes..."
    docker compose down --remove-orphans 2>/dev/null || true
    
    print_message "Limpiando volúmenes no utilizados..."
    docker volume prune -f 2>/dev/null || true
    
    print_message "Limpiando redes no utilizadas..."
    docker network prune -f 2>/dev/null || true
}

# Construir imágenes
build_images() {
    print_header "Construyendo Imágenes Docker"
    
    print_message "Construyendo API Gateway..."
    docker compose build api-gateway
    
    print_message "Construyendo Auth Service..."
    docker compose build auth-service
    
    print_message "Construyendo Product Service..."
    docker compose build product-service
    
    print_message "Construyendo Cart Service..."
    docker compose build cart-service
    
    print_message "Construyendo Frontend..."
    docker compose build frontend
    
    print_message "Todas las imágenes han sido construidas ✓"
}

# Desplegar servicios
deploy_services() {
    print_header "Desplegando Servicios"
    
    print_message "Iniciando servicios en segundo plano..."
    docker compose up -d
    
    print_message "Esperando a que los servicios estén listos..."
    sleep 30
    
    print_message "Verificando estado de los servicios..."
    docker compose ps
}

# Verificar salud de los servicios
health_check() {
    print_header "Verificando Salud de los Servicios"
    
    services=(
        "http://localhost:3000/health"
        "http://localhost:4001/health"
        "http://localhost:4003/health"
        "http://localhost:4004/health"
    )
    
    for service in "${services[@]}"; do
        print_message "Verificando $service..."
        if curl -f -s "$service" > /dev/null; then
            print_message "✓ $service está funcionando"
        else
            print_warning "⚠ $service no responde (puede estar iniciando)"
        fi
    done
}

# Mostrar información de acceso
show_access_info() {
    print_header "Información de Acceso"
    
    echo -e "${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
    echo ""
    echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3001"
    echo -e "${BLUE}🔌 API Gateway:${NC} http://localhost:3000"
    echo -e "${BLUE}🐰 RabbitMQ Management:${NC} http://localhost:15672"
    echo -e "${BLUE}🔐 Auth Service:${NC} http://localhost:4001"
    echo -e "${BLUE}🛒 Product Service:${NC} http://localhost:4003"
    echo -e "${BLUE}🛍️ Cart Service:${NC} http://localhost:4004"
    echo ""
    echo -e "${BLUE}🗄️ Bases de Datos:${NC}"
    echo -e "  Auth DB: localhost:5432"
    echo -e "  Products DB: localhost:5433"
    echo -e "  Orders DB: localhost:5434"
    echo -e "  Inventory DB: localhost:5435"
    echo ""
    echo -e "${YELLOW}📋 Comandos útiles:${NC}"
    echo -e "  Ver logs: ${GREEN}docker compose logs${NC}"
    echo -e "  Ver logs de un servicio: ${GREEN}docker compose logs auth-service${NC}"
    echo -e "  Detener servicios: ${GREEN}docker compose down${NC}"
    echo -e "  Reiniciar servicios: ${GREEN}docker compose restart${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Para desarrollo:${NC}"
    echo -e "  Los servicios están configurados para recargar automáticamente"
    echo -e "  cuando detectan cambios en el código fuente."
}

# Función principal
main() {
    print_header "ZuluCommerce - Despliegue de Microservicios"
    
    case "${1:-deploy}" in
        "deploy")
            check_requirements
            cleanup
            build_images
            deploy_services
            health_check
            show_access_info
            ;;
        "clean")
            print_header "Limpiando Todo"
            docker compose down -v --remove-orphans
            docker system prune -f
            print_message "Limpieza completada ✓"
            ;;
        "logs")
            print_header "Mostrando Logs"
            docker compose logs -f
            ;;
        "restart")
            print_header "Reiniciando Servicios"
            docker compose restart
            print_message "Servicios reiniciados ✓"
            ;;
        "status")
            print_header "Estado de los Servicios"
            docker compose ps
            ;;
        "help")
            print_header "Ayuda"
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos disponibles:"
            echo "  deploy   - Desplegar todos los servicios (por defecto)"
            echo "  clean    - Limpiar todos los contenedores y volúmenes"
            echo "  logs     - Mostrar logs en tiempo real"
            echo "  restart  - Reiniciar todos los servicios"
            echo "  status   - Mostrar estado de los servicios"
            echo "  help     - Mostrar esta ayuda"
            ;;
        *)
            print_error "Comando desconocido: $1"
            echo "Usa '$0 help' para ver los comandos disponibles"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@" 