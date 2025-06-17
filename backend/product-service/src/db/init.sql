CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales
INSERT INTO products (name, price, image) VALUES
    ('Botella de agua', 20.00, 'https://m.media-amazon.com/images/I/61CQachvmqL.jpg'),
    ('Sony WH-1000XM5 Audífonos Inalámbricos', 5999, 'https://http2.mlstatic.com/D_NQ_NP_620187-MLU69726815032_052023-O.webp'),
    ('Camiseta Orgánica', 29.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500'),
    ('Botella Ecológica', 24.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=500'),
    ('Reusable Coffee Cup', 16.99, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpjuPdKoQdZvx24XerVr8e8ufiuCeIBChpTw&s'),
    ('Botella de vino tinto', 42.99, 'https://lacanasteria.com/wp-content/uploads/2023/03/Mucho-Mas-Black-Edition-750ML.jpg'),
    ('Reloj digital', 82.99, 'https://i5.walmartimages.com/asr/6a0d7539-a23b-4147-a8ba-061522489ced.080b1e7296b05163a2460a8e7cf3d03f.jpeg?odnHeight=612&odnWidth=612&odnBg=FFFFFF'); 