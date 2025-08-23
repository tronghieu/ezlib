# EzLib Book Crawler Service - Project Overview

## Project Purpose
The EzLib Book Crawler Service is a Python FastAPI microservice that automatically enriches book metadata from external sources within the EzLib ecosystem. It serves as an independent microservice that:

- **Primary Goal**: Automatically enrich book metadata when books are added to library inventories
- **Secondary Goals**: Periodic updates of existing book data and author information enrichment
- **Core Function**: Data collection and processing only - no user-facing features or business logic

## Key Features
- **Multi-Source Data Collection**: Integrates with OpenLibrary, Google Books, ISBN databases, and Wikipedia
- **High Performance**: Asynchronous processing with FastAPI, Redis caching, rate limiting
- **Data Quality Assurance**: Multi-step validation, conflict resolution, quality scoring
- **Seamless Integration**: Service-to-service authentication with main EzLib API and direct Supabase integration

## Architecture Overview
The service operates as an independent microservice within the EzLib monorepo, maintaining strict data contracts with the main application. It uses a FastAPI-based architecture with external API integrations, caching, and database connectivity.

## Project Structure
- `src/`: Main source code with organized modules (api, services, models, clients, core, utils)
- `tests/`: Comprehensive test suite with unit and integration tests
- `docs/`: Extensive documentation including PRD, architecture, and workflows
- `scripts/`: Development utility scripts for setup, formatting, and testing
- Configuration files: `pyproject.toml` (Poetry), `.env` files, Docker configuration