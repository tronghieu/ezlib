-- Social follows seed data
-- Creates realistic social connections between users

INSERT INTO social_follows (id, follower_id, following_id, followed_at)
VALUES
  -- Emily Chen follows other readers
  (
    '960e8400-e29b-41d4-a716-446655440001',
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily
    '400a0780-d043-4b05-8427-9816855365d5', -- Luna (both love fantasy)
    now() - interval '25 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440002',
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily
    '400a0780-d043-4b05-8427-9816855365d3', -- Sarah (sci-fi connection)
    now() - interval '18 days'
  ),

  -- Marcus follows literature enthusiasts
  (
    '960e8400-e29b-41d4-a716-446655440003',
    '400a0780-d043-4b05-8427-9816855365d2', -- Marcus  
    '400a0780-d043-4b05-8427-9816855365d6', -- James (classic/dystopian overlap)
    now() - interval '22 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440004',
    '400a0780-d043-4b05-8427-9816855365d2', -- Marcus
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily (diverse reading tastes)
    now() - interval '15 days'
  ),

  -- Sarah Kim follows sci-fi and tech-minded readers
  (
    '960e8400-e29b-41d4-a716-446655440005',
    '400a0780-d043-4b05-8427-9816855365d3', -- Sarah
    '400a0780-d043-4b05-8427-9816855365d6', -- James (dystopian sci-fi connection)
    now() - interval '20 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440006',
    '400a0780-d043-4b05-8427-9816855365d3', -- Sarah
    '400a0780-d043-4b05-8427-9816855365d2', -- Marcus (intellectual readers)
    now() - interval '12 days'
  ),

  -- Ahmed Hassan follows mystery and thriller fans
  (
    '960e8400-e29b-41d4-a716-446655440007',
    '400a0780-d043-4b05-8427-9816855365d4', -- Ahmed
    '400a0780-d043-4b05-8427-9816855365d2', -- Marcus (classic literature appreciation)
    now() - interval '17 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440008',
    '400a0780-d043-4b05-8427-9816855365d4', -- Ahmed
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily (diverse reading interests)
    now() - interval '11 days'
  ),

  -- Luna Petrov follows fantasy and YA enthusiasts
  (
    '960e8400-e29b-41d4-a716-446655440009',
    '400a0780-d043-4b05-8427-9816855365d5', -- Luna
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily (fantasy lovers)
    now() - interval '19 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440010',
    '400a0780-d043-4b05-8427-9816855365d5', -- Luna
    '400a0780-d043-4b05-8427-9816855365d3', -- Sarah (broad reading interests)
    now() - interval '14 days'
  ),

  -- James Wilson follows thoughtful readers
  (
    '960e8400-e29b-41d4-a716-446655440011',
    '400a0780-d043-4b05-8427-9816855365d6', -- James
    '400a0780-d043-4b05-8427-9816855365d2', -- Marcus (classic literature)
    now() - interval '16 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440012',
    '400a0780-d043-4b05-8427-9816855365d6', -- James
    '400a0780-d043-4b05-8427-9816855365d3', -- Sarah (thoughtful reviews)
    now() - interval '9 days'
  ),

  -- Additional mutual follows for network effect
  (
    '960e8400-e29b-41d4-a716-446655440013',
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily
    '400a0780-d043-4b05-8427-9816855365d4', -- Ahmed (discovering new genres)
    now() - interval '13 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440014',
    '400a0780-d043-4b05-8427-9816855365d5', -- Luna
    '400a0780-d043-4b05-8427-9816855365d4', -- Ahmed (young reader exploring mysteries)
    now() - interval '8 days'
  ),
  (
    '960e8400-e29b-41d4-a716-446655440015',
    '400a0780-d043-4b05-8427-9816855365d4', -- Ahmed
    '400a0780-d043-4b05-8427-9816855365d5', -- Luna (mutual follow after book recommendation)
    now() - interval '6 days'
  );

-- Author follows - users following their favorite authors
INSERT INTO author_follows (id, user_id, author_id, notification_preferences, followed_at)
VALUES
  -- Emily follows J.K. Rowling
  (
    '970e8400-e29b-41d4-a716-446655440001',
    '400a0780-d043-4b05-8427-9816855365d1',
    '550e8400-e29b-41d4-a716-446655440005',
    '{"new_books": true, "interviews": true, "awards": false}',
    now() - interval '30 days'
  ),

  -- Marcus follows Jane Austen 
  (
    '970e8400-e29b-41d4-a716-446655440002',
    '400a0780-d043-4b05-8427-9816855365d2',
    '550e8400-e29b-41d4-a716-446655440002',
    '{"new_books": true, "interviews": true, "awards": true}',
    now() - interval '35 days'
  ),

  -- Sarah follows Isaac Asimov
  (
    '970e8400-e29b-41d4-a716-446655440003',
    '400a0780-d043-4b05-8427-9816855365d3',
    '550e8400-e29b-41d4-a716-446655440003',
    '{"new_books": true, "interviews": false, "awards": true}',
    now() - interval '28 days'
  ),

  -- Ahmed follows Agatha Christie
  (
    '970e8400-e29b-41d4-a716-446655440004',
    '400a0780-d043-4b05-8427-9816855365d4',
    '550e8400-e29b-41d4-a716-446655440004',
    '{"new_books": true, "interviews": true, "awards": false}',
    now() - interval '24 days'
  ),

  -- Luna follows J.K. Rowling (popular author gets multiple followers)
  (
    '970e8400-e29b-41d4-a716-446655440005',
    '400a0780-d043-4b05-8427-9816855365d5',
    '550e8400-e29b-41d4-a716-446655440005',
    '{"new_books": true, "interviews": true, "awards": true}',
    now() - interval '20 days'
  ),

  -- James follows George Orwell
  (
    '970e8400-e29b-41d4-a716-446655440006',
    '400a0780-d043-4b05-8427-9816855365d6',
    '550e8400-e29b-41d4-a716-446655440001',
    '{"new_books": true, "interviews": true, "awards": true}',
    now() - interval '18 days'
  ),

  -- Cross-genre follows for discovery
  (
    '970e8400-e29b-41d4-a716-446655440007',
    '400a0780-d043-4b05-8427-9816855365d3', -- Sarah
    '550e8400-e29b-41d4-a716-446655440001', -- George Orwell (sci-fi meets dystopian)
    '{"new_books": false, "interviews": true, "awards": false}',
    now() - interval '12 days'
  ),
  (
    '970e8400-e29b-41d4-a716-446655440008',
    '400a0780-d043-4b05-8427-9816855365d1', -- Emily
    '550e8400-e29b-41d4-a716-446655440003', -- Isaac Asimov (exploring sci-fi)
    '{"new_books": true, "interviews": false, "awards": false}',
    now() - interval '10 days'
  );