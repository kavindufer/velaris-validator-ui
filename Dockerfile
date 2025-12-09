# --- Build stage --------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Backend URL for the built app (you can override at build time)
ARG VITE_API_BASE_URL=http://host.docker.internal:8000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# --- Runtime stage ------------------------------------------------------------
FROM nginx:1.27-alpine

# Clean default html and copy compiled app
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
