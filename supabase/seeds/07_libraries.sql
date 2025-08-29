-- Libraries seed data
-- Creates diverse library types with realistic configurations

INSERT INTO libraries (id, name, code, address, contact_info, settings, stats, created_at, updated_at, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 
   'New York Central Library', 
   'NYCL-MAIN',
   '{"street": "476 5th Ave", "city": "New York", "state": "NY", "country": "USA", "postal_code": "10018"}',
   '{"phone": "+1-212-930-0800", "email": "info@nycentral.org", "website": "https://nycentral.org"}',
   '{"loan_period_days": 21, "max_renewals": 3, "max_books_per_member": 10, "late_fee_per_day": 0.50, "membership_fee": 0, "allow_holds": true}',
   '{"total_books": 45230, "total_members": 8924, "active_loans": 1847, "books_loaned_this_month": 3421}',
   now() - interval '2 years 3 months',
   now() - interval '1 day',
   'active'),
   
  ('550e8400-e29b-41d4-a716-446655440102',
   'Berkeley Engineering Library',
   'UCB-ENGR',
   '{"street": "110 Bechtel Engineering Center", "city": "Berkeley", "state": "CA", "country": "USA", "postal_code": "94720"}',
   '{"phone": "+1-510-642-3333", "email": "englib@berkeley.edu", "website": "https://guides.lib.berkeley.edu/engineering"}',
   '{"loan_period_days": 28, "max_renewals": 4, "max_books_per_member": 25, "late_fee_per_day": 1.00, "membership_fee": 0, "allow_holds": true}',
   '{"total_books": 12847, "total_members": 2341, "active_loans": 892, "books_loaned_this_month": 1247}',
   now() - interval '1 year 8 months',
   now() - interval '3 hours',
   'active');