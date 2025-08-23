# EzLib Book Crawler Service - Coding Standards & Conventions

## Code Style & Formatting

### Python Style
- **Line Length**: 88 characters (Black default)
- **Target Python Version**: 3.11
- **Import Organization**: Handled by Ruff (replaces isort)
- **Code Formatter**: Black (automatic formatting)
- **Linter**: Ruff with comprehensive rule set

### Ruff Configuration
Selected rules:
- `E`: pycodestyle errors
- `W`: pycodestyle warnings  
- `F`: pyflakes
- `I`: isort (import sorting)
- `B`: flake8-bugbear
- `C4`: flake8-comprehensions
- `UP`: pyupgrade

### Type Hints
- **Required**: All function definitions must have type hints (`disallow_untyped_defs = true`)
- **Style**: Modern Python 3.11+ syntax (`str | None` instead of `Optional[str]`)
- **Return Types**: Always specify return types
- **MyPy Settings**: Strict type checking enabled

## Documentation Standards

### Docstrings
- **Style**: Google-style docstrings
- **Required**: All classes and public methods must have docstrings
- **Content**: Include purpose, arguments, return values, and examples where helpful

Example:
```python
def enrich_book(self, isbn: str, options: EnrichmentOptions) -> EnrichmentResult:
    """Enrich book metadata from external sources.
    
    Args:
        isbn: Valid ISBN-13 or ISBN-10 identifier
        options: Configuration options for enrichment process
        
    Returns:
        EnrichmentResult containing metadata and processing information
        
    Raises:
        ValidationError: When ISBN format is invalid
        TimeoutError: When external APIs are unavailable
    """
```

### Code Comments
- **Minimal**: Code should be self-documenting
- **Focus**: Complex business logic, API integrations, data transformations
- **Avoid**: Obvious comments that restate the code

## Naming Conventions

### Variables & Functions
- **Style**: `snake_case`
- **Descriptive**: Use clear, descriptive names
- **Constants**: `UPPER_SNAKE_CASE`

### Classes
- **Style**: `PascalCase`  
- **Suffixes**: Use appropriate suffixes (`Service`, `Client`, `Model`, etc.)

### Files & Modules
- **Style**: `snake_case.py`
- **Organization**: Group related functionality in modules
- **Init Files**: Use `__init__.py` for package organization

## Architecture Patterns

### Service Layer Pattern
- **Services**: Business logic in `src/services/`
- **Clients**: External API interactions in `src/clients/`
- **Models**: Data structures in `src/models/`
- **API**: FastAPI routers in `src/api/`

### Dependency Injection
- **FastAPI Dependencies**: Use for configuration, database connections
- **Settings**: Global configuration via Pydantic Settings
- **Clients**: Injected into services for testability

### Error Handling
- **Custom Exceptions**: Defined in `src/core/exceptions.py`
- **HTTP Errors**: Proper HTTP status codes with detailed error messages
- **Logging**: Structured logging with correlation IDs

## Data Models

### Pydantic Models
- **Validation**: Use Pydantic for all data validation
- **Type Safety**: Leverage Pydantic v2 features
- **Configuration**: Use Field() for validation and documentation

### Database Models
- **Integration**: Direct Supabase integration
- **Schemas**: Maintain compatibility with main EzLib database schema