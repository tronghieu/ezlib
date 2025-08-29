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
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES
  ('400a0780-d043-4b05-8427-9816855365d1', 'emily.chen@example.com', now() - interval '45 days', '{"display_name": "Emily Chen"}', now() - interval '45 days', now() - interval '2 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d2', 'marcus.rodriguez@example.com', now() - interval '38 days', '{"display_name": "Marcus Rodriguez"}', now() - interval '38 days', now() - interval '5 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d3', 'james.wilson@example.com', now() - interval '19 days', '{"display_name": "James Wilson"}', now() - interval '19 days', now() - interval '12 hours', false, false),
  
  -- Library staff users
  ('500a0780-d043-4b05-8427-9816855365d1', 'sarah.chen@nycentral.org', now() - interval '18 months', '{"display_name": "Sarah Chen", "job_title": "Head Librarian"}', now() - interval '18 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d2', 'mike.torres@nycentral.org', now() - interval '14 months', '{"display_name": "Miguel Torres", "job_title": "Reference Librarian"}', now() - interval '14 months', now() - interval '3 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d3', 'anna.kowalski@nycentral.org', now() - interval '8 months', '{"display_name": "Anna Kowalski", "job_title": "Library Assistant"}', now() - interval '8 months', now() - interval '2 days', false, false),
  ('500a0780-d043-4b05-8427-9816855365d4', 'david.kim@berkeley.edu', now() - interval '2 years', '{"display_name": "David Kim", "job_title": "Engineering Librarian"}', now() - interval '2 years', now() - interval '6 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d5', 'rachel.smith@berkeley.edu', now() - interval '11 months', '{"display_name": "Rachel Smith", "job_title": "Research Librarian"}', now() - interval '11 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d6', 'janet.murphy@greenfieldlibrary.org', now() - interval '3 years', '{"display_name": "Janet Murphy", "job_title": "Library Director"}', now() - interval '3 years', now() - interval '4 days', false, false),
  
  -- Library members
  ('700a0780-d043-4b05-8427-9816855365d1', 'alice.johnson@example.com', now() - interval '2 years', '{"display_name": "Alice Johnson", "preferred_genres": ["mystery", "biography"]}', now() - interval '2 years', now() - interval '3 days', false, false),
  ('700a0780-d043-4b05-8427-9816855365d2', 'carlos.rodriguez@example.com', now() - interval '1 year', '{"display_name": "Carlos Rodriguez", "preferred_genres": ["science", "technology"]}', now() - interval '1 year', now() - interval '1 week', false, false),
  ('700a0780-d043-4b05-8427-9816855365d3', 'priya.patel@example.com', now() - interval '8 months', '{"display_name": "Priya Patel", "preferred_genres": ["fiction", "history"]}', now() - interval '8 months', now() - interval '2 hours', false, false),
  ('700a0780-d043-4b05-8427-9816855365d4', 'james.thompson@example.com', now() - interval '3 years', '{"display_name": "James Thompson", "preferred_genres": ["fantasy", "science fiction"]}', now() - interval '3 years', now() - interval '5 days', false, false);