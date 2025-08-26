-- Library staff seeding data
-- Includes staff members with different roles across all libraries

-- First, insert additional users for staff members
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
VALUES
  -- NYC Central Library Staff
  ('500a0780-d043-4b05-8427-9816855365d1', 'sarah.chen@nycentral.org', now() - interval '18 months', '{"display_name": "Sarah Chen", "job_title": "Head Librarian"}', now() - interval '18 months', now() - interval '1 day', false, false),
  ('500a0780-d043-4b05-8427-9816855365d2', 'mike.torres@nycentral.org', now() - interval '14 months', '{"display_name": "Miguel Torres", "job_title": "Reference Librarian"}', now() - interval '14 months', now() - interval '3 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d3', 'anna.kowalski@nycentral.org', now() - interval '8 months', '{"display_name": "Anna Kowalski", "job_title": "Library Assistant"}', now() - interval '8 months', now() - interval '2 days', false, false),
  
  -- Berkeley Engineering Library Staff  
  ('500a0780-d043-4b05-8427-9816855365d4', 'david.kim@berkeley.edu', now() - interval '2 years', '{"display_name": "David Kim", "job_title": "Engineering Librarian"}', now() - interval '2 years', now() - interval '6 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365d5', 'rachel.smith@berkeley.edu', now() - interval '11 months', '{"display_name": "Rachel Smith", "job_title": "Research Librarian"}', now() - interval '11 months', now() - interval '1 day', false, false),
  
  -- Greenfield Community Library Staff
  ('500a0780-d043-4b05-8427-9816855365d6', 'janet.murphy@greenfieldlibrary.org', now() - interval '3 years', '{"display_name": "Janet Murphy", "job_title": "Library Director"}', now() - interval '3 years', now() - interval '4 days', false, false),
  ('500a0780-d043-4b05-8427-9816855365d7', 'tom.bradley@greenfieldlibrary.org', now() - interval '6 months', '{"display_name": "Tom Bradley", "job_title": "Part-time Assistant"}', now() - interval '6 months', now() - interval '1 week', false, false),
  
  -- Lincoln High School Library Staff
  ('500a0780-d043-4b05-8427-9816855365d8', 'lisa.garcia@lincolnhs.org', now() - interval '4 years', '{"display_name": "Lisa Garcia", "job_title": "School Librarian"}', now() - interval '4 years', now() - interval '2 hours', false, false),
  
  -- Boston Legal Research Library Staff
  ('500a0780-d043-4b05-8427-9816855365d9', 'robert.washington@blrl.org', now() - interval '7 years', '{"display_name": "Robert Washington", "job_title": "Law Librarian"}', now() - interval '7 years', now() - interval '5 hours', false, false),
  ('500a0780-d043-4b05-8427-9816855365e1', 'jennifer.lee@blrl.org', now() - interval '2 years', '{"display_name": "Jennifer Lee", "job_title": "Research Specialist"}', now() - interval '2 years', now() - interval '8 hours', false, false);

