# Core Workflows

Critical system workflows illustrating component interactions, external API integrations, and the complete user journeys from book discovery through library operations.

## 1. Book Discovery to Borrowing Workflow (30-Second Pipeline)

```mermaid
sequenceDiagram
    participant R as Reader
    participant RA as Reader App
    participant DB as Supabase DB
    participant RT as Real-time
    participant LA as Library App
    participant LS as Library Staff

    Note over R,LS: Social Discovery → Instant Borrowing Pipeline

    R->>RA: Browse social feed
    RA->>DB: Query reviews from followed users (Supabase client)
    DB-->>RA: Social activities with book context
    RA-->>R: Display book in social context

    Note over R,RA: 0-2s: Discovery moment
    R->>RA: Tap book for quick preview
    RA->>DB: Fetch book + editions + reviews (Supabase client)
    DB-->>RA: Complete book information
    RA-->>R: Show review + "Borrow" button

    Note over R,RA: 2-6s: Decision point
    R->>RA: Tap "Borrow" button
    RA->>DB: Query inventory across user's libraries (Supabase client)
    DB-->>RA: Real-time availability status
    RA-->>R: Show library options with availability

    Note over R,RA: 6-9s: Library selection
    R->>RA: Select library and confirm
    RA->>DB: Create borrowing transaction (Supabase client)
    DB->>RT: Trigger real-time notification
    RT->>LA: Push notification to library staff
    DB-->>RA: Transaction created
    RA-->>R: Success notification + due date

    Note over RT,LS: 9-12s: Staff notification
    RT-->>LA: Real-time borrowing request appears
    LA-->>LS: New request notification badge
    LS->>LA: Review and approve request
    LA->>DB: Update transaction status (Supabase client)
    DB->>RT: Trigger approval notification
    RT->>RA: Push notification to reader
    RA-->>R: "Book ready for pickup" notification
```

## 2. Book Metadata Enrichment Workflow

```mermaid
sequenceDiagram
    participant LS as Library Staff
    participant LA as Library App
    participant DB as Supabase DB
    participant Crawler as Python Crawler
    participant ExtAPI as External APIs

    Note over LS,ExtAPI: Staff adds book → Automatic enrichment

    LS->>LA: Add book with ISBN
    LA->>DB: Create BookEdition + BookInventory (Supabase client)
    LA->>Crawler: POST /crawler/enrich-book
    DB-->>LA: Book added (minimal metadata)
    LA-->>LS: Immediate confirmation

    Note over Crawler,ExtAPI: Async enrichment process
    
    par Open Library Lookup
        Crawler->>ExtAPI: GET Open Library API
        ExtAPI-->>Crawler: Book metadata + cover
    and Google Books Lookup
        Crawler->>ExtAPI: GET Google Books API  
        ExtAPI-->>Crawler: Publisher details + description
    and Author Information
        Crawler->>ExtAPI: GET Wikidata API
        ExtAPI-->>Crawler: Author biography + photo
    end

    Crawler->>Crawler: Merge and validate data
    Crawler->>DB: Update BookEdition + Author + BookContributor (Supabase Python client)
    
    Note over DB,LS: Real-time metadata update
    DB->>LA: Real-time subscription update
    LA-->>LS: Book card auto-refreshes with rich metadata
```

## 3. Cross-Subdomain Authentication Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant RA as Reader App<br/>(ezlib.com)
    participant Auth as Supabase Auth
    participant LA as Library App<br/>(manage.ezlib.com)
    participant DB as Supabase DB

    Note over U,DB: Seamless cross-app authentication

    U->>RA: Login on reader app
    RA->>Auth: Email/password authentication (Supabase client)
    Auth-->>RA: JWT token + user session
    RA->>DB: Fetch user profile + roles (Supabase client)
    DB-->>RA: User data + LibReader + LibAdmin records
    RA-->>U: Logged in as reader

    Note over U,LA: Switch to library management
    U->>LA: Navigate to manage.ezlib.com
    LA->>LA: Check for existing auth token (shared Supabase session)
    LA->>Auth: Validate JWT token (Supabase client)
    Auth-->>LA: Token valid + user ID
    LA->>DB: Query LibAdmin roles for user (Supabase client)
    DB-->>LA: Admin permissions for libraries
    
    alt User has library admin access
        LA-->>U: Show library management dashboard
    else User is reader only
        LA-->>U: Show "Request Library Access" page
    end

    Note over U,LA: Role-based interface with RLS
    U->>LA: Perform admin action
    LA->>DB: Action with RLS policy check (Supabase client)
    DB-->>LA: Data returned or access denied based on RLS
    LA->>LA: Execute action or show permission error
```
