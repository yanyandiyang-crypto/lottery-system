-- Idempotency keys for ticket creation
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idem_key VARCHAR(100) NOT NULL,
  ticket_id INT REFERENCES tickets(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, idem_key)
);