-- Insert library staff records
INSERT INTO library_staff (id, user_id, library_id, role, permissions, employment_info, created_at, updated_at, status)
VALUES
  -- NYC Central Library Staff (Large urban library with full hierarchy)
  ('600a0780-d043-4b05-8427-9816855365d1',
   '500a0780-d043-4b05-8427-9816855365d1',
   '550e8400-e29b-41d4-a716-446655440101',
   'manager',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": true, "admin_settings": true}'::jsonb,
   '{"employee_id": "NYC001", "department": "Administration", "hire_date": "2023-03-15", "work_schedule": "full_time"}'::jsonb,
   now() - interval '18 months',
   now() - interval '1 day',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365d2',
   '500a0780-d043-4b05-8427-9816855365d2',
   '550e8400-e29b-41d4-a716-446655440101',
   'librarian',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": false, "admin_settings": false}'::jsonb,
   '{"employee_id": "NYC002", "department": "Reference", "hire_date": "2023-07-20", "work_schedule": "full_time"}'::jsonb,
   now() - interval '14 months',
   now() - interval '3 hours',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365d3',
   '500a0780-d043-4b05-8427-9816855365d3',
   '550e8400-e29b-41d4-a716-446655440101',
   'assistant',
   '{"manage_inventory": false, "manage_members": true, "process_loans": true, "view_reports": false, "manage_staff": false, "admin_settings": false}'::jsonb,
   '{"employee_id": "NYC003", "department": "Circulation", "hire_date": "2024-01-10", "work_schedule": "part_time"}'::jsonb,
   now() - interval '8 months',
   now() - interval '2 days',
   'active'),

  -- Berkeley Engineering Library Staff (Academic library)
  ('600a0780-d043-4b05-8427-9816855365d4',
   '500a0780-d043-4b05-8427-9816855365d4',
   '550e8400-e29b-41d4-a716-446655440102',
   'librarian',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": true, "admin_settings": true}'::jsonb,
   '{"employee_id": "UCB001", "department": "Engineering Collections", "hire_date": "2022-08-15", "work_schedule": "full_time"}'::jsonb,
   now() - interval '2 years',
   now() - interval '6 hours',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365d5',
   '500a0780-d043-4b05-8427-9816855365d5',
   '550e8400-e29b-41d4-a716-446655440102',
   'librarian',
   '{"manage_inventory": true, "manage_members": false, "process_loans": true, "view_reports": true, "manage_staff": false, "admin_settings": false}'::jsonb,
   '{"employee_id": "UCB002", "department": "Research Services", "hire_date": "2023-10-01", "work_schedule": "full_time"}'::jsonb,
   now() - interval '11 months',
   now() - interval '1 day',
   'active'),

  -- Greenfield Community Library Staff (Small public library)
  ('600a0780-d043-4b05-8427-9816855365d6',
   '500a0780-d043-4b05-8427-9816855365d6',
   '550e8400-e29b-41d4-a716-446655440103',
   'admin',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": true, "admin_settings": true}'::jsonb,
   '{"employee_id": "GCL001", "department": "Administration", "hire_date": "2021-09-01", "work_schedule": "full_time"}'::jsonb,
   now() - interval '3 years',
   now() - interval '4 days',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365d7',
   '500a0780-d043-4b05-8427-9816855365d7',
   '550e8400-e29b-41d4-a716-446655440103',
   'assistant',
   '{"manage_inventory": false, "manage_members": true, "process_loans": true, "view_reports": false, "manage_staff": false, "admin_settings": false}'::jsonb,
   '{"employee_id": "GCL002", "department": "Circulation", "hire_date": "2024-03-15", "work_schedule": "part_time"}'::jsonb,
   now() - interval '6 months',
   now() - interval '1 week',
   'active'),

  -- Lincoln High School Library Staff (School library)
  ('600a0780-d043-4b05-8427-9816855365d8',
   '500a0780-d043-4b05-8427-9816855365d8',
   '550e8400-e29b-41d4-a716-446655440104',
   'librarian',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": false, "admin_settings": true}'::jsonb,
   '{"employee_id": "LHS001", "department": "Library Media Center", "hire_date": "2020-08-20", "work_schedule": "full_time"}'::jsonb,
   now() - interval '4 years',
   now() - interval '2 hours',
   'active'),

  -- Boston Legal Research Library Staff (Specialty library)
  ('600a0780-d043-4b05-8427-9816855365d9',
   '500a0780-d043-4b05-8427-9816855365d9',
   '550e8400-e29b-41d4-a716-446655440105',
   'librarian',
   '{"manage_inventory": true, "manage_members": true, "process_loans": true, "view_reports": true, "manage_staff": true, "admin_settings": true}'::jsonb,
   '{"employee_id": "BLRL001", "department": "Legal Research", "hire_date": "2017-11-01", "work_schedule": "full_time"}'::jsonb,
   now() - interval '7 years',
   now() - interval '5 hours',
   'active'),
   
  ('600a0780-d043-4b05-8427-9816855365e1',
   '500a0780-d043-4b05-8427-9816855365e1',
   '550e8400-e29b-41d4-a716-446655440105',
   'librarian',
   '{"manage_inventory": false, "manage_members": false, "process_loans": true, "view_reports": true, "manage_staff": false, "admin_settings": false}'::jsonb,
   '{"employee_id": "BLRL002", "department": "Research Services", "hire_date": "2022-05-15", "work_schedule": "full_time"}'::jsonb,
   now() - interval '2 years',
   now() - interval '8 hours',
   'active');