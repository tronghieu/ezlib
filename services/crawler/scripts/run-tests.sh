#!/bin/bash
# Test execution script

set -e

echo "🧪 Running EzLib Book Crawler Service tests..."

# Run linting first
echo "🔍 Running Ruff linting..."
poetry run ruff check src/ tests/

# Run type checking
echo "🔍 Running MyPy type checking..."
poetry run mypy src/

# Run code formatting check
echo "🔍 Checking Black code formatting..."
poetry run black --check src/ tests/

# Run tests with coverage
echo "🧪 Running pytest with coverage..."
poetry run pytest tests/ \
    --cov=src \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-fail-under=80 \
    -v

echo ""
echo "✅ All tests and quality checks passed!"
echo "📊 Coverage report generated in htmlcov/"
echo ""