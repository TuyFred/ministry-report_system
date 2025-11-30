-- Seed an initial admin user
-- Replace the plaintext password and email before running.

-- bcrypt hash for password 'Olvet123@' (cost 10) — REPLACE if you change password
-- WARNING: Do not store plaintext passwords. Only the hash is inserted.

WITH params AS (
  SELECT 
    'Admin User'::text AS fullname,
    'admin@example.com'::text AS email, -- REPLACE with your admin email
    '$2b$10$YkA1m8f8wCzP1mVQn5pN1u8o9v3XyA4xj0mR1qV2sQy7a3Yd7xW3xK'::text AS password_hash,
    'admin'::text AS role
)
INSERT INTO users (fullname, email, password, role, country, contact, address)
SELECT fullname, email, password_hash, role, NULL, NULL, NULL FROM params
ON CONFLICT (email) DO NOTHING;
