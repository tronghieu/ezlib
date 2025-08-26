-- Extended book catalog seeding data
-- Adds more diverse books and authors to complement existing seed data

-- First, add more authors for a diverse catalog
INSERT INTO authors (id, name, canonical_name, biography, metadata, social_stats, created_at, updated_at)
VALUES 
  -- Contemporary fiction authors
  ('550e8400-e29b-41d4-a716-446655440005', 'Tara Westover', 'westover-tara', 'American historian and author known for her memoir Educated.', '{"birth_year": 1986, "nationality": "American", "genres": ["memoir", "biography"], "photo_url": "https://example.com/tara-westover.jpg"}', '{"followers": 12847, "reviews_count": 8934, "average_rating": 4.4}', now() - interval '4 years', now() - interval '1 month'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Yuval Noah Harari', 'harari-yuval-noah', 'Israeli historian and author of Sapiens and Homo Deus.', '{"birth_year": 1976, "nationality": "Israeli", "genres": ["history", "anthropology", "philosophy"], "photo_url": "https://example.com/harari.jpg"}', '{"followers": 23891, "reviews_count": 15672, "average_rating": 4.2}', now() - interval '3 years', now() - interval '2 weeks'),
  ('550e8400-e29b-41d4-a716-446655440007', 'Michelle Obama', 'obama-michelle', 'Former First Lady and bestselling author of Becoming.', '{"birth_year": 1964, "nationality": "American", "genres": ["memoir", "biography", "politics"], "photo_url": "https://example.com/michelle-obama.jpg"}', '{"followers": 45673, "reviews_count": 28394, "average_rating": 4.7}', now() - interval '5 years', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440008', 'Trevor Noah', 'noah-trevor', 'South African comedian and author of Born a Crime.', '{"birth_year": 1984, "nationality": "South African", "genres": ["memoir", "comedy", "social commentary"], "photo_url": "https://example.com/trevor-noah.jpg"}', '{"followers": 18734, "reviews_count": 12456, "average_rating": 4.3}', now() - interval '6 years', now() - interval '1 week'),
  
  -- Science and technology authors
  ('550e8400-e29b-41d4-a716-446655440009', 'Mary Roach', 'roach-mary', 'American science writer known for humorous popular science books.', '{"birth_year": 1959, "nationality": "American", "genres": ["science", "humor"], "photo_url": "https://example.com/mary-roach.jpg"}', '{"followers": 8945, "reviews_count": 6234, "average_rating": 4.1}', now() - interval '8 years', now() - interval '5 days'),
  ('550e8400-e29b-41d4-a716-446655440010', 'Neil deGrasse Tyson', 'tyson-neil-degrasse', 'American astrophysicist and science communicator.', '{"birth_year": 1958, "nationality": "American", "genres": ["astrophysics", "science communication"], "photo_url": "https://example.com/neil-tyson.jpg"}', '{"followers": 34567, "reviews_count": 19823, "average_rating": 4.0}', now() - interval '10 years', now() - interval '2 days'),
  
  -- Classic and literary fiction
  ('550e8400-e29b-41d4-a716-446655440011', 'Harper Lee', 'lee-harper', 'American novelist best known for To Kill a Mockingbird.', '{"birth_year": 1926, "death_year": 2016, "nationality": "American", "genres": ["literary fiction", "southern gothic"], "photo_url": "https://example.com/harper-lee.jpg"}', '{"followers": 67890, "reviews_count": 45678, "average_rating": 4.6}', now() - interval '12 years', now() - interval '1 year'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Gabriel García Márquez', 'marquez-gabriel-garcia', 'Colombian novelist and Nobel Prize winner.', '{"birth_year": 1927, "death_year": 2014, "nationality": "Colombian", "genres": ["magical realism", "literary fiction"], "photo_url": "https://example.com/garcia-marquez.jpg"}', '{"followers": 29834, "reviews_count": 18723, "average_rating": 4.5}', now() - interval '15 years', now() - interval '6 months'),
  
  -- Business and self-help
  ('550e8400-e29b-41d4-a716-446655440013', 'James Clear', 'clear-james', 'American author known for Atomic Habits.', '{"birth_year": 1986, "nationality": "American", "genres": ["self-help", "productivity", "psychology"], "photo_url": "https://example.com/james-clear.jpg"}', '{"followers": 56789, "reviews_count": 34567, "average_rating": 4.4}', now() - interval '2 years', now() - interval '2 weeks'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Cal Newport', 'newport-cal', 'American computer scientist and productivity expert.', '{"birth_year": 1982, "nationality": "American", "genres": ["productivity", "technology", "career advice"], "photo_url": "https://example.com/cal-newport.jpg"}', '{"followers": 23456, "reviews_count": 15432, "average_rating": 4.2}', now() - interval '7 years', now() - interval '1 month'),
  
  -- Young adult and contemporary
  ('550e8400-e29b-41d4-a716-446655440015', 'Angie Thomas', 'thomas-angie', 'American young adult author of The Hate U Give.', '{"birth_year": 1988, "nationality": "American", "genres": ["young adult", "contemporary fiction", "social issues"], "photo_url": "https://example.com/angie-thomas.jpg"}', '{"followers": 41234, "reviews_count": 27891, "average_rating": 4.8}', now() - interval '3 years', now() - interval '3 weeks');

-- Add more general books with diverse subjects and genres
INSERT INTO general_books (id, canonical_title, first_publication_year, subjects, global_stats, created_at, updated_at)
VALUES
  -- Memoirs and biographies
  ('550e8400-e29b-41d4-a716-446655440201', 'Educated', 2018, ARRAY['memoir', 'biography', 'education', 'family'], '{"total_editions": 3, "total_reviews": 127, "global_average_rating": 4.4, "total_borrows": 234, "languages_available": ["en", "es", "fr"]}'::jsonb, now() - interval '4 years', now() - interval '1 month'),
  ('550e8400-e29b-41d4-a716-446655440202', 'Becoming', 2018, ARRAY['memoir', 'biography', 'politics', 'African American'], '{"total_editions": 4, "total_reviews": 189, "global_average_rating": 4.7, "total_borrows": 456, "languages_available": ["en", "es", "fr", "de"]}'::jsonb, now() - interval '5 years', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440203', 'Born a Crime', 2016, ARRAY['memoir', 'comedy', 'South Africa', 'apartheid'], '{"total_editions": 2, "total_reviews": 98, "global_average_rating": 4.3, "total_borrows": 187, "languages_available": ["en", "af"]}'::jsonb, now() - interval '6 years', now() - interval '1 week'),
  
  -- Science and history
  ('550e8400-e29b-41d4-a716-446655440204', 'Sapiens: A Brief History of Humankind', 2011, ARRAY['history', 'anthropology', 'philosophy', 'evolution'], '{"total_editions": 5, "total_reviews": 298, "global_average_rating": 4.2, "total_borrows": 567, "languages_available": ["en", "he", "es", "fr", "de", "pt"]}'::jsonb, now() - interval '3 years', now() - interval '2 weeks'),
  ('550e8400-e29b-41d4-a716-446655440205', 'Astrophysics for People in a Hurry', 2017, ARRAY['astrophysics', 'science', 'cosmology', 'popular science'], '{"total_editions": 2, "total_reviews": 145, "global_average_rating": 4.0, "total_borrows": 298, "languages_available": ["en", "es"]}'::jsonb, now() - interval '7 years', now() - interval '2 days'),
  ('550e8400-e29b-41d4-a716-446655440206', 'Packing for Mars', 2010, ARRAY['space', 'science', 'humor', 'NASA'], '{"total_editions": 1, "total_reviews": 67, "global_average_rating": 4.1, "total_borrows": 134, "languages_available": ["en"]}'::jsonb, now() - interval '8 years', now() - interval '5 days'),
  
  -- Literary classics
  ('550e8400-e29b-41d4-a716-446655440207', 'To Kill a Mockingbird', 1960, ARRAY['literary fiction', 'southern gothic', 'racism', 'coming of age'], '{"total_editions": 8, "total_reviews": 456, "global_average_rating": 4.6, "total_borrows": 789, "languages_available": ["en", "es", "fr", "de", "it", "pt"]}'::jsonb, now() - interval '12 years', now() - interval '1 year'),
  ('550e8400-e29b-41d4-a716-446655440208', 'One Hundred Years of Solitude', 1967, ARRAY['magical realism', 'literary fiction', 'Latin America', 'family saga'], '{"total_editions": 6, "total_reviews": 234, "global_average_rating": 4.5, "total_borrows": 345, "languages_available": ["es", "en", "fr", "de", "pt", "it"]}'::jsonb, now() - interval '15 years', now() - interval '6 months'),
  
  -- Self-help and productivity
  ('550e8400-e29b-41d4-a716-446655440209', 'Atomic Habits', 2018, ARRAY['self-help', 'productivity', 'psychology', 'behavior change'], '{"total_editions": 3, "total_reviews": 567, "global_average_rating": 4.4, "total_borrows": 892, "languages_available": ["en", "es", "pt", "de"]}'::jsonb, now() - interval '2 years', now() - interval '2 weeks'),
  ('550e8400-e29b-41d4-a716-446655440210', 'Deep Work', 2016, ARRAY['productivity', 'technology', 'career', 'focus'], '{"total_editions": 2, "total_reviews": 234, "global_average_rating": 4.2, "total_borrows": 456, "languages_available": ["en", "es"]}'::jsonb, now() - interval '7 years', now() - interval '1 month'),
  
  -- Young adult and contemporary
  ('550e8400-e29b-41d4-a716-446655440211', 'The Hate U Give', 2017, ARRAY['young adult', 'contemporary fiction', 'racism', 'police brutality', 'social justice'], '{"total_editions": 4, "total_reviews": 398, "global_average_rating": 4.8, "total_borrows": 623, "languages_available": ["en", "es", "fr"]}'::jsonb, now() - interval '3 years', now() - interval '3 weeks');

-- Add corresponding book editions for the new general books
INSERT INTO book_editions (id, general_book_id, isbn_13, isbn_10, title, subtitle, language, country, edition_metadata, social_stats, created_at, updated_at)
VALUES
  -- Educated editions
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '9780399590504', '0399590501', 'Educated', 'A Memoir', 'en', 'USA', '{"publisher": "Random House", "publication_date": "2018-02-20", "page_count": 334, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg", "format": "hardcover", "quality_score": 0.9, "enrichment_status": "completed"}'::jsonb, '{"review_count": 67, "average_rating": 4.4}'::jsonb, now() - interval '4 years', now() - interval '1 month'),
  ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440201', '9780099511021', '0099511029', 'Educated', 'A Memoir', 'en', 'UK', '{"publisher": "Hutchinson", "publication_date": "2018-02-20", "page_count": 334, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780099511021-L.jpg", "format": "paperback", "quality_score": 0.8, "enrichment_status": "completed"}'::jsonb, '{"review_count": 32, "average_rating": 4.3}'::jsonb, now() - interval '4 years', now() - interval '1 month'),
  
  -- Becoming editions
  ('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440202', '9781524763138', '1524763136', 'Becoming', NULL, 'en', 'USA', '{"publisher": "Crown", "publication_date": "2018-11-13", "page_count": 448, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg", "format": "hardcover", "quality_score": 0.95, "enrichment_status": "completed"}'::jsonb, '{"review_count": 124, "average_rating": 4.7}'::jsonb, now() - interval '5 years', now() - interval '3 days'),
  ('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440202', '9780241334140', '0241334144', 'Becoming', NULL, 'en', 'UK', '{"publisher": "Viking", "publication_date": "2018-11-13", "page_count": 448, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780241334140-L.jpg", "format": "paperback", "quality_score": 0.9, "enrichment_status": "completed"}'::jsonb, '{"review_count": 89, "average_rating": 4.6}'::jsonb, now() - interval '5 years', now() - interval '3 days'),
  
  -- Born a Crime editions
  ('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440203', '9780399588174', '0399588175', 'Born a Crime', 'Stories from a South African Childhood', 'en', 'USA', '{"publisher": "Spiegel & Grau", "publication_date": "2016-11-15", "page_count": 304, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780399588174-L.jpg", "format": "hardcover", "quality_score": 0.85, "enrichment_status": "completed"}'::jsonb, '{"review_count": 56, "average_rating": 4.3}'::jsonb, now() - interval '6 years', now() - interval '1 week'),
  
  -- Sapiens editions
  ('550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440204', '9780062316097', '0062316095', 'Sapiens', 'A Brief History of Humankind', 'en', 'USA', '{"publisher": "Harper", "publication_date": "2015-02-10", "page_count": 443, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg", "format": "hardcover", "quality_score": 0.9, "enrichment_status": "completed"}'::jsonb, '{"review_count": 187, "average_rating": 4.2}'::jsonb, now() - interval '3 years', now() - interval '2 weeks'),
  ('550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440204', '9780099590088', '0099590085', 'Sapiens', 'A Brief History of Humankind', 'en', 'UK', '{"publisher": "Vintage", "publication_date": "2015-04-30", "page_count": 512, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780099590088-L.jpg", "format": "paperback", "quality_score": 0.85, "enrichment_status": "completed"}'::jsonb, '{"review_count": 143, "average_rating": 4.1}'::jsonb, now() - interval '3 years', now() - interval '2 weeks'),
  
  -- Astrophysics for People in a Hurry
  ('550e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440205', '9780393609394', '0393609391', 'Astrophysics for People in a Hurry', NULL, 'en', 'USA', '{"publisher": "W. W. Norton & Company", "publication_date": "2017-05-02", "page_count": 224, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780393609394-L.jpg", "format": "hardcover", "quality_score": 0.8, "enrichment_status": "completed"}'::jsonb, '{"review_count": 89, "average_rating": 4.0}'::jsonb, now() - interval '7 years', now() - interval '2 days'),
  
  -- To Kill a Mockingbird
  ('550e8400-e29b-41d4-a716-446655440309', '550e8400-e29b-41d4-a716-446655440207', '9780061120084', '0061120081', 'To Kill a Mockingbird', NULL, 'en', 'USA', '{"publisher": "Harper Perennial Modern Classics", "publication_date": "2006-05-23", "page_count": 376, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg", "format": "paperback", "quality_score": 0.95, "enrichment_status": "completed"}'::jsonb, '{"review_count": 234, "average_rating": 4.6}'::jsonb, now() - interval '12 years', now() - interval '1 year'),
  
  -- Atomic Habits
  ('550e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440209', '9780735211292', '0735211299', 'Atomic Habits', 'An Easy & Proven Way to Build Good Habits & Break Bad Ones', 'en', 'USA', '{"publisher": "Avery", "publication_date": "2018-10-16", "page_count": 320, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg", "format": "hardcover", "quality_score": 0.9, "enrichment_status": "completed"}'::jsonb, '{"review_count": 345, "average_rating": 4.4}'::jsonb, now() - interval '2 years', now() - interval '2 weeks'),
  
  -- The Hate U Give
  ('550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440211', '9780062498533', '0062498533', 'The Hate U Give', NULL, 'en', 'USA', '{"publisher": "Balzer + Bray", "publication_date": "2017-02-28", "page_count": 464, "cover_image_url": "https://covers.openlibrary.org/b/isbn/9780062498533-L.jpg", "format": "hardcover", "quality_score": 0.9, "enrichment_status": "completed"}'::jsonb, '{"review_count": 267, "average_rating": 4.8}'::jsonb, now() - interval '3 years', now() - interval '3 weeks');

-- Add book contributors (author-book relationships) for the new books
INSERT INTO book_contributors (id, general_book_id, book_edition_id, author_id, role, sort_order, created_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440005', 'author', 0, now() - interval '4 years'),
  ('650e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440005', 'author', 0, now() - interval '4 years'),
  ('650e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440007', 'author', 0, now() - interval '5 years'),
  ('650e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440007', 'author', 0, now() - interval '5 years'),
  ('650e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440008', 'author', 0, now() - interval '6 years'),
  ('650e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440006', 'author', 0, now() - interval '3 years'),
  ('650e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440006', 'author', 0, now() - interval '3 years'),
  ('650e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440010', 'author', 0, now() - interval '7 years'),
  ('650e8400-e29b-41d4-a716-446655440309', '550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440309', '550e8400-e29b-41d4-a716-446655440011', 'author', 0, now() - interval '12 years'),
  ('650e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440310', '550e8400-e29b-41d4-a716-446655440013', 'author', 0, now() - interval '2 years'),
  ('650e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440311', '550e8400-e29b-41d4-a716-446655440015', 'author', 0, now() - interval '3 years');