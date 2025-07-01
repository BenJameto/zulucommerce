# Implementación e Integración del Shipping Service - ZuluCommerce

## Fecha: 26 de Junio 2025

### 🚚 **Resumen del Proyecto**
Implementación completa del microservicio de envíos (shipping-service) para ZuluCommerce, incluyendo su integración con el API Gateway y la resolución de múltiples problemas de configuración y enrutamiento.

---

## 📋 **Fase 1: Implementación del Shipping Service**

### **1.1 Estructura del Proyecto Creada**
```bash
newZulucomerce/shipping-service/
├── src/
│   └── index.js
├── package.json
├── Dockerfile
└── .dockerignore
```

### **1.2 Dependencias Configuradas**
```json
{
  "name": "zulucommerce-shipping-service",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "pg": "^8.11.3",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "uuid": "^9.0.1",
    "moment": "^2.29.4",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1"
  }
}
```

### **1.3 Funcionalidades Implementadas**

#### **Endpoints Principales:**
- `POST /api/shipping/calculate` - Calcular tarifas de envío
- `POST /api/shipping/create` - Crear envío
- `GET /api/shipping/:id` - Obtener envío por ID
- `GET /api/shipping/track/:id` - Tracking de envío
- `PUT /api/shipping/:id/status` - Actualizar estado
- `GET /api/shipping/rates` - Obtener tarifas disponibles
- `GET /api/shipping` - Listar envíos con filtros

#### **Base de Datos:**
- **Tabla `shipments`** - Envíos principales
- **Tabla `shipping_rates`** - Tarifas de carriers
- **Tabla `tracking_events`** - Eventos de seguimiento
- **Índices optimizados** para consultas rápidas

---

## 🔧 **Fase 2: Configuración de Kubernetes**

### **2.1 Archivos de Configuración Creados**

#### **Deployment (`shipping-service-deployment.yaml`):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shipping-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: shipping-service
  template:
    spec:
      containers:
      - name: shipping-service
        image: shipping-service:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3007
        env:
        - name: PORT
          value: "3007"
        - name: DB_HOST
          value: "postgres-service"
        # ... más configuraciones
```

#### **Service (`shipping-service-service.yaml`):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: shipping-service
spec:
  type: ClusterIP
  selector:
    app: shipping-service
  ports:
  - name: http
    port: 3007
    targetPort: 3007
```

### **2.2 Comandos de Despliegue**
```bash
# Construir imagen
docker build -t shipping-service:latest -f shipping-service/Dockerfile shipping-service

# Cargar en Minikube
minikube image load shipping-service:latest

# Aplicar configuración
kubectl apply -f k8s/shipping-service-deployment.yaml
kubectl apply -f k8s/shipping-service-service.yaml
```

---

## 🌐 **Fase 3: Integración con API Gateway**

### **3.1 Configuración del Proxy**

#### **Problema Inicial:**
- El API Gateway no tenía configuración para el shipping-service
- Faltaba el servicio `api-gateway-service` en Kubernetes

#### **Solución Implementada:**

**1. Agregar Proxy al API Gateway:**
```javascript
// Shipping service proxy
app.use('/api/shipping', createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping': '/api/shipping'
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🚚 Shipping proxy request: ${req.method} ${req.url} -> ${proxyReq.path}`);
    // ... manejo de body para POST/PUT
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Shipping proxy response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.log('❌ Shipping service proxy error:', err.message, err.code);
    // ... manejo de errores
  }
}));
```

**2. Rutas Específicas para Health e Info:**
```javascript
// Shipping service direct endpoints (health, info) - MUST BE BEFORE GENERAL SHIPPING ROUTE
app.use('/api/shipping/health', createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping/health': '/health'
  }
}));

app.use('/api/shipping/info', createProxyMiddleware({
  target: process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:3007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/shipping/info': '/api/info'
  }
}));
```

**3. Actualizar Información de Endpoints:**
```javascript
app.get('/api/info', (req, res) => {
  res.json({
    service: 'ZuluCommerce API Gateway',
    version: '1.0.0',
    endpoints: {
      // ... otros endpoints
      shipping: '/api/shipping/*'
    }
  });
});
```

---

## 🚨 **Fase 4: Problemas Encontrados y Soluciones**

### **4.1 Problema: ImagePullBackOff**
**Síntomas:**
- Pod en estado `ImagePullBackOff`
- Error: `pull access denied for shipping-service, repository does not exist`

**Causa:**
- Kubernetes intentaba descargar la imagen desde Docker Hub
- La imagen estaba solo en el registro local

**Solución:**
```bash
# Construir imagen en el entorno de Minikube
eval $(minikube docker-env) && docker build -t shipping-service:latest -f shipping-service/Dockerfile shipping-service

# Agregar imagePullPolicy: Never al deployment
spec:
  containers:
  - name: shipping-service
    image: shipping-service:latest
    imagePullPolicy: Never  # ← Agregado
```

### **4.2 Problema: Conflicto de Enrutamiento en API Gateway**
**Síntomas:**
- Error: `ID debe ser un UUID válido` para `/api/shipping/rates`
- Endpoints específicos no funcionaban

**Causa:**
- Orden incorrecto de rutas en Express.js
- Rutas específicas definidas después de rutas con parámetros

**Solución:**
```javascript
// ❌ Orden incorrecto (causaba conflictos)
app.use('/api/shipping', createProxyMiddleware({...}));  // Captura todo
app.use('/api/shipping/health', createProxyMiddleware({...}));  // Nunca se ejecuta

