-- Book contributors seed data
-- Links authors to their books with specific roles

INSERT INTO book_contributors (id, general_book_id, book_edition_id, author_id, role, credit_text, sort_order, created_at, updated_at)
VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'author', 'George Orwell', 1, now() - interval '30 days', now() - interval '30 days'),
  ('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'author', 'Jane Austen', 1, now() - interval '25 days', now() - interval '25 days'),
  ('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'author', 'Isaac Asimov', 1, now() - interval '20 days', now() - interval '20 days'),
  ('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'author', 'J.K. Rowling', 1, now() - interval '10 days', now() - interval '10 days'),
  ('850e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'author', 'Tara Westover', 1, now() - interval '4 years', now() - interval '4 years'),
  ('850e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'author', 'Yuval Noah Harari', 1, now() - interval '3 years', now() - interval '3 years');