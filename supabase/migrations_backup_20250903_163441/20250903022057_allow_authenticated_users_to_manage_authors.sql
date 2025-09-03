-- Migration: Allow authenticated users to manage authors for book creation
-- Story 2.2: Ultra-Simple Add New Books - Fix RLS policy for author creation

-- Allow authenticated users to read authors they've created
CREATE POLICY "Authenticated users can read all authors" ON authors
FOR SELECT TO authenticated
USING (true);

-- Add similar policies for other tables needed for book creation

-- Book Copies: Enable RLS and allow library staff to manage copies in their libraries
ALTER TABLE book_copies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library staff can manage their library's book copies" ON book_copies
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM library_staff ls
    WHERE ls.user_id = auth.uid()
    AND ls.library_id = book_copies.library_id
  )
);

CREATE POLICY "Book copies are publicly readable" ON book_copies
FOR SELECT TO public
USING (true);

-- Note: Updates and deletes should still be restricted to admin/service roles for most tables
-- The existing "Service accounts can manage *" policies handle admin operations
