-- Library members seed data
-- Creates diverse member profiles across libraries

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