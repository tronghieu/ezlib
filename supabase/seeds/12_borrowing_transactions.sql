-- Borrowing transactions seed data
-- Creates realistic borrowing history and current checkouts

INSERT INTO borrowing_transactions (id, library_id, book_copy_id, member_id, staff_id, transaction_type, transaction_date, due_date, return_date, fees, notes, created_at, updated_at)
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
   now() - interval '25 days',
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
   now() - interval '18 days',
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
   now() - interval '20 days',
   now() - interval '20 days');

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