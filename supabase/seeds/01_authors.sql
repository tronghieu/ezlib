-- Authors seed data
-- Creates a small set of well-known authors for testing

INSERT INTO authors (id, name, canonical_name, biography, metadata, social_stats, created_at, updated_at)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'George Orwell',
    'orwell-george',
    'British author and journalist best known for his dystopian novel 1984 and allegorical novella Animal Farm.',
    '{"birth_year": 1903, "death_year": 1950, "nationality": "British", "genres": ["Fiction", "Political", "Dystopian"]}',
    '{"followers": 15234, "reviews_count": 8921, "average_rating": 4.3}',
    now() - interval '30 days',
    now() - interval '30 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002', 
    'Jane Austen',
    'austen-jane',
    'English novelist known for her wit, social commentary, and novels including Pride and Prejudice and Emma.',
    '{"birth_year": 1775, "death_year": 1817, "nationality": "English", "genres": ["Romance", "Fiction", "Classic"]}',
    '{"followers": 21847, "reviews_count": 12456, "average_rating": 4.5}',
    now() - interval '25 days',
    now() - interval '25 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Isaac Asimov', 
    'asimov-isaac',
    'American science fiction writer and biochemist, famous for his Robot and Foundation series.',
    '{"birth_year": 1920, "death_year": 1992, "nationality": "American", "genres": ["Science Fiction", "Non-fiction"]}',
    '{"followers": 9876, "reviews_count": 6543, "average_rating": 4.2}',
    now() - interval '20 days',
    now() - interval '20 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    'Agatha Christie',
    'christie-agatha',
    'British crime novelist, known for her detective characters Hercule Poirot and Miss Jane Marple.',
    '{"birth_year": 1890, "death_year": 1976, "nationality": "British", "genres": ["Mystery", "Crime", "Detective"]}',
    '{"followers": 18765, "reviews_count": 11234, "average_rating": 4.4}',
    now() - interval '15 days', 
    now() - interval '15 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005',
    'J.K. Rowling',
    'rowling-jk',
    'British author best known for the Harry Potter fantasy series.',
    '{"birth_year": 1965, "nationality": "British", "genres": ["Fantasy", "Young Adult", "Fiction"]}',
    '{"followers": 45632, "reviews_count": 23891, "average_rating": 4.6}',
    now() - interval '10 days',
    now() - interval '10 days'
  );