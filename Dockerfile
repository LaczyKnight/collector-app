# ---- Stage 1: Build the React App ----
FROM node:18-alpine AS builder
WORKDIR /app
# Copy the frontend-specific package files
COPY package*.json ./
RUN npm install
# Copy the rest of the frontend source (src, public, etc.)
COPY . .
RUN npm run build

# ---- Stage 2: Production Stage ----
# This stage just provides the final build output.
FROM alpine:latest
WORKDIR /app
# Copy the built static files from the builder stage
COPY --from=builder /app/build .
