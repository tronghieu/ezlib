-- Borrowing transactions seeding data
-- Creates realistic borrowing history and current checkouts

INSERT INTO borrowing_transactions (id, library_id, book_copy_id, member_id, staff_id, transaction_type, transaction_date, due_date, return_date, fees, notes, created_at)
VALUES
  -- NYC Central Library transactions
  
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
   '{"late_fee": 2.50, "damage_fee": 0, "processing_fee": 0, "total": 2.50}'::jsonb,
   'Member requested 21-day loan period',
   now() - interval '25 days'),
  
  -- Current checkout: Carlos Rodriguez with Educated
  ('a00a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d4',
   '800a0780-d043-4b05-8427-9816855365d2',
   '600a0780-d043-4b05-8427-9816855365d3',
   'checkout',
   now() - interval '18 days',
   now() + interval '3 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Standard checkout',
   now() - interval '18 days'),
  
  -- Current checkout: David Wong with Becoming
  ('a00a0780-d043-4b05-8427-9816855365d3',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d7',
   '800a0780-d043-4b05-8427-9816855365d6',
   '600a0780-d043-4b05-8427-9816855365d1',
   'checkout',
   now() - interval '15 days',
   now() + interval '6 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Senior member discount applied',
   now() - interval '15 days'),
  
  -- Current checkout: Priya Patel with Atomic Habits
  ('a00a0780-d043-4b05-8427-9816855365d4',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365e1',
   '800a0780-d043-4b05-8427-9816855365d3',
   '600a0780-d043-4b05-8427-9816855365d2',
   'checkout',
   now() - interval '24 days',
   now() - interval '3 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'First renewal approved',
   now() - interval '24 days'),
  
  -- Previous completed transactions at NYC
  
  -- Alice Johnson returned Pride and Prejudice (completed)
  ('a00a0780-d043-4b05-8427-9816855365d5',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365f6',
   '800a0780-d043-4b05-8427-9816855365d1',
   '600a0780-d043-4b05-8427-9816855365d3',
   'checkout',
   now() - interval '45 days',
   now() - interval '24 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Standard checkout',
   now() - interval '45 days'),
  ('a00a0780-d043-4b05-8427-9816855365d6',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365f6',
   '800a0780-d043-4b05-8427-9816855365d1',
   '600a0780-d043-4b05-8427-9816855365d3',
   'return',
   now() - interval '20 days',
   now() - interval '24 days',
   now() - interval '20 days',
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Returned on time',
   now() - interval '20 days'),
  
  -- Carlos Rodriguez borrowed and returned Sapiens (with late fee)
  ('a00a0780-d043-4b05-8427-9816855365d7',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d8',
   '800a0780-d043-4b05-8427-9816855365d2',
   '600a0780-d043-4b05-8427-9816855365d2',
   'checkout',
   now() - interval '60 days',
   now() - interval '39 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Standard checkout',
   now() - interval '60 days'),
  ('a00a0780-d043-4b05-8427-9816855365d8',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d8',
   '800a0780-d043-4b05-8427-9816855365d2',
   '600a0780-d043-4b05-8427-9816855365d1',
   'return',
   now() - interval '32 days',
   now() - interval '39 days',
   now() - interval '32 days',
   '{"late_fee": 3.75, "damage_fee": 0, "processing_fee": 0, "total": 3.75}'::jsonb,
   'Returned 7 days late, fees paid',
   now() - interval '32 days'),

  -- Berkeley Engineering Library transactions
  
  -- Current checkout: Emma Chen with Foundation
  ('a00a0780-d043-4b05-8427-9816855365e1',
   '550e8400-e29b-41d4-a716-446655440102',
   '900a0780-d043-4b05-8427-9816855365e2',
   '800a0780-d043-4b05-8427-9816855365e2',
   '600a0780-d043-4b05-8427-9816855365d4',
   'checkout',
   now() - interval '20 days',
   now() + interval '8 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Student checkout - extended loan period',
   now() - interval '20 days'),
  
  -- Current checkout: Alex Kumar with Astrophysics (overdue)
  ('a00a0780-d043-4b05-8427-9816855365e2',
   '550e8400-e29b-41d4-a716-446655440102',
   '900a0780-d043-4b05-8427-9816855365e4',
   '800a0780-d043-4b05-8427-9816855365e3',
   '600a0780-d043-4b05-8427-9816855365d5',
   'checkout',
   now() - interval '35 days',
   now() - interval '7 days',
   NULL,
   '{"late_fee": 7.00, "damage_fee": 0, "processing_fee": 0, "total": 7.00}'::jsonb,
   'Graduate student - second renewal approved',
   now() - interval '35 days'),
  
  -- Previous transaction: Emma Chen with different book (completed)
  ('a00a0780-d043-4b05-8427-9816855365e3',
   '550e8400-e29b-41d4-a716-446655440102',
   '900a0780-d043-4b05-8427-9816855365e3',
   '800a0780-d043-4b05-8427-9816855365e2',
   '600a0780-d043-4b05-8427-9816855365d4',
   'checkout',
   now() - interval '75 days',
   now() - interval '47 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Student checkout',
   now() - interval '75 days'),
  ('a00a0780-d043-4b05-8427-9816855365e4',
   '550e8400-e29b-41d4-a716-446655440102',
   '900a0780-d043-4b05-8427-9816855365e3',
   '800a0780-d043-4b05-8427-9816855365e2',
   '600a0780-d043-4b05-8427-9816855365d4',
   'return',
   now() - interval '45 days',
   now() - interval '47 days',
   now() - interval '45 days',
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Returned on time',
   now() - interval '45 days'),

  -- Greenfield Community Library transactions
  
  -- Current checkout: James Thompson with To Kill a Mockingbird (overdue)
  ('a00a0780-d043-4b05-8427-9816855365e5',
   '550e8400-e29b-41d4-a716-446655440103',
   '900a0780-d043-4b05-8427-9816855365e6',
   '800a0780-d043-4b05-8427-9816855365d4',
   '600a0780-d043-4b05-8427-9816855365d6',
   'checkout',
   now() - interval '19 days',
   now() - interval '5 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Teacher checkout - professional use',
   now() - interval '19 days'),
  
  -- Current checkout: Maria Gonzalez with Harry Potter
  ('a00a0780-d043-4b05-8427-9816855365e6',
   '550e8400-e29b-41d4-a716-446655440103',
   '900a0780-d043-4b05-8427-9816855365e8',
   '800a0780-d043-4b05-8427-9816855365d5',
   '600a0780-d043-4b05-8427-9816855365d7',
   'checkout',
   now() - interval '7 days',
   now() + interval '7 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'New member - first checkout',
   now() - interval '7 days'),
  
  -- Previous transaction: James Thompson with other books (history)
  ('a00a0780-d043-4b05-8427-9816855365e7',
   '550e8400-e29b-41d4-a716-446655440103',
   '900a0780-d043-4b05-8427-9816855365e7',
   '800a0780-d043-4b05-8427-9816855365d4',
   '600a0780-d043-4b05-8427-9816855365d6',
   'checkout',
   now() - interval '40 days',
   now() - interval '26 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Regular member checkout',
   now() - interval '40 days'),
  ('a00a0780-d043-4b05-8427-9816855365e8',
   '550e8400-e29b-41d4-a716-446655440103',
   '900a0780-d043-4b05-8427-9816855365e7',
   '800a0780-d043-4b05-8427-9816855365d4',
   '600a0780-d043-4b05-8427-9816855365d6',
   'return',
   now() - interval '23 days',
   now() - interval '26 days',
   now() - interval '23 days',
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Returned on time',
   now() - interval '23 days'),

  -- Lincoln High School Library transactions
  
  -- Current checkout: Sarah Mitchell with To Kill a Mockingbird
  ('a00a0780-d043-4b05-8427-9816855365e9',
   '550e8400-e29b-41d4-a716-446655440104',
   '900a0780-d043-4b05-8427-9816855365f1',
   '800a0780-d043-4b05-8427-9816855365e5',
   '600a0780-d043-4b05-8427-9816855365d8',
   'checkout',
   now() - interval '5 days',
   now() + interval '9 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Class assignment - English Literature',
   now() - interval '5 days'),
  
  -- Current checkout: Tyler Jackson with The Hate U Give
  ('a00a0780-d043-4b05-8427-9816855365f1',
   '550e8400-e29b-41d4-a716-446655440104',
   '900a0780-d043-4b05-8427-9816855365f3',
   '800a0780-d043-4b05-8427-9816855365e6',
   '600a0780-d043-4b05-8427-9816855365d8',
   'checkout',
   now() - interval '11 days',
   now() + interval '3 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Personal reading choice',
   now() - interval '11 days'),
  
  -- Previous transaction: Sarah Mitchell with another book (completed)
  ('a00a0780-d043-4b05-8427-9816855365f2',
   '550e8400-e29b-41d4-a716-446655440104',
   '900a0780-d043-4b05-8427-9816855365f2',
   '800a0780-d043-4b05-8427-9816855365e5',
   '600a0780-d043-4b05-8427-9816855365d8',
   'checkout',
   now() - interval '35 days',
   now() - interval '21 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Summer reading selection',
   now() - interval '35 days'),
  ('a00a0780-d043-4b05-8427-9816855365f3',
   '550e8400-e29b-41d4-a716-446655440104',
   '900a0780-d043-4b05-8427-9816855365f2',
   '800a0780-d043-4b05-8427-9816855365e5',
   '600a0780-d043-4b05-8427-9816855365d8',
   'return',
   now() - interval '18 days',
   now() - interval '21 days',
   now() - interval '18 days',
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Returned on time',
   now() - interval '18 days'),

  -- Boston Legal Research Library transactions
  
  -- Current checkout: Rebecca Martinez with legal reference (overdue but professional member)
  ('a00a0780-d043-4b05-8427-9816855365f4',
   '550e8400-e29b-41d4-a716-446655440105',
   '900a0780-d043-4b05-8427-9816855365f5',
   '800a0780-d043-4b05-8427-9816855365e7',
   '600a0780-d043-4b05-8427-9816855365d9',
   'checkout',
   now() - interval '18 days',
   now() - interval '11 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Professional member - case research',
   now() - interval '18 days'),
  
  -- Previous transaction: Kevin O''Connor with legal history (completed with fees)
  ('a00a0780-d043-4b05-8427-9816855365f5',
   '550e8400-e29b-41d4-a716-446655440105',
   '900a0780-d043-4b05-8427-9816855365f4',
   '800a0780-d043-4b05-8427-9816855365e8',
   '600a0780-d043-4b05-8427-9816855365e1',
   'checkout',
   now() - interval '50 days',
   now() - interval '43 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Paralegal research',
   now() - interval '50 days'),
  ('a00a0780-d043-4b05-8427-9816855365f6',
   '550e8400-e29b-41d4-a716-446655440105',
   '900a0780-d043-4b05-8427-9816855365f4',
   '800a0780-d043-4b05-8427-9816855365e8',
   '600a0780-d043-4b05-8427-9816855365e1',
   'return',
   now() - interval '34 days',
   now() - interval '43 days',
   now() - interval '34 days',
   '{"late_fee": 18.00, "damage_fee": 0, "processing_fee": 0, "total": 18.00}'::jsonb,
   'Returned 9 days late, fees paid via firm account',
   now() - interval '34 days'),

  -- Additional historical transactions for richer data
  
  -- Renewals and hold requests
  ('a00a0780-d043-4b05-8427-9816855365f7',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d2',
   '800a0780-d043-4b05-8427-9816855365d1',
   '600a0780-d043-4b05-8427-9816855365d2',
   'renewal',
   now() - interval '4 days',
   now() + interval '17 days',
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 1.00, "total": 1.00}'::jsonb,
   'First renewal approved - late fees applied for overdue status',
   now() - interval '4 days'),
  
  ('a00a0780-d043-4b05-8427-9816855365f8',
   '550e8400-e29b-41d4-a716-446655440101',
   '900a0780-d043-4b05-8427-9816855365d6',
   '800a0780-d043-4b05-8427-9816855365d3',
   '600a0780-d043-4b05-8427-9816855365d1',
   'hold_placed',
   now() - interval '3 days',
   NULL,
   NULL,
   '{"late_fee": 0, "damage_fee": 0, "processing_fee": 0, "total": 0}'::jsonb,
   'Hold placed - will notify when available',
   now() - interval '3 days');

-- Update book_copies availability to reflect current checkouts
-- This ensures consistency between borrowing_transactions and book_copies tables
UPDATE book_copies 
SET availability = jsonb_set(availability, '{current_borrower_id}', '"800a0780-d043-4b05-8427-9816855365d1"')
WHERE id = '900a0780-d043-4b05-8427-9816855365d2';

UPDATE book_copies 
SET availability = jsonb_set(availability, '{current_borrower_id}', '"800a0780-d043-4b05-8427-9816855365d2"')
WHERE id = '900a0780-d043-4b05-8427-9816855365d4';

UPDATE book_copies 
SET availability = jsonb_set(availability, '{current_borrower_id}', '"800a0780-d043-4b05-8427-9816855365d6"')
WHERE id = '900a0780-d043-4b05-8427-9816855365d7';

UPDATE book_copies 
SET availability = jsonb_set(availability, '{current_borrower_id}', '"800a0780-d043-4b05-8427-9816855365d3"')
WHERE id = '900a0780-d043-4b05-8427-9816855365e1';