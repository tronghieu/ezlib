-- Book contributors seed data
-- Links authors to their books with specific roles

INSERT INTO book_contributors (id, general_book_id, book_edition_id, author_id, role, credit_text, sort_order, created_at)
VALUES
  -- 1984 by George Orwell
  (
    '850e8400-e29b-41d4-a716-446655440001',
    '650e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'author',
    'George Orwell',
    1,
    now() - interval '30 days'
  ),
  (
    '850e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'author',
    'George Orwell',
    1,
    now() - interval '28 days'
  ),

  -- Animal Farm by George Orwell
  (
    '850e8400-e29b-41d4-a716-446655440003',
    '650e8400-e29b-41d4-a716-446655440002',
    '750e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'author',
    'George Orwell',
    1,
    now() - interval '26 days'
  ),

  -- Pride and Prejudice by Jane Austen
  (
    '850e8400-e29b-41d4-a716-446655440004',
    '650e8400-e29b-41d4-a716-446655440003',
    '750e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'author',
    'Jane Austen',
    1,
    now() - interval '24 days'
  ),

  -- Foundation by Isaac Asimov
  (
    '850e8400-e29b-41d4-a716-446655440005',
    '650e8400-e29b-41d4-a716-446655440004',
    '750e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440003',
    'author',
    'Isaac Asimov',
    1,
    now() - interval '20 days'
  ),

  -- Murder on the Orient Express by Agatha Christie
  (
    '850e8400-e29b-41d4-a716-446655440006',
    '650e8400-e29b-41d4-a716-446655440005',
    '750e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440004',
    'author',
    'Agatha Christie',
    1,
    now() - interval '15 days'
  ),

  -- Harry Potter and the Philosopher's Stone by J.K. Rowling
  (
    '850e8400-e29b-41d4-a716-446655440007',
    '650e8400-e29b-41d4-a716-446655440006',
    '750e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440005',
    'author',
    'J.K. Rowling',
    1,
    now() - interval '10 days'
  ),

  -- Emma by Jane Austen
  (
    '850e8400-e29b-41d4-a716-446655440008',
    '650e8400-e29b-41d4-a716-446655440007',
    '750e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440002',
    'author',
    'Jane Austen',
    1,
    now() - interval '22 days'
  ),

  -- I, Robot by Isaac Asimov
  (
    '850e8400-e29b-41d4-a716-446655440009',
    '650e8400-e29b-41d4-a716-446655440008',
    '750e8400-e29b-41d4-a716-446655440009',
    '550e8400-e29b-41d4-a716-446655440003',
    'author',
    'Isaac Asimov',
    1,
    now() - interval '18 days'
  );