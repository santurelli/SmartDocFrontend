# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM caddy:2.7-alpine
WORKDIR /srv
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

# The Caddyfile will handle port 80/443 and domain app.smart-doc.it
EXPOSE 80 443
