/**
 * Books API Route - Example Implementation
 * Demonstrates permission-based API route protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission, withLibraryScope } from '@/lib/auth/server';

/**
 * GET /api/books - List books (requires books:view permission)
 */
export const GET = withPermission(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get('libraryId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!libraryId) {
      return NextResponse.json(
        { error: 'Library ID is required' },
        { status: 400 }
      );
    }

    try {
      const books = await withLibraryScope(
        async (supabase, scopedLibraryId) => {
          let query = supabase
            .from('book_copies')
            .select(`
              id,
              barcode,
              availability,
              book_editions (
                id,
                title,
                subtitle,
                isbn_13,
                language,
                general_books (
                  canonical_title,
                  subjects,
                  book_contributors (
                    role,
                    authors (
                      name,
                      canonical_name
                    )
                  )
                )
              )
            `)
            .eq('library_id', scopedLibraryId)
            .range((page - 1) * limit, page * limit - 1);

          if (search) {
            query = query.or(`
              book_editions.title.ilike.%${search}%,
              book_editions.isbn_13.ilike.%${search}%,
              book_editions.general_books.book_contributors.authors.name.ilike.%${search}%
            `);
          }

          const { data, error } = await query;

          if (error) {
            throw error;
          }

          return data || [];
        },
        'books:view',
        libraryId
      );

      return NextResponse.json({
        books,
        pagination: {
          page,
          limit,
          hasMore: books.length === limit
        }
      });
    } catch (error) {
      console.error('Books API error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      );
    }
  },
  'books:view'
);

/**
 * POST /api/books - Add new book (requires books:add permission)
 */
export const POST = withPermission(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get('libraryId');

    if (!libraryId) {
      return NextResponse.json(
        { error: 'Library ID is required' },
        { status: 400 }
      );
    }

    try {
      const body = await request.json();
      const { isbn, title, authors, copies = 1 } = body;

      if (!isbn && !title) {
        return NextResponse.json(
          { error: 'Either ISBN or title is required' },
          { status: 400 }
        );
      }

      const result = await withLibraryScope(
        async (supabase, scopedLibraryId) => {
          // This is a simplified example - real implementation would:
          // 1. Check if book edition already exists
          // 2. Create general_book if needed
          // 3. Create book_edition if needed  
          // 4. Create book_copies for the library
          // 5. Handle enrichment via external APIs

          // Placeholder implementation
          const bookCopy = {
            id: crypto.randomUUID(),
            library_id: scopedLibraryId,
            book_edition_id: crypto.randomUUID(),
            barcode: `LIB${Date.now()}`,
            availability: {
              status: 'available',
              due_date: null,
              hold_queue: []
            }
          };

          return bookCopy;
        },
        'books:add',
        libraryId
      );

      return NextResponse.json(
        { message: 'Book added successfully', book: result },
        { status: 201 }
      );
    } catch (error) {
      console.error('Add book error:', error);
      return NextResponse.json(
        { error: 'Failed to add book' },
        { status: 500 }
      );
    }
  },
  'books:add'
);

/**
 * PUT /api/books - Update book (requires books:edit permission)
 */
export const PUT = withPermission(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get('libraryId');
    const bookId = searchParams.get('bookId');

    if (!libraryId || !bookId) {
      return NextResponse.json(
        { error: 'Library ID and Book ID are required' },
        { status: 400 }
      );
    }

    try {
      const body = await request.json();

      const updatedBook = await withLibraryScope(
        async (supabase, scopedLibraryId) => {
          const { data, error } = await supabase
            .from('book_copies')
            .update(body)
            .eq('id', bookId)
            .eq('library_id', scopedLibraryId)
            .select()
            .single();

          if (error) {
            throw error;
          }

          return data;
        },
        'books:edit',
        libraryId
      );

      return NextResponse.json({
        message: 'Book updated successfully',
        book: updatedBook
      });
    } catch (error) {
      console.error('Update book error:', error);
      return NextResponse.json(
        { error: 'Failed to update book' },
        { status: 500 }
      );
    }
  },
  'books:edit'
);

/**
 * DELETE /api/books - Delete book (requires books:delete permission)
 */
export const DELETE = withPermission(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get('libraryId');
    const bookId = searchParams.get('bookId');

    if (!libraryId || !bookId) {
      return NextResponse.json(
        { error: 'Library ID and Book ID are required' },
        { status: 400 }
      );
    }

    try {
      await withLibraryScope(
        async (supabase, scopedLibraryId) => {
          // Check if book is currently checked out
          const { data: bookData, error: fetchError } = await supabase
            .from('book_copies')
            .select('availability')
            .eq('id', bookId)
            .eq('library_id', scopedLibraryId)
            .single();

          if (fetchError) {
            throw fetchError;
          }

          if (bookData.availability.status !== 'available') {
            throw new Error('Cannot delete book that is currently checked out');
          }

          const { error: deleteError } = await supabase
            .from('book_copies')
            .delete()
            .eq('id', bookId)
            .eq('library_id', scopedLibraryId);

          if (deleteError) {
            throw deleteError;
          }
        },
        'books:delete',
        libraryId
      );

      return NextResponse.json({
        message: 'Book deleted successfully'
      });
    } catch (error) {
      console.error('Delete book error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete book' },
        { status: 500 }
      );
    }
  },
  'books:delete'
);