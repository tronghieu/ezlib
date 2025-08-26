-- Book copies (physical inventory) seeding data
-- Creates actual physical book copies that can be borrowed from each library

INSERT INTO book_copies (id, library_id, book_edition_id, copy_number, barcode, location, condition_info, availability, created_at, updated_at)
VALUES
  -- NYC Central Library copies (Large urban library with multiple copies of popular books)
  
  -- 1984 (existing book edition: 550e8400-e29b-41d4-a716-446655440201 from original seed)
  ('900a0780-d043-4b05-8427-9816855365d1', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', '001', 'NYC001000001', '{"section": "Fiction", "shelf": "A-15", "call_number": "FIC ORW"}'::jsonb, '{"condition": "good", "acquisition_date": "2022-01-15", "acquisition_price": 14.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '2 years', now() - interval '1 week'),
  ('900a0780-d043-4b05-8427-9816855365d2', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', '002', 'NYC001000002', '{"section": "Fiction", "shelf": "A-15", "call_number": "FIC ORW"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-03-20", "acquisition_price": 14.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d1", "due_date": "2024-09-15", "hold_queue": []}'::jsonb, now() - interval '1 year 5 months', now() - interval '2 days'),
  ('900a0780-d043-4b05-8427-9816855365d3', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', '003', 'NYC001000003', '{"section": "Fiction", "shelf": "A-15", "call_number": "FIC ORW"}'::jsonb, '{"condition": "good", "acquisition_date": "2022-01-15", "acquisition_price": 14.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '2 years', now() - interval '1 week'),
  
  -- Educated
  ('900a0780-d043-4b05-8427-9816855365d4', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440301', '001', 'NYC002000001', '{"section": "Biography", "shelf": "B-12", "call_number": "BIO WES"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-02-10", "acquisition_price": 18.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d2", "due_date": "2024-09-20", "hold_queue": []}'::jsonb, now() - interval '1 year 6 months', now() - interval '3 days'),
  ('900a0780-d043-4b05-8427-9816855365d5', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440301', '002', 'NYC002000002', '{"section": "Biography", "shelf": "B-12", "call_number": "BIO WES"}'::jsonb, '{"condition": "good", "acquisition_date": "2023-02-10", "acquisition_price": 18.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '1 year 6 months', now() - interval '3 days'),
  
  -- Becoming
  ('900a0780-d043-4b05-8427-9816855365d6', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440303', '001', 'NYC003000001', '{"section": "Biography", "shelf": "B-18", "call_number": "BIO OBA"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-01-05", "acquisition_price": 22.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": ["800a0780-d043-4b05-8427-9816855365d3"]}'::jsonb, now() - interval '1 year 7 months', now() - interval '1 month'),
  ('900a0780-d043-4b05-8427-9816855365d7', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440303', '002', 'NYC003000002', '{"section": "Biography", "shelf": "B-18", "call_number": "BIO OBA"}'::jsonb, '{"condition": "good", "acquisition_date": "2023-01-05", "acquisition_price": 22.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d6", "due_date": "2024-09-25", "hold_queue": []}'::jsonb, now() - interval '1 year 7 months', now() - interval '1 month'),
  
  -- Sapiens
  ('900a0780-d043-4b05-8427-9816855365d8', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440306', '001', 'NYC004000001', '{"section": "History", "shelf": "H-05", "call_number": "909 HAR"}'::jsonb, '{"condition": "good", "acquisition_date": "2022-09-15", "acquisition_price": 16.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '2 years', now() - interval '2 weeks'),
  
  -- Atomic Habits
  ('900a0780-d043-4b05-8427-9816855365d9', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440310', '001', 'NYC005000001', '{"section": "Self-Help", "shelf": "S-08", "call_number": "158.1 CLE"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-11-20", "acquisition_price": 19.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '9 months', now() - interval '1 day'),
  ('900a0780-d043-4b05-8427-9816855365e1', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440310', '002', 'NYC005000002', '{"section": "Self-Help", "shelf": "S-08", "call_number": "158.1 CLE"}'::jsonb, '{"condition": "good", "acquisition_date": "2023-11-20", "acquisition_price": 19.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d3", "due_date": "2024-09-10", "hold_queue": []}'::jsonb, now() - interval '9 months', now() - interval '1 day'),

  -- Berkeley Engineering Library copies (Academic library with specialized collection)
  
  -- Foundation (existing book edition from original seed)
  ('900a0780-d043-4b05-8427-9816855365e2', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440202', '001', 'UCB001000001', '{"section": "Science Fiction", "shelf": "SF-03", "call_number": "SF ASI"}'::jsonb, '{"condition": "good", "acquisition_date": "2021-08-15", "acquisition_price": 12.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365e2", "due_date": "2024-09-28", "hold_queue": []}'::jsonb, now() - interval '3 years', now() - interval '1 month'),
  
  -- Astrophysics for People in a Hurry
  ('900a0780-d043-4b05-8427-9816855365e3', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440308', '001', 'UCB002000001', '{"section": "Physics", "shelf": "P-12", "call_number": "523.01 TYS"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2022-01-10", "acquisition_price": 18.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '2 years 7 months', now() - interval '2 weeks'),
  ('900a0780-d043-4b05-8427-9816855365e4', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440308', '002', 'UCB002000002', '{"section": "Physics", "shelf": "P-12", "call_number": "523.01 TYS"}'::jsonb, '{"condition": "good", "acquisition_date": "2022-01-10", "acquisition_price": 18.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365e3", "due_date": "2024-10-05", "hold_queue": []}'::jsonb, now() - interval '2 years 7 months', now() - interval '2 weeks'),
  
  -- Deep Work (Cal Newport)
  ('900a0780-d043-4b05-8427-9816855365e5', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440210', '001', 'UCB003000001', '{"section": "Productivity", "shelf": "P-20", "call_number": "658.4 NEW"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-09-05", "acquisition_price": 17.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '11 months', now() - interval '3 days'),

  -- Greenfield Community Library copies (Small public library with limited copies)
  
  -- To Kill a Mockingbird 
  ('900a0780-d043-4b05-8427-9816855365e6', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440309', '001', 'GCL001000001', '{"section": "Classics", "shelf": "C-07", "call_number": "FIC LEE"}'::jsonb, '{"condition": "fair", "acquisition_date": "2019-05-12", "acquisition_price": 11.99, "notes": "Some wear on cover, pages in good condition"}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d4", "due_date": "2024-09-12", "hold_queue": []}'::jsonb, now() - interval '5 years', now() - interval '4 months'),
  
  -- Born a Crime
  ('900a0780-d043-4b05-8427-9816855365e7', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440305', '001', 'GCL002000001', '{"section": "Biography", "shelf": "B-03", "call_number": "BIO NOA"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-06-20", "acquisition_price": 16.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '1 year 2 months', now() - interval '2 weeks'),
  
  -- Harry Potter (existing from original seed)
  ('900a0780-d043-4b05-8427-9816855365e8', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440203', '001', 'GCL003000001', '{"section": "Young Adult", "shelf": "YA-12", "call_number": "YA ROW"}'::jsonb, '{"condition": "good", "acquisition_date": "2020-11-15", "acquisition_price": 13.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365d5", "due_date": "2024-09-18", "hold_queue": []}'::jsonb, now() - interval '3 years 9 months', now() - interval '3 weeks'),

  -- Lincoln High School Library copies (School library with curriculum focus)
  
  -- To Kill a Mockingbird (required reading)
  ('900a0780-d043-4b05-8427-9816855365e9', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440309', '001', 'LHS001000001', '{"section": "English Curriculum", "shelf": "ENG-A", "call_number": "F LEE"}'::jsonb, '{"condition": "good", "acquisition_date": "2022-08-10", "acquisition_price": 9.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '2 years', now() - interval '1 month'),
  ('900a0780-d043-4b05-8427-9816855365f1', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440309', '002', 'LHS001000002', '{"section": "English Curriculum", "shelf": "ENG-A", "call_number": "F LEE"}'::jsonb, '{"condition": "good", "acquisition_date": "2022-08-10", "acquisition_price": 9.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365e5", "due_date": "2024-09-30", "hold_queue": []}'::jsonb, now() - interval '2 years', now() - interval '1 month'),
  
  -- The Hate U Give
  ('900a0780-d043-4b05-8427-9816855365f2', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440311', '001', 'LHS002000001', '{"section": "Young Adult", "shelf": "YA-05", "call_number": "YA THO"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2023-09-01", "acquisition_price": 12.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '11 months', now() - interval '2 weeks'),
  ('900a0780-d043-4b05-8427-9816855365f3', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440311', '002', 'LHS002000002', '{"section": "Young Adult", "shelf": "YA-05", "call_number": "YA THO"}'::jsonb, '{"condition": "good", "acquisition_date": "2023-09-01", "acquisition_price": 12.99}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365e6", "due_date": "2024-09-14", "hold_queue": []}'::jsonb, now() - interval '11 months', now() - interval '2 weeks'),

  -- Boston Legal Research Library copies (Specialized law library)
  
  -- Legal reference books would typically not circulate, but for demo purposes:
  ('900a0780-d043-4b05-8427-9816855365f4', '550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440204', '001', 'BLRL001000001', '{"section": "Legal History", "shelf": "LH-12", "call_number": "340.9 HAR"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2021-03-15", "acquisition_price": 29.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '3 years 5 months', now() - interval '1 month'),
  
  -- Constitutional law case studies
  ('900a0780-d043-4b05-8427-9816855365f5', '550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440207', '001', 'BLRL002000001', '{"section": "Constitutional Law", "shelf": "CL-08", "call_number": "342.73 LEE"}'::jsonb, '{"condition": "good", "acquisition_date": "2020-01-20", "acquisition_price": 24.99, "notes": "Classic case study for civil rights law"}'::jsonb, '{"status": "checked_out", "current_borrower_id": "800a0780-d043-4b05-8427-9816855365e7", "due_date": "2024-09-07", "hold_queue": []}'::jsonb, now() - interval '4 years 7 months', now() - interval '2 months'),
  
  -- Additional popular titles across libraries
  
  -- Pride and Prejudice at NYC (existing from original seed)
  ('900a0780-d043-4b05-8427-9816855365f6', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440202', '001', 'NYC006000001', '{"section": "Classics", "shelf": "C-12", "call_number": "FIC AUS"}'::jsonb, '{"condition": "good", "acquisition_date": "2021-06-10", "acquisition_price": 10.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '3 years 2 months', now() - interval '2 months'),
  ('900a0780-d043-4b05-8427-9816855365f7', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440202', '002', 'NYC006000002', '{"section": "Classics", "shelf": "C-12", "call_number": "FIC AUS"}'::jsonb, '{"condition": "excellent", "acquisition_date": "2022-08-15", "acquisition_price": 10.99}'::jsonb, '{"status": "available", "current_borrower_id": null, "due_date": null, "hold_queue": []}'::jsonb, now() - interval '2 years', now() - interval '1 month');