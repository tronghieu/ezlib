-- Social follows seed data
-- Creates basic social connections between users (keeping it simple for core functionality)

-- Note: More comprehensive social follows data exists in the original file structure
-- This simplified version focuses on essential relationships for testing core library features

INSERT INTO social_follows (id, follower_id, following_id, followed_at)
VALUES
  -- Basic follows for testing social features
  ('960e8400-e29b-41d4-a716-446655440001',
   '400a0780-d043-4b05-8427-9816855365d1', -- Emily follows
   '400a0780-d043-4b05-8427-9816855365d2', -- Marcus
   now() - interval '25 days'),
  
  ('960e8400-e29b-41d4-a716-446655440002',
   '400a0780-d043-4b05-8427-9816855365d2', -- Marcus follows
   '400a0780-d043-4b05-8427-9816855365d1', -- Emily
   now() - interval '20 days'),
   
  ('960e8400-e29b-41d4-a716-446655440003',
   '400a0780-d043-4b05-8427-9816855365d3', -- James follows
   '400a0780-d043-4b05-8427-9816855365d1', -- Emily
   now() - interval '15 days');

-- Author follows - users following their favorite authors
INSERT INTO author_follows (id, user_id, author_id, notification_preferences, followed_at)
VALUES
  -- Emily follows J.K. Rowling
  ('970e8400-e29b-41d4-a716-446655440001',
   '400a0780-d043-4b05-8427-9816855365d1',
   '550e8400-e29b-41d4-a716-446655440004',
   '{"new_books": true, "interviews": true, "awards": false}',
   now() - interval '30 days'),

  -- Marcus follows Jane Austen 
  ('970e8400-e29b-41d4-a716-446655440002',
   '400a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440002',
   '{"new_books": true, "interviews": true, "awards": true}',
   now() - interval '35 days'),

  -- James follows George Orwell
  ('970e8400-e29b-41d4-a716-446655440003',
   '400a0780-d043-4b05-8427-9816855365d3',
   '550e8400-e29b-41d4-a716-446655440001',
   '{"new_books": true, "interviews": true, "awards": true}',
   now() - interval '18 days');