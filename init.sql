-- Auto-create the cafe_ai database for the Nuxt application
-- This runs on first PostgreSQL container start only

CREATE DATABASE cafe_ai;
GRANT ALL PRIVILEGES ON DATABASE cafe_ai TO litellm_user;
\c cafe_ai
GRANT ALL ON SCHEMA public TO litellm_user;
