# Resumen de Errores y Soluciones - Payment Service

## Fecha: 26 de Junio 2025

### Problema Principal: Payment Service en CrashLoopBackOff

#### 🔍 **Diagnóstico Inicial**
- **Estado del pod**: `CrashLoopBackOff`
- **Error en logs**: `ReferenceError: query is not defined at /app/src/index.js:364`
- **Causa raíz**: El archivo principal `index.js` no existía en el contenedor

#### 📋 **Problemas Identificados y Soluciones**

### 1. Archivo Principal Faltante
**Problema**: 
- El archivo `src/index.js` no existía en el payment-service
- Solo existía `src/index.js.backup`

**Solución**:
```bash
cp payment-service/src/index.js.backup payment-service/src/index.js
```

### 2. Error de Importación de `query`
**Problema**: 
- Error: `ReferenceError: query is not defined at line 364`
- El código usaba `query()` de express-validator pero no estaba importado

**Solución**:
- Verificamos que la importación ya existía en el archivo:
```javascript
const { body, param, query, validationResult } = require('express-validator');
```
- El problema era que el archivo no existía, no la importación

### 3. Imagen de Docker Desactualizada
**Problema**: 
- El contenedor seguía usando una versión antigua de la imagen
- Los cambios no se reflejaban en Kubernetes

**Solución**:
```bash
# Reconstruir la imagen
docker build -t payment-service:latest -f newZulucomerce/payment-service/Dockerfile newZulucomerce/payment-service

# Cargar la imagen en Minikube
minikube image load payment-service:latest

# Actualizar el deployment
kubectl set image deployment/payment-service payment-service=payment-service:latest
```

### 4. Problema de Conectividad con Base de Datos
**Problema**: 
- Error: `getaddrinfo ENOTFOUND postgres-service`
- El servicio no podía conectarse a PostgreSQL

**Solución**:
- Este error es normal cuando se ejecuta el contenedor fuera del cluster
- Dentro de Kubernetes, el servicio `postgres-service` es accesible
- No requiere corrección adicional

#### 🛠️ **Comandos Utilizados para la Solución**

```bash
# 1. Verificar estado inicial
kubectl get pods -A
kubectl logs payment-service-[POD_NAME]

# 2. Restaurar archivo principal
cp payment-service/src/index.js.backup payment-service/src/index.js

# 3. Reconstruir imagen Docker
docker build -t payment-service:latest -f newZulucomerce/payment-service/Dockerfile newZulucomerce/payment-service

# 4. Cargar imagen en Minikube
minikube image load payment-service:latest

# 5. Actualizar deployment
kubectl set image deployment/payment-service payment-service=payment-service:latest

# 6. Eliminar pods antiguos
kubectl delete pod -l app=payment-service

# 7. Verificar estado final
kubectl get pods | grep payment-service
kubectl logs payment-service-[NEW_POD_NAME]
```

#### ✅ **Estado Final**
- **Pod Status**: `Running`
- **Ready**: `1/1`
- **Restarts**: `0`
- **Logs**: 
  - ✅ Base de datos inicializada correctamente
  - 💳 Payment Service iniciado en puerto 3006
  - 📊 Health check funcionando

#### 📝 **Lecciones Aprendidas**

1. **Verificar existencia de archivos**: Siempre confirmar que los archivos principales existen antes de desplegar
2. **Actualizar imágenes**: Después de cambios en el código, reconstruir y actualizar las imágenes Docker
3. **Cargar en Minikube**: Las imágenes locales deben cargarse en el entorno de Minikube
4. **Monitorear logs**: Los logs son fundamentales para diagnosticar problemas de despliegue
5. **Forzar recreación**: A veces es necesario eliminar pods para forzar el uso de nuevas imágenes

#### 🔧 **Prevención Futura**

1. **Backup automático**: Mantener backups de archivos críticos
2. **Scripts de despliegue**: Crear scripts que incluyan reconstrucción de imágenes
3. **Verificación pre-despliegue**: Validar que todos los archivos necesarios existen
4. **Monitoreo continuo**: Implementar health checks y alertas

---
*Documento creado para referencia futura y documentación de problemas comunes en el despliegue de microservicios.* 