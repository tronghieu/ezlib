# Task Completion Checklist - EzLib Book Crawler Service

## Pre-Commit Quality Checklist

When completing any development task, ensure the following steps are completed:

### 1. Code Quality Checks
```bash
# Run the comprehensive format script
./scripts/format-code.sh

# Or run individual commands:
poetry run black src/ tests/          # Code formatting
poetry run ruff check --fix src/ tests/  # Linting with auto-fix
poetry run mypy src/                  # Type checking
```

### 2. Testing Requirements
```bash
# Run the full test suite
./scripts/run-tests.sh

# Or run individual test commands:
poetry run pytest tests/ -v                    # All tests
poetry run pytest tests/ --cov=src             # With coverage
poetry run pytest tests/ --cov-fail-under=80   # Ensure 80% coverage
```

### 3. Code Standards Verification
- [ ] All new functions have type hints
- [ ] Public methods have Google-style docstrings
- [ ] Error handling follows established patterns
- [ ] New dependencies added via Poetry (`poetry add package_name`)
- [ ] Environment variables documented in `.env.example` if added

### 4. Testing Standards
- [ ] New functionality has corresponding unit tests
- [ ] Integration tests added for external API interactions
- [ ] Tests use proper mocking for external dependencies
- [ ] Test coverage maintained above 80%

### 5. Documentation Updates
- [ ] README.md updated if public API changes
- [ ] Docstrings added for new public methods/classes
- [ ] Environment variables documented if new configs added

### 6. Configuration & Environment
- [ ] New settings added to `Settings` class in `src/core/config.py`
- [ ] Environment variables added to `.env.example`
- [ ] Configuration changes tested in development environment

## Pre-Deployment Checklist

For changes that will be deployed:

### 7. External Dependencies
- [ ] External API rate limits respected
- [ ] API keys and secrets properly configured
- [ ] Database migrations considered (if schema changes)

### 8. Performance Considerations
- [ ] Async/await patterns used for I/O operations
- [ ] Caching implemented for expensive operations
- [ ] Rate limiting configured for external APIs

### 9. Security Review
- [ ] No hardcoded secrets or API keys
- [ ] Input validation for all user-provided data
- [ ] Proper error messages (don't expose sensitive info)

## Automated Quality Gates

The following are enforced by the test scripts:

### Code Quality (via `./scripts/format-code.sh`)
- Black code formatting (88 character line limit)
- Ruff linting with comprehensive rule set
- MyPy type checking with strict settings

### Test Quality (via `./scripts/run-tests.sh`)
- All tests must pass
- Minimum 80% code coverage
- No linting errors
- Type checking must pass

## Quick Verification Commands

Before committing code:
```bash
# One-liner to run all quality checks
./scripts/format-code.sh && ./scripts/run-tests.sh

# Quick check without coverage
poetry run black src/ tests/ && poetry run ruff check src/ tests/ && poetry run mypy src/ && poetry run pytest tests/ -v
```

## Git Workflow Integration

Recommended commit workflow:
```bash
# 1. Run quality checks
./scripts/format-code.sh

# 2. Run tests  
./scripts/run-tests.sh

# 3. Stage changes
git add .

# 4. Commit with descriptive message
git commit -m "feat: add book enrichment service with OpenLibrary integration"

# 5. Push changes
git push origin feature-branch
```

## Troubleshooting Common Issues

### Test Failures
- Check external API mocks are properly configured
- Ensure environment variables are set correctly
- Verify Redis/database connectivity for integration tests

### Type Checking Errors
- Add missing type hints to function signatures
- Use `| None` syntax for optional types (Python 3.11+)
- Import types from proper modules

### Formatting Issues
- Run `poetry run black src/ tests/` to auto-format
- Check line length limits (88 characters)
- Ensure proper import organization via Ruff