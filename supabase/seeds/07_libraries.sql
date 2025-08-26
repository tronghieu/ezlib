-- Libraries seeding data
-- Includes 5 different types of libraries with realistic configurations

INSERT INTO libraries (id, name, code, address, contact_info, settings, stats, created_at, updated_at, status)
VALUES
  -- Major urban public library
  ('550e8400-e29b-41d4-a716-446655440101', 
   'New York Central Library', 
   'NYCL-MAIN',
   '{"street": "476 5th Ave", "city": "New York", "state": "NY", "country": "USA", "postal_code": "10018", "coordinates": {"lat": 40.7532, "lng": -73.9822}}'::jsonb,
   '{"phone": "+1-212-930-0800", "email": "info@nycentral.org", "website": "https://nycentral.org", "hours": {"monday": "9:00-20:00", "tuesday": "9:00-20:00", "wednesday": "9:00-20:00", "thursday": "9:00-20:00", "friday": "9:00-18:00", "saturday": "9:00-17:00", "sunday": "12:00-17:00"}}'::jsonb,
   '{"loan_period_days": 21, "max_renewals": 3, "max_books_per_member": 10, "late_fee_per_day": 0.50, "membership_fee": 0, "allow_holds": true, "allow_digital": true}'::jsonb,
   '{"total_books": 45230, "total_members": 8924, "active_loans": 1847, "books_loaned_this_month": 3421}'::jsonb,
   now() - interval '2 years 3 months',
   now() - interval '1 day',
   'active'),
   
  -- University academic library  
  ('550e8400-e29b-41d4-a716-446655440102',
   'Berkeley Engineering Library',
   'UCB-ENGR',
   '{"street": "110 Bechtel Engineering Center", "city": "Berkeley", "state": "CA", "country": "USA", "postal_code": "94720", "coordinates": {"lat": 37.8719, "lng": -122.2585}}'::jsonb,
   '{"phone": "+1-510-642-3333", "email": "englib@berkeley.edu", "website": "https://guides.lib.berkeley.edu/engineering", "hours": {"monday": "8:00-22:00", "tuesday": "8:00-22:00", "wednesday": "8:00-22:00", "thursday": "8:00-22:00", "friday": "8:00-18:00", "saturday": "10:00-18:00", "sunday": "12:00-22:00"}}'::jsonb,
   '{"loan_period_days": 28, "max_renewals": 4, "max_books_per_member": 25, "late_fee_per_day": 1.00, "membership_fee": 0, "allow_holds": true, "allow_digital": true}'::jsonb,
   '{"total_books": 12847, "total_members": 2341, "active_loans": 892, "books_loaned_this_month": 1247}'::jsonb,
   now() - interval '1 year 8 months',
   now() - interval '3 hours',
   'active'),

  -- Small town public library
  ('550e8400-e29b-41d4-a716-446655440103',
   'Greenfield Community Library',
   'GCL-MAIN',
   '{"street": "45 Main Street", "city": "Greenfield", "state": "MA", "country": "USA", "postal_code": "01301", "coordinates": {"lat": 42.5876, "lng": -72.5989}}'::jsonb,
   '{"phone": "+1-413-772-1544", "email": "info@greenfieldlibrary.org", "website": "https://greenfieldlibrary.org", "hours": {"monday": "10:00-18:00", "tuesday": "10:00-20:00", "wednesday": "10:00-18:00", "thursday": "10:00-20:00", "friday": "10:00-17:00", "saturday": "9:00-16:00", "sunday": "closed"}}'::jsonb,
   '{"loan_period_days": 14, "max_renewals": 2, "max_books_per_member": 5, "late_fee_per_day": 0.25, "membership_fee": 0, "allow_holds": true, "allow_digital": false}'::jsonb,
   '{"total_books": 8924, "total_members": 1823, "active_loans": 421, "books_loaned_this_month": 687}'::jsonb,
   now() - interval '4 years 1 month',
   now() - interval '2 days',
   'active'),

  -- High school library
  ('550e8400-e29b-41d4-a716-446655440104',
   'Lincoln High School Library',
   'LHS-LIB',
   '{"street": "2162 24th Ave", "city": "San Francisco", "state": "CA", "country": "USA", "postal_code": "94116", "coordinates": {"lat": 37.7478, "lng": -122.4814}}'::jsonb,
   '{"phone": "+1-415-759-2730", "email": "library@lincolnhs.org", "website": "https://lincolnhs.org/library", "hours": {"monday": "7:30-16:00", "tuesday": "7:30-16:00", "wednesday": "7:30-16:00", "thursday": "7:30-16:00", "friday": "7:30-15:00", "saturday": "closed", "sunday": "closed"}}'::jsonb,
   '{"loan_period_days": 14, "max_renewals": 1, "max_books_per_member": 3, "late_fee_per_day": 0.00, "membership_fee": 0, "allow_holds": false, "allow_digital": false}'::jsonb,
   '{"total_books": 3241, "total_members": 847, "active_loans": 234, "books_loaned_this_month": 412}'::jsonb,
   now() - interval '8 months',
   now() - interval '1 week',
   'active'),

  -- Specialty legal library
  ('550e8400-e29b-41d4-a716-446655440105',
   'Boston Legal Research Library',
   'BLRL-MAIN',
   '{"street": "1 Beacon St Suite 1400", "city": "Boston", "state": "MA", "country": "USA", "postal_code": "02108", "coordinates": {"lat": 42.3584, "lng": -71.0598}}'::jsonb,
   '{"phone": "+1-617-523-4529", "email": "reference@blrl.org", "website": "https://blrl.org", "hours": {"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-17:00", "saturday": "9:00-15:00", "sunday": "closed"}}'::jsonb,
   '{"loan_period_days": 7, "max_renewals": 1, "max_books_per_member": 8, "late_fee_per_day": 2.00, "membership_fee": 150.00, "allow_holds": true, "allow_digital": true}'::jsonb,
   '{"total_books": 15678, "total_members": 423, "active_loans": 287, "books_loaned_this_month": 534}'::jsonb,
   now() - interval '15 months',
   now() - interval '4 hours',
   'active');