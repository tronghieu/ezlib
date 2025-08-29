-- EzLib Database Comprehensive Seed Data
-- Complete library management system with books, staff, members, and transactions

-- Clear existing data (in reverse dependency order)
DELETE FROM borrowing_transactions;
DELETE FROM book_copies;
DELETE FROM library_members;
DELETE FROM library_staff;
DELETE FROM libraries;
DELETE FROM social_follows;
DELETE FROM author_follows;
DELETE FROM reviews;
DELETE FROM book_contributors; 
DELETE FROM book_editions;
DELETE FROM general_books;
DELETE FROM authors;
DELETE FROM auth.users WHERE email LIKE '%@example.com' OR email LIKE '%@nycentral.org' OR email LIKE '%@berkeley.edu' OR email LIKE '%@greenfieldlibrary.org' OR email LIKE '%@lincolnhs.org' OR email LIKE '%@blrl.org';

-- ============================================================================
-- USERS SEED DATA
-- ============================================================================

-- Core users for social features
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES
  ('400a0780-d043-4b05-8427-9816855365d1', 'emily.chen@example.com', now() - interval '45 days', '{"display_name": "Emily Chen"}', now() - interval '45 days', now() - interval '2 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d2', 'marcus.rodriguez@example.com', now() - interval '38 days', '{"display_name": "Marcus Rodriguez"}', now() - interval '38 days', now() - interval '5 days', false, false),
  ('400a0780-d043-4b05-8427-9816855365d3', 'james.wilson@example.com', now() - interval '19 days', '{"display_name": "James Wilson"}', now() - interval '19 days', now() - interval '12 hours', false, false),
  
  -- Library staff users
  ('500a0780-d043-4b05-8427-9816855365d1', 'sarah.chen@nycentral.org', now() - interval '18 months', '{"display_name": "Sarah Chen", "job_title": "Head Librarian"}', now() - interval '18 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d2', 'mike.torres@nycentral.org', now() - interval '14 months', '{"display_name": "Miguel Torres", "job_title": "Reference Librarian"}', now() - interval '14 months', now() - interval '3 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d3', 'anna.kowalski@nycentral.org', now() - interval '8 months', '{"display_name": "Anna Kowalski", "job_title": "Library Assistant"}', now() - interval '8 months', now() - interval '2 days', false, false),
  ('500a0780-d043-4b05-8427-9816855365d4', 'david.kim@berkeley.edu', now() - interval '2 years', '{"display_name": "David Kim", "job_title": "Engineering Librarian"}', now() - interval '2 years', now() - interval '6 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d5', 'rachel.smith@berkeley.edu', now() - interval '11 months', '{"display_name": "Rachel Smith", "job_title": "Research Librarian"}', now() - interval '11 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d6', 'janet.murphy@greenfieldlibrary.org', now() - interval '3 years', '{"display_name": "Janet Murphy", "job_title": "Library Director"}', now() - interval '3 years', now() - interval '4 days', false, false),
  
  -- Library members
  ('700a0780-d043-4b05-8427-9816855365d1', 'alice.johnson@example.com', now() - interval '2 years', '{"display_name": "Alice Johnson", "preferred_genres": ["mystery", "biography"]}', now() - interval '2 years', now() - interval '3 days', false, false),
  ('700a0780-d043-4b05-8427-9816855365d2', 'carlos.rodriguez@example.com', now() - interval '1 year', '{"display_name": "Carlos Rodriguez", "preferred_genres": ["science", "technology"]}', now() - interval '1 year', now() - interval '1 week', false, false),
  ('700a0780-d043-4b05-8427-9816855365d3', 'priya.patel@example.com', now() - interval '8 months', '{"display_name": "Priya Patel", "preferred_genres": ["fiction", "history"]}', now() - interval '8 months', now() - interval '2 hours', false, false),
  ('700a0780-d043-4b05-8427-9816855365d4', 'james.thompson@example.com', now() - interval '3 years', '{"display_name": "James Thompson", "preferred_genres": ["fantasy", "science fiction"]}', now() - interval '3 years', now() - interval '5 days', false, false);