// ✅ Orden correcto
app.use('/api/shipping/health', createProxyMiddleware({...}));  // Específica primero
app.use('/api/shipping/info', createProxyMiddleware({...}));   // Específica primero
app.use('/api/shipping', createProxyMiddleware({...}));        // General después
```

### **4.3 Problema: Conflicto de Enrutamiento en Shipping Service**
**Síntomas:**
- Error: `ID debe ser un UUID válido` para `/api/shipping/rates`
- El endpoint `rates` era capturado por `/:id`

**Causa:**
- Express.js capturaba `/api/shipping/rates` como `/api/shipping/:id` donde `id = "rates"`

**Solución:**
```javascript
// ❌ Orden incorrecto
app.get('/api/shipping/:id', [...], async (req, res) => {
  // Captura /api/shipping/rates como /api/shipping/:id
});

app.get('/api/shipping/rates', [...], async (req, res) => {
  // Nunca se ejecuta
});

// ✅ Orden correcto
app.get('/api/shipping/rates', [...], async (req, res) => {
  // Se ejecuta primero para /api/shipping/rates
});

app.get('/api/shipping/:id', [...], async (req, res) => {
  // Se ejecuta para otros paths como /api/shipping/123e4567-...
});
```

### **4.4 Problema: Servicio API Gateway No Encontrado**
**Síntomas:**
- Error: `services "api-gateway" not found`
- Port-forward fallaba

**Causa:**
- El servicio se llamaba `api-gateway-service`, no `api-gateway`

**Solución:**
```bash
# ❌ Comando incorrecto
kubectl port-forward service/api-gateway 3000:3000

# ✅ Comando correcto
kubectl port-forward service/api-gateway-service 3000:3000
```

---

## ✅ **Fase 5: Verificación y Pruebas**

### **5.1 Estado Final de los Servicios**
```bash
✅ api-gateway-56d8ff5db9-k4dq7        1/1     Running
✅ shipping-service-699b869f7b-tdggx   1/1     Running
✅ payment-service-654c87fcd7-n4h2t    1/1     Running
✅ auth-service-74b8bbbc94-7hb48       1/1     Running
✅ cart-service-6c57f95554-4npsg       1/1     Running
✅ order-service-66b5db887d-bbkjw      1/1     Running
✅ product-service-7957b484d9-4q4m6    1/1     Running
✅ search-service-59f9bcbd96-dtp6q     1/1     Running
✅ postgres-7c67586bc7-g4v4w           1/1     Running
```

### **5.2 Endpoints Verificados**

#### **Health Check:**
```bash
curl http://api-gateway-service:3000/api/shipping/health
# Respuesta:
{
  "status": "OK",
  "service": "Shipping Service",
  "timestamp": "2025-06-26T22:57:17.131Z",
  "uptime": 325.559656815
}
```

#### **Info Endpoint:**
```bash
curl http://api-gateway-service:3000/api/shipping/info
# Respuesta: Lista completa de endpoints disponibles
```

#### **Shipping Rates:**
```bash
curl "http://api-gateway-service:3000/api/shipping/rates?origin_country=US&destination_country=US&weight=2"
# Respuesta: 24 tarifas de envío de múltiples carriers
```

---

## 📝 **Lecciones Aprendidas**

### **1. Orden de Rutas en Express.js**
- **Rutas específicas** deben ir ANTES que rutas con parámetros
- El orden importa más que la lógica de la ruta
- Usar comentarios para documentar el orden crítico

### **2. Configuración de Kubernetes**
- **imagePullPolicy: Never** para imágenes locales en Minikube
- Construir imágenes en el entorno correcto de Docker
- Verificar nombres exactos de servicios

### **3. Proxy Configuration**
- Configurar rutas específicas antes de rutas generales
- Manejar correctamente el body de requests POST/PUT
- Implementar logging detallado para debugging

### **4. Base de Datos**
- Crear índices para mejorar rendimiento
- Usar transacciones para operaciones complejas
- Validar datos de entrada con express-validator

---

## 🔧 **Comandos Útiles para Debugging**

### **Verificar Estado de Pods:**
```bash
kubectl get pods -A
kubectl get pods | grep shipping-service
kubectl get pods | grep api-gateway
```

### **Revisar Logs:**
```bash
kubectl logs <pod-name> --tail=20
kubectl logs shipping-service-<hash> --tail=50
kubectl logs api-gateway-<hash> --tail=50
```

### **Verificar Servicios:**
```bash
kubectl get services
kubectl describe service shipping-service
kubectl describe service api-gateway-service
```

### **Reconstruir y Actualizar:**
```bash
# Construir imagen
eval $(minikube docker-env) && docker build -t shipping-service:latest -f shipping-service/Dockerfile shipping-service

# Actualizar deployment
kubectl rollout restart deployment/shipping-service
kubectl rollout restart deployment/api-gateway
```

### **Probar Endpoints:**
```bash
# Desde dentro del cluster
kubectl run test-client --image=curlimages/curl --rm -it --restart=Never -- curl -s http://api-gateway-service:3000/api/shipping/health

# Port-forward para pruebas locales
kubectl port-forward service/api-gateway-service 3000:3000 &
curl http://localhost:3000/api/shipping/health
```

---

## 🎯 **Próximos Pasos Recomendados**

1. **Pruebas Exhaustivas** - Probar todos los endpoints del shipping-service
2. **Monitoreo** - Configurar alertas y métricas
3. **Documentación API** - Crear documentación completa de endpoints
4. **Integración Frontend** - Conectar con la interfaz de usuario
5. **Testing Automatizado** - Implementar tests unitarios e integración

---

*Documento creado para referencia futura y documentación del proceso de implementación e integración del shipping-service en ZuluCommerce.* 