# ---- Stage 1: Build Stage ----
# Use a full Node image to install all dependencies
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# ---- Stage 2: Production Stage ----
# Start fresh from a lightweight image
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
# Install ONLY production dependencies
RUN npm install --only=production
# Copy the application code from the builder stage
COPY --from=builder /usr/src/app .
EXPOSE 5000
CMD ["node", "server.js"]
