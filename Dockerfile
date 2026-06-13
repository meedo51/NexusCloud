# Multi-stage Dockerfile for NexusCloud
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
# Use npm install to ensure it works without lockfile
RUN npm install

# Copy all source
COPY . .

# Build Vite frontend and Express server
RUN npm run build

# Second stage: production image
FROM node:20-alpine AS runner

# Install tini for init process
RUN apk add --no-cache tini

WORKDIR /app
ENV NODE_ENV=production

# Copy package info and install production dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy built assets
COPY --from=builder /app/dist ./dist

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads /app/data && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
