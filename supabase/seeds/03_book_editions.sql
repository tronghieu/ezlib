-- Book editions seed data
-- Creates specific published editions of the general books

INSERT INTO book_editions (id, general_book_id, isbn_13, isbn_10, title, subtitle, language, country, edition_metadata, social_stats, created_at, updated_at)
VALUES
  -- 1984 editions
  (
    '750e8400-e29b-41d4-a716-446655440001',
    '650e8400-e29b-41d4-a716-446655440001',
    '9780451524935',
    '0451524934',
    '1984',
    NULL,
    'en',
    'US',
    '{"publisher": "Signet Classics", "publication_year": 1961, "pages": 328, "format": "Mass Market Paperback", "cover_image": "https://covers.example.com/1984-signet.jpg"}',
    '{"reviews": 23456, "ratings": 45123, "average_rating": 4.3, "borrowing_activity": {"total_borrows": 1234, "current_borrowed": 45}}',
    now() - interval '30 days',
    now() - interval '2 days'
  ),
  (
    '750e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440001', 
    '9780547928227',
    '0547928220',
    'Nineteen Eighty-Four',
    NULL,
    'en',
    'US',
    '{"publisher": "Mariner Books", "publication_year": 2013, "pages": 298, "format": "Paperback", "cover_image": "https://covers.example.com/1984-mariner.jpg"}',
    '{"reviews": 5672, "ratings": 12389, "average_rating": 4.4, "borrowing_activity": {"total_borrows": 567, "current_borrowed": 23}}',
    now() - interval '28 days',
    now() - interval '4 days'
  ),
  
  -- Animal Farm editions  
  (
    '750e8400-e29b-41d4-a716-446655440003',
    '650e8400-e29b-41d4-a716-446655440002',
    '9780451526342',
    '0451526341',
    'Animal Farm',
    NULL,
    'en', 
    'US',
    '{"publisher": "Signet Classics", "publication_year": 1996, "pages": 112, "format": "Mass Market Paperback", "cover_image": "https://covers.example.com/animal-farm-signet.jpg"}',
    '{"reviews": 18234, "ratings": 34567, "average_rating": 4.2, "borrowing_activity": {"total_borrows": 890, "current_borrowed": 34}}',
    now() - interval '26 days',
    now() - interval '6 days'
  ),

  -- Pride and Prejudice editions
  (
    '750e8400-e29b-41d4-a716-446655440004',
    '650e8400-e29b-41d4-a716-446655440003',
    '9780141439518',
    '0141439518',
    'Pride and Prejudice',
    NULL,
    'en',
    'UK', 
    '{"publisher": "Penguin Classics", "publication_year": 2003, "pages": 480, "format": "Paperback", "cover_image": "https://covers.example.com/pride-prejudice-penguin.jpg"}',
    '{"reviews": 34567, "ratings": 67890, "average_rating": 4.5, "borrowing_activity": {"total_borrows": 1567, "current_borrowed": 67}}',
    now() - interval '24 days',
    now() - interval '1 day'
  ),

  -- Foundation editions
  (
    '750e8400-e29b-41d4-a716-446655440005',
    '650e8400-e29b-41d4-a716-446655440004',
    '9780553293357',
    '0553293354',
    'Foundation',
    NULL,
    'en',
    'US',
    '{"publisher": "Spectra", "publication_year": 1991, "pages": 244, "format": "Mass Market Paperback", "cover_image": "https://covers.example.com/foundation-spectra.jpg"}',
    '{"reviews": 8901, "ratings": 15432, "average_rating": 4.2, "borrowing_activity": {"total_borrows": 345, "current_borrowed": 12}}',
    now() - interval '20 days',
    now() - interval '5 days'
  ),

  -- Murder on the Orient Express editions
  (
    '750e8400-e29b-41d4-a716-446655440006',
    '650e8400-e29b-41d4-a716-446655440005',
    '9780062073501',
    '0062073508',
    'Murder on the Orient Express',
    'A Hercule Poirot Mystery',
    'en',
    'US',
    '{"publisher": "William Morrow Paperbacks", "publication_year": 2011, "pages": 274, "format": "Paperback", "cover_image": "https://covers.example.com/orient-express-morrow.jpg"}',
    '{"reviews": 12345, "ratings": 23456, "average_rating": 4.4, "borrowing_activity": {"total_borrows": 678, "current_borrowed": 28}}',
    now() - interval '15 days',
    now() - interval '3 days'
  ),

  -- Harry Potter editions
  (
    '750e8400-e29b-41d4-a716-446655440007',
    '650e8400-e29b-41d4-a716-446655440006',
    '9780439708180',
    '0439708184',
    'Harry Potter and the Sorcerer\'s Stone',
    NULL,
    'en',
    'US',
    '{"publisher": "Scholastic Inc.", "publication_year": 1998, "pages": 309, "format": "Paperback", "cover_image": "https://covers.example.com/harry-potter-scholastic.jpg"}',
    '{"reviews": 89012, "ratings": 145678, "average_rating": 4.6, "borrowing_activity": {"total_borrows": 2345, "current_borrowed": 89}}',
    now() - interval '10 days',
    now() - interval '1 hour'
  ),

  -- Emma editions
  (
    '750e8400-e29b-41d4-a716-446655440008',
    '650e8400-e29b-41d4-a716-446655440007',
    '9780141439587',
    '0141439580',
    'Emma',
    NULL,
    'en',
    'UK',
    '{"publisher": "Penguin Classics", "publication_year": 2003, "pages": 474, "format": "Paperback", "cover_image": "https://covers.example.com/emma-penguin.jpg"}',
    '{"reviews": 23456, "ratings": 45678, "average_rating": 4.3, "borrowing_activity": {"total_borrows": 789, "current_borrowed": 31}}',
    now() - interval '22 days',
    now() - interval '8 days'
  ),

  -- I, Robot editions
  (
    '750e8400-e29b-41d4-a716-446655440009',
    '650e8400-e29b-41d4-a716-446655440008',
    '9780553294385',
    '0553294385',
    'I, Robot',
    NULL,
    'en',
    'US',
    '{"publisher": "Spectra", "publication_year": 1991, "pages": 224, "format": "Mass Market Paperback", "cover_image": "https://covers.example.com/i-robot-spectra.jpg"}',
    '{"reviews": 15678, "ratings": 28901, "average_rating": 4.1, "borrowing_activity": {"total_borrows": 456, "current_borrowed": 18}}',
    now() - interval '18 days',
    now() - interval '7 days'
  );