-- ============================================================================
-- LIBRARIES SEED DATA
-- ============================================================================

INSERT INTO libraries (id, name, code, address, contact_info, settings, stats, created_at, updated_at, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 
   'New York Central Library', 
   'NYCL-MAIN',
   '{"street": "476 5th Ave", "city": "New York", "state": "NY", "country": "USA", "postal_code": "10018"}'::jsonb,
   '{"phone": "+1-212-930-0800", "email": "info@nycentral.org", "website": "https://nycentral.org"}'::jsonb,
   '{"loan_period_days": 21, "max_renewals": 3, "max_books_per_member": 10, "late_fee_per_day": 0.50, "membership_fee": 0, "allow_holds": true}'::jsonb,
   '{"total_books": 45230, "total_members": 8924, "active_loans": 1847, "books_loaned_this_month": 3421}'::jsonb,
   now() - interval '2 years 3 months',
   now() - interval '1 day',
   'active'),
   
  ('550e8400-e29b-41d4-a716-446655440102',
   'Berkeley Engineering Library',
   'UCB-ENGR',
   '{"street": "110 Bechtel Engineering Center", "city": "Berkeley", "state": "CA", "country": "USA", "postal_code": "94720"}'::jsonb,
   '{"phone": "+1-510-642-3333", "email": "englib@berkeley.edu", "website": "https://guides.lib.berkeley.edu/engineering"}'::jsonb,
   '{"loan_period_days": 28, "max_renewals": 4, "max_books_per_member": 25, "late_fee_per_day": 1.00, "membership_fee": 0, "allow_holds": true}'::jsonb,
   '{"total_books": 12847, "total_members": 2341, "active_loans": 892, "books_loaned_this_month": 1247}'::jsonb,
   now() - interval '1 year 8 months',
   now() - interval '3 hours',
   'active');

-- ============================================================================
-- AUTHORS SEED DATA 
-- ============================================================================

INSERT INTO authors (id, name, canonical_name, biography, metadata, social_stats, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'George Orwell', 'orwell-george', 'British author and journalist.', '{"birth_year": 1903, "death_year": 1950}', '{"followers": 15234, "reviews_count": 8921, "average_rating": 4.3}', now() - interval '30 days', now() - interval '30 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Jane Austen', 'austen-jane', 'English novelist.', '{"birth_year": 1775, "death_year": 1817}', '{"followers": 21847, "reviews_count": 12456, "average_rating": 4.5}', now() - interval '25 days', now() - interval '25 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Isaac Asimov', 'asimov-isaac', 'American science fiction writer.', '{"birth_year": 1920, "death_year": 1992}', '{"followers": 9876, "reviews_count": 6543, "average_rating": 4.2}', now() - interval '20 days', now() - interval '20 days'),
  ('550e8400-e29b-41d4-a716-446655440004', 'J.K. Rowling', 'rowling-jk', 'British author.', '{"birth_year": 1965}', '{"followers": 45632, "reviews_count": 23891, "average_rating": 4.6}', now() - interval '10 days', now() - interval '10 days'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Tara Westover', 'westover-tara', 'American historian and author known for her memoir Educated.', '{"birth_year": 1986, "nationality": "American", "genres": ["memoir", "biography"]}', '{"followers": 12847, "reviews_count": 8934, "average_rating": 4.4}', now() - interval '4 years', now() - interval '1 month'),
  ('550e8400-e29b-41d4-a716-446655440006', 'Yuval Noah Harari', 'harari-yuval-noah', 'Israeli historian and author of Sapiens and Homo Deus.', '{"birth_year": 1976, "nationality": "Israeli", "genres": ["history", "anthropology", "philosophy"]}', '{"followers": 23891, "reviews_count": 15672, "average_rating": 4.2}', now() - interval '3 years', now() - interval '2 weeks');

-- ============================================================================
-- GENERAL BOOKS SEED DATA
-- ============================================================================

INSERT INTO general_books (id, canonical_title, first_publication_year, subjects, global_stats, created_at, updated_at)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '1984', 1949, ARRAY['Fiction', 'Dystopian'], '{"total_editions": 245, "total_reviews": 89234, "average_rating": 4.3}', now() - interval '30 days', now() - interval '5 days'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Pride and Prejudice', 1813, ARRAY['Romance', 'Fiction'], '{"total_editions": 156, "total_reviews": 123456, "average_rating": 4.5}', now() - interval '25 days', now() - interval '3 days'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Foundation', 1951, ARRAY['Science Fiction'], '{"total_editions": 98, "total_reviews": 34567, "average_rating": 4.2}', now() - interval '20 days', now() - interval '8 days'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Harry Potter and the Philosopher''s Stone', 1997, ARRAY['Fantasy', 'Young Adult'], '{"total_editions": 312, "total_reviews": 234567, "average_rating": 4.6}', now() - interval '10 days', now() - interval '1 days'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Educated', 2018, ARRAY['memoir', 'biography', 'education', 'family'], '{"total_editions": 3, "total_reviews": 127, "global_average_rating": 4.4, "total_borrows": 234, "languages_available": ["en", "es", "fr"]}', now() - interval '4 years', now() - interval '1 month'),
  ('650e8400-e29b-41d4-a716-446655440006', 'Sapiens: A Brief History of Humankind', 2011, ARRAY['history', 'anthropology', 'philosophy', 'evolution'], '{"total_editions": 5, "total_reviews": 298, "global_average_rating": 4.2, "total_borrows": 567, "languages_available": ["en", "he", "es", "fr", "de", "pt"]}', now() - interval '3 years', now() - interval '2 weeks');

