-- Esquema mínimo: una sola tabla para comprobar que todas las capas se conectan.
CREATE TABLE IF NOT EXISTS items (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
