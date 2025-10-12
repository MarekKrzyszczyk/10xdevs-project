-- =============================================================================
-- Migration: Seed default user for development/testing
-- =============================================================================
-- Purpose: Create a default user in auth.users table for local development
-- Note: This is only for development. In production, use real authentication.
-- =============================================================================

-- Insert default user into auth.users table if it doesn't exist
-- This allows RLS policies to work with the DEFAULT_USER_ID
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
SELECT
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'dev@10xcards.local',
  -- This is a bcrypt hash of 'password123' - only for local dev!
  '$2a$10$YPj8AxuGKH0K7MxOGjOvzOxdxEY0QY6KqJKq.hqJQqJQqJQqJQqJO',
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid
);

-- =============================================================================
-- Migration complete
-- =============================================================================
