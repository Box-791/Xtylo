# Build frontend
FROM node:20-alpine AS build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/

# Use npm install (not npm ci) to tolerate lockfile mismatch
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# Nginx serves frontend
FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

