-- General books seed data  
-- Creates canonical book entries (language-agnostic works)

INSERT INTO general_books (id, canonical_title, first_publication_year, subjects, global_stats, created_at, updated_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '1984', 1949, ARRAY['Fiction', 'Dystopian'], '{"total_editions": 245, "total_reviews": 89234, "average_rating": 4.3}', now() - interval '30 days', now() - interval '5 days'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Pride and Prejudice', 1813, ARRAY['Romance', 'Fiction'], '{"total_editions": 156, "total_reviews": 123456, "average_rating": 4.5}', now() - interval '25 days', now() - interval '3 days'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Foundation', 1951, ARRAY['Science Fiction'], '{"total_editions": 98, "total_reviews": 34567, "average_rating": 4.2}', now() - interval '20 days', now() - interval '8 days'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Harry Potter and the Philosopher''s Stone', 1997, ARRAY['Fantasy', 'Young Adult'], '{"total_editions": 312, "total_reviews": 234567, "average_rating": 4.6}', now() - interval '10 days', now() - interval '1 days'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Educated', 2018, ARRAY['memoir', 'biography', 'education', 'family'], '{"total_editions": 3, "total_reviews": 127, "global_average_rating": 4.4, "total_borrows": 234, "languages_available": ["en", "es", "fr"]}', now() - interval '4 years', now() - interval '1 month'),
  ('650e8400-e29b-41d4-a716-446655440006', 'Sapiens: A Brief History of Humankind', 2011, ARRAY['history', 'anthropology', 'philosophy', 'evolution'], '{"total_editions": 5, "total_reviews": 298, "global_average_rating": 4.2, "total_borrows": 567, "languages_available": ["en", "he", "es", "fr", "de", "pt"]}', now() - interval '3 years', now() - interval '2 weeks');