# API Specification

Based on the REST API approach with Supabase client integration, here's the comprehensive API specification covering both reader social features and library management operations.

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: EzLib API
  version: 1.0.0
  description: |
    Unified API for EzLib reader social platform and library management system.
    Supports multi-tenant libraries with role-based access control.
    
    **Authentication:** All endpoints require Supabase JWT token in Authorization header
    **Base URLs:**
    - Reader App: https://ezlib.com/api
    - Library Management: https://manage.ezlib.com/api
    
servers:
  - url: https://ezlib.com/api
    description: Reader Social API
  - url: https://manage.ezlib.com/api  
    description: Library Management API

security:
  - BearerAuth: []

paths:
  # ===================
  # AUTHENTICATION
  # ===================
  /auth/profile:
    get:
      summary: Get current user profile
      tags: [Authentication]
      responses:
        '200':
          description: User profile with roles and library memberships
    
    patch:
      summary: Update user profile
      tags: [Authentication]
      responses:
        '200':
          description: Updated user profile

  # ===================
  # BOOK DISCOVERY
  # ===================
  /books/discover:
    get:
      summary: Discover books with social and availability context
      tags: [Book Discovery]
      parameters:
        - name: language
          in: query
          schema: { type: string }
          description: Preferred language for editions
        - name: library_ids
          in: query
          schema: 
            type: array
            items: { type: string }
          description: Filter by library availability
        - name: following_only
          in: query
          schema: { type: boolean }
          description: Only show books reviewed by followed users
      responses:
        '200':
          description: Curated book discovery feed

  /books/general/{generalBookId}:
    get:
      summary: Get general book details with all editions
      tags: [Book Discovery]
      parameters:
        - name: generalBookId
          in: path
          required: true
          schema: { type: string }
        - name: user_language
          in: query
          schema: { type: string }
          description: Prioritize editions in this language
      responses:
        '200':
          description: Complete book information across editions

  /books/editions/{editionId}/availability:
    get:
      summary: Get real-time availability across libraries
      tags: [Book Discovery]
      parameters:
        - name: editionId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Availability status with library details

  # ===================
  # BORROWING WORKFLOW
  # ===================
  /borrowing/request:
    post:
      summary: Request to borrow a book
      tags: [Borrowing]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [book_inventory_id]
              properties:
                book_inventory_id: { type: string }
                preferred_pickup_date: { type: string, format: date }
                notes: { type: string }
      responses:
        '201':
          description: Borrowing request created

  /borrowing/requests:
    get:
      summary: Get user's borrowing requests and history
      tags: [Borrowing]
      parameters:
        - name: status
          in: query
          schema: 
            type: array
            items: { type: string }
        - name: library_id
          in: query
          schema: { type: string }
      responses:
        '200':
          description: User's borrowing history

  # ===================
  # SOCIAL FEATURES
  # ===================
  /social/feed:
    get:
      summary: Get personalized social reading feed
      tags: [Social]
      parameters:
        - name: feed_type
          in: query
          schema: 
            type: string
            enum: [following, trending, local_libraries]
            default: following
      responses:
        '200':
          description: Social activity feed

  /reviews:
    post:
      summary: Create a book review
      tags: [Social]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [book_edition_id, content, rating]
              properties:
                book_edition_id: { type: string }
                content: { type: string }
                rating: { type: integer, minimum: 1, maximum: 5 }
      responses:
        '201':
          description: Review created successfully

  /authors/{authorId}:
    get:
      summary: Get author page with bibliography
      tags: [Authors]
      parameters:
        - name: authorId
          in: path
          required: true
          schema: { type: string }
        - name: user_language
          in: query
          schema: { type: string }
          description: Filter books to preferred language editions
      responses:
        '200':
          description: Author profile and works

  # ===================
  # LIBRARY MANAGEMENT  
  # ===================
  /libraries/{libraryId}/inventory:
    get:
      summary: Get library book inventory (Staff only)
      tags: [Library Management]
      parameters:
        - name: libraryId
          in: path
          required: true
          schema: { type: string }
        - name: collection_id
          in: query
          schema: { type: string }
        - name: search
          in: query
          schema: { type: string }
          description: Search by title, author, ISBN
      responses:
        '200':
          description: Library inventory listing

    post:
      summary: Add book to library inventory
      tags: [Library Management]
      parameters:
        - name: libraryId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                isbn_13: { type: string }
                book_edition_id: { type: string }
                total_copies: { type: integer }
      responses:
        '201':
          description: Book added to inventory

  /libraries/{libraryId}/members:
    get:
      summary: Get library members (Staff only)
      tags: [Library Management]
      parameters:
        - name: libraryId
          in: path
          required: true
          schema: { type: string }
        - name: search
          in: query
          schema: { type: string }
      responses:
        '200':
          description: Library members list

    post:
      summary: Add new library member
      tags: [Library Management]
      parameters:
        - name: libraryId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [user_email]
              properties:
                user_email: { type: string, format: email }
                subscription_end: { type: string, format: date }
                notes: { type: string }
      responses:
        '201':
          description: Member added successfully

  /libraries/{libraryId}/collections:
    get:
      summary: Get library collections
      tags: [Library Management]
      parameters:
        - name: libraryId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Library collections

    post:
      summary: Create new collection
      tags: [Library Management]
      parameters:
        - name: libraryId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, type]
              properties:
                name: { type: string }
                description: { type: string }
                is_public: { type: boolean }
      responses:
        '201':
          description: Collection created

  # ===================
  # PYTHON CRAWLER API
  # ===================
  /crawler/enrich-book:
    post:
      summary: Trigger book metadata enrichment (Internal API)
      tags: [Data Enrichment]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                isbn_13: { type: string }
                book_edition_id: { type: string }
                general_book_id: { type: string }
                force_refresh: { type: boolean }
      responses:
        '202':
          description: Enrichment job queued

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
