# Multi-stage Dockerfile for NextChat
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and client package definitions
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm --prefix client install

# Copy source files
COPY . .

# Generate Prisma Client & Build Client Assets
RUN npx prisma generate
RUN npm --prefix client run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built assets from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

# Run database push and start application
CMD ["sh", "-c", "npx prisma db push && node server/index.js"]
