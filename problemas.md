�� Problemas Encontrados y Soluciones
1. Problema: Error en Dockerfile - npm ci sin package-lock.json
❌ Error:
Apply
🔧 Solución:
Causa: El Dockerfile usaba npm ci pero no existía el archivo package-lock.json
Solución:
Ejecutamos npm install para generar el package-lock.json
Cambiamos el Dockerfile para usar npm install --only=production en lugar de npm ci
2. Problema: Servicio Kubernetes con puertos duplicados
❌ Error:
Apply
🔧 Solución:
Causa: El servicio tenía dos puertos con el mismo port: 3000 pero diferentes nodePort
Solución: Eliminamos el puerto duplicado, dejando solo el puerto HTTP
3. Problema: Proxy del API Gateway no funcionaba para peticiones POST
❌ Error:
Apply
🔧 Solución:
Causa: El middleware de proxy no manejaba correctamente el body de las peticiones POST
Solución: Agregamos manejo explícito del body en el proxy:
Apply:

onProxyReq: (proxyReq, req, res) => {
  if (req.body && req.method === 'POST') {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
}

4. Problema: Errores de conectividad ECONNREFUSED
❌ Error:
Apply
🔧 Solución:
Causa: El proxy estaba resolviendo el nombre del servicio a una IP que no era accesible
Solución: Simplificamos la configuración del proxy eliminando timeouts y configuraciones complejas que causaban conflictos
5. Problema: Timeouts en peticiones POST
❌ Error:
Apply
🔧 Solución:
Causa: El proxy no reenviaba el body de las peticiones POST al Auth Service
Solución: Implementamos el manejo explícito del body como se mencionó en el problema 3
�� Lecciones Aprendidas
1. Docker y npm
npm ci requiere package-lock.json
npm install es más flexible para entornos de desarrollo
Siempre generar package-lock.json antes de construir imágenes Docker
2. Kubernetes Services
Evitar puertos duplicados en la configuración
Los servicios ClusterIP son para comunicación interna
Los servicios NodePort son para acceso externo
3. Proxy Middleware
El proxy no maneja automáticamente el body de peticiones POST
Es necesario reenviar explícitamente el body
La configuración simple suele ser más robusta
4. Debugging en Kubernetes
Usar kubectl logs para ver logs de pods
Usar kubectl exec para probar conectividad desde dentro del cluster
Usar kubectl port-forward para acceder a servicios internos