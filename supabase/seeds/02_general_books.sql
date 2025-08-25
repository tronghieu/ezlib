-- General books seed data  
-- Creates canonical book entries (language-agnostic works)

INSERT INTO general_books (id, canonical_title, first_publication_year, subjects, global_stats, created_at, updated_at)
VALUES
  (
    '650e8400-e29b-41d4-a716-446655440001',
    '1984',
    1949,
    ARRAY['Fiction', 'Dystopian', 'Political', 'Science Fiction', 'Classic'],
    '{"total_editions": 245, "total_reviews": 89234, "average_rating": 4.3, "languages": 67}',
    now() - interval '30 days',
    now() - interval '5 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440002', 
    'Animal Farm',
    1945,
    ARRAY['Fiction', 'Allegory', 'Political', 'Satire', 'Classic'],
    '{"total_editions": 189, "total_reviews": 67891, "average_rating": 4.2, "languages": 52}',
    now() - interval '28 days',
    now() - interval '7 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440003',
    'Pride and Prejudice',
    1813,
    ARRAY['Romance', 'Fiction', 'Classic', 'Literature', 'British'],
    '{"total_editions": 156, "total_reviews": 123456, "average_rating": 4.5, "languages": 43}',
    now() - interval '25 days',
    now() - interval '3 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440004',
    'Foundation',
    1951,
    ARRAY['Science Fiction', 'Space Opera', 'Galactic Empire', 'Future'],
    '{"total_editions": 98, "total_reviews": 34567, "average_rating": 4.2, "languages": 28}',
    now() - interval '20 days',
    now() - interval '8 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440005',
    'Murder on the Orient Express',
    1934,
    ARRAY['Mystery', 'Crime', 'Detective', 'Thriller', 'Classic'],
    '{"total_editions": 87, "total_reviews": 56789, "average_rating": 4.4, "languages": 35}',
    now() - interval '15 days',
    now() - interval '4 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440006',
    'Harry Potter and the Philosopher\'s Stone',
    1997,
    ARRAY['Fantasy', 'Young Adult', 'Magic', 'Adventure', 'Coming of Age'],
    '{"total_editions": 312, "total_reviews": 234567, "average_rating": 4.6, "languages": 78}',
    now() - interval '10 days',
    now() - interval '1 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440007',
    'Emma',
    1815,
    ARRAY['Romance', 'Fiction', 'Classic', 'Literature', 'Comedy'],
    '{"total_editions": 134, "total_reviews": 87432, "average_rating": 4.3, "languages": 31}',
    now() - interval '24 days',
    now() - interval '6 days'
  ),
  (
    '650e8400-e29b-41d4-a716-446655440008',
    'I, Robot',
    1950,
    ARRAY['Science Fiction', 'Robotics', 'AI', 'Short Stories', 'Technology'],
    '{"total_editions": 76, "total_reviews": 45321, "average_rating": 4.1, "languages": 26}',
    now() - interval '18 days',
    now() - interval '9 days'
  );