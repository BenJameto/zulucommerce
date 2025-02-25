-- Verificar y crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS zulucommerce;
USE zulucommerce;

-- Verificar y crear la tabla Ciudad
*CREATE TABLE IF NOT EXISTS Ciudad (-------------------------listo--------------
    id_ciudad UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);
SELECT 'Tabla Ciudad lista para usar' AS Mensaje;

-- Verificar y crear la tabla Almacen
*CREATE TABLE IF NOT EXISTS Almacen (-------------------------listo--------------
    id_almacen UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_direccion TEXT NOT NULL,
    id_ciudad UUID NOT NULL,
    FOREIGN KEY (id_ciudad) REFERENCES Ciudad(id_ciudad)
    FOREIGN KEY (id_direccion) REFERENCES Direcciones(id_direccion)
);
SELECT 'Tabla Almacen lista para usar' AS Mensaje;

-- Verificar y crear la tabla Usuario
*CREATE TABLE IF NOT EXISTS Usuario (-------------------------listo--------------
    id_usuario UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    id_direccion UUID NOT NULL,
    telefono VARCHAR(20),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rol ENUM('cliente', 'administrador') NOT NULL
    FOREIGN KEY (id_direccion) REFERENCES Direcciones(id_direccion)
);
SELECT 'Tabla Usuario lista para usar' AS Mensaje;

-- Verificar y crear la tabla Direcciones
*CREATE TABLE IF NOT EXISTS Direcciones (-------------------------listo--------------
    id_direccion UUID PRIMARY KEY,
    id_usuario UUID NOT NULL,
    direccion TEXT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);
SELECT 'Tabla Direcciones lista para usar' AS Mensaje;

-- Verificar y crear la tabla Categoria_Producto
*CREATE TABLE IF NOT EXISTS Categoria_Producto (-------------------------listo--------------
    id_categoria UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);
SELECT 'Tabla Categoria_Producto lista para usar' AS Mensaje;

-- Verificar y crear la tabla Producto
*CREATE TABLE IF NOT EXISTS Producto (-------------------------listo--------------
    id_producto UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    imagen VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    id_categoria UUID NOT NULL,
    id_almacen UUID NOT NULL,
    id_review UUID,
    FOREIGN KEY (id_categoria) REFERENCES Categoria_Producto(id_categoria)
    FOREIGN KEY (id_review) REFERENCES Reviews(id_review)
    FOREIGN KEY (id_almacen) REFERENCES Almacen(id_almacen)
);
SELECT 'Tabla Producto lista para usar' AS Mensaje;

-- Verificar y crear la tabla Stock_Almacen
*CREATE TABLE IF NOT EXISTS Stock_Almacen (-------------------------listo--------------
    id_stock UUID PRIMARY KEY,
    id_producto UUID NOT NULL,
    id_almacen UUID NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto),
    FOREIGN KEY (id_almacen) REFERENCES Almacen(id_almacen)
);
SELECT 'Tabla Stock_Almacen lista para usar' AS Mensaje;

-- Verificar y crear la tabla Estado_Carrito
*CREATE TABLE IF NOT EXISTS Estado_Carrito (-------------------------listo--------------
    id_estado_c UUID PRIMARY KEY,
    estado_c ENUM('pendiente', 'finalizado') NOT NULL
);
SELECT 'Tabla Estado_Carrito lista para usar' AS Mensaje;

-- Verificar y crear la tabla Carrito
*CREATE TABLE IF NOT EXISTS Carrito (-------------------------listo--------------
    id_carrito UUID PRIMARY KEY,
    id_usuario UUID NOT NULL,
    id_estado_c UUID NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_estado_c) REFERENCES Estado_Carrito(id_estado_c)
);
SELECT 'Tabla Carrito lista para usar' AS Mensaje;

-- Verificar y crear la tabla Detalle_Carrito
*CREATE TABLE IF NOT EXISTS Detalle_Carrito (-------------------------listo--------------
    id_detalle UUID PRIMARY KEY,
    id_carrito UUID NOT NULL,
    id_producto UUID NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (id_carrito) REFERENCES Carrito(id_carrito),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);
