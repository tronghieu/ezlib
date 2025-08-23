# EzLib Book Crawler Service - Development Commands

## Essential Development Commands

### Environment Setup
```bash
# Run full development environment setup
./scripts/setup-dev.sh

# Install dependencies manually
poetry install

# Create .env from template
cp .env.example .env
```

### Development Server
```bash
# Start development server with hot reload
poetry run python -m src.main

# Alternative: Use uvicorn directly
poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Check health endpoint
curl http://localhost:8000/health

# Access API documentation
open http://localhost:8000/docs
```

### Code Quality & Formatting
```bash
# Format code with Black
poetry run black src/ tests/

# Check formatting (without changes)
poetry run black --check src/ tests/

# Run linting and auto-fix issues
poetry run ruff check --fix src/ tests/

# Check linting (without fixes)
poetry run ruff check src/ tests/

# Run type checking
poetry run mypy src/

# Run all formatting and quality checks
./scripts/format-code.sh
```

### Testing
```bash
# Run all tests
poetry run pytest tests/ -v

# Run tests with coverage
poetry run pytest tests/ --cov=src --cov-report=term-missing --cov-report=html

# Run specific test categories
poetry run pytest -m "not external_api"  # Skip external API tests
poetry run pytest tests/unit/             # Unit tests only
poetry run pytest tests/integration/      # Integration tests only

# Run comprehensive test suite with quality checks
./scripts/run-tests.sh
```

### Development Utilities
```bash
# Check Poetry environment
poetry show
poetry env info

# Update dependencies
poetry update

# Add new dependency
poetry add package_name
poetry add --group dev package_name  # Dev dependency

# Activate Poetry shell
poetry shell
```

### System Commands (macOS/Darwin)
```bash
# File operations
ls -la              # List files with details
find . -name "*.py" # Find Python files
grep -r "pattern"   # Search in files

# Process management
ps aux | grep python    # Find Python processes
kill -9 PID            # Kill specific process

# Git operations
git status
git add .
git commit -m "message"
git push origin main
```

### Docker Operations (Future)
```bash
# Build container
docker build -t ezlib-crawler .

# Run container
docker run -p 8000:8000 --env-file .env ezlib-crawler

# Docker Compose
docker-compose up -d
docker-compose logs -f
```

### API Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test enrichment endpoint
curl -X POST http://localhost:8000/api/v1/enrich \
  -H "Content-Type: application/json" \
  -d '{"book_edition_id": "uuid", "isbn_13": "9780441569595"}'

# Using HTTPie (if installed)
http POST localhost:8000/api/v1/enrich book_edition_id="uuid" isbn_13="9780441569595"
```

## Quick Command Reference

### Most Common Commands
- `poetry run python -m src.main` - Start dev server
- `./scripts/format-code.sh` - Format and lint code  
- `poetry run pytest tests/ -v` - Run tests
- `poetry run mypy src/` - Type checking

### Daily Development Workflow
1. Start server: `poetry run python -m src.main`
2. Make changes to code
3. Run tests: `poetry run pytest`
4. Format code: `./scripts/format-code.sh`
5. Commit changes: `git add . && git commit -m "message"`