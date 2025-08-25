-- EzLib Database Seed Data (Working Version)
-- Minimal seed data that works with database triggers

-- Clear existing data (in reverse dependency order)
DELETE FROM reviews;
DELETE FROM book_contributors; 
DELETE FROM book_editions;
DELETE FROM general_books;
DELETE FROM authors;
DELETE FROM auth.users WHERE email LIKE '%@example.com';

-- Disable triggers temporarily to avoid issues during seeding
ALTER TABLE book_editions DISABLE TRIGGER update_general_book_stats_trigger;
ALTER TABLE reviews DISABLE TRIGGER update_review_stats_trigger;

-- Users seed data
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES
  ('400a0780-d043-4b05-8427-9816855365d1', 'emily.chen@example.com', now() - interval '45 days', '{"display_name": "Emily Chen"}', now() - interval '45 days', now() - interval '2 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d2', 'marcus.rodriguez@example.com', now() - interval '38 days', '{"display_name": "Marcus Rodriguez"}', now() - interval '38 days', now() - interval '5 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d3', 'james.wilson@example.com', now() - interval '19 days', '{"display_name": "James Wilson"}', now() - interval '19 days', now() - interval '12 hours', false, false);

-- Authors
INSERT INTO authors (id, name, canonical_name, biography, metadata, social_stats, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'George Orwell', 'orwell-george', 'British author and journalist.', '{"birth_year": 1903, "death_year": 1950}', '{"followers": 15234, "reviews_count": 8921, "average_rating": 4.3}', now() - interval '30 days', now() - interval '30 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Jane Austen', 'austen-jane', 'English novelist.', '{"birth_year": 1775, "death_year": 1817}', '{"followers": 21847, "reviews_count": 12456, "average_rating": 4.5}', now() - interval '25 days', now() - interval '25 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Isaac Asimov', 'asimov-isaac', 'American science fiction writer.', '{"birth_year": 1920, "death_year": 1992}', '{"followers": 9876, "reviews_count": 6543, "average_rating": 4.2}', now() - interval '20 days', now() - interval '20 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'J.K. Rowling', 'rowling-jk', 'British author.', '{"birth_year": 1965}', '{"followers": 45632, "reviews_count": 23891, "average_rating": 4.6}', now() - interval '10 days', now() - interval '10 days');

-- General books
INSERT INTO general_books (id, canonical_title, first_publication_year, subjects, global_stats, created_at, updated_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '1984', 1949, ARRAY['Fiction', 'Dystopian'], '{"total_editions": 245, "total_reviews": 89234, "average_rating": 4.3}', now() - interval '30 days', now() - interval '5 days'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Pride and Prejudice', 1813, ARRAY['Romance', 'Fiction'], '{"total_editions": 156, "total_reviews": 123456, "average_rating": 4.5}', now() - interval '25 days', now() - interval '3 days'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Foundation', 1951, ARRAY['Science Fiction'], '{"total_editions": 98, "total_reviews": 34567, "average_rating": 4.2}', now() - interval '20 days', now() - interval '8 days'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Harry Potter and the Philosopher''s Stone', 1997, ARRAY['Fantasy', 'Young Adult'], '{"total_editions": 312, "total_reviews": 234567, "average_rating": 4.6}', now() - interval '10 days', now() - interval '1 days');

-- Book editions
INSERT INTO book_editions (id, general_book_id, isbn_13, isbn_10, title, language, country, edition_metadata, social_stats, created_at, updated_at)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '9780451524935', '0451524934', '1984', 'en', 'US', '{"publisher": "Signet Classics", "publication_year": 1961, "pages": 328, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '30 days', now() - interval '2 days'),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '9780141439518', '0141439518', 'Pride and Prejudice', 'en', 'UK', '{"publisher": "Penguin Classics", "publication_year": 2003, "pages": 480, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '24 days', now() - interval '1 day'),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '9780553293357', '0553293354', 'Foundation', 'en', 'US', '{"publisher": "Spectra", "publication_year": 1991, "pages": 244, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '20 days', now() - interval '5 days'),
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '9780439708180', '0439708184', 'Harry Potter and the Sorcerer''s Stone', 'en', 'US', '{"publisher": "Scholastic Inc.", "publication_year": 1998, "pages": 309, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '10 days', now() - interval '1 hour');

-- Book contributors
INSERT INTO book_contributors (id, general_book_id, book_edition_id, author_id, role, credit_text, sort_order, created_at)
VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'author', 'George Orwell', 1, now() - interval '30 days'),
  ('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'author', 'Jane Austen', 1, now() - interval '24 days'),
  ('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'author', 'Isaac Asimov', 1, now() - interval '20 days'),
  ('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'author', 'J.K. Rowling', 1, now() - interval '10 days');

-- Re-enable triggers
ALTER TABLE book_editions ENABLE TRIGGER update_general_book_stats_trigger;
ALTER TABLE reviews ENABLE TRIGGER update_review_stats_trigger;

-- Reviews (these will trigger the stats updates)
INSERT INTO reviews (id, book_edition_id, general_book_id, reviewer_id, content, rating, language, visibility, social_metrics, created_at, updated_at)
VALUES
  ('950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '400a0780-d043-4b05-8427-9816855365d1', 'Amazing fantasy world!', 5, 'en', 'public', '{"likes": 23, "replies": 7}', now() - interval '8 days', now() - interval '8 days'),
  ('950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '400a0780-d043-4b05-8427-9816855365d2', 'Brilliant social commentary.', 5, 'en', 'public', '{"likes": 45, "replies": 12}', now() - interval '12 days', now() - interval '12 days'),
  ('950e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '400a0780-d043-4b05-8427-9816855365d3', 'More relevant than ever.', 5, 'en', 'public', '{"likes": 42, "replies": 18}', now() - interval '5 days', now() - interval '5 days');