FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if needed (e.g., for node-gyp)
# RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript code (if there is a build step, otherwise we can just run tsx)
# Wait, this project uses `tsx watch src/server.ts` for dev, but for prod we should compile or use tsx.
# For simplicity and reliability in SaaS production, let's compile it, or if it doesn't have a build script, run via tsx.
# We will install tsx globally or use the local one.
# We will use tsx in production for this specific setup since we don't have tsc configured.

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# We still need tsx if we run TS directly.
RUN npm install -g tsx

COPY . .

# Expose port
EXPOSE 3001

# Command to run the server
CMD ["tsx", "src/server.ts"]
