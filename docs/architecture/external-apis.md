# External APIs

The Python Book Crawler Service integrates with multiple external APIs to enrich book metadata, aggregate reviews, and provide comprehensive book information for the EzLib platform.

## Open Library API

- **Purpose:** Primary source for ISBN-based book metadata and cover images
- **Documentation:** https://openlibrary.org/developers/api  
- **Base URL(s):** https://openlibrary.org/api/
- **Authentication:** Public API, no authentication required
- **Rate Limits:** 100 requests per minute per IP address

**Key Endpoints Used:**
- `GET /books` - Bulk ISBN lookup for book metadata
- `GET /authors/{author_key}` - Author biographical information
- `GET /covers/{cover_id}` - Book cover image URLs in multiple sizes

**Integration Notes:** Primary data source for book enrichment. Provides clean, structured metadata with good coverage of international editions. Cover images available in small, medium, large sizes.

## Google Books API

- **Purpose:** Secondary metadata source and publisher information verification
- **Documentation:** https://developers.google.com/books/docs/v1/using
- **Base URL(s):** https://www.googleapis.com/books/v1/
- **Authentication:** API key required for higher rate limits
- **Rate Limits:** 1,000 requests per day (free tier), 100,000 requests per day (paid)

**Key Endpoints Used:**
- `GET /volumes` - Search books by ISBN, title, or author
- `GET /volumes/{volumeId}` - Detailed book information

**Integration Notes:** Excellent for recent publications and detailed publisher information. Provides high-quality book descriptions and accurate publication dates. Used as fallback when Open Library lacks data.

## WorldCat Search API

- **Purpose:** Library-specific metadata and edition verification
- **Documentation:** https://www.oclc.org/developer/develop/web-services/worldcat-search-api.en.html
- **Base URL(s):** http://www.worldcat.org/webservices/catalog/
- **Authentication:** API key required
- **Rate Limits:** 50,000 requests per day

**Key Endpoints Used:**
- `GET /content/{isbn}` - ISBN-based book lookup with library holdings
- `GET /search` - Title/author search across library catalogs

**Integration Notes:** Valuable for verifying book editions exist in library systems. Provides MARC record data and international cataloging standards compliance.

## Goodreads API (Legacy/Web Scraping)

- **Purpose:** Review aggregation and social rating data
- **Documentation:** API discontinued, using structured web scraping
- **Base URL(s):** https://www.goodreads.com/
- **Authentication:** Web scraping with rate limiting and user-agent rotation
- **Rate Limits:** Self-imposed: 1 request per 2 seconds to avoid blocking

**Key Endpoints Used:**
- `/book/show/{book_id}` - Book page scraping for reviews and ratings
- `/author/show/{author_id}` - Author page for biographical data
- `/search` - Book search by ISBN/title

**Integration Notes:** Critical for social proof and review aggregation. Requires careful scraping with respect for robots.txt and rate limiting. Data extraction focused on average ratings, review counts, and popular quotes.

## ISBN Database API

- **Purpose:** ISBN validation and format conversion (ISBN-10 ↔ ISBN-13)
- **Documentation:** https://isbndb.com/apidocs
- **Base URL(s):** https://api2.isbndb.com/
- **Authentication:** API key required
- **Rate Limits:** 2,500 requests per month (free tier)

**Key Endpoints Used:**
- `GET /book/{isbn}` - ISBN lookup with comprehensive metadata
- `GET /books/{title}` - Title-based book search

**Integration Notes:** Specialized for ISBN validation and book identification. Particularly useful for older books that may not be well-represented in other databases.

## Wikipedia API (Wikidata)

- **Purpose:** Author biographical information and book background data
- **Documentation:** https://www.wikidata.org/wiki/Wikidata:Data_access
- **Base URL(s):** https://www.wikidata.org/w/api.php
- **Authentication:** Public API, no authentication required
- **Rate Limits:** 5,000 requests per hour per IP

**Key Endpoints Used:**
- `GET /api.php?action=wbsearchentities` - Search for authors and books
- `GET /api.php?action=wbgetentities` - Get detailed entity information

**Integration Notes:** Excellent source for author biographical data, birth/death dates, nationality, and relationships between authors and works. Structured data format enables reliable information extraction.
