#!/bin/bash
set -e

echo "🚀 AI Freelancer SaaS Platform - Setup"
echo "========================================"

# Check prerequisites
echo "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install: https://docs.docker.com/get-docker/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install: https://nodejs.org/"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3.11+ is required. Install: https://python.org/"; exit 1; }

echo "All prerequisites met!"

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your API keys before running."
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd packages/frontend
npm install
cd ../..

# Install gateway dependencies
echo "Installing gateway dependencies..."
cd packages/gateway
npm install
cd ../..

# Install automation dependencies
echo "Installing automation dependencies..."
cd packages/automation
npm install
npx playwright install chromium
cd ../..

# Install AI service dependencies
echo "Installing AI service dependencies..."
cd packages/ai-service
pip install -e . 2>/dev/null || pip3 install -e .
cd ../..

# Make the postgres init script executable
chmod +x database/postgres/init-multiple-dbs.sh

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys (OpenAI, Pinecone, ElevenLabs, Stripe)"
echo "  2. Run: docker compose up -d postgres mongo redis n8n"
echo "  3. Run gateway: cd packages/gateway && npm run dev"
echo "  4. Run AI service: cd packages/ai-service && uvicorn app.main:app --reload"
echo "  5. Run frontend: cd packages/frontend && npm run dev"
echo ""
echo "Or run everything with Docker:"
echo "  docker compose up --build"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  API Gateway: http://localhost:4000"
echo "  AI Service: http://localhost:8000"
echo "  n8n: http://localhost:5678"
