-- Users seed data
-- Creates test users in auth.users for social features (reviews, follows)
-- Note: These are development/testing users with email confirmation bypassed

INSERT INTO auth.users (
    id, 
    instance_id, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    is_super_admin, 
    role, 
    aud
) VALUES
  -- Reader 1: Emily Chen - Active reviewer
  (
    '400a0780-d043-4b05-8427-9816855365d1',
    '00000000-0000-0000-0000-000000000000',
    'emily.chen@example.com',
    crypt('password123', gen_salt('bf')),
    now() - interval '45 days',
    now() - interval '45 days',
    now() - interval '2 days',
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "emily.chen@example.com", "display_name": "Emily Chen", "avatar_url": "https://avatars.example.com/emily.jpg", "bio": "Voracious reader, fantasy lover, coffee enthusiast ☕📚"}',
    false,
    'authenticated',
    'authenticated'
  ),
  
  -- Reader 2: Marcus Rodriguez - Classic literature fan
  (
    '400a0780-d043-4b05-8427-9816855365d2',
    '00000000-0000-0000-0000-000000000000',
    'marcus.rodriguez@example.com',
    crypt('password123', gen_salt('bf')),
    now() - interval '38 days',
    now() - interval '38 days',
    now() - interval '5 days',
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "marcus.rodriguez@example.com", "display_name": "Marcus Rodriguez", "avatar_url": "https://avatars.example.com/marcus.jpg", "bio": "Professor of Literature. Austen enthusiast. Always reading something from the 19th century."}',
    false,
    'authenticated',
    'authenticated'
  ),
  
  -- Reader 3: Sarah Kim - Sci-fi devotee
  (
    '400a0780-d043-4b05-8427-9816855365d3',
    '00000000-0000-0000-0000-000000000000',
    'sarah.kim@example.com',
    crypt('password123', gen_salt('bf')),
    now() - interval '32 days',
    now() - interval '32 days',
    now() - interval '1 day',
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "sarah.kim@example.com", "display_name": "Sarah Kim", "avatar_url": "https://avatars.example.com/sarah.jpg", "bio": "Software engineer by day, sci-fi explorer by night. Currently obsessed with Asimov."}',
    false,
    'authenticated',
    'authenticated'
  ),
  
  -- Reader 4: Ahmed Hassan - Mystery lover
  (
    '400a0780-d043-4b05-8427-9816855365d4',
    '00000000-0000-0000-0000-000000000000',
    'ahmed.hassan@example.com',
    crypt('password123', gen_salt('bf')),
    now() - interval '28 days',
    now() - interval '28 days',
    now() - interval '3 hours',
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "ahmed.hassan@example.com", "display_name": "Ahmed Hassan", "avatar_url": "https://avatars.example.com/ahmed.jpg", "bio": "Mystery and thriller enthusiast. Agatha Christie is my queen 👑🔍"}',
    false,
    'authenticated',
    'authenticated'
  ),
  
  -- Reader 5: Luna Petrov - Young adult fan
  (
    '400a0780-d043-4b05-8427-9816855365d5',
    '00000000-0000-0000-0000-000000000000',
    'luna.petrov@example.com',
    crypt('password123', gen_salt('bf')),
    now() - interval '22 days',
    now() - interval '22 days',
    now() - interval '6 hours',
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "luna.petrov@example.com", "display_name": "Luna Petrov", "avatar_url": "https://avatars.example.com/luna.jpg", "bio": "Harry Potter fan since age 7. Always looking for the next magical world to dive into ✨🪄"}',
    false,
    'authenticated',
    'authenticated'
  ),
  
  -- Reader 6: James Wilson - Dystopian fiction reader
  (
    '400a0780-d043-4b05-8427-9816855365d6',
    '00000000-0000-0000-0000-000000000000',
    'james.wilson@example.com',
    crypt('password123', gen_salt('bf')),
    now() - interval '19 days',
    now() - interval '19 days',
    now() - interval '12 hours',
    '{"provider": "email", "providers": ["email"]}',
    '{"email": "james.wilson@example.com", "display_name": "James Wilson", "avatar_url": "https://avatars.example.com/james.jpg", "bio": "Dystopian fiction reader. 1984 changed my worldview. Always questioning the status quo."}',
    false,
    'authenticated',
    'authenticated'
  );