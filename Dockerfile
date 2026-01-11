# Stage 1: Build the React frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Production environment
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install ONLY production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the server file
COPY server.js ./

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3001

# Define environment variables (can be overridden at runtime)
ENV PORT=3001
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
