-- Migración para actualizar la tabla users
-- Agregar campos faltantes que están siendo usados por el código

-- Agregar columna username
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;

-- Agregar columna first_name
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);

-- Agregar columna last_name
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Agregar columna phone
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Agregar columna date_of_birth
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Agregar columna address
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Agregar columna updated_at
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Actualizar registros existentes para tener valores por defecto
UPDATE users SET 
    username = CONCAT('user_', id) WHERE username IS NULL;

UPDATE users SET 
    first_name = SPLIT_PART(name, ' ', 1) WHERE first_name IS NULL AND name IS NOT NULL;

UPDATE users SET 
    last_name = SPLIT_PART(name, ' ', 2) WHERE last_name IS NULL AND name IS NOT NULL;

-- Hacer username NOT NULL después de actualizar
ALTER TABLE users ALTER COLUMN username SET NOT NULL; 