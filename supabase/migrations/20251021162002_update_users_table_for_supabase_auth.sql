/*
  # Update Users Table for Supabase Auth Integration
  
  ## Changes
  - Remove password_hash column (Supabase Auth handles authentication)
  - Keep user metadata in separate table for application-specific data
  
  ## Note
  This migration safely handles the case where the column might not exist.
*/

-- Remove password_hash column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users DROP COLUMN password_hash;
  END IF;
END $$;