SELECT 'Tabla Detalle_Carrito lista para usar' AS Mensaje;

-- Verificar y crear la tabla Estado_Pedido
*CREATE TABLE IF NOT EXISTS Estado_Pedido (-------------------------listo--------------
    id_estado_p UUID PRIMARY KEY,
    estado_p ENUM('pendiente', 'procesando', 'enviado', 'entregado') DEFAULT 'pendiente',
);
SELECT 'Tabla Estado_Pedido lista para usar' AS Mensaje;

-- Verificar y crear la tabla Pedido
*CREATE TABLE IF NOT EXISTS Pedido (-------------------------listo--------------
    id_pedido UUID PRIMARY KEY,
    id_usuario UUID NOT NULL,
    id_estado_p UUID NOT NULL,
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_direccion UUID NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_estado_p) REFERENCES Estado_Pedido(id_estado_p),
    FOREIGN KEY (id_direccion) REFERENCES Direcciones(id_direccion)
);
SELECT 'Tabla Pedido lista para usar' AS Mensaje;

-- Verificar y crear la tabla Metodo_Pago
*CREATE TABLE IF NOT EXISTS Metodo_Pago (-------------------------listo--------------
    id_metodo_pago UUID PRIMARY KEY,
    metodo_p ENUM('tarjeta', 'paypal', 'transferencia') NOT NULL,
);
SELECT 'Tabla Metodo_Pago lista para usar' AS Mensaje;

-- Verificar y crear la tabla Pagos
*CREATE TABLE IF NOT EXISTS Pagos (-------------------------listo--------------
    id_pago UUID PRIMARY KEY,
    id_pedido UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    id_metodo_pago UUID NOT NULL,
    id_edo_pago UUID NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido),
    FOREIGN KEY (id_metodo_p) REFERENCES Metodo_Pago(id_metodo_p),
    FOREIGN KEY (id_edo_pago) REFERENCES Estado_Pago(id_edo_pago)
);
SELECT 'Tabla Pagos lista para usar' AS Mensaje;

-- Verificar y crear la tabla Estado_Pago
*CREATE TABLE IF NOT EXISTS Estado_Pago (-------------------------listo--------------
    id_edo_pago UUID PRIMARY KEY,
    edo_pago ENUM('pendiente', 'procesando', 'pagado') DEFAULT 'pendiente',
);
SELECT 'Tabla Estado_Pago lista para usar' AS Mensaje;

-- Verificar y crear la tabla Reseñas de Productos
CREATE TABLE IF NOT EXISTS Reviwes (-------------------------listo--------------
    id_review UUID PRIMARY KEY,
    id_usuario UUID NOT NULL,
    id_producto UUID NOT NULL,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario VARCHAR(255),
    fecha_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_producto) REFERENCES Producto(id_producto)
);
SELECT 'Tabla ReseñasProducto lista para usar' AS Mensaje;

-- Verificar y crear la tabla Logs del Sistema
CREATE TABLE IF NOT EXISTS LogsSistema (-------------------------listo--------------
    id_log UUID PRIMARY KEY,
    servicio VARCHAR(255) NOT NULL,
    nivel ENUM('info', 'warning', 'error') NOT NULL,
    mensaje VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT 'Tabla LogsSistema lista para usar' AS Mensaje;

-- Verificar y crear la tabla Envios
CREATE TABLE IF NOT EXISTS Envios (-------------------------listo--------------
    id_envio UUID PRIMARY KEY,
    id_pedido UUID NOT NULL,
    id_empresa UUID NOT NULL,
    id_estado_envio UUID NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrega_estimada TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido),
    FOREIGN KEY (id_metodo_envio) REFERENCES Metodo_Envio(id_metodo_envio),
    FOREIGN KEY (id_estado_envio) REFERENCES Estado_Envio(id_estado_envio)
);
SELECT 'Tabla Envios lista para usar' AS Mensaje;

-- Verificar y crear la tabla Empresa_envio
CREATE TABLE IF NOT EXISTS Empresa_Envio (-------------------------listo--------------
    id_empresa UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
);
