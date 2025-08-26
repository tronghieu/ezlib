-- Library members seeding data
-- Includes diverse member profiles across all libraries

-- First, insert additional users for library members
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES
  -- Regular library patrons
  ('700a0780-d043-4b05-8427-9816855365d1', 'alice.johnson@example.com', now() - interval '2 years', '{"display_name": "Alice Johnson", "preferred_genres": ["mystery", "biography"]}', now() - interval '2 years', now() - interval '3 days', false, false),
  ('700a0780-d043-4b05-8427-9816855365d2', 'carlos.rodriguez@example.com', now() - interval '1 year', '{"display_name": "Carlos Rodriguez", "preferred_genres": ["science", "technology"]}', now() - interval '1 year', now() - interval '1 week', false, false),
  ('700a0780-d043-4b05-8427-9816855365d3', 'priya.patel@example.com', now() - interval '8 months', '{"display_name": "Priya Patel", "preferred_genres": ["fiction", "history"]}', now() - interval '8 months', now() - interval '2 hours', false, false),
  ('700a0780-d043-4b05-8427-9816855365d4', 'james.thompson@example.com', now() - interval '3 years', '{"display_name": "James Thompson", "preferred_genres": ["fantasy", "science fiction"]}', now() - interval '3 years', now() - interval '5 days', false, false),
  ('700a0780-d043-4b05-8427-9816855365d5', 'maria.gonzalez@example.com', now() - interval '6 months', '{"display_name": "Maria Gonzalez", "preferred_genres": ["romance", "contemporary fiction"]}', now() - interval '6 months', now() - interval '1 day', false, false),
  ('700a0780-d043-4b05-8427-9816855365d6', 'david.wong@example.com', now() - interval '4 years', '{"display_name": "David Wong", "preferred_genres": ["business", "self-help"]}', now() - interval '4 years', now() - interval '1 week', false, false),
  ('700a0780-d043-4b05-8427-9816855365d7', 'sarah.adams@example.com', now() - interval '1.5 years', '{"display_name": "Sarah Adams", "preferred_genres": ["literary fiction", "poetry"]}', now() - interval '1.5 years', now() - interval '6 hours', false, false),
  ('700a0780-d043-4b05-8427-9816855365d8', 'michael.brown@example.com', now() - interval '9 months', '{"display_name": "Michael Brown", "preferred_genres": ["thriller", "crime"]}', now() - interval '9 months', now() - interval '3 days', false, false),
  ('700a0780-d043-4b05-8427-9816855365d9', 'lisa.kim@example.com', now() - interval '2.5 years', '{"display_name": "Lisa Kim", "preferred_genres": ["health", "cooking"]}', now() - interval '2.5 years', now() - interval '2 weeks', false, false),
  ('700a0780-d043-4b05-8427-9816855365e1', 'robert.taylor@example.com', now() - interval '7 months', '{"display_name": "Robert Taylor", "preferred_genres": ["history", "biography"]}', now() - interval '7 months', now() - interval '4 days', false, false),
  
  -- Student users for academic library
  ('700a0780-d043-4b05-8427-9816855365e2', 'student1@berkeley.edu', now() - interval '1 year', '{"display_name": "Emma Chen", "student_id": "3035467890", "major": "Computer Science"}', now() - interval '1 year', now() - interval '1 day', false, false),
  ('700a0780-d043-4b05-8427-9816855365e3', 'student2@berkeley.edu', now() - interval '2 years', '{"display_name": "Alex Kumar", "student_id": "3035467891", "major": "Electrical Engineering"}', now() - interval '2 years', now() - interval '12 hours', false, false),
  ('700a0780-d043-4b05-8427-9816855365e4', 'student3@berkeley.edu', now() - interval '6 months', '{"display_name": "Jordan Williams", "student_id": "3035467892", "major": "Mechanical Engineering"}', now() - interval '6 months', now() - interval '2 days', false, false),
  
  -- High school students
  ('700a0780-d043-4b05-8427-9816855365e5', 'student.sarah@lincolnhs.org', now() - interval '2 years', '{"display_name": "Sarah Mitchell", "grade": 11, "student_id": "LHS2025001"}', now() - interval '2 years', now() - interval '1 week', false, false),
  ('700a0780-d043-4b05-8427-9816855365e6', 'student.tyler@lincolnhs.org', now() - interval '1 year', '{"display_name": "Tyler Jackson", "grade": 12, "student_id": "LHS2024015"}', now() - interval '1 year', now() - interval '3 days', false, false),
  
  -- Legal professionals
  ('700a0780-d043-4b05-8427-9816855365e7', 'lawyer1@lawfirm.com', now() - interval '5 years', '{"display_name": "Rebecca Martinez", "bar_number": "MA123456", "firm": "Martinez & Associates"}', now() - interval '5 years', now() - interval '1 day', false, false),
  ('700a0780-d043-4b05-8427-9816855365e8', 'paralegal@citylaw.com', now() - interval '3 years', '{"display_name": "Kevin O''Connor", "position": "Paralegal", "firm": "City Legal Services"}', now() - interval '3 years', now() - interval '4 days', false, false);

