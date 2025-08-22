# Overview

The EzLib Book Crawler Service is a Python FastAPI microservice responsible for enriching book metadata from external sources. It operates independently within the EzLib monorepo while maintaining strict data contracts with the main application.

## Service Purpose

- **Primary Goal**: Enrich book metadata automatically when books are added to library inventories
- **Secondary Goals**: Periodic updates of existing book data, author information enrichment
- **Scope**: Data collection and processing only - no user-facing features or business logic
