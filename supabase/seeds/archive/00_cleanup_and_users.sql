-- EzLib Database Cleanup and Users Seed Data
-- This file must run first to clean existing data and create base users

-- Clear existing data (in reverse dependency order)
DELETE FROM borrowing_transactions;
DELETE FROM book_copies;
DELETE FROM library_members;
DELETE FROM library_staff;
DELETE FROM libraries;
DELETE FROM social_follows;
DELETE FROM author_follows;
DELETE FROM reviews;
DELETE FROM book_contributors; 
DELETE FROM book_editions;
DELETE FROM general_books;
DELETE FROM authors;
DELETE FROM auth.users WHERE email LIKE '%@example.com' OR email LIKE '%@nycentral.org' OR email LIKE '%@berkeley.edu' OR email LIKE '%@greenfieldlibrary.org' OR email LIKE '%@lincolnhs.org' OR email LIKE '%@blrl.org';

-- ============================================================================
-- USERS SEED DATA
-- ============================================================================

-- Core users for social features
INSERT INTO auth.users (
  id, 
  aud, 
  role, 
  email, 
  email_confirmed_at, 
  raw_app_meta_data,
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  is_sso_user, 
  is_anonymous
)
VALUES
  ('400a0780-d043-4b05-8427-9816855365d1', 'authenticated', 'authenticated', 'emily.chen@example.com', now() - interval '45 days', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Emily Chen", "email_verified": true}', now() - interval '45 days', now() - interval '2 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d2', 'authenticated', 'authenticated', 'marcus.rodriguez@example.com', now() - interval '38 days', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Marcus Rodriguez", "email_verified": true}', now() - interval '38 days', now() - interval '5 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d3', 'authenticated', 'authenticated', 'james.wilson@example.com', now() - interval '19 days', '{"provider": "email", "providers": ["email"]}', '{"display_name": "James Wilson", "email_verified": true}', now() - interval '19 days', now() - interval '12 hours', false, false),
  
  -- Library staff users
  ('500a0780-d043-4b05-8427-9816855365d1', 'authenticated', 'authenticated', 'sarah.chen@nycentral.org', now() - interval '18 months', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Sarah Chen", "job_title": "Head Librarian", "email_verified": true}', now() - interval '18 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d2', 'authenticated', 'authenticated', 'mike.torres@nycentral.org', now() - interval '14 months', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Miguel Torres", "job_title": "Reference Librarian", "email_verified": true}', now() - interval '14 months', now() - interval '3 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d3', 'authenticated', 'authenticated', 'anna.kowalski@nycentral.org', now() - interval '8 months', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Anna Kowalski", "job_title": "Library Assistant", "email_verified": true}', now() - interval '8 months', now() - interval '2 days', false, false),
  ('500a0780-d043-4b05-8427-9816855365d4', 'authenticated', 'authenticated', 'david.kim@berkeley.edu', now() - interval '2 years', '{"provider": "email", "providers": ["email"]}', '{"display_name": "David Kim", "job_title": "Engineering Librarian", "email_verified": true}', now() - interval '2 years', now() - interval '6 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d5', 'authenticated', 'authenticated', 'rachel.smith@berkeley.edu', now() - interval '11 months', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Rachel Smith", "job_title": "Research Librarian", "email_verified": true}', now() - interval '11 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d6', 'authenticated', 'authenticated', 'janet.murphy@greenfieldlibrary.org', now() - interval '3 years', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Janet Murphy", "job_title": "Library Director", "email_verified": true}', now() - interval '3 years', now() - interval '4 days', false, false),
  
  -- Library members
  ('700a0780-d043-4b05-8427-9816855365d1', 'authenticated', 'authenticated', 'alice.johnson@example.com', now() - interval '2 years', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Alice Johnson", "preferred_genres": ["mystery", "biography"], "email_verified": true}', now() - interval '2 years', now() - interval '3 days', false, false),
  ('700a0780-d043-4b05-8427-9816855365d2', 'authenticated', 'authenticated', 'carlos.rodriguez@example.com', now() - interval '1 year', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Carlos Rodriguez", "preferred_genres": ["science", "technology"], "email_verified": true}', now() - interval '1 year', now() - interval '1 week', false, false),
  ('700a0780-d043-4b05-8427-9816855365d3', 'authenticated', 'authenticated', 'priya.patel@example.com', now() - interval '8 months', '{"provider": "email", "providers": ["email"]}', '{"display_name": "Priya Patel", "preferred_genres": ["fiction", "history"], "email_verified": true}', now() - interval '8 months', now() - interval '2 hours', false, false),
  ('700a0780-d043-4b05-8427-9816855365d4', 'authenticated', 'authenticated', 'james.thompson@example.com', now() - interval '3 years', '{"provider": "email", "providers": ["email"]}', '{"display_name": "James Thompson", "preferred_genres": ["fantasy", "science fiction"], "email_verified": true}', now() - interval '3 years', now() - interval '5 days', false, false);