-- Insert library member records
INSERT INTO library_members (id, user_id, library_id, member_id, personal_info, membership_info, borrowing_stats, created_at, updated_at, status)
VALUES
  -- NYC Central Library Members (Diverse urban population)
  ('800a0780-d043-4b05-8427-9816855365d1',
   '700a0780-d043-4b05-8427-9816855365d1',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123456',
   '{"first_name": "Alice", "last_name": "Johnson", "email": "alice.johnson@example.com", "phone": "+1-646-555-0123", "address": {"street": "123 Manhattan Ave", "city": "New York", "state": "NY", "postal_code": "10025"}}'::jsonb,
   '{"type": "adult", "expiry_date": "2025-03-15", "fees_owed": 2.50, "notes": "Prefers mystery novels, active reader"}'::jsonb,
   '{"total_books_borrowed": 47, "current_loans": 3, "overdue_items": 1, "total_late_fees": 12.50}'::jsonb,
   now() - interval '2 years',
   now() - interval '3 days',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365d2',
   '700a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123457',
   '{"first_name": "Carlos", "last_name": "Rodriguez", "email": "carlos.rodriguez@example.com", "phone": "+1-718-555-0156", "address": {"street": "789 Brooklyn Heights", "city": "Brooklyn", "state": "NY", "postal_code": "11201"}}'::jsonb,
   '{"type": "adult", "expiry_date": "2025-08-20", "fees_owed": 0, "notes": "Interested in science and technology books"}'::jsonb,
   '{"total_books_borrowed": 23, "current_loans": 2, "overdue_items": 0, "total_late_fees": 3.75}'::jsonb,
   now() - interval '1 year',
   now() - interval '1 week',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365d3',
   '700a0780-d043-4b05-8427-9816855365d3',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123458',
   '{"first_name": "Priya", "last_name": "Patel", "email": "priya.patel@example.com", "phone": "+1-347-555-0198", "address": {"street": "456 Queens Blvd", "city": "Queens", "state": "NY", "postal_code": "11377"}}'::jsonb,
   '{"type": "adult", "expiry_date": "2025-12-10", "fees_owed": 0, "notes": "Regular visitor, enjoys historical fiction"}'::jsonb,
   '{"total_books_borrowed": 31, "current_loans": 4, "overdue_items": 0, "total_late_fees": 7.25}'::jsonb,
   now() - interval '8 months',
   now() - interval '2 hours',
   'active'),

  -- Berkeley Engineering Library Members (Students and researchers)
  ('800a0780-d043-4b05-8427-9816855365e2',
   '700a0780-d043-4b05-8427-9816855365e2',
   '550e8400-e29b-41d4-a716-446655440102',
   'UCB2024001',
   '{"first_name": "Emma", "last_name": "Chen", "email": "student1@berkeley.edu", "phone": "+1-510-555-0234", "address": {"street": "2650 Durant Ave", "city": "Berkeley", "state": "CA", "postal_code": "94704"}}'::jsonb,
   '{"type": "student", "expiry_date": "2025-05-31", "fees_owed": 0, "notes": "CS major, focus on algorithms and data structures"}'::jsonb,
   '{"total_books_borrowed": 28, "current_loans": 5, "overdue_items": 0, "total_late_fees": 0}'::jsonb,
   now() - interval '1 year',
   now() - interval '1 day',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365e3',
   '700a0780-d043-4b05-8427-9816855365e3',
   '550e8400-e29b-41d4-a716-446655440102',
   'UCB2023015',
   '{"first_name": "Alex", "last_name": "Kumar", "email": "student2@berkeley.edu", "phone": "+1-510-555-0267", "address": {"street": "2536 Hillegass Ave", "city": "Berkeley", "state": "CA", "postal_code": "94704"}}'::jsonb,
   '{"type": "graduate", "expiry_date": "2025-12-31", "fees_owed": 15.00, "notes": "PhD student in Electrical Engineering, heavy library user"}'::jsonb,
   '{"total_books_borrowed": 67, "current_loans": 8, "overdue_items": 2, "total_late_fees": 24.00}'::jsonb,
   now() - interval '2 years',
   now() - interval '12 hours',
   'active'),

  -- Greenfield Community Library Members (Small town residents)
  ('800a0780-d043-4b05-8427-9816855365d4',
   '700a0780-d043-4b05-8427-9816855365d4',
   '550e8400-e29b-41d4-a716-446655440103',
   'GCL001234',
   '{"first_name": "James", "last_name": "Thompson", "email": "james.thompson@example.com", "phone": "+1-413-555-0189", "address": {"street": "15 Elm Street", "city": "Greenfield", "state": "MA", "postal_code": "01301"}}'::jsonb,
   '{"type": "adult", "expiry_date": "2025-06-15", "fees_owed": 0, "notes": "Local teacher, loves fantasy and sci-fi"}'::jsonb,
   '{"total_books_borrowed": 89, "current_loans": 2, "overdue_items": 0, "total_late_fees": 5.75}'::jsonb,
   now() - interval '3 years',
   now() - interval '5 days',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365d5',
   '700a0780-d043-4b05-8427-9816855365d5',
   '550e8400-e29b-41d4-a716-446655440103',
   'GCL001235',
   '{"first_name": "Maria", "last_name": "Gonzalez", "email": "maria.gonzalez@example.com", "phone": "+1-413-555-0198", "address": {"street": "42 Oak Avenue", "city": "Greenfield", "state": "MA", "postal_code": "01301"}}'::jsonb,
   '{"type": "adult", "expiry_date": "2025-09-30", "fees_owed": 1.25, "notes": "New resident, enjoys contemporary fiction"}'::jsonb,
   '{"total_books_borrowed": 12, "current_loans": 3, "overdue_items": 0, "total_late_fees": 2.50}'::jsonb,
   now() - interval '6 months',
   now() - interval '1 day',
   'active'),

  -- Lincoln High School Library Members (Students)
  ('800a0780-d043-4b05-8427-9816855365e5',
   '700a0780-d043-4b05-8427-9816855365e5',
   '550e8400-e29b-41d4-a716-446655440104',
   'LHS2025001',
   '{"first_name": "Sarah", "last_name": "Mitchell", "email": "student.sarah@lincolnhs.org", "phone": "+1-415-555-0145", "address": {"street": "1456 Sunset Blvd", "city": "San Francisco", "state": "CA", "postal_code": "94122"}}'::jsonb,
   '{"type": "student", "expiry_date": "2025-06-15", "fees_owed": 0, "notes": "Junior year, honor student, likes classic literature"}'::jsonb,
   '{"total_books_borrowed": 24, "current_loans": 2, "overdue_items": 0, "total_late_fees": 0}'::jsonb,
   now() - interval '2 years',
   now() - interval '1 week',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365e6',
   '700a0780-d043-4b05-8427-9816855365e6',
   '550e8400-e29b-41d4-a716-446655440104',
   'LHS2024015',
   '{"first_name": "Tyler", "last_name": "Jackson", "email": "student.tyler@lincolnhs.org", "phone": "+1-415-555-0178", "address": {"street": "890 Irving St", "city": "San Francisco", "state": "CA", "postal_code": "94122"}}'::jsonb,
   '{"type": "student", "expiry_date": "2024-06-15", "fees_owed": 0, "notes": "Senior year, interested in graphic novels and manga"}'::jsonb,
   '{"total_books_borrowed": 18, "current_loans": 1, "overdue_items": 0, "total_late_fees": 0}'::jsonb,
   now() - interval '1 year',
   now() - interval '3 days',
   'active'),

  -- Boston Legal Research Library Members (Legal professionals)
  ('800a0780-d043-4b05-8427-9816855365e7',
   '700a0780-d043-4b05-8427-9816855365e7',
   '550e8400-e29b-41d4-a716-446655440105',
   'BLRL001',
   '{"first_name": "Rebecca", "last_name": "Martinez", "email": "lawyer1@lawfirm.com", "phone": "+1-617-555-0234", "address": {"street": "100 Summer Street", "city": "Boston", "state": "MA", "postal_code": "02110"}}'::jsonb,
   '{"type": "professional", "expiry_date": "2025-11-30", "fees_owed": 0, "notes": "Corporate lawyer, specializes in intellectual property"}'::jsonb,
   '{"total_books_borrowed": 156, "current_loans": 6, "overdue_items": 0, "total_late_fees": 18.00}'::jsonb,
   now() - interval '5 years',
   now() - interval '1 day',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365e8',
   '700a0780-d043-4b05-8427-9816855365e8',
   '550e8400-e29b-41d4-a716-446655440105',
   'BLRL002',
   '{"first_name": "Kevin", "last_name": "O''Connor", "email": "paralegal@citylaw.com", "phone": "+1-617-555-0267", "address": {"street": "250 Franklin St", "city": "Boston", "state": "MA", "postal_code": "02110"}}'::jsonb,
   '{"type": "professional", "expiry_date": "2025-08-15", "fees_owed": 4.00, "notes": "Paralegal focusing on family law and civil litigation"}'::jsonb,
   '{"total_books_borrowed": 43, "current_loans": 3, "overdue_items": 1, "total_late_fees": 12.00}'::jsonb,
   now() - interval '3 years',
   now() - interval '4 days',
   'active'),

  -- Additional members across libraries for more realistic data
  ('800a0780-d043-4b05-8427-9816855365d6',
   '700a0780-d043-4b05-8427-9816855365d6',
   '550e8400-e29b-41d4-a716-446655440101',
   'NYC123459',
   '{"first_name": "David", "last_name": "Wong", "email": "david.wong@example.com", "phone": "+1-212-555-0245", "address": {"street": "567 Upper East Side", "city": "New York", "state": "NY", "postal_code": "10021"}}'::jsonb,
   '{"type": "senior", "expiry_date": "2025-04-30", "fees_owed": 0, "notes": "Retired businessman, enjoys business and self-help books"}'::jsonb,
   '{"total_books_borrowed": 134, "current_loans": 1, "overdue_items": 0, "total_late_fees": 8.25}'::jsonb,
   now() - interval '4 years',
   now() - interval '1 week',
   'active'),
   
  ('800a0780-d043-4b05-8427-9816855365e4',
   '700a0780-d043-4b05-8427-9816855365e4',
   '550e8400-e29b-41d4-a716-446655440102',
   'UCB2024002',
   '{"first_name": "Jordan", "last_name": "Williams", "email": "student3@berkeley.edu", "phone": "+1-510-555-0289", "address": {"street": "2701 Bancroft Way", "city": "Berkeley", "state": "CA", "postal_code": "94704"}}'::jsonb,
   '{"type": "student", "expiry_date": "2025-05-31", "fees_owed": 0, "notes": "Mechanical engineering student, interested in materials science"}'::jsonb,
   '{"total_books_borrowed": 15, "current_loans": 4, "overdue_items": 0, "total_late_fees": 0}'::jsonb,
   now() - interval '6 months',
   now() - interval '2 days',
   'active');