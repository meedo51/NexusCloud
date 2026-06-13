# Multi-stage Dockerfile for the File Management Application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy all source
COPY . .

# Build Vite frontend and Express server
RUN npm run build

# Second stage: production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy package info and dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads /app/data && chown -R node:node /app

USER node
EXPOSE 3000

CMD ["npm", "start"]
