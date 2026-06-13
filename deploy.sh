#!/bin/bash
set -e

echo "Deploying NexusCloud..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Create directories
mkdir -p uploads data

# Initialize Swarm if needed for secrets
if ! docker info | grep -q "Swarm: active"; then
    echo "Initializing Docker Swarm mode for secrets support..."
    docker swarm init 2>/dev/null || true
fi

# Create JWT secret if not exists
if ! docker secret ls | grep -q jwt_secret; then
    echo "Creating jwt_secret..."
    openssl rand -hex 32 | docker secret create jwt_secret -
else
    echo "jwt_secret already exists."
fi

# Build and deploy
echo "Building and starting containers..."
docker compose down || true
docker compose build
docker compose up -d

echo "Waiting for healthchecks (10s)..."
sleep 10
docker ps | grep nexuscloud_app

echo "================================================="
echo "NexusCloud deployed successfully!"
echo "App URL: http://localhost:3000"
echo "Check logs with: docker compose logs -f --tail=100"
echo "================================================="
