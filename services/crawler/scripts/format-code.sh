#!/bin/bash
# Code formatting script

set -e

echo "🎨 Formatting EzLib Book Crawler Service code..."

# Format code with Black
echo "🖤 Running Black formatter..."
poetry run black src/ tests/

# Fix linting issues with Ruff
echo "🔧 Fixing linting issues with Ruff..."
poetry run ruff check --fix src/ tests/

# Sort imports (Ruff handles this)
echo "📦 Import sorting handled by Ruff..."

# Run type checking to ensure everything is still correct
echo "🔍 Verifying with MyPy type checking..."
poetry run mypy src/

echo ""
echo "✅ Code formatting complete!"
echo "📝 All files have been formatted and linting issues fixed"
echo ""