-- ============================================================================
-- BOOK EDITIONS SEED DATA
-- ============================================================================

INSERT INTO book_editions (id, general_book_id, isbn_13, isbn_10, title, language, country, edition_metadata, social_stats, created_at, updated_at)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '9780451524935', '0451524934', '1984', 'en', 'US', '{"publisher": "Signet Classics", "publication_year": 1961, "pages": 328, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '30 days', now() - interval '2 days'),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '9780141439518', '0141439518', 'Pride and Prejudice', 'en', 'UK', '{"publisher": "Penguin Classics", "publication_year": 2003, "pages": 480, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '24 days', now() - interval '1 day'),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '9780553293357', '0553293354', 'Foundation', 'en', 'US', '{"publisher": "Spectra", "publication_year": 1991, "pages": 244, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '20 days', now() - interval '5 days'),
  ('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '9780439708180', '0439708184', 'Harry Potter and the Sorcerer''s Stone', 'en', 'US', '{"publisher": "Scholastic Inc.", "publication_year": 1998, "pages": 309, "format": "paperback"}', '{"reviews": 0, "ratings": 0}', now() - interval '10 days', now() - interval '1 hour'),
  ('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '9780399590504', '0399590501', 'Educated', 'en', 'USA', '{"publisher": "Random House", "publication_date": "2018-02-20", "page_count": 334, "format": "hardcover", "quality_score": 0.9, "enrichment_status": "completed"}', '{"review_count": 67, "average_rating": 4.4}', now() - interval '4 years', now() - interval '1 month'),
  ('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', '9780062316097', '0062316095', 'Sapiens', 'en', 'USA', '{"publisher": "Harper", "publication_date": "2015-02-10", "page_count": 443, "format": "hardcover", "quality_score": 0.9, "enrichment_status": "completed"}', '{"review_count": 187, "average_rating": 4.2}', now() - interval '3 years', now() - interval '2 weeks');

-- ============================================================================
-- LIBRARY STAFF SEED DATA
-- ============================================================================

INSERT INTO library_staff (id, user_id, library_id, role, permissions, employment_info, created_at, updated_at, status)
VALUES
  ('600a0780-d043-4b05-8427-9816855365d1',
   '500a0780-d043-4b05-8427-9816855365d1',
   '550e8400-e29b-41d4-a716-446655440101',
   'manager',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": true, "admin_settings": true}',
   '{"employee_id": "NYC001", "department": "Administration", "hire_date": "2023-03-15", "work_schedule": "full_time"}',
   now() - interval '18 months',
   now() - interval '1 day',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365d2',
   '500a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440101',
   'librarian',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": false, "admin_settings": false}',
   '{"employee_id": "NYC002", "department": "Reference", "hire_date": "2023-07-20", "work_schedule": "full_time"}',
   now() - interval '14 months',
   now() - interval '3 hours',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365d4',
   '500a0780-d043-4b05-8427-9816855365d4',
   '550e8400-e29b-41d4-a716-446655440102',
   'librarian',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": true, "admin_settings": true}',
   '{"employee_id": "UCB001", "department": "Engineering Collections", "hire_date": "2022-08-15", "work_schedule": "full_time"}',
   now() - interval '2 years',
   now() - interval '6 hours',
   'active');

-- ============================================================================
-- LIBRARY MEMBERS SEED DATA
-- ============================================================================

INSERT INTO library_members (id, user_id, library_id, member_id, personal_info, membership_info, borrowing_stats, created_at, updated_at, status)
VALUES
  ('800a0780-d043-4b05-8427-9816855365d1',
   '700a0780-d043-4b05-8427-9816855365d1',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123456',
   '{"first_name": "Alice", "last_name": "Johnson", "email": "alice.johnson@example.com", "phone": "+1-646-555-0123"}',
   '{"type": "adult", "expiry_date": "2025-03-15", "fees_owed": 2.50, "notes": "Prefers mystery novels, active reader"}',
   '{"total_books_borrowed": 47, "current_loans": 3, "overdue_items": 1, "total_late_fees": 12.50}',
   now() - interval '2 years',
   now() - interval '3 days',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365d2',
   '700a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123457',
   '{"first_name": "Carlos", "last_name": "Rodriguez", "email": "carlos.rodriguez@example.com", "phone": "+1-718-555-0156"}',
   '{"type": "adult", "expiry_date": "2025-08-20", "fees_owed": 0, "notes": "Interested in science and technology books"}',
   '{"total_books_borrowed": 23, "current_loans": 2, "overdue_items": 0, "total_late_fees": 3.75}',
   now() - interval '1 year',
   now() - interval '1 week',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365d3',
   '700a0780-d043-4b05-8427-9816855365d3',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123458',
   '{"first_name": "Priya", "last_name": "Patel", "email": "priya.patel@example.com", "phone": "+1-347-555-0198"}',
   '{"type": "adult", "expiry_date": "2025-12-10", "fees_owed": 0, "notes": "Regular visitor, enjoys historical fiction"}',
   '{"total_books_borrowed": 31, "current_loans": 4, "overdue_items": 0, "total_late_fees": 7.25}',
   now() - interval '8 months',
   now() - interval '2 hours',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365d4',
   '700a0780-d043-4b05-8427-9816855365d4',
   '550e8400-e29b-41d4-a716-446655440102',
   'UCB2024001',
   '{"first_name": "James", "last_name": "Thompson", "email": "james.thompson@example.com", "phone": "+1-510-555-0234"}',
   '{"type": "student", "expiry_date": "2025-05-31", "fees_owed": 0, "notes": "Engineering student, focus on technical texts"}',
   '{"total_books_borrowed": 28, "current_loans": 5, "overdue_items": 0, "total_late_fees": 0}',
   now() - interval '1 year',
   now() - interval '1 day',
   'active');

-- ============================================================================
-- BOOK COPIES SEED DATA
-- ============================================================================

INSERT INTO book_copies (id, library_id, book_edition_id, copy_number, barcode, location, condition_info, availability, created_at, updated_at)
VALUES
  -- NYC Central Library copies
  ('900a0780-d043-4b05-8427-9816855365d1', '550e8400-e29b-41d4-a716-446655440101', '750e8400-e29b-41d4-a716-446655440001', '001', 'NYC001000001', '{"section": "Fiction", "shelf": "A-15", "call_number": "FIC ORW"}', '{"condition": "good", "acquisition_date": "2022-01-15", "acquisition_price": 14.99}', '{"status": "available"}', now() - interval '2 years', now() - interval '1 week'),
  ('900a0780-d043-4b05-8427-9816855365d2', '550e8400-e29b-41d4-a716-446655440101', '750e8400-e29b-41d4-a716-446655440001', '002', 'NYC001000002', '{"section": "Fiction", "shelf": "A-15", "call_number": "FIC ORW"}', '{"condition": "excellent", "acquisition_date": "2023-03-20", "acquisition_price": 14.99}', '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d1", "due_date": "2024-09-15"}', now() - interval '1 year 5 months', now() - interval '2 days'),
  ('900a0780-d043-4b05-8427-9816855365d3', '550e8400-e29b-41d4-a716-446655440101', '750e8400-e29b-41d4-a716-446655440005', '001', 'NYC002000001', '{"section": "Biography", "shelf": "B-12", "call_number": "BIO WES"}', '{"condition": "excellent", "acquisition_date": "2023-02-10", "acquisition_price": 18.99}', '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d2", "due_date": "2024-09-20"}', now() - interval '1 year 6 months', now() - interval '3 days'),
  ('900a0780-d043-4b05-8427-9816855365d4', '550e8400-e29b-41d4-a716-446655440101', '750e8400-e29b-41d4-a716-446655440006', '001', 'NYC003000001', '{"section": "History", "shelf": "H-05", "call_number": "909 HAR"}', '{"condition": "good", "acquisition_date": "2022-09-15", "acquisition_price": 16.99}', '{"status": "available"}', now() - interval '2 years', now() - interval '2 weeks'),
  
  -- Berkeley Engineering Library copies  
  ('900a0780-d043-4b05-8427-9816855365d5', '550e8400-e29b-41d4-a716-446655440102', '750e8400-e29b-41d4-a716-446655440003', '001', 'UCB001000001', '{"section": "Science Fiction", "shelf": "SF-03", "call_number": "SF ASI"}', '{"condition": "good", "acquisition_date": "2021-08-15", "acquisition_price": 12.99}', '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d4", "due_date": "2024-09-28"}', now() - interval '3 years', now() - interval '1 month'),
  ('900a0780-d043-4b05-8427-9816855365d6', '550e8400-e29b-41d4-a716-446655440102', '750e8400-e29b-41d4-a716-446655440002', '001', 'UCB002000001', '{"section": "Classics", "shelf": "C-12", "call_number": "FIC AUS"}', '{"condition": "good", "acquisition_date": "2021-06-10", "acquisition_price": 10.99}', '{"status": "available"}', now() - interval '3 years 2 months', now() - interval '2 months');

-- ============================================================================
-- BOOK CONTRIBUTORS SEED DATA
-- ============================================================================

INSERT INTO book_contributors (id, general_book_id, book_edition_id, author_id, role, credit_text, sort_order, created_at)
VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'author', 'George Orwell', 1, now() - interval '30 days'),
  ('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'author', 'Jane Austen', 1, now() - interval '25 days'),
  ('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'author', 'Isaac Asimov', 1, now() - interval '20 days'),
  ('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'author', 'J.K. Rowling', 1, now() - interval '10 days'),
  ('850e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'author', 'Tara Westover', 1, now() - interval '4 years'),
  ('850e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'author', 'Yuval Noah Harari', 1, now() - interval '3 years');

-- ============================================================================
-- BORROWING TRANSACTIONS SEED DATA
-- ============================================================================

INSERT INTO borrowing_transactions (id, library_id, book_copy_id, member_id, staff_id, transaction_type, transaction_date, due_date, return_date, fees, notes, created_at)
VALUES
  -- Current checkout: Alice Johnson with 1984 (overdue with fees)
  ('a00a0780-d043-4b05-8427-9816855365d1',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d2',
   '800a0780-d043-4b05-8427-9816855365d1',
   '600a0780-d043-4b05-8427-9816855365d2',
   'checkout',
   now() - interval '25 days',
   now() - interval '4 days',
   NULL,
   '{"late_fee": 2.50, "damage_fee": 0, "processing_fee": 0, "total": 2.50}',
   'Member requested 21-day loan period',
   now() - interval '25 days'),
  
  -- Current checkout: Carlos Rodriguez with Educated
  ('a00a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d3',
   '800a0780-d043-4b05-8427-9816855365d2',
   '600a0780-d043-4b05-8427-9816855365d1',
   'checkout',
   now() - interval '18 days',
   now() + interval '3 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}',
   'Standard checkout',
   now() - interval '18 days'),
  
  -- Current checkout: James Thompson with Foundation (Berkeley)
  ('a00a0780-d043-4b05-8427-9816855365d3',
   '550e8400-e29b-41d4-a716-446655440102',
   '900a0780-d043-4b05-8427-9816855365d5',
   '800a0780-d043-4b05-8427-9816855365d4',
   '600a0780-d043-4b05-8427-9816855365d4',
   'checkout',
   now() - interval '20 days',
   now() + interval '8 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}',
   'Student checkout - extended loan period',
   now() - interval '20 days');

-- ============================================================================
-- REVIEWS SEED DATA (Social Features)
-- ============================================================================

INSERT INTO reviews (id, book_edition_id, general_book_id, reviewer_id, content, rating, language, visibility, social_metrics, created_at, updated_at)
VALUES
  ('950e8400-e29b-41d4-a716-446655440001',
   '750e8400-e29b-41d4-a716-446655440001',
   '650e8400-e29b-41d4-a716-446655440001',
   '400a0780-d043-4b05-8427-9816855365d1',
   'A powerful dystopian novel that feels increasingly relevant today. Orwell''s vision of totalitarianism is both terrifying and compelling.',
   5,
   'en',
   'public',
   '{"like_count": 12, "comment_count": 3, "borrow_influence_count": 2, "share_count": 1}',
   now() - interval '15 days',
   now() - interval '10 days'),
   
  ('950e8400-e29b-41d4-a716-446655440002',
   '750e8400-e29b-41d4-a716-446655440002',
   '650e8400-e29b-41d4-a716-446655440002',
   '400a0780-d043-4b05-8427-9816855365d2',
   'Austen''s wit and social commentary shine through in this timeless romance. Elizabeth Bennet remains one of literature''s most engaging protagonists.',
   4,
   'en',
   'public',
   '{"like_count": 8, "comment_count": 2, "borrow_influence_count": 1, "share_count": 0}',
   now() - interval '20 days',
   now() - interval '20 days'),
   
  ('950e8400-e29b-41d4-a716-446655440003',
   '750e8400-e29b-41d4-a716-446655440005',
   '650e8400-e29b-41d4-a716-446655440005',
   '700a0780-d043-4b05-8427-9816855365d1',
   'An incredible memoir about the power of education and family complexity. Westover''s journey from isolation to academia is inspiring and heartbreaking.',
   5,
   'en',
   'public',
   '{"like_count": 24, "comment_count": 6, "borrow_influence_count": 4, "share_count": 3}',
   now() - interval '12 days',
   now() - interval '8 days');

-- Verify seed data integrity
DO $$
DECLARE 
    library_count INTEGER;
    staff_count INTEGER;
    member_count INTEGER;
    book_count INTEGER;
    transaction_count INTEGER;
    copy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO library_count FROM libraries;
    SELECT COUNT(*) INTO staff_count FROM library_staff;
    SELECT COUNT(*) INTO member_count FROM library_members;
    SELECT COUNT(*) INTO book_count FROM book_editions;
    SELECT COUNT(*) INTO copy_count FROM book_copies;
    SELECT COUNT(*) INTO transaction_count FROM borrowing_transactions;
    
    RAISE NOTICE 'EzLib Seed Data Summary:';
    RAISE NOTICE '- Libraries: %', library_count;
    RAISE NOTICE '- Staff members: %', staff_count;
    RAISE NOTICE '- Library members: %', member_count;
    RAISE NOTICE '- Book editions: %', book_count;
    RAISE NOTICE '- Physical copies: %', copy_count;
    RAISE NOTICE '- Borrowing transactions: %', transaction_count;
    
    -- Basic integrity checks
    IF library_count < 2 THEN
        RAISE EXCEPTION 'Insufficient library data - expected at least 2 libraries, got %', library_count;
    END IF;
    
    IF copy_count < 5 THEN
        RAISE EXCEPTION 'Insufficient book copy data - expected at least 5 copies, got %', copy_count;
    END IF;
    
    RAISE NOTICE '✅ Seed data validation passed successfully!';
END $$;