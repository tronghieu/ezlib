-- Library staff seed data
-- Creates staff members with different roles across libraries

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