#!/bin/bash
# Development environment setup script

set -e

echo "🚀 Setting up EzLib Book Crawler Service development environment..."

# Check Python version
python_version=$(python --version 2>&1 | cut -d' ' -f2)
required_version="3.11"

if [[ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]]; then
    echo "❌ Python 3.11+ is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version check passed: $python_version"

# Check if Poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "📦 Installing Poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "✅ Poetry is available"

# Install dependencies
echo "📦 Installing dependencies with Poetry..."
poetry install

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values"
else
    echo "✅ .env file already exists"
fi

# Run initial tests
echo "🧪 Running tests to verify setup..."
poetry run pytest tests/ -v

# Run code quality checks
echo "🔍 Running code quality checks..."
poetry run black --check src/ tests/
poetry run ruff check src/ tests/
poetry run mypy src/

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start development server: poetry run python -m src.main"
echo "3. Visit http://localhost:8000/docs for API documentation"
echo ""
echo "Development commands:"
echo "  poetry run pytest              # Run tests"
echo "  poetry run black src/ tests/   # Format code"
echo "  poetry run ruff check --fix    # Fix linting issues"
echo "  poetry run mypy src/           # Type checking"
echo ""